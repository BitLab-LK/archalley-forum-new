/**
 * Validate Submission API
 * POST /api/admin/submissions/validate
 * Admin endpoint to approve/validate a submission
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
    const { submissionId, validationNotes } = body;

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
        userId: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Only allow validating SUBMITTED submissions
    if (submission.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: `Cannot validate submission with status: ${submission.status}` },
        { status: 400 }
      );
    }

    // Update submission to VALIDATED
    const updatedSubmission = await prisma.competitionSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'VALIDATED',
        isValidated: true,
        validatedBy: session.user.id,
        validatedAt: new Date(),
        validationNotes: validationNotes || null,
      },
    });

    console.log(`✅ Submission ${submission.registrationNumber} validated by admin ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Submission validated successfully',
      submission: updatedSubmission,
    });
  } catch (error: any) {
    console.error('Error validating submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate submission' },
      { status: 500 }
    );
  }
}
