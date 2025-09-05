import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendNotificationEmail } from '@/lib/email-service';
import { NotificationType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type = 'SYSTEM' } = body;

    // Send a test email to the current user
    const success = await sendNotificationEmail(
      session.user.id,
      type as NotificationType,
      {
        postTitle: 'Test Post Title',
        commentContent: 'This is a test email notification to verify your email service is working correctly.',
        authorId: session.user.id,
        customUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile/email-preferences`
      }
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully! Check your inbox.'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Test email failed to send. Check your email preferences and configuration.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
