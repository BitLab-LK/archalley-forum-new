/**
 * API Route: Update Competition Registration Submission
 * Handles project submission uploads and updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateSubmissionStatus } from '@/lib/competition-utils';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { registrationId, submissionUrl, submissionNotes, submissionFiles } = body;

    // Validate required fields
    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Fetch registration to verify ownership
    const registration = await prisma.competitionRegistration.findUnique({
      where: { id: registrationId },
      include: {
        user: true,
        competition: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check if user owns this registration
    if (registration.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'You do not have permission to update this registration' },
        { status: 403 }
      );
    }

    // Check if registration is confirmed
    if (registration.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Only confirmed registrations can submit projects' },
        { status: 400 }
      );
    }

    // Check if competition is still accepting submissions
    const now = new Date();
    if (now > new Date(registration.competition.endDate)) {
      return NextResponse.json(
        { error: 'Submission deadline has passed' },
        { status: 400 }
      );
    }

    // Update registration with submission using utility function
    await updateSubmissionStatus(
      prisma,
      registrationId,
      'SUBMITTED',
      {
        submissionUrl: submissionUrl || registration.submissionUrl,
        submissionNotes: submissionNotes || registration.submissionNotes,
        submissionFiles: submissionFiles || registration.submissionFiles,
      }
    );

    // Fetch updated registration with relations
    const finalRegistration = await prisma.competitionRegistration.findUnique({
      where: { id: registrationId },
      include: {
        competition: true,
        registrationType: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Submission uploaded successfully',
      registration: finalRegistration,
    });
  } catch (error) {
    console.error('❌ Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
