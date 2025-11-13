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
      select: {
        id: true,
        registrationNumber: true,
        displayCode: true,
        status: true,
        submissionStatus: true,
        country: true,
        participantType: true,
        referralSource: true,
        teamName: true,
        companyName: true,
        businessRegistrationNo: true,
        teamMembers: true,
        members: true, // CRITICAL: User-filled data (emails, phones, names, parent info, etc.)
        amountPaid: true,
        currency: true,
        registeredAt: true,
        confirmedAt: true,
        submittedAt: true,
        submissionFiles: true,
        submissionNotes: true,
        submissionUrl: true,
        score: true,
        rank: true,
        award: true,
        createdAt: true,
        updatedAt: true,
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
            metadata: true,
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

    // Calculate statistics - Group by payment to avoid double counting
    // Group registrations by payment ID to get unique transactions
    const paymentGroups = new Map<string, typeof registrations>();
    registrations.forEach(reg => {
      const key = reg.payment?.id || `no-payment-${reg.id}`;
      if (!paymentGroups.has(key)) {
        paymentGroups.set(key, []);
      }
      paymentGroups.get(key)!.push(reg);
    });

    // Calculate total revenue by summing each payment group once
    let totalRevenue = 0;
    paymentGroups.forEach(group => {
      // Check if at least one registration in the group is CONFIRMED
      const hasConfirmed = group.some(r => r.status === 'CONFIRMED');
      if (hasConfirmed) {
        // Sum all amounts in this payment group (they're part of same transaction)
        const groupTotal = group.reduce((sum, r) => sum + r.amountPaid, 0);
        totalRevenue += groupTotal;
      }
    });

    const stats = {
      total: registrations.length,
      confirmed: registrations.filter(r => r.status === 'CONFIRMED').length,
      pending: registrations.filter(r => r.status === 'PENDING').length,
      submitted: registrations.filter(r => r.submissionStatus === 'SUBMITTED').length,
      totalRevenue: totalRevenue,
    };

    return NextResponse.json({
      success: true,
      data: {
        registrations,
        competitions,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching competition registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
