/**
 * Verify Payment API Route
 * Admin endpoint to approve/reject bank transfer payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  sendPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
} from '@/lib/competition-email-service';
import { triggerGa4PurchaseForPayment } from '@/lib/ga4-purchase-service';

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

    // Check if user is admin and get admin details for audit trail
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
    const { paymentId, registrationId, approve, rejectReason } = body;

    if (!paymentId || !registrationId || typeof approve !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get payment and registration details
    const payment = await prisma.competitionPayment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
      },
    });

    const registration = await prisma.competitionRegistration.findUnique({
      where: { id: registrationId },
      include: {
        competition: true,
        registrationType: true,
        user: true,
      },
    });

    if (!payment || !registration) {
      return NextResponse.json(
        { success: false, error: 'Payment or registration not found' },
        { status: 404 }
      );
    }

    if (approve) {
      // Approve payment with audit trail
      await prisma.competitionPayment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          metadata: {
            ...(payment.metadata as any || {}),
            verifiedBy: adminUser.email,
            verifiedByName: adminUser.name || adminUser.email,
            verifiedAt: new Date().toISOString(),
            action: 'APPROVED',
          },
        },
      });

      // Update registration status to CONFIRMED with display code
      await prisma.competitionRegistration.update({
        where: { id: registrationId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      // Extract customer email from payment.customerDetails (competition registration email)
      const customerDetails = payment.customerDetails as any;
      const customerEmail = customerDetails?.email || registration.user.email;
      const customerName = customerDetails?.firstName && customerDetails?.lastName
        ? `${customerDetails.firstName} ${customerDetails.lastName}`
        : registration.user.name || 'User';

      console.log(`📧 Sending verification email to competition registration email: ${customerEmail}`);

      // Send payment verified email directly using Nodemailer
      try {
        await sendPaymentVerifiedEmail({
          registration,
          competition: registration.competition,
          registrationType: registration.registrationType,
          userName: customerName,
          userEmail: customerEmail,
        });
        console.log('✅ Payment verified email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        // Don't fail the request if email fails
      }

      try {
        const ga4Result = await triggerGa4PurchaseForPayment(payment.id, {
          source: 'bank_transfer_admin',
        });

        if (ga4Result.status === 'SUCCESS') {
          console.log(
            `📊 GA4 purchase event sent for bank transfer transaction ${payment.orderId}`,
            ga4Result.logId ? { logId: ga4Result.logId } : undefined
          );
        } else {
          console.warn(
            `⚠️ GA4 purchase event skipped for bank transfer transaction ${payment.orderId}`,
            ga4Result.reason || ga4Result.error
          );
        }
      } catch (trackingError) {
        console.error('❌ Failed to trigger GA4 purchase event for bank transfer:', trackingError);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment approved and user notified',
      });
    } else {
      // Reject payment with audit trail
      await prisma.competitionPayment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          metadata: {
            ...(payment.metadata as any || {}),
            verifiedBy: adminUser.email,
            verifiedByName: adminUser.name || adminUser.email,
            verifiedAt: new Date().toISOString(),
            action: 'REJECTED',
            rejectReason: rejectReason || 'Payment could not be verified',
          },
        },
      });

      // Update registration status to CANCELLED
      await prisma.competitionRegistration.update({
        where: { id: registrationId },
        data: {
          status: 'CANCELLED',
        },
      });

      // Extract customer email from payment.customerDetails
      const customerDetails = payment.customerDetails as any;
      const customerEmail = customerDetails?.email || registration.user.email;
      const customerName = customerDetails?.firstName && customerDetails?.lastName
        ? `${customerDetails.firstName} ${customerDetails.lastName}`
        : registration.user.name || 'User';

      console.log(`📧 Sending rejection email to: ${customerEmail}`);

      // Send payment rejected email directly using Nodemailer
      try {
        await sendPaymentRejectedEmail({
          registration,
          competition: registration.competition,
          registrationType: registration.registrationType,
          userName: customerName,
          userEmail: customerEmail,
          rejectReason: rejectReason || 'Payment could not be verified',
        });
        console.log('✅ Rejection email sent with reason:', rejectReason);
      } catch (emailError) {
        console.error('❌ Failed to send rejection email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Payment rejected and user notified',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
