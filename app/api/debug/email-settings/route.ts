import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get current user's email notification settings
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        emailNotifications: true,
        notifyOnComment: true,
        notifyOnLike: true,
        notifyOnMention: true,
        notifyOnReply: true,
        notifyOnNewPost: true,
        notifyOnSystem: true,
        emailDigest: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check email service configuration
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '***' : 'Not set',
      password: process.env.SMTP_PASSWORD ? '***' : 'Not set',
      from: process.env.EMAIL_FROM
    };

    // Get recent email logs for this user
    const recentEmailLogs = await prisma.emailLogs.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        status: true,
        error: true,
        sentAt: true,
        createdAt: true
      }
    });

    // Diagnostic checks
    const diagnostics = {
      userHasEmail: !!user.email,
      emailVerified: !!user.emailVerified,
      globalNotificationsEnabled: user.emailNotifications,
      commentNotificationsEnabled: user.notifyOnComment,
      likeNotificationsEnabled: user.notifyOnLike,
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
      emailFromSet: !!process.env.EMAIL_FROM
    };

    return NextResponse.json({
      user,
      smtpConfig,
      diagnostics,
      recentEmailLogs,
      recommendations: getRecommendations(diagnostics, user)
    });

  } catch (error) {
    console.error('Email settings debug error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}

function getRecommendations(diagnostics: any, _user: any) {
  const recommendations = [];

  if (!diagnostics.userHasEmail) {
    recommendations.push('❌ User has no email address - add email to profile');
  }

  if (!diagnostics.emailVerified) {
    recommendations.push('⚠️ Email not verified - user might not receive emails');
  }

  if (!diagnostics.globalNotificationsEnabled) {
    recommendations.push('❌ Global email notifications are disabled - enable in email preferences');
  }

  if (!diagnostics.commentNotificationsEnabled) {
    recommendations.push('❌ Comment notifications are disabled - enable in email preferences');
  }

  if (!diagnostics.likeNotificationsEnabled) {
    recommendations.push('❌ Like notifications are disabled - enable in email preferences');
  }

  if (!diagnostics.smtpConfigured) {
    recommendations.push('❌ SMTP not properly configured - check environment variables');
  }

  if (!diagnostics.emailFromSet) {
    recommendations.push('❌ EMAIL_FROM not set - check environment variables');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All settings look good! Email notifications should be working.');
  }

  return recommendations;
}
