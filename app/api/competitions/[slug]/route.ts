/**
 * GET Competition by Slug API Route
 * Returns competition details with registration types
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiResponse, CompetitionWithTypes } from '@/types/competition';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse<ApiResponse<CompetitionWithTypes>>> {
  try {
    const { slug } = params;

    // Fetch competition with registration types
    const competition = await prisma.competition.findUnique({
      where: { slug },
      include: {
        registrationTypes: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: ['CONFIRMED', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLETED'],
                },
              },
            },
          },
        },
      },
    });

    if (!competition) {
      return NextResponse.json(
        {
          success: false,
          error: 'Competition not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: competition,
    });
  } catch (error) {
    console.error('Error fetching competition:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch competition details',
      },
      { status: 500 }
    );
  }
}
