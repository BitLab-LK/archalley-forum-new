/**
 * Withdraw Submission API
 * POST /api/submissions/withdraw
 * User endpoint to withdraw their own submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    // Check if submission exists and belongs to user
    const submission = await prisma.competitionSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        registrationNumber: true,
        title: true,
        userId: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (submission.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only withdraw your own submissions' },
        { status: 403 }
      );
    }

    // Only allow withdrawing SUBMITTED, VALIDATED, or PUBLISHED submissions
    const withdrawableStatuses = ['SUBMITTED', 'VALIDATED', 'PUBLISHED'];
    if (!withdrawableStatuses.includes(submission.status)) {
      return NextResponse.json(
        { error: `Cannot withdraw submission with status: ${submission.status}` },
        { status: 400 }
      );
    }

    // Update submission to WITHDRAWN
    const updatedSubmission = await prisma.competitionSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'WITHDRAWN',
        isPublished: false, // Remove from public view if published
      },
    });

    console.log(`🔙 Submission ${submission.registrationNumber} withdrawn by user ${session.user.name || session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Submission withdrawn successfully',
      submission: updatedSubmission,
    });
  } catch (error: any) {
    console.error('Error withdrawing submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to withdraw submission' },
      { status: 500 }
    );
  }
}
