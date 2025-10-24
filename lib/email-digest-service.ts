import { prisma } from './prisma';
import { sendNotificationEmail } from './email-service';
import { EmailDigestFreq, NotificationType } from '@prisma/client';

interface DigestData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  posts: number;
  comments: number;
  likes: number;
  mentions: number;
  newFollowers: number;
  period: string;
  activityDetails: Array<{
    type: string;
    count: number;
    examples: string[];
  }>;
}

// Get the date range for the digest based on frequency
function getDateRange(frequency: EmailDigestFreq): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (frequency) {
    case 'DAILY':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case 'WEEKLY':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'MONTHLY':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    default:
      throw new Error('Invalid frequency');
  }

  return { startDate, endDate };
}

// Generate digest data for a user
async function generateDigestData(userId: string, frequency: EmailDigestFreq): Promise<DigestData | null> {
  const { startDate, endDate } = getDateRange(frequency);

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true }
  });

  if (!user || !user.name) return null;

  // Get user's post IDs first for likes calculation
  const userPostIds = await prisma.post.findMany({
    where: { authorId: userId },
    select: { id: true }
  });

  // Get activity counts
  const [
    newPosts,
    newComments,
    newLikes,
    newMentions,
    notifications
  ] = await Promise.all([
    // Posts created by user
    prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    // Comments by user
    prisma.comment.count({
      where: {
        authorId: userId,
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    // Likes received on user's posts
    prisma.votes.count({
      where: {
        type: 'UP',
        createdAt: { gte: startDate, lte: endDate },
        postId: { in: userPostIds.map(p => p.id) }
      }
    }),
    // Mentions of user
    prisma.notifications.count({
      where: {
        userId,
        type: NotificationType.MENTION,
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    // All notifications for examples
    prisma.notifications.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { type: true, title: true, message: true }
    })
  ]);

  // Get new followers count (if we have a followers system)
  const newFollowers = 0; // Placeholder - implement when followers system exists

  // Create activity details
  const activityDetails = [];

  if (newPosts > 0) {
    const recentPosts = await prisma.post.findMany({
      where: {
        authorId: userId,
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { content: true },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    activityDetails.push({
      type: 'Posts Created',
      count: newPosts,
      examples: recentPosts.map(p => p.content?.substring(0, 30) + '...' || 'No content').slice(0, 3)
    });
  }

  if (newComments > 0) {
    activityDetails.push({
      type: 'Comments Made',
      count: newComments,
      examples: []
    });
  }

  if (newLikes > 0) {
    activityDetails.push({
      type: 'Likes Received',
      count: newLikes,
      examples: []
    });
  }

  if (newMentions > 0) {
    activityDetails.push({
      type: 'Mentions',
      count: newMentions,
      examples: notifications
        .filter(n => n.type === NotificationType.MENTION)
        .map(n => n.title)
        .slice(0, 3)
    });
  }

  const period = frequency === 'DAILY' ? 'yesterday' : 
                frequency === 'WEEKLY' ? 'this week' : 'this month';

  return {
    user: {
      id: user.id,
      name: user.name || 'User',
      email: user.email
    },
    posts: newPosts,
    comments: newComments,
    likes: newLikes,
    mentions: newMentions,
    newFollowers,
    period,
    activityDetails
  };
}

// Generate HTML email template for digest
function generateDigestEmail(data: DigestData): { subject: string; html: string; text: string } {
  const { user, posts, comments, likes, mentions, period, activityDetails } = data;
  
  const totalActivity = posts + comments + likes + mentions;
  
  const subject = `Your ${period} forum activity summary`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
        📊 Your Forum Activity Summary
      </h2>
      
      <p>Hi ${user.name || 'there'},</p>
      
      ${totalActivity > 0 ? `
        <p>Here's what happened ${period}:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Activity Overview</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            ${posts > 0 ? `<div>📝 <strong>${posts}</strong> post${posts > 1 ? 's' : ''} created</div>` : ''}
            ${comments > 0 ? `<div>💬 <strong>${comments}</strong> comment${comments > 1 ? 's' : ''} made</div>` : ''}
            ${likes > 0 ? `<div>👍 <strong>${likes}</strong> like${likes > 1 ? 's' : ''} received</div>` : ''}
            ${mentions > 0 ? `<div>📢 <strong>${mentions}</strong> mention${mentions > 1 ? 's' : ''}</div>` : ''}
          </div>
        </div>
        
        ${activityDetails.length > 0 ? `
          <h3 style="color: #333;">Activity Details</h3>
          ${activityDetails.map(activity => `
            <div style="margin: 15px 0; padding: 15px; background: #fff; border: 1px solid #e1e5e9; border-radius: 6px;">
              <h4 style="margin: 0 0 8px 0; color: #0066cc;">${activity.type} (${activity.count})</h4>
              ${activity.examples.length > 0 ? `
                <ul style="margin: 5px 0; padding-left: 20px; color: #666;">
                  ${activity.examples.map(example => `<li>${example}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        ` : ''}
      ` : `
        <p>It's been quiet ${period} - no new activity to report.</p>
        <p>Why not check out the latest discussions in the forum?</p>
      `}
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" 
           style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Visit Forum
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        You're receiving this digest because you have it enabled in your 
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile/email-preferences">email preferences</a>.
      </p>
    </div>
  `;
  
  const text = `
    Your Forum Activity Summary (${period})
    
    Hi ${user.name || 'there'},
    
    ${totalActivity > 0 ? `
      Here's what happened ${period}:
      ${posts > 0 ? `- ${posts} post${posts > 1 ? 's' : ''} created\n` : ''}
      ${comments > 0 ? `- ${comments} comment${comments > 1 ? 's' : ''} made\n` : ''}
      ${likes > 0 ? `- ${likes} like${likes > 1 ? 's' : ''} received\n` : ''}
      ${mentions > 0 ? `- ${mentions} mention${mentions > 1 ? 's' : ''}\n` : ''}
      
      Visit the forum: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}
    ` : `
      It's been quiet ${period} - no new activity to report.
      Visit the forum: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}
    `}
    
    Manage your email preferences: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile/email-preferences
  `;
  
  return { subject, html, text };
}

// Send digest to a single user
export async function sendDigestToUser(userId: string, frequency: EmailDigestFreq): Promise<boolean> {
  try {
    const digestData = await generateDigestData(userId, frequency);
    
    if (!digestData) {
      console.log(`User ${userId} not found for digest`);
      return false;
    }

    const emailTemplate = generateDigestEmail(digestData);
    
    // Use the existing email service but with custom template
    const success = await sendNotificationEmail(userId, NotificationType.SYSTEM, {
      customUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`,
      postTitle: emailTemplate.subject,
      commentContent: emailTemplate.html
    });

    console.log(`Digest email ${success ? 'sent' : 'failed'} for user ${userId}`);
    return success;

  } catch (error) {
    console.error(`Error sending digest to user ${userId}:`, error);
    return false;
  }
}

// Send digests to all users with specified frequency
export async function sendDigests(frequency: EmailDigestFreq): Promise<{ sent: number; failed: number }> {
  try {
    // Get all users who have digests enabled for this frequency
    const users = await prisma.users.findMany({
      where: {
        emailDigest: frequency,
        emailNotifications: true,
        emailVerified: { not: null }
      },
      select: { id: true }
    });

    console.log(`Sending ${frequency} digests to ${users.length} users`);

    const results = await Promise.allSettled(
      users.map(user => sendDigestToUser(user.id, frequency))
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failed = results.length - sent;

    console.log(`Digest batch results: ${sent} sent, ${failed} failed`);
    return { sent, failed };

  } catch (error) {
    console.error('Error in batch digest sending:', error);
    return { sent: 0, failed: 0 };
  }
}

// Cron job function to be called periodically
export async function runDigestCron() {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const dayOfMonth = now.getDate();

  console.log(`Running digest cron at ${now.toISOString()}`);

  try {
    // Send daily digests at 8 AM
    if (hour === 8) {
      await sendDigests('DAILY');
    }

    // Send weekly digests on Monday at 9 AM
    if (dayOfWeek === 1 && hour === 9) {
      await sendDigests('WEEKLY');
    }

    // Send monthly digests on the 1st at 10 AM
    if (dayOfMonth === 1 && hour === 10) {
      await sendDigests('MONTHLY');
    }

  } catch (error) {
    console.error('Error in digest cron:', error);
  }
}
