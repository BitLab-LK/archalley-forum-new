/**
 * My Registrations API Route
 * Returns all registrations for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types/competition';

export async function GET(
  _request: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Fetch all registrations for the user
    const registrations = await prisma.competitionRegistration.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        registrationNumber: true,
        // displayCode is excluded - only visible to admins
        userId: true,
        competitionId: true,
        registrationTypeId: true,
        paymentId: true,
        country: true,
        participantType: true,
        referralSource: true,
        teamName: true,
        companyName: true,
        businessRegistrationNo: true,
        teamMembers: true,
        members: true,
        status: true,
        submissionStatus: true,
        amountPaid: true,
        currency: true,
        registeredAt: true,
        confirmedAt: true,
        submittedAt: true,
        submissionFiles: true,
        submissionNotes: true,
        submissionUrl: true,
        score: true,
        judgeComments: true,
        rank: true,
        award: true,
        certificateUrl: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        competition: true,
        registrationType: true,
        payment: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch registrations',
      },
      { status: 500 }
    );
  }
}
