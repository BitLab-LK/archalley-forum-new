/**
 * Script to analyze existing payments and identify sandbox/test payments
 * Run with: node scripts/analyze-sandbox-payments.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import classification function (converted for Node.js)
function classifyPayment(payment) {
  const indicators = [];
  let isSandbox = false;
  let isTestData = false;
  let confidence = 'low';

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

  // Determine environment
  let environment = 'unknown';
  if (isTestData) {
    environment = 'test';
  } else if (isSandbox) {
    environment = 'sandbox';
  } else if (indicators.length === 0) {
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

async function analyzePayments() {
  try {
    console.log('🔍 Analyzing Payments for Sandbox/Test Data...\n');
    console.log('═══════════════════════════════════════════════\n');

    // Fetch all payments
    const payments = await prisma.competitionPayment.findMany({
      select: {
        id: true,
        orderId: true,
        merchantId: true,
        paymentId: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        metadata: true,
        responseData: true,
        completedAt: true,
        createdAt: true,
        registrations: {
          select: {
            id: true,
            registrationNumber: true,
            status: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Total Payments Found: ${payments.length}\n`);

    // Classify each payment
    const results = {
      production: [],
      sandbox: [],
      test: [],
      unknown: [],
    };

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

      results[classification.environment].push({
        payment,
        classification,
      });
    });

    // Display Summary
    console.log('📈 SUMMARY\n');
    console.log('─────────────────────────────────────────────────');
    console.log(`🟢 Production Payments: ${results.production.length}`);
    console.log(`🏖️  Sandbox Payments:    ${results.sandbox.length}`);
    console.log(`🧪 Test Payments:       ${results.test.length}`);
    console.log(`❓ Unknown Payments:    ${results.unknown.length}`);
    console.log('─────────────────────────────────────────────────\n');

    // Calculate Revenue
    const productionRevenue = results.production.reduce((sum, r) => sum + r.payment.amount, 0);
    const sandboxRevenue = results.sandbox.reduce((sum, r) => sum + r.payment.amount, 0);
    const testRevenue = results.test.reduce((sum, r) => sum + r.payment.amount, 0);

    console.log('💰 REVENUE BREAKDOWN\n');
    console.log('─────────────────────────────────────────────────');
    console.log(`🟢 Production Revenue: LKR ${productionRevenue.toLocaleString()}`);
    console.log(`🏖️  Sandbox Revenue:    LKR ${sandboxRevenue.toLocaleString()}`);
    console.log(`🧪 Test Revenue:       LKR ${testRevenue.toLocaleString()}`);
    console.log('─────────────────────────────────────────────────\n');

    // Display Sandbox/Test Payments Details
    if (results.sandbox.length > 0 || results.test.length > 0) {
      console.log('🧪 SANDBOX/TEST PAYMENTS DETECTED\n');
      console.log('═══════════════════════════════════════════════\n');

      [...results.sandbox, ...results.test].forEach(({ payment, classification }) => {
        console.log(`Environment: ${classification.environment.toUpperCase()} (${classification.confidence} confidence)`);
        console.log(`Order ID: ${payment.orderId}`);
        console.log(`Payment ID: ${payment.paymentId || 'N/A'}`);
        console.log(`Merchant ID: ${payment.merchantId}`);
        console.log(`Amount: ${payment.currency} ${payment.amount.toLocaleString()}`);
        console.log(`Status: ${payment.status}`);
        console.log(`Method: ${payment.paymentMethod || 'N/A'}`);
        console.log(`Created: ${payment.createdAt.toISOString()}`);
        console.log(`Indicators: ${classification.indicators.join(', ')}`);
        console.log(`Registrations: ${payment.registrations.length}`);
        if (payment.registrations.length > 0) {
          payment.registrations.forEach(reg => {
            console.log(`  - ${reg.registrationNumber} (${reg.user.email})`);
          });
        }
        console.log('─────────────────────────────────────────────────\n');
      });
    }

    // Display Production Payments Summary
    if (results.production.length > 0) {
      console.log(`🟢 PRODUCTION PAYMENTS (${results.production.length})\n`);
      console.log('─────────────────────────────────────────────────');
      results.production.forEach(({ payment }) => {
        console.log(`${payment.orderId} | ${payment.currency} ${payment.amount} | ${payment.status} | ${payment.registrations.length} reg(s)`);
      });
      console.log('─────────────────────────────────────────────────\n');
    }

    console.log('\n✅ Analysis Complete!\n');
    console.log('💡 TIP: Use the Environment filter in Admin Dashboard to separate production from test data.');

  } catch (error) {
    console.error('❌ Error analyzing payments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzePayments();
