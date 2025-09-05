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

    // Manually verify the user's email and enable all notifications
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        emailVerified: new Date(), // Mark email as verified
        emailNotifications: true,  // Enable global notifications
        notifyOnComment: true,     // Enable comment notifications
        notifyOnLike: true,        // Enable like notifications
        notifyOnMention: true,     // Enable mention notifications
        notifyOnReply: true,       // Enable reply notifications
        notifyOnSystem: true,      // Enable system notifications
        emailDigest: 'WEEKLY'      // Enable weekly digest
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

    return NextResponse.json({
      success: true,
      message: '✅ Email verified and all notifications enabled!',
      user: updatedUser
    });

  } catch (error) {
    console.error('Fix email setup error:', error);
    return NextResponse.json(
      { error: 'Failed to fix email setup' },
      { status: 500 }
    );
  }
}
