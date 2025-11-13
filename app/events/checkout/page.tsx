/**
 * Checkout Page
 * Handle payment and customer information
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import CheckoutClient from './checkout-client';

export const metadata: Metadata = {
  title: 'Checkout - Archalley',
  description: 'Complete your competition registration payment',
};

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/events/checkout');
  }

  return <CheckoutClient user={session.user} />;
}
