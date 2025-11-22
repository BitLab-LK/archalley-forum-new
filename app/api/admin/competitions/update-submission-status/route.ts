/**
 * API Route: Update Submission Status
 * Updates the submissionStatus field for a competition registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { registrationId, submissionStatus } = body;

    if (!registrationId || !submissionStatus) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate submissionStatus
    const validStatuses = ['NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(submissionStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission status' },
        { status: 400 }
      );
    }

    // Update the registration
    const updatedRegistration = await prisma.competitionRegistration.update({
      where: { id: registrationId },
      data: {
        submissionStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRegistration,
      message: `Submission status updated to ${submissionStatus}`,
    });
  } catch (error: any) {
    console.error('Error updating submission status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update submission status',
      },
      { status: 500 }
    );
  }
}
