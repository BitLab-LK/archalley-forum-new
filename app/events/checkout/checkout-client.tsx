/**
 * Checkout Client Component
 * Handles customer information and payment initiation
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CartWithItems } from '@/types/competition';
import { PayHerePaymentData } from '@/types/competition';
import { toast } from 'sonner';

interface Props {
  user: any;
}

export default function CheckoutClient({ user }: Props) {
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    country: 'Sri Lanka', // Default country
  });
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/competitions/cart');
      const data = await response.json();

      // API returns { success: true, data: { cart, summary } }
      if (data.success && data.data?.cart) {
        const cartData = data.data.cart;
        setCart(cartData);

        // Auto-fill form with data from first cart item's first member
        if (cartData.items && cartData.items.length > 0) {
          const firstItem = cartData.items[0];
          const members = Array.isArray(firstItem.members) ? firstItem.members : [];
          
          if (members.length > 0) {
            const firstMember = members[0];
            
            // Extract first and last name
            const nameParts = firstMember.name?.split(' ') || [];
            const firstName = nameParts[0] || user?.name?.split(' ')[0] || '';
            const lastName = nameParts.slice(1).join(' ') || user?.name?.split(' ').slice(1).join(' ') || '';

            setFormData({
              firstName,
              lastName,
              email: firstMember.email || user?.email || '',
              phone: firstMember.phone || '',
              address: '',
              city: '',
              country: firstItem.country || 'Sri Lanka',
            });
          }
        }
      } else {
        toast.error('Your cart is empty');
        router.push('/events');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
      router.push('/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/competitions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: formData,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.paymentData) {
        // Create and submit PayHere form
        initiatePayHerePayment(result.data.paymentData);
      } else {
        toast.error(result.error || 'Failed to initiate payment');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const initiatePayHerePayment = (paymentData: PayHerePaymentData) => {
    // Create hidden form
    const form = document.createElement('form');
    form.method = 'POST';
    // Use sandbox URL for testing (you can add environment variable check here)
    form.action = process.env.NEXT_PUBLIC_PAYHERE_MODE === 'live'
      ? 'https://www.payhere.lk/pay/checkout'
      : 'https://sandbox.payhere.lk/pay/checkout';

    // Add all payment fields
    const fields: Record<string, string> = {
      merchant_id: paymentData.merchant_id,
      return_url: paymentData.return_url,
      cancel_url: paymentData.cancel_url,
      notify_url: paymentData.notify_url,
      first_name: paymentData.first_name,
      last_name: paymentData.last_name,
      email: paymentData.email,
      phone: paymentData.phone || '',
      address: paymentData.address || '',
      city: paymentData.city || '',
      country: paymentData.country || 'Sri Lanka',
      order_id: paymentData.order_id,
      items: paymentData.items,
      currency: paymentData.currency,
      amount: paymentData.amount,
      hash: paymentData.hash,
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return null; // Will redirect
  }

  // Use subtotal from database which has the correct pricing
  const totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Get competition title from first item
  const competitionTitle = cart.items[0]?.competition?.title || 'Archalley Competition 2025';

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Registration</span>
        </button>

        {/* Payment Summary Header */}
        <div className="bg-black text-white rounded-t-lg p-6 mb-0 border-b border-orange-500">
          <div className="flex items-center gap-3 mb-1">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18" />
            </svg>
            <h1 className="text-2xl font-bold">Payment Summary</h1>
          </div>
          <p className="text-orange-500 text-sm font-medium">{competitionTitle}</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-b-lg border border-gray-200 border-t-0 p-6">
          {/* Order Summary Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Order Summary</h2>
            
            <div className="border border-gray-200 rounded p-4 mb-4">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                <span className="font-medium text-black text-sm">Registration Details</span>
                <span className="font-medium text-black text-sm">Amount</span>
              </div>

              {cart.items.map((item) => {
                const memberCount = Array.isArray(item.members) ? item.members.length : 1;
                return (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="font-medium text-black text-sm">{item.registrationType.name}</span>
                      <span className="text-gray-500 text-xs"> × {memberCount}</span>
                    </div>
                    <span className="font-medium text-black text-sm">
                      {item.registrationType.fee.toLocaleString()} × {memberCount} = {item.subtotal.toLocaleString()} LKR
                    </span>
                  </div>
                );
              })}

              <div className="mt-4 pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-black">Total Amount</span>
                  <span className="text-xl font-bold text-orange-500">{totalAmount.toLocaleString()} LKR</span>
                </div>
              </div>

              <div className="mt-3 bg-orange-50 border border-orange-200 rounded p-2">
                <p className="text-xs text-orange-600 text-center font-medium">
                  {cart.items.length} competition entry included
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-black mb-3">Payment Method (Demo)</h2>
            <div className="border border-orange-500 rounded p-3 bg-orange-50">
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  id="card-payment" 
                  name="payment-method" 
                  checked 
                  readOnly
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="card-payment" className="flex items-center gap-2 cursor-pointer">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18" />
                  </svg>
                  <span className="font-medium text-black text-sm">Credit / Debit Card</span>
                </label>
              </div>
            </div>
          </div>

          {/* Important Information Section */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-black mb-3">Important Information</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700 text-sm">You will receive a confirmation email after successful payment</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700 text-sm">All registration details have been saved</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700 text-sm">Refunds are subject to the competition's refund policy</p>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full bg-black hover:bg-orange-500 text-white font-medium py-3 px-6 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Proceed to Payment Gateway (Demo)'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            This is a demonstration payment page. No actual payment will be processed.
          </p>
        </div>
      </div>
    </div>
  );
}
