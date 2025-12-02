/**
 * Reject Submission API
 * POST /api/admin/submissions/reject
 * Admin endpoint to reject a submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { submissionId, rejectionReason } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Check if submission exists
    const submission = await prisma.competitionSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        submissionNumber: true,
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

    // Only allow rejecting SUBMITTED or VALIDATED submissions
    if (!['SUBMITTED', 'VALIDATED'].includes(submission.status)) {
      return NextResponse.json(
        { error: `Cannot reject submission with status: ${submission.status}` },
        { status: 400 }
      );
    }

    // Update submission to REJECTED
    const updatedSubmission = await prisma.competitionSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'REJECTED',
        isValidated: false,
        isPublished: false,
        validatedBy: session.user.id,
        validatedAt: new Date(),
        validationNotes: rejectionReason,
        validationErrors: { reason: rejectionReason }, // Store structured rejection data
      },
    });

    console.log(`❌ Submission ${submission.submissionNumber} rejected by admin ${user.name}`);
    console.log(`   Reason: ${rejectionReason}`);

    return NextResponse.json({
      success: true,
      message: 'Submission rejected successfully',
      submission: updatedSubmission,
    });
  } catch (error: any) {
    console.error('Error rejecting submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject submission' },
      { status: 500 }
    );
  }
}
