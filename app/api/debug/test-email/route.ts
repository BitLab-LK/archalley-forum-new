import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  sendNotificationEmail, 
  initializeEmailService, 
  getEmailServiceStatus 
} from '@/lib/email-service';
import { NotificationType } from '@prisma/client';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get email service status
    const status = getEmailServiceStatus();
    
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      emailService: status,
      endpoints: {
        testSend: 'POST /api/debug/test-email',
        initialize: 'PUT /api/debug/test-email'
      }
    });

  } catch (error) {
    console.error('Email test endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to get email service status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!session.user.email) {
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    const body = await request.json();
    const { type = 'SYSTEM' } = body;

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    console.log(`📧 Testing email notification: ${type} to ${session.user.email}`);

    // Send test email
    const success = await sendNotificationEmail(
      session.user.id,
      type,
      {
        postId: 'test-post-id',
        authorId: 'test-author-id',
        postTitle: 'Test Email Notification',
        commentContent: 'This is a test email notification from Archalley Forum.',
        customUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/test`
      }
    );

    return NextResponse.json({
      success,
      message: success 
        ? `Test email sent successfully to ${session.user.email}` 
        : 'Failed to send test email',
      recipient: session.user.email,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test email send error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🔄 Reinitializing email service...');

    // Reinitialize email service
    const result = await initializeEmailService();
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Email service initialized successfully' 
        : `Failed to initialize email service: ${result.error}`,
      timestamp: new Date().toISOString(),
      status: getEmailServiceStatus()
    });

  } catch (error) {
    console.error('Email service initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize email service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}