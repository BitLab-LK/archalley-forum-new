'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, RefreshCw } from 'lucide-react';

interface Props {
  orderId: string;
}

export default function PaymentProcessingClient({ orderId }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  // Check payment status every 3 seconds
  useEffect(() => {
    let pollCount = 0;
    const maxPolls = 5; // Maximum 5 polls (15 seconds)
    
    const checkStatus = async () => {
      try {
        setChecking(true);
        pollCount++;
        console.log(`📊 Polling payment status (${pollCount}/${maxPolls})...`);
        
        const response = await fetch(`/api/competitions/payment/status/${orderId}`);
        const data = await response.json();

        if (data.status === 'COMPLETED') {
          console.log('✅ Payment confirmed as COMPLETED');
          router.push(`/competitions/payment/success/${orderId}`);
        } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
          console.log('❌ Payment FAILED or CANCELLED');
          router.push(`/competitions/payment/failed/${orderId}`);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setChecking(false);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    checkStatus(); // Initial check

    // Fallback: After 15 seconds, redirect to return URL to trigger fallback mechanism
    // This handles cases where PayHere notify webhook cannot reach localhost
    const fallbackTimeout = setTimeout(() => {
      console.log('⏱️ Timeout reached, redirecting to return URL for fallback...');
      window.location.href = `/api/competitions/payment/return?order_id=${orderId}`;
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimeout);
    };
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-pulse">
          <Clock className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Processing Payment...
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Please wait while we confirm your payment with PayHere.
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
            <span className="text-sm">
              {checking ? 'Checking payment status...' : 'Waiting for confirmation...'}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Order ID: <span className="font-mono">{orderId}</span>
        </p>
      </div>
    </div>
  );
}
