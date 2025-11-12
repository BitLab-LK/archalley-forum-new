/**
 * API Route: Delete Competition Registrations
 * Handles bulk deletion of competition registrations and associated data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get registration IDs to delete
    const body = await request.json();
    const { registrationIds } = body;

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No registration IDs provided' },
        { status: 400 }
      );
    }

    console.log(`[Admin] Deleting ${registrationIds.length} registrations:`, registrationIds);

    // Fetch registrations to get payment IDs
    const registrations = await prisma.competitionRegistration.findMany({
      where: {
        id: { in: registrationIds },
      },
      include: {
        payment: true,
      },
    });

    if (registrations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No registrations found' },
        { status: 404 }
      );
    }

    // Extract payment IDs
    const paymentIds = registrations
      .filter(reg => reg.payment)
      .map(reg => reg.payment!.id);

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete registrations (CASCADE will handle most related data)
      const deletedRegistrations = await tx.competitionRegistration.deleteMany({
        where: {
          id: { in: registrationIds },
        },
      });

      // 2. Delete associated payments if they exist
      let deletedPayments = { count: 0 };
      if (paymentIds.length > 0) {
        deletedPayments = await tx.competitionPayment.deleteMany({
          where: {
            id: { in: paymentIds },
          },
        });
      }

      return {
        deletedRegistrations: deletedRegistrations.count,
        deletedPayments: deletedPayments.count,
      };
    });

    console.log(`[Admin] Deletion complete:`, result);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedRegistrations} registration(s) and ${result.deletedPayments} payment(s)`,
      deletedCount: result.deletedRegistrations,
    });

  } catch (error: any) {
    console.error('[Admin] Error deleting registrations:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete registrations',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
