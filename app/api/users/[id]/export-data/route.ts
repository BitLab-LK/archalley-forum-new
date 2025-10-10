import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;
    
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Collect all user data
    const userData = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        Post: {
          include: {
            Comment: true,
            primaryCategory: true,
            postCategories: {
              include: {
                category: true
              }
            }
          }
        },
        Comment: {
          include: {
            Post: {
              select: { id: true, content: true }
            }
          }
        },
        votes: true,
        workExperience: true,
        education: true,
        notifications: true,
        Account: {
          select: {
            provider: true,
            providerAccountId: true
          }
        }
      }
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const exportData = {
      profile: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        company: userData.company,
        profession: userData.profession,
        linkedinUrl: userData.linkedinUrl,
        twitterUrl: userData.twitterUrl,
        instagramUrl: userData.instagramUrl,
        githubUrl: userData.githubUrl,
        createdAt: userData.createdAt,
        lastActiveAt: userData.lastActiveAt,
        skills: userData.skills,
        industry: userData.industry,
        country: userData.country,
        city: userData.city
      },
      posts: userData.Post.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isAnonymous: post.isAnonymous,
        commentsCount: post.Comment.length,
        categoryName: post.primaryCategory?.name || 'Other'
      })),
      comments: userData.Comment.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        postContent: comment.Post.content?.substring(0, 50) + '...',
        postId: comment.Post.id
      })),
      votes: userData.votes.map(vote => ({
        id: vote.id,
        type: vote.type,
        createdAt: vote.createdAt,
        postId: vote.postId,
        commentId: vote.commentId
      })),
      workExperience: userData.workExperience,
      education: userData.education,
      notifications: userData.notifications.map(notif => ({
        id: notif.id,
        type: notif.type,
        message: notif.message,
        createdAt: notif.createdAt,
        isRead: notif.isRead
      })),
      connectedAccounts: userData.Account.map(account => ({
        provider: account.provider
      })),
      preferences: {
        emailNotifications: userData.emailNotifications,
        notifyOnComment: userData.notifyOnComment,
        notifyOnLike: userData.notifyOnLike,
        notifyOnMention: userData.notifyOnMention,
        notifyOnReply: userData.notifyOnReply,
        notifyOnNewPost: userData.notifyOnNewPost,
        notifyOnSystem: userData.notifyOnSystem,
        emailDigest: userData.emailDigest,
        profileVisibility: userData.profileVisibility,
        emailPrivacy: userData.emailPrivacy,
        phonePrivacy: userData.phonePrivacy,
        profilePhotoPrivacy: userData.profilePhotoPrivacy
      },
      exportedAt: new Date().toISOString()
    };

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `archAlley-data-export-${timestamp}.json`;

    // Return the data as a downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(JSON.stringify(exportData, null, 2)).toString()
      }
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
