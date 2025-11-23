/**
 * Checkout Client Component
 * Handles customer information and payment initiation
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { CartWithItems } from '@/types/competition';
import { PayHerePaymentData } from '@/types/competition';
import { toast } from 'sonner';
import { trackAddPaymentInfo, EcommerceItem } from '@/lib/google-analytics';

interface Props {
  user: any;
}

export default function CheckoutClient({ user }: Props) {
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [bankSlipFile, setBankSlipFile] = useState<File | null>(null);
  const [payHereLoaded, setPayHereLoaded] = useState(false);
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
    
    // Load PayHere SDK if not already loaded
    const loadPayHereSDK = () => {
      if (typeof window === 'undefined') return;

      // Check if already loaded
      if (window.payhere) {
        console.log('PayHere SDK already available');
        setPayHereLoaded(true);
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="payhere.js"]');
      if (existingScript) {
        console.log('PayHere script tag exists, waiting for SDK to initialize');
        // Poll for SDK availability
        const interval = setInterval(() => {
          if (window.payhere) {
            console.log('PayHere SDK initialized');
            setPayHereLoaded(true);
            clearInterval(interval);
          }
        }, 200);

        setTimeout(() => clearInterval(interval), 10000);
        return;
      }

      // Load the script manually as fallback
      console.log('Loading PayHere SDK manually');
      const script = document.createElement('script');
      script.src = 'https://www.payhere.lk/lib/payhere.js';
      script.async = true;
      script.onload = () => {
        console.log('PayHere SDK script loaded manually');
        // Wait a bit for initialization
        setTimeout(() => {
          if (window.payhere) {
            console.log('PayHere SDK initialized after manual load');
            setPayHereLoaded(true);
          } else {
            console.warn('PayHere SDK not available after manual load');
            // Poll for it
            const pollInterval = setInterval(() => {
              if (window.payhere) {
                console.log('PayHere SDK found on poll');
                setPayHereLoaded(true);
                clearInterval(pollInterval);
              }
            }, 200);
            setTimeout(() => clearInterval(pollInterval), 5000);
          }
        }, 300);
      };
      script.onerror = () => {
        console.error('Failed to load PayHere SDK manually');
        setPayHereLoaded(false);
        toast.error('Failed to load payment system. Please refresh the page.');
      };
      document.head.appendChild(script);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadPayHereSDK, 100);
    
    return () => clearTimeout(timer);
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
      const phone = formData.phone.replace(/[\s\-()]/g, ''); // Remove spaces, dashes, parentheses
      
      // Check if phone starts with + or just digits
      const hasCountryCode = phone.startsWith('+');
      const phoneRegex = hasCountryCode 
        ? /^\+\d{10,15}$/ // International format
        : /^0?\d{9,10}$/;  // Local format (with or without leading 0)
      
      if (!phoneRegex.test(phone)) {
        toast.error('Please enter a valid phone number (e.g., 0771234567 or +94771234567)');
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
    console.log('handleSubmit called', { paymentMethod, cartItems: cart?.items.length });
    
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Prevent double submission
    if (isProcessing) {
      console.log('Already processing, ignoring duplicate submission');
      return;
    }

    // Validate form data
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    // Validate bank transfer requirements
    if (paymentMethod === 'bank' && !bankSlipFile) {
      toast.error('Please upload your bank transfer slip');
      return;
    }

    setIsProcessing(true);
    console.log('Processing payment...', { paymentMethod });

    try {
      if (paymentMethod === 'card') {
        console.log('Initiating card payment via PayHere');
        
        // Track add_payment_info event when clicking PayHere button
        if (cart && cart.items.length > 0) {
          const items: EcommerceItem[] = cart.items.map((item: any) => ({
            item_id: `${item.competitionId}_${item.registrationTypeId}`,
            item_name: item.registrationType?.name || 'Registration',
            item_category: 'Competition Registration',
            item_category2: item.competition?.title || '',
            item_category3: item.registrationType?.name || '',
            price: item.subtotal,
            quantity: 1,
            currency: 'LKR',
          }));
          trackAddPaymentInfo(items, 'card');
        }
        
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
        console.log('Checkout API response:', { success: result.success, hasPaymentData: !!result.data?.paymentData });

        if (result.success && result.data?.paymentData) {
          console.log('Calling initiatePayHerePayment');
          initiatePayHerePayment(result.data.paymentData);
        } else {
          console.error('Checkout failed:', result.error);
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

        // Track add_payment_info event when clicking Submit Bank Transfer button
        if (cart && cart.items.length > 0) {
          const items: EcommerceItem[] = cart.items.map((item: any) => ({
            item_id: `${item.competitionId}_${item.registrationTypeId}`,
            item_name: item.registrationType?.name || 'Registration',
            item_category: 'Competition Registration',
            item_category2: item.competition?.title || '',
            item_category3: item.registrationType?.name || '',
            price: item.subtotal,
            quantity: 1,
            currency: 'LKR',
          }));
          trackAddPaymentInfo(items, 'bank_transfer');
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
          // Get all registration data with type names
          const registrations = result.data?.registrations || [];
          console.log('Navigating to payment-pending with registrations:', registrations);
          router.push(`/events/payment-pending?registrations=${encodeURIComponent(JSON.stringify(registrations))}`);
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
    console.log('initiatePayHerePayment called', {
      hasWindow: typeof window !== 'undefined',
      hasPayHere: typeof window !== 'undefined' && !!window.payhere,
      payHereLoaded,
      paymentData: {
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        merchant_id: paymentData.merchant_id,
      }
    });

    // Check if payhere.js is loaded
    if (typeof window === 'undefined') {
      console.error('Window is undefined');
      toast.error('Payment gateway is not available. Please refresh the page.');
      setIsProcessing(false);
      return;
    }

    if (!window.payhere) {
      console.error('PayHere SDK not loaded. window.payhere is undefined');
      toast.error('Payment gateway is loading. Please wait a moment and try again.');
      setIsProcessing(false);
      
      // Try to wait and retry once
      setTimeout(() => {
        if (window.payhere) {
          console.log('PayHere SDK loaded on retry, attempting payment again');
          initiatePayHerePayment(paymentData);
        } else {
          toast.error('Payment gateway failed to load. Please refresh the page.');
        }
      }, 2000);
      return;
    }

    if (!payHereLoaded) {
      console.warn('PayHere SDK loaded but state not updated');
      setPayHereLoaded(true);
    }

    // Set up PayHere event handlers
    window.payhere.onCompleted = function onCompleted(orderId: string) {
      console.log('Payment completed. OrderID:', orderId);
      console.log('⚠️ Note: Payment submitted to PayHere, waiting for server confirmation...');
      
      // Don't set isProcessing to false - keep it true while redirecting
      // Redirect to processing page to wait for PayHere notify webhook
      // This is critical because onCompleted fires BEFORE PayHere confirms the payment
      setTimeout(() => {
        router.push(`/competitions/payment/processing/${orderId}`);
      }, 500);
    };

    window.payhere.onDismissed = function onDismissed() {
      console.log('Payment dismissed');
      setIsProcessing(false);
      toast.info('Payment was cancelled. You can try again.');
    };

    window.payhere.onError = function onError(error: string) {
      console.log('Payment error:', error);
      setIsProcessing(false);
      toast.error(`Payment error: ${error}`);
    };

    // Prepare payment object for PayHere SDK
    const payment = {
      sandbox: paymentData.sandbox, // CRITICAL: Tell PayHere to use sandbox mode
      merchant_id: paymentData.merchant_id,
      return_url: undefined, // Important: set to undefined for Onsite Checkout
      cancel_url: undefined, // Important: set to undefined for Onsite Checkout
      notify_url: paymentData.notify_url,
      order_id: paymentData.order_id,
      items: paymentData.items,
      amount: paymentData.amount,
      currency: paymentData.currency,
      hash: paymentData.hash,
      first_name: paymentData.first_name,
      last_name: paymentData.last_name,
      email: paymentData.email,
      phone: paymentData.phone || '',
      address: paymentData.address || '',
      city: paymentData.city || '',
      country: paymentData.country || 'Sri Lanka',
    };

    // Start the payment popup
    try {
      console.log('🚀 Starting PayHere payment with full details:', {
        sandbox: payment.sandbox,
        merchant_id: payment.merchant_id,
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        items: payment.items,
        hash: payment.hash,
        notify_url: payment.notify_url,
        first_name: payment.first_name,
        last_name: payment.last_name,
        email: payment.email,
        country: payment.country,
      });
      
      console.log('📋 Complete payment object:', JSON.stringify(payment, null, 2));
      
      window.payhere.startPayment(payment);
      console.log('✅ payhere.startPayment called successfully');
    } catch (error) {
      console.error('Error starting payment:', error);
      setIsProcessing(false);
      toast.error(`Failed to start payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    <>
      {/* PayHere JavaScript SDK */}
      <Script 
        src="https://www.payhere.lk/lib/payhere.js" 
        strategy="afterInteractive"
        onLoad={() => {
          console.log('PayHere SDK script loaded');
          // Wait a bit for the SDK to initialize
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.payhere) {
              console.log('PayHere SDK initialized successfully');
              setPayHereLoaded(true);
            } else {
              console.warn('PayHere SDK script loaded but window.payhere not available yet');
              // Try again after a short delay
              setTimeout(() => {
                if (typeof window !== 'undefined' && window.payhere) {
                  console.log('PayHere SDK initialized on retry');
                  setPayHereLoaded(true);
                } else {
                  console.error('PayHere SDK failed to initialize');
                }
              }, 1000);
            }
          }, 100);
        }}
        onError={(e) => {
          console.error('Failed to load PayHere SDK script:', e);
          setPayHereLoaded(false);
          toast.error('Failed to load payment gateway. Please refresh the page.');
        }}
      />
      
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
                          {(group.totalAmount / group.count).toLocaleString()} LKR
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
              onClick={() => {
                setPaymentMethod('card');
              }}
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
              onClick={() => {
                setPaymentMethod('bank');
              }}
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
                ? 'Pay Securely with PayHere' 
                : 'Submit Bank Transfer Details →'}
          </button>

          {paymentMethod === 'bank' && !bankSlipFile && (
            <p className="text-xs text-orange-500 text-center mt-2">
              Please upload your bank transfer slip
            </p>
          )}

          {paymentMethod === 'card' && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Secure payment will open in a popup window
            </p>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
