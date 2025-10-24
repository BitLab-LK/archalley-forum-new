import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationEmail, extractMentions, getUserIdsByUsernames } from '@/lib/email-service';
import { NotificationType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, data } = body;

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: type and userId' },
        { status: 400 }
      );
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    const success = await sendNotificationEmail(userId, type, data);

    return NextResponse.json({
      success,
      message: success ? 'Email sent successfully' : 'Email not sent (user preferences or error)'
    });

  } catch (error) {
    console.error('Email notification API error:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}

// Helper endpoint to send mention notifications
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, authorId, postId, postTitle } = body;

    if (!content || !authorId || !postId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract mentions from content
    const mentionedUsernames = extractMentions(content);
    
    if (mentionedUsernames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No mentions found',
        mentionsSent: 0
      });
    }

    // Get user IDs from usernames
    const mentionedUserIds = await getUserIdsByUsernames(mentionedUsernames);

    // Send mention emails to all mentioned users
    const results = await Promise.allSettled(
      mentionedUserIds.map(userId => 
        sendNotificationEmail(userId, NotificationType.MENTION, {
          authorId,
          postId,
          postTitle,
          commentContent: content
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

    return NextResponse.json({
      success: true,
      mentionsSent: sent,
      totalMentions: mentionedUserIds.length,
      mentionedUsernames
    });

  } catch (error) {
    console.error('Mention notification API error:', error);
    return NextResponse.json(
      { error: 'Failed to send mention notifications' },
      { status: 500 }
    );
  }
}
