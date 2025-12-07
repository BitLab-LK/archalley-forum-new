/**
 * Unpublish Submission API
 * POST /api/admin/submissions/unpublish
 * Admin endpoint to unpublish a published submission
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
    const { submissionId, reason } = body;

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
        isPublished: true,
        userId: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Only allow unpublishing PUBLISHED submissions
    if (submission.status !== 'PUBLISHED' || !submission.isPublished) {
      return NextResponse.json(
        { error: `Cannot unpublish submission with status: ${submission.status}. Only PUBLISHED submissions can be unpublished.` },
        { status: 400 }
      );
    }

    // Update submission to VALIDATED (unpublished but still validated)
    const updatedSubmission = await prisma.competitionSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'VALIDATED',
        isPublished: false,
        // Keep validation status, just remove from public view
      },
    });

    console.log(`🔒 Submission ${submission.registrationNumber} unpublished by admin ${user.name}`);
    console.log(`   Title: ${submission.title}`);
    if (reason) {
      console.log(`   Reason: ${reason}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Submission unpublished successfully',
      submission: updatedSubmission,
    });
  } catch (error: any) {
    console.error('Error unpublishing submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unpublish submission' },
      { status: 500 }
    );
  }
}

