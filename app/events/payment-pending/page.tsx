/**
 * Payment Pending Page
 * Shows confirmation for bank transfer submissions
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import PaymentPendingClient from './payment-pending-client';

export const metadata: Metadata = {
  title: 'Payment Pending - Archalley Forum',
  description: 'Your bank transfer details have been submitted',
};

export default async function PaymentPendingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return <PaymentPendingClient user={session.user} />;
}
