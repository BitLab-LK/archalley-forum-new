import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { classifyPayment } from '@/lib/payment-utils';

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

    // Check if user is admin/super admin/viewer
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN', 'VIEWER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Viewer access required' },
        { status: 403 }
      );
    }

    // Fetch all registrations with related data
    const allRegistrations = await prisma.competitionRegistration.findMany({
      select: {
        id: true,
        registrationNumber: true,
        status: true,
        amountPaid: true,
        currency: true,
        registeredAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        competition: {
          select: {
            id: true,
            slug: true,
            title: true,
            year: true,
          },
        },
        registrationType: {
          select: {
            id: true,
            name: true,
            type: true,
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
            merchantId: true,
            paymentId: true,
            metadata: true,
            responseData: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    // Filter out registrations with sandbox payments
    const registrations = allRegistrations.filter(registration => {
      // If no payment, include it (might be pending registration)
      if (!registration.payment) {
        return true;
      }

      // Classify the payment to check if it's sandbox
      const classification = classifyPayment({
        merchantId: registration.payment.merchantId || '',
        orderId: registration.payment.orderId,
        paymentId: registration.payment.paymentId || null,
        metadata: registration.payment.metadata,
        responseData: registration.payment.responseData,
        amount: registration.payment.amount,
        status: registration.payment.status,
      });

      // Exclude sandbox and test payments
      return classification.environment !== 'sandbox' && classification.environment !== 'test';
    });

    return NextResponse.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    console.error('Error fetching competition registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

