/**
 * Payment Utilities - Sandbox Detection & Classification
 * Identifies test/sandbox payments without database schema changes
 */

export interface PaymentClassification {
  isSandbox: boolean;
  isTestData: boolean;
  environment: 'production' | 'sandbox' | 'test' | 'unknown';
  indicators: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Detect if a payment is from sandbox/test environment
 * Uses existing fields: metadata, merchantId, orderId, paymentId, responseData
 */
export function classifyPayment(payment: {
  merchantId: string;
  orderId: string;
  paymentId?: string | null;
  metadata?: any;
  responseData?: any;
  amount?: number;
  status?: string;
}): PaymentClassification {
  const indicators: string[] = [];
  let isSandbox = false;
  let isTestData = false;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // Pattern 1: Check metadata for test flags
  if (payment.metadata) {
    if (payment.metadata.testPayment === true) {
      indicators.push('metadata.testPayment=true');
      isTestData = true;
      confidence = 'high';
    }
    if (payment.metadata.sandbox === true) {
      indicators.push('metadata.sandbox=true');
      isSandbox = true;
      confidence = 'high';
    }
    if (payment.metadata.environment === 'sandbox' || payment.metadata.environment === 'test') {
      indicators.push(`metadata.environment=${payment.metadata.environment}`);
      isSandbox = true;
      confidence = 'high';
    }
  }

  // Pattern 2: Check merchantId patterns
  if (payment.merchantId) {
    if (payment.merchantId.toUpperCase().includes('TEST')) {
      indicators.push('merchantId contains TEST');
      isTestData = true;
      confidence = 'high';
    }
    if (payment.merchantId.toUpperCase().includes('SANDBOX')) {
      indicators.push('merchantId contains SANDBOX');
      isSandbox = true;
      confidence = 'high';
    }
    // Check for known sandbox merchant IDs
    // PayHere sandbox merchant IDs: 1232882, 1224208
    if (payment.merchantId === '1232882' || payment.merchantId === '1224208') {
      indicators.push(`Sandbox merchant ID: ${payment.merchantId}`);
      isSandbox = true;
      confidence = 'high';
    }
    // Production merchant ID
    if (payment.merchantId === '238431') {
      indicators.push('Production merchant ID: 238431');
      confidence = 'high';
    }
  }

  // Pattern 3: Check orderId patterns
  if (payment.orderId) {
    const upperOrderId = payment.orderId.toUpperCase();
    if (upperOrderId.includes('TEST')) {
      indicators.push('orderId contains TEST');
      isTestData = true;
      confidence = 'high';
    }
    if (upperOrderId.includes('SANDBOX')) {
      indicators.push('orderId contains SANDBOX');
      isSandbox = true;
      confidence = 'high';
    }
    if (upperOrderId.includes('DEMO')) {
      indicators.push('orderId contains DEMO');
      isTestData = true;
      confidence = 'high';
    }
  }

  // Pattern 4: Check paymentId patterns
  if (payment.paymentId) {
    const upperPaymentId = payment.paymentId.toUpperCase();
    if (upperPaymentId.includes('TEST')) {
      indicators.push('paymentId contains TEST');
      isTestData = true;
      confidence = 'high';
    }
    if (upperPaymentId.startsWith('PH-TEST-')) {
      indicators.push('paymentId starts with PH-TEST-');
      isTestData = true;
      confidence = 'high';
    }
  }

  // Pattern 5: Check responseData
  if (payment.responseData) {
    if (payment.responseData.merchant_id?.toUpperCase().includes('TEST')) {
      indicators.push('responseData.merchant_id contains TEST');
      isTestData = true;
      confidence = 'high';
    }
    if (payment.responseData.sandbox === true || payment.responseData.mode === 'sandbox') {
      indicators.push('responseData indicates sandbox mode');
      isSandbox = true;
      confidence = 'high';
    }
  }

  // Pattern 6: Common test amounts (exact amounts often used in testing)
  if (payment.amount) {
    const testAmounts = [1, 10, 100, 0.01, 0.1, 1.00, 10.00, 100.00];
    if (testAmounts.includes(payment.amount)) {
      indicators.push(`common test amount: ${payment.amount}`);
      confidence = confidence === 'high' ? 'high' : 'low';
    }
  }

  // Determine environment
  let environment: 'production' | 'sandbox' | 'test' | 'unknown' = 'unknown';
  if (isTestData) {
    environment = 'test';
  } else if (isSandbox) {
    environment = 'sandbox';
  } else {
    // If not sandbox or test, it's production
    environment = 'production';
  }

  return {
    isSandbox,
    isTestData,
    environment,
    indicators,
    confidence,
  };
}

/**
 * Get a visual badge/tag for payment environment
 */
export function getPaymentEnvironmentBadge(classification: PaymentClassification): {
  label: string;
  color: string;
  emoji: string;
  bgColor: string;
  textColor: string;
} {
  switch (classification.environment) {
    case 'test':
      return {
        label: 'TEST',
        emoji: '',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
      };
    case 'sandbox':
      return {
        label: 'SANDBOX',
        emoji: '',
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
      };
    case 'production':
      return {
        label: 'LIVE',
        emoji: '',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
      };
    default:
      return {
        label: 'UNKNOWN',
        emoji: '',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
      };
  }
}

/**
 * Filter payments by environment
 */
export function filterPaymentsByEnvironment(
  payments: any[],
  filter: 'all' | 'production' | 'sandbox' | 'test'
): any[] {
  if (filter === 'all') return payments;

  return payments.filter(payment => {
    const classification = classifyPayment({
      merchantId: payment.merchantId,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      metadata: payment.metadata,
      responseData: payment.responseData,
      amount: payment.amount,
      status: payment.status,
    });

    return classification.environment === filter;
  });
}

/**
 * Calculate statistics excluding test/sandbox data
 */
export function calculateProductionStats(payments: any[]): {
  totalCount: number;
  productionCount: number;
  sandboxCount: number;
  testCount: number;
  productionRevenue: number;
  sandboxRevenue: number;
  testRevenue: number;
} {
  let productionCount = 0;
  let sandboxCount = 0;
  let testCount = 0;
  let productionRevenue = 0;
  let sandboxRevenue = 0;
  let testRevenue = 0;

  payments.forEach(payment => {
    const classification = classifyPayment({
      merchantId: payment.merchantId,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      metadata: payment.metadata,
      responseData: payment.responseData,
      amount: payment.amount,
      status: payment.status,
    });

    const amount = payment.amount || 0;

    switch (classification.environment) {
      case 'production':
        productionCount++;
        productionRevenue += amount;
        break;
      case 'sandbox':
        sandboxCount++;
        sandboxRevenue += amount;
        break;
      case 'test':
        testCount++;
        testRevenue += amount;
        break;
    }
  });

  return {
    totalCount: payments.length,
    productionCount,
    sandboxCount,
    testCount,
    productionRevenue,
    sandboxRevenue,
    testRevenue,
  };
}

/**
 * Get human-readable explanation of why payment was classified
 */
export function getClassificationExplanation(classification: PaymentClassification): string {
  if (classification.indicators.length === 0) {
    return 'No test/sandbox indicators found. Assumed to be production payment.';
  }

  const reasons = classification.indicators.join(', ');
  return `Classified as ${classification.environment} based on: ${reasons}`;
}
