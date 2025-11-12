/**
 * Delete Competition Registrations API
 * Allows admin to delete one or multiple registrations
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
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { registrationIds } = body;

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Registration IDs are required' },
        { status: 400 }
      );
    }

    console.log(`Admin ${session.user.email} attempting to delete ${registrationIds.length} registrations`);

    // Fetch registrations to get payment info before deletion
    const registrationsToDelete = await prisma.competitionRegistration.findMany({
      where: {
        id: { in: registrationIds },
      },
      include: {
        payment: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (registrationsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No registrations found to delete' },
        { status: 404 }
      );
    }

    // Group registrations by payment ID
    const paymentGroups = new Map<string, typeof registrationsToDelete>();
    const noPaymentRegs: typeof registrationsToDelete = [];

    registrationsToDelete.forEach((reg) => {
      if (reg.paymentId) {
        const existing = paymentGroups.get(reg.paymentId) || [];
        existing.push(reg);
        paymentGroups.set(reg.paymentId, existing);
      } else {
        noPaymentRegs.push(reg);
      }
    });

    // Delete registrations
    const deleted = await prisma.competitionRegistration.deleteMany({
      where: {
        id: { in: registrationIds },
      },
    });

    // Check if we should also delete the payment records
    // Only delete payment if ALL associated registrations are being deleted
    const paymentsToDelete: string[] = [];

    for (const [paymentId] of paymentGroups.entries()) {
      // Check if there are any remaining registrations for this payment
      const remainingRegs = await prisma.competitionRegistration.count({
        where: {
          paymentId: paymentId,
        },
      });

      // If no registrations remain, delete the payment record too
      if (remainingRegs === 0) {
        paymentsToDelete.push(paymentId);
      }
    }

    // Delete orphaned payment records
    if (paymentsToDelete.length > 0) {
      await prisma.competitionPayment.deleteMany({
        where: {
          id: { in: paymentsToDelete },
        },
      });
      console.log(`Deleted ${paymentsToDelete.length} orphaned payment records`);
    }

    console.log(`Successfully deleted ${deleted.count} registrations`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleted.count} registration(s)`,
      deletedCount: deleted.count,
      orphanedPaymentsDeleted: paymentsToDelete.length,
    });
  } catch (error) {
    console.error('Error deleting registrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete registrations',
      },
      { status: 500 }
    );
  }
}
