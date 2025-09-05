import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Enable all email notifications for the current user
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
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
      message: '✅ All email notifications have been enabled!',
      user: updatedUser
    });

  } catch (error) {
    console.error('Enable notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to enable notifications' },
      { status: 500 }
    );
  }
}
