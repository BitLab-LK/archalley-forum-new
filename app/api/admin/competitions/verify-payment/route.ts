/**
 * Verify Payment API Route
 * Admin endpoint to approve/reject bank transfer payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateUniqueDisplayCode } from '@/lib/competition-utils';

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
      // Generate unique display code if not already present
      let displayCode = registration.displayCode;
      if (!displayCode) {
        displayCode = await generateUniqueDisplayCode(
          prisma,
          registration.competition.year
        );
        console.log(`✅ Generated display code for ${registration.registrationNumber}: ${displayCode}`);
      }

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
          displayCode: displayCode, // Ensure display code is set
        },
      });

      // Extract customer email from payment.customerDetails (competition registration email)
      const customerDetails = payment.customerDetails as any;
      const customerEmail = customerDetails?.email || registration.user.email;
      const customerName = customerDetails?.firstName && customerDetails?.lastName
        ? `${customerDetails.firstName} ${customerDetails.lastName}`
        : registration.user.name || 'User';

      console.log(`📧 Sending verification email to competition registration email: ${customerEmail}`);

      // Send payment verified email to the email used during competition registration
      try {
        await fetch(`${request.nextUrl.origin}/api/admin/send-registration-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail, // ✅ Use competition registration email, not main account email
            name: customerName,   // ✅ Use name from competition registration
            registrationNumber: registration.registrationNumber,
            competitionTitle: registration.competition.title,
            template: 'PAYMENT_VERIFIED',
          }),
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the request if email fails
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

      // Send payment rejected email with admin's reject reason
      try {
        await fetch(`${request.nextUrl.origin}/api/admin/send-registration-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            name: customerName,
            registrationNumber: registration.registrationNumber,
            competitionTitle: registration.competition.title,
            template: 'PAYMENT_REJECTED',
            rejectReason: rejectReason, // ✅ FIXED: Pass admin's specific rejection reason
          }),
        });
        console.log('✅ Rejection email sent with reason:', rejectReason);
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
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
