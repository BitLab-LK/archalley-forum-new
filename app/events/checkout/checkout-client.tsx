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
        // Bank transfer payment - upload to Vercel Blob
        if (!bankSlipFile) {
          toast.error('Please upload your bank transfer slip');
          setIsProcessing(false);
          return;
        }

        // First, upload the file to Vercel Blob
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

        // Now submit the payment with the uploaded file URL
        const response = await fetch('/api/competitions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerInfo: formData,
            paymentMethod: 'bank',
            bankSlipUrl: uploadResult.url,
            bankSlipFileName: bankSlipFile.name,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success('Bank transfer details submitted successfully!');
          router.push(`/events/payment-pending?registrationNumber=${encodeURIComponent(result.registrationNumber || '')}`);
        } else {
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

  const openWhatsApp = () => {
    const phoneNumber = '94711942194'; // WhatsApp number
    const message = encodeURIComponent(
      `Hi, I want to complete my competition registration payment via bank transfer.\n\n` +
      `Order Details:\n` +
      `Name: ${formData.firstName} ${formData.lastName}\n` +
      `Email: ${formData.email}\n` +
      `Total Amount: LKR ${totalAmount.toLocaleString()}\n\n` +
      `I will send the bank slip shortly.`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
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
                    <p><span className="font-medium">Bank Name:</span> Bank of Ceylon</p>
                    <p><span className="font-medium">Account Name:</span> Archalley Forum</p>
                    <p><span className="font-medium">Account Number:</span> 1234567890</p>
                    <p><span className="font-medium">Branch:</span> Colombo Main</p>
                    <p><span className="font-medium">Amount:</span> <span className="text-orange-500 font-bold">LKR {totalAmount.toLocaleString()}</span></p>
                  </div>

                  {/* Upload Slip Section */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <label className="block text-sm font-medium text-black mb-2">
                      Upload Bank Slip <span className="text-orange-500">*</span>
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

                  {/* WhatsApp Option */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Or send via WhatsApp:</p>
                    <button
                      type="button"
                      onClick={openWhatsApp}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2 px-4 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Send via WhatsApp
                    </button>
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
              Please upload your bank transfer slip to continue
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
