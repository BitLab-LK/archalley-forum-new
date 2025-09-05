import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendNotificationEmail } from '@/lib/email-service';
import { NotificationType } from '@prisma/client';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Send a test email to the current user
    const success = await sendNotificationEmail(
      session.user.id, 
      NotificationType.SYSTEM, 
      {
        postTitle: 'Test Email System',
        authorId: session.user.id,
        customUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/`
      }
    );

    return NextResponse.json({
      success,
      message: success 
        ? '✅ Test email sent successfully!' 
        : '❌ Test email failed to send. Check console logs and email settings.',
      userId: session.user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send test email', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
