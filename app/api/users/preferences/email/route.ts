import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const emailPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  notifyOnComment: z.boolean(),
  notifyOnLike: z.boolean(),
  notifyOnMention: z.boolean(),
  notifyOnReply: z.boolean(),
  notifyOnNewPost: z.boolean(),
  notifyOnSystem: z.boolean(),
  emailDigest: z.enum(['DISABLED', 'DAILY', 'WEEKLY', 'MONTHLY'])
});

// GET - Fetch user's email preferences
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotifications: true,
        notifyOnComment: true,
        notifyOnLike: true,
        notifyOnMention: true,
        notifyOnReply: true,
        notifyOnNewPost: true,
        notifyOnSystem: true,
        emailDigest: true,
        emailVerified: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      emailNotifications: user.emailNotifications,
      notifyOnComment: user.notifyOnComment,
      notifyOnLike: user.notifyOnLike,
      notifyOnMention: user.notifyOnMention,
      notifyOnReply: user.notifyOnReply,
      notifyOnNewPost: user.notifyOnNewPost,
      notifyOnSystem: user.notifyOnSystem,
      emailDigest: user.emailDigest,
      emailVerified: !!user.emailVerified
    });

  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update user's email preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const preferences = emailPreferencesSchema.parse(body);

    // Update user preferences
    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        emailNotifications: preferences.emailNotifications,
        notifyOnComment: preferences.notifyOnComment,
        notifyOnLike: preferences.notifyOnLike,
        notifyOnMention: preferences.notifyOnMention,
        notifyOnReply: preferences.notifyOnReply,
        notifyOnNewPost: preferences.notifyOnNewPost,
        notifyOnSystem: preferences.notifyOnSystem,
        emailDigest: preferences.emailDigest
      },
      select: {
        id: true,
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

    return NextResponse.json({
      success: true,
      preferences: {
        emailNotifications: updatedUser.emailNotifications,
        notifyOnComment: updatedUser.notifyOnComment,
        notifyOnLike: updatedUser.notifyOnLike,
        notifyOnMention: updatedUser.notifyOnMention,
        notifyOnReply: updatedUser.notifyOnReply,
        notifyOnNewPost: updatedUser.notifyOnNewPost,
        notifyOnSystem: updatedUser.notifyOnSystem,
        emailDigest: updatedUser.emailDigest
      }
    });

  } catch (error) {
    console.error('Error updating email preferences:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preferences data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update email preferences' },
      { status: 500 }
    );
  }
}
