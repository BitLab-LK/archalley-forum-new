/**
 * Publish Submission API
 * POST /api/admin/submissions/publish
 * Admin endpoint to publish a validated submission for public voting
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
        submissionNumber: true,
        title: true,
        isValidated: true,
        userId: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Only allow publishing VALIDATED submissions
    if (submission.status !== 'VALIDATED') {
      return NextResponse.json(
        { error: `Cannot publish submission with status: ${submission.status}. Only VALIDATED submissions can be published.` },
        { status: 400 }
      );
    }

    if (!submission.isValidated) {
      return NextResponse.json(
        { error: 'Submission must be validated before publishing' },
        { status: 400 }
      );
    }

    // Update submission to PUBLISHED
    const updatedSubmission = await prisma.competitionSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'PUBLISHED',
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    console.log(`🚀 Submission ${submission.submissionNumber} published by admin ${user.name}`);
    console.log(`   Title: ${submission.title}`);
    console.log(`   Now live for public voting!`);

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
