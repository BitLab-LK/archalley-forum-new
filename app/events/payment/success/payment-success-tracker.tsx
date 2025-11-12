'use client';

import { useEffect } from 'react';
import { event } from '@/lib/google-analytics';

interface PaymentSuccessTrackerProps {
  orderId?: string;
  amount?: number;
  itemCount?: number;
}

export default function PaymentSuccessTracker({ 
  orderId, 
  amount,
  itemCount 
}: PaymentSuccessTrackerProps) {
  useEffect(() => {
    // Track successful payment completion
    event({
      action: 'purchase',
      category: 'ecommerce',
      label: `competition_entry_${orderId || 'unknown'}`,
      value: amount || 0,
    });

    // Also track as conversion
    event({
      action: 'competition_entry_complete',
      category: 'competition',
      label: orderId || 'unknown',
      value: amount || 0,
    });

    console.log('✅ Payment completion tracked:', {
      orderId,
      amount,
      itemCount,
    });
  }, [orderId, amount, itemCount]);

  return null; // This is a tracking-only component
}
