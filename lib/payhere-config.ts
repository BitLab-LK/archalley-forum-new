/**
 * PayHere Payment Gateway Configuration
 * Configuration and utilities for PayHere integration
 */

export const PAYHERE_CONFIG = {
  // Merchant Configuration
  merchantId:
    process.env.PAYHERE_MODE === 'live'
      ? process.env.PAYHERE_MERCHANT_ID?.trim()
      : (process.env.PAYHERE_SANDBOX_MERCHANT_ID || process.env.PAYHERE_MERCHANT_ID)?.trim() || '1221149',
  
  merchantSecret:
    process.env.PAYHERE_MODE === 'live'
      ? process.env.PAYHERE_MERCHANT_SECRET?.trim()
      : (process.env.PAYHERE_SANDBOX_MERCHANT_SECRET || process.env.PAYHERE_MERCHANT_SECRET)?.trim() || 'test_secret',
  
  // Payment Configuration
  currency: 'LKR',
  mode: (process.env.PAYHERE_MODE as 'sandbox' | 'live') || 'sandbox',
  
  // URLs
  paymentUrl:
    process.env.PAYHERE_MODE === 'live'
      ? 'https://www.payhere.lk/pay/checkout'
      : 'https://sandbox.payhere.lk/pay/checkout',
  
  returnUrl: `${process.env.NEXTAUTH_URL}/competitions/payment/return`,
  cancelUrl: `${process.env.NEXTAUTH_URL}/competitions/payment/cancel`,
  notifyUrl: `${process.env.NEXTAUTH_URL}/api/competitions/payment/notify`,
  
  // Supported Payment Methods
  supportedMethods: [
    'VISA',
    'MASTER',
    'AMEX',
    'eZCash',
    'mCash',
    'Genie',
    'Frimi',
    'SAMPATH_VISHWA',
  ],
  
  // Status Codes
  statusCodes: {
    SUCCESS: '2',
    PENDING: '0',
    FAILED: '-1',
    CANCELLED: '-2',
    CHARGED_BACK: '-3',
  },
} as const;

/**
 * Get PayHere configuration with validation
 */
export function getPayHereConfig() {
  if (!PAYHERE_CONFIG.merchantId) {
    throw new Error('PayHere Merchant ID is not configured');
  }
  
  if (!PAYHERE_CONFIG.merchantSecret) {
    throw new Error('PayHere Merchant Secret is not configured');
  }
  
  return PAYHERE_CONFIG;
}

/**
 * Get PayHere status message
 */
export function getPayHereStatusMessage(statusCode: string): string {
  const messages: Record<string, string> = {
    '2': 'Payment Successful',
    '0': 'Payment Pending',
    '-1': 'Payment Cancelled',
    '-2': 'Payment Failed',
    '-3': 'Payment Charged Back',
  };
  
  return messages[statusCode] || 'Unknown Status';
}

/**
 * Validate PayHere webhook request
 */
export function isValidPayHereRequest(headers: Headers): boolean {
  // Check if request is from PayHere
  const userAgent = headers.get('user-agent');
  
  // Basic validation - enhance based on PayHere documentation
  if (!userAgent) {
    return false;
  }
  
  // In production, add more strict validation
  return true;
}
