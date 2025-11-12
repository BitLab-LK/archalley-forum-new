/**
 * Payment Success Page
 * Displays successful registration details
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PaymentSuccessTracker from './payment-success-tracker';

export const metadata: Metadata = {
  title: 'Payment Successful - Archalley Forum',
  description: 'Your registration payment was successful',
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const resolvedSearchParams = await searchParams;
  const orderId = resolvedSearchParams.order_id;

  // Fetch order details for analytics
  let orderAmount = 0;
  let itemCount = 0;

  if (orderId) {
    try {
      const payment = await prisma.competitionPayment.findUnique({
        where: { orderId: orderId },
        select: {
          amount: true,
          items: true,
        },
      });

      if (payment) {
        orderAmount = payment.amount;
        // Parse items JSON to get count
        try {
          const items = typeof payment.items === 'string' 
            ? JSON.parse(payment.items) 
            : payment.items;
          itemCount = Array.isArray(items) ? items.length : 0;
        } catch {
          itemCount = 0;
        }
      }
    } catch (error) {
      console.error('Error fetching order for analytics:', error);
    }
  }

  return (
    <>
      {/* Track payment success */}
      <PaymentSuccessTracker 
        orderId={orderId} 
        amount={orderAmount}
        itemCount={itemCount}
      />
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Your competition registration has been confirmed.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Order ID</p>
              <p className="font-mono font-bold text-gray-900">{orderId}</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6 mb-6">
            <p className="text-sm text-gray-600 mb-4">
              A confirmation email has been sent to your registered email address with:
            </p>
            <ul className="text-sm text-gray-700 text-left max-w-md mx-auto space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Your registration numbers
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Payment receipt
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Competition guidelines
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Submission instructions
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/profile/registrations"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg transform transition-all duration-300 hover:scale-105"
            >
              View My Registrations
            </Link>
            <Link
              href="/events"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-lg transform transition-all duration-300 hover:scale-105"
            >
              Browse Events
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-8">
            Need help? Contact us at support@archalleyforum.com
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
