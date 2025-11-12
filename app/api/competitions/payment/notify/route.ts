/**
 * PayHere Payment Notification (IPN) Handler
 * Processes payment notifications from PayHere
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPayHereSignature,
  generateUniqueRegistrationNumber,
  generateUniqueDisplayCode,
} from '@/lib/competition-utils';
import { getPayHereConfig } from '@/lib/payhere-config';
import { PayHereResponse } from '@/types/competition';
import {
  sendRegistrationConfirmationEmail,
  sendPaymentReceiptEmail,
  sendCompetitionGuidelinesEmail,
} from '@/lib/competition-email-service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse form data from PayHere
    const formData = await request.formData();
    
    const payHereData: PayHereResponse = {
      merchant_id: formData.get('merchant_id') as string,
      order_id: formData.get('order_id') as string,
      payhere_amount: formData.get('payhere_amount') as string,
      payhere_currency: formData.get('payhere_currency') as string,
      status_code: formData.get('status_code') as string,
      md5sig: formData.get('md5sig') as string,
      method: formData.get('method') as string,
      status_message: formData.get('status_message') as string,
      card_holder_name: formData.get('card_holder_name') as string || undefined,
      card_no: formData.get('card_no') as string || undefined,
      payment_id: formData.get('payment_id') as string,
      custom_1: formData.get('custom_1') as string || undefined,
      custom_2: formData.get('custom_2') as string || undefined,
    };

    console.log('PayHere IPN received:', {
      order_id: payHereData.order_id,
      status_code: payHereData.status_code,
      amount: payHereData.payhere_amount,
    });

    // Find payment record
    const payment = await prisma.competitionPayment.findUnique({
      where: { orderId: payHereData.order_id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      console.error('Payment not found:', payHereData.order_id);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify signature
    const payHereConfig = getPayHereConfig();
    const isValid = verifyPayHereSignature(
      payHereData.merchant_id,
      payHereData.order_id,
      payHereData.payhere_amount,
      payHereData.payhere_currency,
      payHereData.status_code,
      payHereData.md5sig,
      payHereConfig.merchantSecret!
    );

    if (!isValid) {
      console.error('Invalid PayHere signature');
      
      await prisma.competitionPayment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          errorMessage: 'Invalid signature',
          responseData: payHereData as any,
        },
      });

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process based on status code
    if (payHereData.status_code === '2') {
      // Payment successful
      await handleSuccessfulPayment(payment.id, payHereData);
    } else if (payHereData.status_code === '-1' || payHereData.status_code === '-2') {
      // Payment failed or cancelled
      await prisma.competitionPayment.update({
        where: { id: payment.id },
        data: {
          status: payHereData.status_code === '-1' ? 'CANCELLED' : 'FAILED',
          statusCode: payHereData.status_code,
          errorMessage: payHereData.status_message,
          responseData: payHereData as any,
        },
      });
    } else if (payHereData.status_code === '-3') {
      // Charged back
      await prisma.competitionPayment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          statusCode: payHereData.status_code,
          refundedAt: new Date(),
          responseData: payHereData as any,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing PayHere notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 * Creates registrations and updates payment status
 */
async function handleSuccessfulPayment(
  paymentId: string,
  payHereData: PayHereResponse
): Promise<void> {
  try {
    const payment = await prisma.competitionPayment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
      },
    });

    if (!payment || !payment.metadata) {
      throw new Error('Payment or metadata not found');
    }

    const metadata = payment.metadata as any;
    const cartId = metadata.cartId;
    const itemIds = metadata.itemIds as string[];

    // Fetch cart items
    const cartItems = await prisma.registrationCartItem.findMany({
      where: {
        id: { in: itemIds },
      },
      include: {
        competition: true,
        registrationType: true,
      },
    });

    // Create registrations for each cart item
    const registrations = await Promise.all(
      cartItems.map(async (item) => {
        // Generate unique random registration number
        const registrationNumber = await generateUniqueRegistrationNumber(prisma);

        // Generate unique anonymous display code for public entry display
        const displayCode = await generateUniqueDisplayCode(
          prisma,
          item.competition.year
        );

        console.log(`✅ Generated registration number: ${registrationNumber} with display code: ${displayCode}`);

        // Create registration
        return prisma.competitionRegistration.create({
          data: {
            registrationNumber,
            displayCode, // Anonymous code for public display
            userId: payment.userId,
            competitionId: item.competitionId,
            registrationTypeId: item.registrationTypeId,
            paymentId: payment.id,
            country: item.country,
            participantType: item.participantType,
            referralSource: item.referralSource,
            teamName: item.teamName,
            companyName: item.companyName,
            businessRegistrationNo: item.businessRegistrationNo,
            teamMembers: item.teamMembers === null ? undefined : item.teamMembers,
            members: item.members as any,
            status: 'CONFIRMED',
            amountPaid: item.subtotal,
            currency: payment.currency,
            confirmedAt: new Date(),
          },
        });
      })
    );

    // Update payment record
    await prisma.competitionPayment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        paymentId: payHereData.payment_id,
        statusCode: payHereData.status_code,
        md5sig: payHereData.md5sig,
        paymentMethod: payHereData.method,
        cardHolderName: payHereData.card_holder_name,
        cardNo: payHereData.card_no,
        responseData: payHereData as any,
      },
    });

    // Mark cart as completed
    await prisma.registrationCart.update({
      where: { id: cartId },
      data: { status: 'COMPLETED' },
    });

    // Send confirmation emails for each registration
    console.log('Sending confirmation emails for registrations:', registrations.map(r => r.registrationNumber));
    
    // Extract customer details from payment (competition registration info)
    const customerDetails = payment.customerDetails as any;
    const customerEmail = customerDetails?.email || payment.user.email;
    const customerName = customerDetails?.firstName && customerDetails?.lastName
      ? `${customerDetails.firstName} ${customerDetails.lastName}`
      : payment.user.name || 'Participant';
    
    console.log(`📧 Sending emails to competition registration email: ${customerEmail}`);
    
    for (const registration of registrations) {
      try {
        const item = cartItems.find(i => i.competitionId === registration.competitionId);
        if (!item) continue;

        const emailData = {
          registration,
          competition: item.competition,
          registrationType: item.registrationType,
          userName: customerName,      // ✅ Use name from competition registration
          userEmail: customerEmail,    // ✅ Use email from competition registration, not main account
          members: (item.members as any) || [],
          paymentOrderId: payment.orderId,
        };

        // Send all three emails
        await Promise.all([
          sendRegistrationConfirmationEmail(emailData),
          sendPaymentReceiptEmail(emailData),
          sendCompetitionGuidelinesEmail(emailData),
        ]);

        console.log(`✅ Emails sent for registration: ${registration.registrationNumber}`);
      } catch (emailError) {
        console.error(`❌ Failed to send emails for ${registration.registrationNumber}:`, emailError);
        // Don't throw - registration is already created
      }
    }
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}
