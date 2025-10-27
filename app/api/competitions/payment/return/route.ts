/**
 * Payment Return Handler
 * Handles user return from PayHere after payment attempt
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.redirect(
      new URL('/competitions/payment/error?message=Invalid request', request.url)
    );
  }

  try {
    // Fetch payment status
    const payment = await prisma.competitionPayment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return NextResponse.redirect(
        new URL('/competitions/payment/error?message=Payment not found', request.url)
      );
    }

    // Redirect based on payment status
    if (payment.status === 'COMPLETED') {
      return NextResponse.redirect(
        new URL(`/competitions/payment/success/${orderId}`, request.url)
      );
    } else if (payment.status === 'PENDING' || payment.status === 'PROCESSING') {
      return NextResponse.redirect(
        new URL(`/competitions/payment/processing/${orderId}`, request.url)
      );
    } else {
      return NextResponse.redirect(
        new URL(`/competitions/payment/failed/${orderId}`, request.url)
      );
    }
  } catch (error) {
    console.error('Error handling payment return:', error);
    return NextResponse.redirect(
      new URL('/competitions/payment/error?message=Server error', request.url)
    );
  }
}
