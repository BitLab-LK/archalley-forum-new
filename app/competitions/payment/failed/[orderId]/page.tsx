/**
 * PayHere Payment Failed Page
 * Shows error when payment fails
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PaymentFailedClient from './payment-failed-client';

export const metadata: Metadata = {
  title: 'Payment Failed - Archalley Forum',
  description: 'Your payment could not be processed',
};

interface Props {
  params: {
    orderId: string;
  };
}

export default async function PaymentFailedPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  try {
    const payment = await prisma.competitionPayment.findUnique({
      where: { orderId: params.orderId },
    });

    return (
      <PaymentFailedClient
        orderId={params.orderId}
        errorMessage={payment?.errorMessage || undefined}
      />
    );
  } catch (error) {
    console.error('Error loading payment failed page:', error);
    return <PaymentFailedClient orderId={params.orderId} />;
  }
}
