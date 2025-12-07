/**
 * Admin Submissions API
 * GET /api/admin/submissions
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check admin authorization
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all submissions with related data
    const submissions = await prisma.competitionSubmission.findMany({
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Fetch registration details for each submission
    const submissionsWithDetails = await Promise.all(
      submissions.map(async (submission) => {
        const user = await prisma.users.findUnique({
          where: { id: submission.userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        });

        const registration = await prisma.competitionRegistration.findUnique({
          where: { id: submission.registrationId },
          include: {
            competition: {
              select: {
                id: true,
                title: true,
              },
            },
            registrationType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return {
          ...submission,
          user,
          registration,
        };
      })
    );

    return NextResponse.json({
      success: true,
      submissions: submissionsWithDetails,
      total: submissionsWithDetails.length,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
