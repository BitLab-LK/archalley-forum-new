/**
 * Revert Payment API Route
 * Admin endpoint to revert approved/rejected payments back to PENDING
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        role: true, 
        name: true,
        email: true,
      },
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, registrationId } = body;

    if (!paymentId || !registrationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get payment and registration details
    const payment = await prisma.competitionPayment.findUnique({
      where: { id: paymentId },
    });

    const registration = await prisma.competitionRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!payment || !registration) {
      return NextResponse.json(
        { success: false, error: 'Payment or registration not found' },
        { status: 404 }
      );
    }

    // Check if payment can be reverted (must be COMPLETED or FAILED)
    if (payment.status !== 'COMPLETED' && payment.status !== 'FAILED') {
      return NextResponse.json(
        { success: false, error: 'Payment cannot be reverted (must be COMPLETED or FAILED)' },
        { status: 400 }
      );
    }

    // Revert payment to PENDING with audit trail
    await prisma.competitionPayment.update({
      where: { id: paymentId },
      data: {
        status: 'PENDING',
        completedAt: null,
        metadata: {
          ...(payment.metadata as any || {}),
          revertedBy: adminUser.email,
          revertedByName: adminUser.name || adminUser.email,
          revertedAt: new Date().toISOString(),
          previousStatus: payment.status,
          revertReason: body.revertReason || 'Admin reverted payment status',
        },
      },
    });

    // Revert registration to PENDING
    await prisma.competitionRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'PENDING',
        confirmedAt: null,
        // Keep display code - don't remove it
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment reverted to PENDING',
    });
  } catch (error) {
    console.error('Error reverting payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revert payment' },
      { status: 500 }
    );
  }
}
