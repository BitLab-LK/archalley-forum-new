/**
 * PayHere Payment Success Page
 * Shows confirmation after successful PayHere payment
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PaymentSuccessClient from './payment-success-client';

export const metadata: Metadata = {
  title: 'Payment Successful - Archalley Forum',
  description: 'Your payment has been completed successfully',
};

interface Props {
  params: {
    orderId: string;
  };
}

export default async function PaymentSuccessPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  try {
    // Fetch payment and registration details
    const payment = await prisma.competitionPayment.findUnique({
      where: { orderId: params.orderId },
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
      redirect('/events');
    }

    // Get registrations for this payment
    const registrations = await prisma.competitionRegistration.findMany({
      where: {
        paymentId: payment.id,
      },
      include: {
        competition: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        registrationType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      select: {
        registrationNumber: true,
        status: true,
        amountPaid: true,
        competition: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        registrationType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (registrations.length === 0) {
      redirect('/events');
    }

    // Get customer details from payment
    const customerDetails = payment.customerDetails as any;
    const customerEmail = customerDetails?.email || payment.user.email;
    const customerName = customerDetails?.firstName && customerDetails?.lastName
      ? `${customerDetails.firstName} ${customerDetails.lastName}`
      : payment.user.name || 'User';

    return (
      <PaymentSuccessClient
        user={{
          name: customerName,
          email: customerEmail,
        }}
        payment={{
          orderId: payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          completedAt: payment.completedAt,
        }}
        registrations={registrations.map((reg) => ({
          registrationNumber: reg.registrationNumber,
          status: reg.status,
          competition: {
            title: reg.competition.title,
            slug: reg.competition.slug,
            id: reg.competition.id,
          },
          registrationType: {
            name: reg.registrationType.name,
            id: reg.registrationType.id,
          },
          amountPaid: reg.amountPaid,
        }))}
      />
    );
  } catch (error) {
    console.error('Error loading payment success page:', error);
    redirect('/events');
  }
}
