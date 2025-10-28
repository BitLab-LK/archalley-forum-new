/**
 * Checkout API Route
 * Initiates payment process for cart items
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  ApiResponse,
  PaymentInitiationResponse,
  CheckoutData,
} from '@/types/competition';
import {
  generateOrderId,
  getNextOrderSequence,
  generatePayHereHash,
  isCartExpired,
} from '@/lib/competition-utils';
import { getPayHereConfig } from '@/lib/payhere-config';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaymentInitiationResponse>>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body: CheckoutData = await request.json();

    // Validate customer info
    if (
      !body.customerInfo ||
      !body.customerInfo.firstName ||
      !body.customerInfo.lastName ||
      !body.customerInfo.email ||
      !body.customerInfo.country
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Complete customer information is required',
        },
        { status: 400 }
      );
    }

    // Fetch cart with items
    const cart = await prisma.registrationCart.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        items: {
          include: {
            competition: true,
            registrationType: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart is empty',
        },
        { status: 400 }
      );
    }

    // Check if cart is expired
    if (isCartExpired(cart.expiresAt)) {
      await prisma.registrationCart.update({
        where: { id: cart.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Cart has expired. Please add items again.',
        },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Generate order ID
    const orderSequence = await getNextOrderSequence(prisma);
    const orderId = generateOrderId(orderSequence);

    // Get PayHere configuration
    const payHereConfig = getPayHereConfig();

    // Create payment record
    const payment = await prisma.competitionPayment.create({
      data: {
        orderId,
        userId: session.user.id,
        competitionId: cart.items[0].competitionId, // Primary competition
        amount: totalAmount,
        currency: 'LKR',
        merchantId: payHereConfig.merchantId!,
        status: 'PENDING',
        items: cart.items.map((item) => ({
          id: item.id,
          competitionTitle: item.competition.title,
          registrationType: item.registrationType.name,
          country: item.country,
          memberCount: Array.isArray(item.members) ? (item.members as any[]).length : 0,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
        customerDetails: body.customerInfo,
        metadata: {
          cartId: cart.id,
          itemIds: cart.items.map((item) => item.id),
        },
      },
    });

    // Prepare PayHere payment data
    const itemsDescription = cart.items
      .map((item) => `${item.competition.title} - ${item.registrationType.name}`)
      .join(', ');

    const hash = generatePayHereHash(
      payHereConfig.merchantId!,
      orderId,
      totalAmount.toFixed(2),
      payHereConfig.currency,
      payHereConfig.merchantSecret!
    );

    const paymentData = {
      merchant_id: payHereConfig.merchantId!,
      return_url: payHereConfig.returnUrl,
      cancel_url: payHereConfig.cancelUrl,
      notify_url: payHereConfig.notifyUrl,
      order_id: orderId,
      items: itemsDescription,
      currency: payHereConfig.currency,
      amount: totalAmount.toFixed(2),
      first_name: body.customerInfo.firstName,
      last_name: body.customerInfo.lastName,
      email: body.customerInfo.email,
      phone: body.customerInfo.phone || '',
      address: body.customerInfo.address || '',
      city: body.customerInfo.city || '',
      country: body.customerInfo.country,
      hash,
    };

    // Store cart reference in payment metadata
    await prisma.competitionPayment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          cartId: cart.id,
          itemIds: cart.items.map((item) => item.id),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        paymentData,
        paymentUrl: payHereConfig.paymentUrl,
      },
    });
  } catch (error) {
    console.error('Error initiating checkout:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate payment',
      },
      { status: 500 }
    );
  }
}
