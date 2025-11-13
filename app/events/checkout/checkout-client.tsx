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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [bankSlipFile, setBankSlipFile] = useState<File | null>(null);
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
            
            // For Kids registrations, use parent information
            const isKidsRegistration = firstItem.participantType === 'KIDS';
            
            // Extract first and last name
            let firstName, lastName;
            if (isKidsRegistration) {
              // For Kids, use parent names
              firstName = firstMember.parentFirstName || user?.name?.split(' ')[0] || '';
              lastName = firstMember.parentLastName || user?.name?.split(' ').slice(1).join(' ') || '';
            } else {
              // For other types, use member name
              const nameParts = firstMember.name?.split(' ') || [];
              firstName = nameParts[0] || user?.name?.split(' ')[0] || '';
              lastName = nameParts.slice(1).join(' ') || user?.name?.split(' ').slice(1).join(' ') || '';
            }

            setFormData({
              firstName,
              lastName,
              email: isKidsRegistration ? (firstMember.parentEmail || user?.email || '') : (firstMember.email || user?.email || ''),
              phone: isKidsRegistration ? (firstMember.parentPhone || '') : (firstMember.phone || ''),
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

  const validateForm = () => {
    // Validate first name
    if (!formData.firstName || formData.firstName.trim().length === 0) {
      toast.error('First name is required');
      return false;
    }
    if (formData.firstName.trim().length < 2) {
      toast.error('First name must be at least 2 characters');
      return false;
    }

    // Validate last name
    if (!formData.lastName || formData.lastName.trim().length === 0) {
      toast.error('Last name is required');
      return false;
    }
    if (formData.lastName.trim().length < 2) {
      toast.error('Last name must be at least 2 characters');
      return false;
    }

    // Validate email
    if (!formData.email || formData.email.trim().length === 0) {
      toast.error('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Validate phone (if provided)
    if (formData.phone && formData.phone.trim().length > 0) {
      const phoneRegex = /^\+\d{1,3}\d{9,14}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        toast.error('Please enter a valid phone number with country code (e.g., +94771234567)');
        return false;
      }
    }

    // Validate country
    if (!formData.country || formData.country.trim().length === 0) {
      toast.error('Country is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Validate form data
    if (!validateForm()) {
      return;
    }

    // Validate bank transfer requirements
    if (paymentMethod === 'bank' && !bankSlipFile) {
      toast.error('Please upload your bank transfer slip');
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod === 'card') {
        // Card payment via PayHere
        const response = await fetch('/api/competitions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerInfo: formData,
            paymentMethod: 'card',
          }),
        });

        const result = await response.json();

        if (result.success && result.data?.paymentData) {
          initiatePayHerePayment(result.data.paymentData);
        } else {
          toast.error(result.error || 'Failed to initiate payment');
          setIsProcessing(false);
        }
      } else {
        // Bank transfer payment
        let bankSlipUrl = null;
        let bankSlipFileName = null;

        // Upload file to Azure Blob Storage if provided
        if (bankSlipFile) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', bankSlipFile);
          uploadFormData.append('folder', 'bank-slips');

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          const uploadResult = await uploadResponse.json();

          if (!uploadResult.success) {
            toast.error('Failed to upload bank slip');
            setIsProcessing(false);
            return;
          }

          bankSlipUrl = uploadResult.url;
          bankSlipFileName = bankSlipFile.name;
        }

        // Submit the payment with or without uploaded file
        const response = await fetch('/api/competitions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerInfo: formData,
            paymentMethod: 'bank',
            bankSlipUrl: bankSlipUrl,
            bankSlipFileName: bankSlipFileName,
          }),
        });

        const result = await response.json();
        console.log('Bank transfer checkout response:', result);

        if (result.success) {
          toast.success('Bank transfer details submitted successfully!');
          // API returns data in result.data.registrationNumber
          const registrationNumber = result.data?.registrationNumber || result.registrationNumber || '';
          console.log('Navigating to payment-pending with registration number:', registrationNumber);
          router.push(`/events/payment-pending?registrationNumber=${encodeURIComponent(registrationNumber)}`);
        } else {
          console.error('Bank transfer submission failed:', result.error);
          toast.error(result.error || 'Failed to submit bank transfer');
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid file (JPG, PNG, or PDF)');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setBankSlipFile(file);
      toast.success('File uploaded successfully');
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
          <div className="mb-8">
            <h2 className="text-xl font-bold text-black mb-5">Order Summary</h2>
            
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Table */}
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-200">
                    <th className="w-2/5 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Item
                    </th>
                    <th className="w-1/5 px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Price
                    </th>
                    <th className="w-1/5 px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Qty
                    </th>
                    <th className="w-1/5 px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {/* Group items by registration type */}
                  {(() => {
                    // Group items by registrationTypeId
                    const groupedItems = cart.items.reduce((acc, item) => {
                      const key = item.registrationTypeId;
                      if (!acc[key]) {
                        acc[key] = {
                          registrationType: item.registrationType,
                          count: 0,
                          totalAmount: 0,
                        };
                      }
                      acc[key].count += 1;
                      acc[key].totalAmount += item.subtotal;
                      return acc;
                    }, {} as Record<string, { registrationType: any; count: number; totalAmount: number }>);

                    return Object.values(groupedItems).map((group, index) => (
                      <tr key={index} className="border-b border-gray-150 hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                          {group.registrationType.name}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-700 text-right font-medium tabular-nums">
                          {group.registrationType.fee.toLocaleString()} LKR
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-gray-900 bg-gray-100 rounded">
                            {group.count}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-gray-900 text-right tabular-nums">
                          {group.totalAmount.toLocaleString()} LKR
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>

              {/* Total Amount Section */}
              <div className="bg-gray-50 border-t-2 border-gray-300">
                <div className="px-6 py-5 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-orange-500 tabular-nums">
                    {totalAmount.toLocaleString()} LKR
                  </span>
                </div>
              </div>

              {/* Entry count info */}
              <div className="bg-orange-50 border-t border-orange-200 px-6 py-3">
                <p className="text-sm text-orange-600 text-center font-semibold">
                  {cart.items.length} competition {cart.items.length === 1 ? 'entry' : 'entries'} included
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-black mb-3">Select Payment Method</h2>
            
            {/* Card Payment Option */}
            <div 
              className={`border rounded-lg p-4 mb-3 cursor-pointer transition-all ${
                paymentMethod === 'card' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="flex items-start gap-3">
                <input 
                  type="radio" 
                  id="card-payment" 
                  name="payment-method" 
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500 mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="card-payment" className="flex items-center gap-2 cursor-pointer">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18" />
                    </svg>
                    <span className="font-medium text-black">Card Payment (PayHere)</span>
                  </label>
                  <p className="text-xs text-gray-600 mt-1 ml-7">Pay securely with Visa, MasterCard, or Amex</p>
                </div>
              </div>
            </div>

            {/* Bank Transfer Option */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === 'bank' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('bank')}
            >
              <div className="flex items-start gap-3">
                <input 
                  type="radio" 
                  id="bank-transfer" 
                  name="payment-method" 
                  checked={paymentMethod === 'bank'}
                  onChange={() => setPaymentMethod('bank')}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500 mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="bank-transfer" className="flex items-center gap-2 cursor-pointer">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-medium text-black">Bank Transfer</span>
                  </label>
                  <p className="text-xs text-gray-600 mt-1 ml-7">Transfer to our bank account and upload slip</p>
                </div>
              </div>

              {/* Bank Details (shown when bank transfer is selected) */}
              {paymentMethod === 'bank' && (
                <div className="mt-4 ml-7 p-3 bg-white border border-gray-200 rounded space-y-2">
                  <h4 className="font-medium text-black text-sm mb-2">Bank Account Details:</h4>
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Bank Name:</span> Sampath Bank</p>
                    <p><span className="font-medium">Account Name:</span> Archalley (Pvt) Ltd</p>
                    <p><span className="font-medium">Account Number:</span> 0034 1001 3958</p>
                    <p><span className="font-medium">Branch:</span> Thimbirigasyaya</p>
                    <p><span className="font-medium">Amount:</span> <span className="text-orange-500 font-bold">LKR {totalAmount.toLocaleString()}</span></p>
                  </div>

                  {/* Upload Slip Section */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <label className="block text-sm font-medium text-black mb-2">
                      Upload Bank Slip <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-orange-50 file:text-orange-500 hover:file:bg-orange-100 cursor-pointer"
                    />
                    {bankSlipFile && (
                      <p className="text-xs text-green-600 mt-1">✓ {bankSlipFile.name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Supported: JPG, PNG, PDF (Max 5MB)</p>
                  </div>
                </div>
              )}
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
            disabled={isProcessing || (paymentMethod === 'bank' && !bankSlipFile)}
            className="w-full bg-black hover:bg-orange-500 text-white font-medium py-3 px-6 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing 
              ? 'Processing...' 
              : paymentMethod === 'card' 
                ? 'Proceed to PayHere Gateway →' 
                : 'Submit Bank Transfer Details →'}
          </button>

          {paymentMethod === 'bank' && !bankSlipFile && (
            <p className="text-xs text-orange-500 text-center mt-2">
              Please upload your bank transfer slip
            </p>
          )}

          {paymentMethod === 'card' && (
            <p className="text-xs text-gray-500 text-center mt-3">
              You will be redirected to PayHere secure payment gateway
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
