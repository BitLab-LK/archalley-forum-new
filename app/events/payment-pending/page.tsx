/**
 * Payment Pending Page
 * Shows confirmation for bank transfer submissions
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

  // Fetch the actual email used during registration from payment customerDetails
  let registrationEmail = session.user.email;
  let registrationName = session.user.name;

  try {
    // Always fetch the most recent payment first as it has the customer info from checkout
    const recentPayment = await prisma.competitionPayment.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get email from payment customerDetails (this is the form data from checkout)
    if (recentPayment && recentPayment.customerDetails) {
      const customerDetails = recentPayment.customerDetails as any;
      if (customerDetails.email) {
        registrationEmail = customerDetails.email;
        registrationName = `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim() || registrationName;
      }
    }
  } catch (error) {
    console.error('Error fetching payment details:', error);
    // Fall back to session user details
  }

  return (
    <PaymentPendingClient
      user={{
        name: registrationName,
        email: registrationEmail,
      }}
    />
  );
}
