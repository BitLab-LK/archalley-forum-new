import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin/moderator
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all registrations with related data
    const registrations = await prisma.competitionRegistration.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        competition: {
          select: {
            id: true,
            slug: true,
            title: true,
            year: true,
            status: true,
            startDate: true,
            endDate: true,
            registrationDeadline: true,
          },
        },
        registrationType: {
          select: {
            id: true,
            name: true,
            fee: true,
          },
        },
        payment: {
          select: {
            id: true,
            orderId: true,
            status: true,
            amount: true,
            paymentMethod: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch competitions for filtering
    const competitions = await prisma.competition.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        year: true,
      },
      orderBy: {
        year: 'desc',
      },
    });

    // Calculate statistics
    const stats = {
      total: registrations.length,
      confirmed: registrations.filter(r => r.status === 'CONFIRMED').length,
      pending: registrations.filter(r => r.status === 'PENDING').length,
      submitted: registrations.filter(r => r.submissionStatus === 'SUBMITTED').length,
      totalRevenue: registrations
        .filter(r => r.status === 'CONFIRMED')
        .reduce((sum, r) => sum + r.amountPaid, 0),
    };

    return NextResponse.json({
      registrations,
      competitions,
      stats,
    });
  } catch (error) {
    console.error('Error fetching competition registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
