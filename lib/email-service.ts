import { prisma } from './prisma';
import { NotificationType, EmailStatus } from '@prisma/client';
import nodemailer from 'nodemailer';

// Email service configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  userEmail: string;
  userName: string;
  postTitle?: string;
  postContent?: string;
  commentContent?: string;
  authorName?: string;
  postUrl?: string;
  siteUrl: string;
}

// Email templates
export const getEmailTemplate = (type: NotificationType, data: EmailData): EmailTemplate => {
  const { userName, postTitle, authorName, postUrl, siteUrl, commentContent } = data;

  const templates: Record<NotificationType, EmailTemplate> = {
    POST_LIKE: {
      subject: `${authorName} liked your post "${postTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Someone liked your post! 👍</h2>
          <p>Hi ${userName},</p>
          <p><strong>${authorName}</strong> liked your post "<strong>${postTitle}</strong>".</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <a href="${postUrl}" style="color: #0066cc; text-decoration: none;">View your post →</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${authorName} liked your post "${postTitle}". View your post: ${postUrl}`
    },

    POST_COMMENT: {
      subject: `${authorName} commented on your post "${postTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New comment on your post! 💬</h2>
          <p>Hi ${userName},</p>
          <p><strong>${authorName}</strong> commented on your post "<strong>${postTitle}</strong>".</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">"${commentContent}"</p>
          </div>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reply to Comment</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${authorName} commented on your post "${postTitle}": "${commentContent}". Reply: ${postUrl}`
    },

    COMMENT_REPLY: {
      subject: `${authorName} replied to your comment`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Someone replied to your comment! 💭</h2>
          <p>Hi ${userName},</p>
          <p><strong>${authorName}</strong> replied to your comment on "<strong>${postTitle}</strong>".</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">"${commentContent}"</p>
          </div>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Conversation</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${authorName} replied to your comment on "${postTitle}": "${commentContent}". View: ${postUrl}`
    },

    MENTION: {
      subject: `${authorName} mentioned you in a post`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You were mentioned! 📢</h2>
          <p>Hi ${userName},</p>
          <p><strong>${authorName}</strong> mentioned you in "${postTitle}".</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">"${commentContent}"</p>
          </div>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Post</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${authorName} mentioned you in "${postTitle}": "${commentContent}". View: ${postUrl}`
    },

    BEST_ANSWER: {
      subject: `Your comment was marked as the best answer!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Congratulations! 🏆</h2>
          <p>Hi ${userName},</p>
          <p>Your comment on "<strong>${postTitle}</strong>" was marked as the best answer!</p>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Answer</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, your comment on "${postTitle}" was marked as the best answer! View: ${postUrl}`
    },

    SYSTEM: {
      subject: `System Notification`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">System Notification 🔔</h2>
          <p>Hi ${userName},</p>
          <p>${commentContent}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have system notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${commentContent}`
    },

    EMAIL_VERIFICATION: {
      subject: `Verify your email address`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify your email address 📧</h2>
          <p>Hi ${userName},</p>
          <p>Please verify your email address to receive notifications and secure your account.</p>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 12px;">
            If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `Hi ${userName}, please verify your email address: ${postUrl}`
    },

    NEW_POST_IN_CATEGORY: {
      subject: `New post in category you follow: "${postTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New post in your followed category! 📝</h2>
          <p>Hi ${userName},</p>
          <p><strong>${authorName}</strong> posted "${postTitle}" in a category you follow.</p>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Read Post</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you follow this category. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${authorName} posted "${postTitle}" in a category you follow. Read: ${postUrl}`
    },

    NEW_FOLLOWER: {
      subject: `${authorName} started following you`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You have a new follower! 👥</h2>
          <p>Hi ${userName},</p>
          <p><strong>${authorName}</strong> started following you.</p>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Profile</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${authorName} started following you. View profile: ${postUrl}`
    }
  };

  return templates[type];
};

