/**
 * Submission Reminder Cron Job
 * Sends reminder emails to participants who haven't submitted yet
 * Can be triggered by a cron service like Vercel Cron or manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSubmissionReminderEmail } from '@/lib/competition-email-service';

export async function GET(request: NextRequest) {
  try {
    // Check authorization (optional - add a secret key check)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (process.env.CRON_SECRET && authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find confirmed registrations that haven't submitted yet
    const registrations = await prisma.competitionRegistration.findMany({
      where: {
        status: 'CONFIRMED',
        submissionStatus: 'NOT_SUBMITTED',
        competition: {
          endDate: {
            gte: now, // Deadline hasn't passed
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        competition: {
          select: {
            id: true,
            title: true,
            slug: true,
            endDate: true,
            startDate: true,
          },
        },
      },
    });

    const emailsSent: string[] = [];
    const emailsFailed: string[] = [];

    for (const registration of registrations) {
      const deadline = new Date(registration.competition.endDate);
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send reminder at 7 days, 3 days, and 1 day before deadline
      let shouldSend = false;
      
      if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
        shouldSend = true;
      }

      if (shouldSend) {
        try {
          await sendSubmissionReminderEmail(
            registration.user.email,
            registration.user.name || 'Participant',
            registration.competition as any,
            registration.registrationNumber,
            daysRemaining
          );
          emailsSent.push(registration.registrationNumber);
          console.log(`✅ Reminder sent to ${registration.user.email} for ${registration.registrationNumber}`);
        } catch (error) {
          emailsFailed.push(registration.registrationNumber);
          console.error(`❌ Failed to send reminder for ${registration.registrationNumber}:`, error);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Submission reminders processed',
      stats: {
        totalRegistrations: registrations.length,
        emailsSent: emailsSent.length,
        emailsFailed: emailsFailed.length,
      },
      details: {
        sent: emailsSent,
        failed: emailsFailed,
      },
    });
  } catch (error) {
    console.error('Error processing submission reminders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// For manual testing
export async function POST(request: NextRequest) {
  return GET(request);
}
