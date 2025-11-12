'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Mail, FileText, ArrowRight, Award, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentSuccessClientProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  payment: {
    orderId: string;
    amount: number;
    currency: string;
    completedAt: Date | null;
  };
  registrations: Array<{
    registrationNumber: string;
    status: string;
    competition: {
      title: string;
      slug: string;
    };
    registrationType: {
      name: string;
    };
  }>;
}

export default function PaymentSuccessClient({
  user,
  payment,
  registrations,
}: PaymentSuccessClientProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // Redirect to events page after 30 seconds
    if (countdown === 0) {
      router.push('/events');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Thank you, {user.name}! Your registration is confirmed.
          </p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-6">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payment Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-gray-900 font-semibold">{payment.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="text-gray-900 font-bold">
                  {payment.currency} {payment.amount.toLocaleString()}
                </span>
              </div>
              {payment.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Date:</span>
                  <span className="text-gray-900">
                    {format(new Date(payment.completedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Confirmed
                </span>
              </div>
            </div>
          </div>

          {/* Registrations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Registrations
            </h3>
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div
                  key={registration.registrationNumber}
                  className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-orange-600 font-medium mb-1">
                        Registration Number
                      </p>
                      <p className="text-2xl font-bold text-orange-900 font-mono">
                        {registration.registrationNumber}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Award className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{registration.competition.title}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{registration.registrationType.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Email Notification */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Confirmation Emails Sent
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                We've sent the following emails to <strong>{user.email}</strong>:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Registration confirmation with all details</li>
                <li>Payment receipt for your records</li>
                <li>Competition guidelines and submission instructions</li>
              </ul>
              <p className="text-xs text-blue-600 mt-3">
                💡 Can't find the emails? Check your spam/junk folder.
              </p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What's next?
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                1
              </div>
              <p className="text-gray-700">
                Check your email for registration confirmation and competition guidelines
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                2
              </div>
              <p className="text-gray-700">
                Prepare your submission according to the competition requirements
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                3
              </div>
              <p className="text-gray-700">
                Submit your work through your profile dashboard before the deadline
              </p>
            </li>
            <li className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                4
              </div>
              <p className="text-gray-700">
                Wait for results announcement and check the leaderboard
              </p>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => router.push('/profile/registrations')}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            View My Registrations
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/events')}
            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Browse More Events
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-redirect notice */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Auto-redirecting to events page in <span className="font-semibold text-orange-600">{countdown}</span> seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