// Check if user wants email notifications for this type
export const shouldSendEmail = async (userId: string, type: NotificationType): Promise<boolean> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
      emailNotifications: true,
      notifyOnComment: true,
      notifyOnLike: true,
      notifyOnMention: true,
      notifyOnReply: true,
      notifyOnNewPost: true,
      notifyOnSystem: true,
    }
  });

  if (!user) {
    return false;
  }

  // For development, allow emails even if not verified (but user must have email address)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasEmail = !!user.email;
  const isVerifiedOrDev = user.emailVerified || isDevelopment;
  
  if (!hasEmail || !user.emailNotifications || !isVerifiedOrDev) {
    console.log(`Email blocked for user ${userId}: hasEmail=${hasEmail}, notifications=${user.emailNotifications}, verified=${!!user.emailVerified}, isDev=${isDevelopment}`);
    return false;
  }

  const preferenceMap: Record<NotificationType, boolean> = {
    POST_COMMENT: user.notifyOnComment,
    POST_LIKE: user.notifyOnLike,
    MENTION: user.notifyOnMention,
    COMMENT_REPLY: user.notifyOnReply,
    NEW_POST_IN_CATEGORY: user.notifyOnNewPost,
    SYSTEM: user.notifyOnSystem,
    BEST_ANSWER: true, // Always send for best answer
    EMAIL_VERIFICATION: true, // Always send for verification
    NEW_FOLLOWER: true, // Always send for new followers
  };

  return preferenceMap[type] ?? false;
};

// Main email sending function
export const sendNotificationEmail = async (
  userId: string,
  type: NotificationType,
  data: {
    postId?: string;
    commentId?: string;
    authorId?: string;
    postTitle?: string;
    commentContent?: string;
    customUrl?: string;
  }
): Promise<boolean> => {
  try {
    // Check if user wants this type of email
    const shouldSend = await shouldSendEmail(userId, type);
    if (!shouldSend) {
      console.log(`User ${userId} has disabled ${type} email notifications`);
      return false;
    }

    // Get user and author data
    const [user, author] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      }),
      data.authorId ? prisma.users.findUnique({
        where: { id: data.authorId },
        select: { name: true }
      }) : null
    ]);

    if (!user?.email) {
      console.log(`User ${userId} has no email address`);
      return false;
    }

    // Get post data if needed
    let post = null;
    if (data.postId) {
      post = await prisma.post.findUnique({
        where: { id: data.postId },
        select: { id: true, title: true, content: true }
      });
    }

    // Prepare email data
    const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const postUrl = data.customUrl || (data.postId ? `${siteUrl}/posts/${data.postId}` : siteUrl);

    const emailData: EmailData = {
      userEmail: user.email,
      userName: user.name || 'User',
      postTitle: data.postTitle || post?.title || 'Untitled Post',
      postContent: post?.content,
      commentContent: data.commentContent,
      authorName: author?.name || 'Someone',
      postUrl,
      siteUrl,
    };

    // Generate email template
    const template = getEmailTemplate(type, emailData);

    // Log email attempt
    const emailLog = await prisma.emailLogs.create({
      data: {
        email: user.email,
        subject: template.subject,
        template: type,
        type,
        status: EmailStatus.PENDING,
        userId,
        postId: data.postId,
        commentId: data.commentId,
        metadata: data,
      }
    });

    try {
      // Send email
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Forum'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: user.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      // Update log as sent
      await prisma.emailLogs.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        }
      });

      console.log(`Email sent successfully to ${user.email} for ${type}`);
      return true;

    } catch (emailError) {
      // Update log as failed
      await prisma.emailLogs.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.FAILED,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        }
      });

      console.error(`Failed to send email to ${user.email}:`, emailError);
      return false;
    }

  } catch (error) {
    console.error('Error in sendNotificationEmail:', error);
    return false;
  }
};

// Batch email sending for multiple users
export const sendBulkNotificationEmails = async (
  userIds: string[],
  type: NotificationType,
  data: {
    postId?: string;
    commentId?: string;
    authorId?: string;
    postTitle?: string;
    commentContent?: string;
    customUrl?: string;
  }
): Promise<{ sent: number; failed: number }> => {
  const results = await Promise.allSettled(
    userIds.map(userId => sendNotificationEmail(userId, type, data))
  );

  const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - sent;

  console.log(`Bulk email results: ${sent} sent, ${failed} failed`);
  return { sent, failed };
};

// Helper function to extract mentions from content
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

// Helper function to get user IDs from usernames
export const getUserIdsByUsernames = async (usernames: string[]): Promise<string[]> => {
  const users = await prisma.users.findMany({
    where: {
      name: {
        in: usernames,
        mode: 'insensitive'
      }
    },
    select: { id: true }
  });
  
  return users.map(user => user.id);
};
