/**
 * Production Data Analysis Script
 * Identifies real (production) payments vs test/sandbox data
 * Run with: node scripts/analyze-production-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Known sandbox/test merchant IDs
const SANDBOX_MERCHANT_IDS = ['1232882', '1214321'];
const PRODUCTION_MERCHANT_IDS = ['238431']; // Add your production merchant ID here

function classifyPayment(payment) {
  const indicators = [];
  let environment = 'unknown';
  let confidence = 'low';

  // Check merchant ID (highest priority)
  if (payment.merchantId) {
    if (PRODUCTION_MERCHANT_IDS.includes(payment.merchantId)) {
      environment = 'production';
      confidence = 'high';
      indicators.push(`Production merchant ID: ${payment.merchantId}`);
    } else if (SANDBOX_MERCHANT_IDS.includes(payment.merchantId)) {
      environment = 'sandbox';
      confidence = 'high';
      indicators.push(`Sandbox merchant ID: ${payment.merchantId}`);
    } else if (payment.merchantId.match(/^12\d{5}$/)) {
      environment = 'sandbox';
      confidence = 'medium';
      indicators.push(`PayHere sandbox pattern (12xxxxx): ${payment.merchantId}`);
    }
  }

  // Check metadata flags
  if (payment.metadata) {
    if (payment.metadata.sandbox === true) {
      environment = 'sandbox';
      confidence = 'high';
      indicators.push('metadata.sandbox=true');
    }
    if (payment.metadata.testPayment === true) {
      environment = 'test';
      confidence = 'high';
      indicators.push('metadata.testPayment=true');
    }
    if (payment.metadata.environment) {
      environment = payment.metadata.environment;
      confidence = 'high';
      indicators.push(`metadata.environment=${payment.metadata.environment}`);
    }
  }

  // Check order ID patterns
  if (payment.orderId) {
    const upperOrderId = payment.orderId.toUpperCase();
    if (upperOrderId.includes('TEST') || upperOrderId.includes('SANDBOX') || upperOrderId.includes('DEMO')) {
      environment = 'test';
      confidence = 'high';
      indicators.push(`Test pattern in orderId: ${payment.orderId}`);
    }
  }

  // Check payment ID patterns
  if (payment.paymentId) {
    const upperPaymentId = payment.paymentId.toUpperCase();
    if (upperPaymentId.includes('TEST') || upperPaymentId.includes('SANDBOX')) {
      environment = 'test';
      confidence = 'high';
      indicators.push(`Test pattern in paymentId: ${payment.paymentId}`);
    }
  }

  // Check response data
  if (payment.responseData) {
    const responseStr = JSON.stringify(payment.responseData).toUpperCase();
    if (responseStr.includes('TEST') || responseStr.includes('SANDBOX')) {
      if (environment === 'unknown') {
        environment = 'test';
        confidence = 'medium';
      }
      indicators.push('Test pattern in responseData');
    }
  }

  return { environment, confidence, indicators };
}

async function analyzeData() {
  console.log('🔍 ANALYZING COMPETITION REGISTRATION DATA\n');
  console.log('=' .repeat(80));

  try {
    // Fetch all registrations with payments
    const registrations = await prisma.competitionRegistration.findMany({
      include: {
        payment: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        competition: {
          select: {
            id: true,
            title: true,
            year: true,
          }
        },
        registrationType: {
          select: {
            id: true,
            name: true,
            fee: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Total Registrations: ${registrations.length}`);
    console.log(`📊 With Payments: ${registrations.filter(r => r.payment).length}`);
    console.log(`📊 Without Payments: ${registrations.filter(r => !r.payment).length}\n`);

    // Classify all payments
    const classified = {
      production: [],
      sandbox: [],
      test: [],
      unknown: [],
      noPayment: []
    };

    let totalProductionRevenue = 0;
    let totalSandboxRevenue = 0;
    let totalTestRevenue = 0;

    registrations.forEach(reg => {
      if (!reg.payment) {
        classified.noPayment.push(reg);
        return;
      }

      const classification = classifyPayment(reg.payment);
      const data = {
        registration: reg,
        classification
      };

      if (classification.environment === 'production') {
        classified.production.push(data);
        if (reg.status === 'CONFIRMED') {
          totalProductionRevenue += reg.amountPaid;
        }
      } else if (classification.environment === 'sandbox') {
        classified.sandbox.push(data);
        if (reg.status === 'CONFIRMED') {
          totalSandboxRevenue += reg.amountPaid;
        }
      } else if (classification.environment === 'test') {
        classified.test.push(data);
        if (reg.status === 'CONFIRMED') {
          totalTestRevenue += reg.amountPaid;
        }
      } else {
        classified.unknown.push(data);
      }
    });

    // Display summary
    console.log('=' .repeat(80));
    console.log('📈 CLASSIFICATION SUMMARY');
    console.log('=' .repeat(80));
    console.log(`\n✅ PRODUCTION (Real Payments): ${classified.production.length}`);
    console.log(`   - Confirmed: ${classified.production.filter(d => d.registration.status === 'CONFIRMED').length}`);
    console.log(`   - Pending: ${classified.production.filter(d => d.registration.status === 'PENDING').length}`);
    console.log(`   - Total Revenue: ${totalProductionRevenue.toLocaleString()} LKR`);

    console.log(`\n🧪 SANDBOX (Test Payments): ${classified.sandbox.length}`);
    console.log(`   - Confirmed: ${classified.sandbox.filter(d => d.registration.status === 'CONFIRMED').length}`);
    console.log(`   - Pending: ${classified.sandbox.filter(d => d.registration.status === 'PENDING').length}`);
    console.log(`   - Total Amount: ${totalSandboxRevenue.toLocaleString()} LKR`);

    console.log(`\n🔬 TEST (Test Data): ${classified.test.length}`);
    console.log(`   - Confirmed: ${classified.test.filter(d => d.registration.status === 'CONFIRMED').length}`);
    console.log(`   - Pending: ${classified.test.filter(d => d.registration.status === 'PENDING').length}`);
    console.log(`   - Total Amount: ${totalTestRevenue.toLocaleString()} LKR`);

    console.log(`\n❓ UNKNOWN: ${classified.unknown.length}`);
    console.log(`\n⚠️  NO PAYMENT: ${classified.noPayment.length}`);

    // Display production data details
    if (classified.production.length > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log('✅ PRODUCTION PAYMENTS (REAL DATA - KEEP THESE)');
      console.log('=' .repeat(80));
      
      classified.production.forEach((data, index) => {
        const reg = data.registration;
        console.log(`\n${index + 1}. Registration: ${reg.registrationNumber}`);
        console.log(`   User: ${reg.user.name} (${reg.user.email})`);
        console.log(`   Competition: ${reg.competition.title} ${reg.competition.year}`);
        console.log(`   Type: ${reg.registrationType.name}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Amount: ${reg.amountPaid.toLocaleString()} ${reg.currency}`);
        console.log(`   Payment Method: ${reg.payment.paymentMethod}`);
        console.log(`   Payment Status: ${reg.payment.status}`);
        console.log(`   Order ID: ${reg.payment.orderId}`);
        console.log(`   Merchant ID: ${reg.payment.merchantId || 'N/A'}`);
        console.log(`   Confidence: ${data.classification.confidence.toUpperCase()}`);
        console.log(`   Indicators: ${data.classification.indicators.join(', ')}`);
        console.log(`   Created: ${reg.createdAt.toISOString()}`);
      });
    }

    // Display sandbox/test data that can be deleted
    const deletableCount = classified.sandbox.length + classified.test.length;
    if (deletableCount > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log(`🗑️  SANDBOX/TEST DATA (SAFE TO DELETE - ${deletableCount} registrations)`);
      console.log('=' .repeat(80));
      
      const deletable = [...classified.sandbox, ...classified.test];
      deletable.forEach((data, index) => {
        const reg = data.registration;
        console.log(`\n${index + 1}. Registration: ${reg.registrationNumber}`);
        console.log(`   Environment: ${data.classification.environment.toUpperCase()}`);
        console.log(`   User: ${reg.user.name} (${reg.user.email})`);
        console.log(`   Competition: ${reg.competition.title}`);
        console.log(`   Type: ${reg.registrationType.name}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Amount: ${reg.amountPaid.toLocaleString()} ${reg.currency}`);
        console.log(`   Order ID: ${reg.payment.orderId}`);
        console.log(`   Merchant ID: ${reg.payment.merchantId || 'N/A'}`);
        console.log(`   Indicators: ${data.classification.indicators.join(', ')}`);
        console.log(`   Registration ID: ${reg.id}`);
      });
    }

    // Display unknown data (needs manual review)
    if (classified.unknown.length > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log(`❓ UNKNOWN DATA (NEEDS MANUAL REVIEW - ${classified.unknown.length} registrations)`);
      console.log('=' .repeat(80));
      
      classified.unknown.forEach((data, index) => {
        const reg = data.registration;
        console.log(`\n${index + 1}. Registration: ${reg.registrationNumber}`);
        console.log(`   User: ${reg.user.name} (${reg.user.email})`);
        console.log(`   Competition: ${reg.competition.title}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Amount: ${reg.amountPaid.toLocaleString()} ${reg.currency}`);
        console.log(`   Order ID: ${reg.payment.orderId}`);
        console.log(`   Merchant ID: ${reg.payment.merchantId || 'N/A'}`);
        console.log(`   Payment Method: ${reg.payment.paymentMethod || 'N/A'}`);
        console.log(`   Registration ID: ${reg.id}`);
      });
    }

    // Display registrations without payments
    if (classified.noPayment.length > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log(`⚠️  REGISTRATIONS WITHOUT PAYMENTS (${classified.noPayment.length})`);
      console.log('=' .repeat(80));
      
      classified.noPayment.forEach((reg, index) => {
        console.log(`\n${index + 1}. Registration: ${reg.registrationNumber}`);
        console.log(`   User: ${reg.user.name} (${reg.user.email})`);
        console.log(`   Competition: ${reg.competition.title}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Amount: ${reg.amountPaid.toLocaleString()} ${reg.currency}`);
        console.log(`   Created: ${reg.createdAt.toISOString()}`);
        console.log(`   Registration ID: ${reg.id}`);
      });
    }

    // Generate IDs file for deletion script
    const deletableData = [...classified.sandbox, ...classified.test];
    const testRegistrationIds = deletableData.map(d => d.registration.id);
    console.log('\n' + '=' .repeat(80));
    console.log('💾 GENERATED FILES');
    console.log('=' .repeat(80));
    console.log(`\nTest Registration IDs saved to: scripts/test-registration-ids.json`);
    console.log(`Total IDs to delete: ${testRegistrationIds.length}`);

    const fs = require('fs');
    fs.writeFileSync(
      'scripts/test-registration-ids.json',
      JSON.stringify(testRegistrationIds, null, 2)
    );

    // Summary
    console.log('\n' + '=' .repeat(80));
    console.log('📋 NEXT STEPS');
    console.log('=' .repeat(80));
    console.log(`\n1. Review the PRODUCTION data above (${classified.production.length} registrations)`);
    console.log(`   ✅ These are REAL payments - they will be KEPT`);
    console.log(`\n2. Review the SANDBOX/TEST data (${deletableCount} registrations)`);
    console.log(`   🗑️  These are test payments - they can be DELETED`);
    
    if (classified.unknown.length > 0) {
      console.log(`\n3. ⚠️  IMPORTANT: Review ${classified.unknown.length} UNKNOWN registrations manually`);
      console.log(`   - Cannot determine if production or test`);
      console.log(`   - Check merchant IDs and contact details`);
    }

    console.log(`\n4. To delete test data, run:`);
    console.log(`   node scripts/delete-test-registrations.js`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error analyzing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeData();
