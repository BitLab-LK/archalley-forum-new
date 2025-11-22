/**
 * Payment Failed Page
 * Displays payment failure message with retry option
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Payment Failed - Archalley Forum',
  description: 'Your payment could not be processed',
};

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: { order_id?: string; reason?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const orderId = searchParams.order_id;
  const reason = searchParams.reason || 'Payment processing failed';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Failed
          </h1>

          <p className="text-lg text-gray-600 mb-6">
            We couldn't process your payment.
          </p>

          {reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">{reason}</p>
            </div>
          )}

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Order ID</p>
              <p className="font-mono font-bold text-gray-900">{orderId}</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6 mb-6">
            <p className="text-sm text-gray-700 mb-4">
              Common reasons for payment failure:
            </p>
            <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-2">
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Insufficient funds in your account
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Card details entered incorrectly
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Card expired or blocked
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                Payment gateway timeout
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/events/checkout"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg transform transition-all duration-300 hover:scale-105"
            >
              Try Again
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
  );
}
