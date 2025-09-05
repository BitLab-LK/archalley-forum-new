import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current user data
    const currentUser = await prisma.users.findUnique({
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
        notifyOnSystem: true,
        emailDigest: true
      }
    });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Special handling for Google OAuth users
    const isGoogleUser = session.user.email && session.user.image?.includes('googleusercontent.com');
    const sessionEmail = session.user.email;

    // Update user with Google OAuth email and verify it
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        // Use Google email if available and different
        email: sessionEmail || currentUser.email,
        // For Google OAuth users, auto-verify email
        emailVerified: isGoogleUser ? new Date() : currentUser.emailVerified,
        // Enable all email notifications
        emailNotifications: true,
        notifyOnComment: true,
        notifyOnLike: true,
        notifyOnMention: true,
        notifyOnReply: true,
        notifyOnSystem: true,
        emailDigest: 'WEEKLY'
      },
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
        notifyOnSystem: true,
        emailDigest: true
      }
    });

    const diagnostics = {
      isGoogleUser,
      sessionEmail,
      originalEmail: currentUser.email,
      finalEmail: updatedUser.email,
      wasVerified: !!currentUser.emailVerified,
      nowVerified: !!updatedUser.emailVerified,
      hadNotifications: currentUser.emailNotifications,
      nowHasNotifications: updatedUser.emailNotifications
    };

    return NextResponse.json({
      success: true,
      message: '✅ Google OAuth user email setup completed!',
      user: updatedUser,
      diagnostics,
      changes: {
        emailUpdated: currentUser.email !== updatedUser.email,
        emailVerified: !currentUser.emailVerified && !!updatedUser.emailVerified,
        notificationsEnabled: !currentUser.emailNotifications && updatedUser.emailNotifications
      }
    });

  } catch (error) {
    console.error('Google OAuth email setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup Google OAuth email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
