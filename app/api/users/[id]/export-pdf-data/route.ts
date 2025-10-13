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

    // Get user data with simplified relationships
    const userData = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        location: true,
        portfolioUrl: true,
        company: true,
        profession: true,
        linkedinUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        githubUrl: true,
        createdAt: true,
        lastActiveAt: true,
        skills: true,
        industry: true,
        country: true,
        city: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        headline: true,
        facebookUrl: true,
        emailNotifications: true,
        notifyOnComment: true,
        notifyOnLike: true,
        notifyOnMention: true,
        notifyOnReply: true,
        notifyOnNewPost: true,
        notifyOnSystem: true,
        emailDigest: true,
        profileVisibility: true,
        workExperience: {
          select: {
            jobTitle: true,
            company: true,
            startDate: true,
            endDate: true,
            description: true
          }
        },
        education: {
          select: {
            degree: true,
            institution: true,
            startDate: true,
            endDate: true,
            description: true
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

    // Get post count
    const postCount = await prisma.post.count({
      where: { authorId: userId }
    });

    // Get comment count
    const commentCount = await prisma.comment.count({
      where: { authorId: userId }
    });

    // Create a comprehensive data object for PDF generation
    const exportData = {
      profile: {
        fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name,
        email: userData.email,
        headline: userData.headline,
        bio: userData.bio,
        company: userData.company,
        profession: userData.profession,
        industry: userData.industry,
        location: `${userData.city || ''} ${userData.country || ''}`.trim(),
        phone: userData.phoneNumber,
        portfolioUrl: userData.portfolioUrl,
        skills: userData.skills || [],
        memberSince: userData.createdAt?.toLocaleDateString(),
        lastActive: userData.lastActiveAt?.toLocaleDateString()
      },
      socialLinks: {
        linkedin: userData.linkedinUrl,
        twitter: userData.twitterUrl,
        instagram: userData.instagramUrl,
        github: userData.githubUrl,
        facebook: userData.facebookUrl
      },
      workExperience: userData.workExperience.map(work => ({
        position: work.jobTitle,
        company: work.company,
        duration: `${work.startDate} - ${work.endDate || 'Present'}`,
        description: work.description
      })),
      education: userData.education.map(edu => ({
        degree: edu.degree,
        institution: edu.institution,
        duration: `${edu.startDate} - ${edu.endDate || 'Present'}`,
        description: edu.description
      })),
      activity: {
        totalPosts: postCount,
        totalComments: commentCount
      },
      preferences: {
        profileVisibility: userData.profileVisibility ? 'Public' : 'Private',
        emailNotifications: userData.emailNotifications ? 'Enabled' : 'Disabled',
        commentNotifications: userData.notifyOnComment ? 'Enabled' : 'Disabled',
        likeNotifications: userData.notifyOnLike ? 'Enabled' : 'Disabled',
        mentionNotifications: userData.notifyOnMention ? 'Enabled' : 'Disabled',
        replyNotifications: userData.notifyOnReply ? 'Enabled' : 'Disabled',
        newPostNotifications: userData.notifyOnNewPost ? 'Enabled' : 'Disabled',
        systemNotifications: userData.notifyOnSystem ? 'Enabled' : 'Disabled',
        emailDigest: userData.emailDigest
      },
      exportDate: new Date().toLocaleDateString(),
      exportTime: new Date().toLocaleTimeString()
    };

    return NextResponse.json(exportData);

  } catch (error) {
    console.error('PDF export data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
