import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const adminUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const logs = await prisma.ga4PurchaseLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        payment: {
          select: {
            orderId: true,
            paymentMethod: true,
            ga4PurchaseStatus: true,
            ga4PurchaseSentAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        transactionId: log.transactionId,
        paymentMethod: log.paymentMethod ?? log.payment?.paymentMethod ?? null,
        logStatus: log.status,
        attempt: log.attempt,
        httpStatus: log.httpStatus,
        purchaseStatus: log.payment?.ga4PurchaseStatus ?? null,
        purchaseSentAt: log.payment?.ga4PurchaseSentAt,
        ga4Response: log.response,
        error: log.errorMessage,
        source: log.source,
        sentAt: log.sentAt,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching GA4 purchase logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch GA4 purchase logs' },
      { status: 500 }
    );
  }
}

