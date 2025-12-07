/**
 * Publish Submission API
 * POST /api/admin/submissions/publish
 * Admin endpoint to publish a validated submission for public voting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSubmissionPublishedEmail } from '@/lib/competition-email-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check admin authorization
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Check if submission exists
    const submission = await prisma.competitionSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        registrationNumber: true,
        title: true,
        submissionCategory: true,
        isValidated: true,
        userId: true,
        competitionId: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Allow publishing VALIDATED or SUBMITTED submissions (auto-validate if SUBMITTED)
    if (!['VALIDATED', 'SUBMITTED'].includes(submission.status)) {
      return NextResponse.json(
        { error: `Cannot publish submission with status: ${submission.status}. Only VALIDATED or SUBMITTED submissions can be published.` },
        { status: 400 }
      );
    }

    // Update submission to PUBLISHED (auto-validate if needed)
    const updatedSubmission = await prisma.competitionSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'PUBLISHED',
        isPublished: true,
        publishedAt: new Date(),
        isValidated: true, // Auto-validate when publishing
        validatedAt: submission.isValidated ? undefined : new Date(), // Only set if not already validated
      },
    });

    console.log(`🚀 Submission ${submission.registrationNumber} published by admin ${user.name}`);
    console.log(`   Title: ${submission.title}`);
    console.log(`   Now live for public voting!`);

    // Send email notification to user
    try {
      // Fetch user and competition details for email
      const [userData, competition] = await Promise.all([
        prisma.users.findUnique({
          where: { id: submission.userId },
          select: { name: true, email: true },
        }),
        prisma.competition.findUnique({
          where: { id: submission.competitionId },
        }),
      ]);

      if (userData && competition) {
        const submissionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/submissions/${submissionId}`;
        
        await sendSubmissionPublishedEmail({
          submission: {
            registrationNumber: submission.registrationNumber || '',
            title: submission.title,
            submissionCategory: submission.submissionCategory,
            publishedAt: updatedSubmission.publishedAt,
          },
          competition: competition as any,
          userName: userData.name || 'Participant',
          userEmail: userData.email,
          submissionUrl,
        });
        console.log(`📧 Submission published email sent to ${userData.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send submission published email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Submission published successfully',
      submission: updatedSubmission,
    });
  } catch (error: any) {
    console.error('Error publishing submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish submission' },
      { status: 500 }
    );
  }
}
