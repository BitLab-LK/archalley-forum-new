/**
 * PayHere Payment Processing Page
 * Shows status while payment is being processed
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import PaymentProcessingClient from './payment-processing-client';

export const metadata: Metadata = {
  title: 'Payment Processing - Archalley Forum',
  description: 'Your payment is being processed',
};

interface Props {
  params: {
    orderId: string;
  };
}

export default async function PaymentProcessingPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return <PaymentProcessingClient orderId={params.orderId} />;
}
