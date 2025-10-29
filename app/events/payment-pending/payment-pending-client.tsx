'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Mail, FileText, ArrowRight } from 'lucide-react';

interface PaymentPendingClientProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function PaymentPendingClient({ user }: PaymentPendingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationNumber = searchParams.get('registrationNumber');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Redirect to profile after 10 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/profile');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bank Transfer Submitted Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you, {user.name}! Your payment details have been received.
          </p>
        </div>

        {/* Registration Number */}
        {registrationNumber && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium mb-1">
                  Registration Number
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {registrationNumber}
                </p>
              </div>
              <FileText className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Payment Verification Pending
              </h2>
              <p className="text-gray-600">
                Our team will verify your bank transfer within 24-48 hours. You'll receive a confirmation email once the payment is verified.
              </p>
            </div>
          </div>

          {/* What's Next */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What happens next?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  1
                </div>
                <p className="text-gray-700">
                  Our admin team will review your bank transfer slip
                </p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  2
                </div>
                <p className="text-gray-700">
                  Once verified, your payment status will be updated
                </p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  3
                </div>
                <p className="text-gray-700">
                  You'll receive a confirmation email with your registration details
                </p>
              </li>
            </ul>
          </div>

          {/* Email Notification */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center space-x-3 text-gray-600">
              <Mail className="w-5 h-5" />
              <p className="text-sm">
                A confirmation email has been sent to{' '}
                <span className="font-medium text-gray-900">{user.email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            Important Notes:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Keep your registration number for future reference</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check your email (including spam folder) for updates</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>You can view your registration status in your profile</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Contact us via WhatsApp (0711942194) if you have questions</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/profile')}
            className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            View My Registrations
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          <button
            onClick={() => router.push('/events')}
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Browse More Events
          </button>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Redirecting to your profile in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}
