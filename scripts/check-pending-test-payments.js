/**
 * CHECK PENDING TEST PAYMENTS
 * Shows all pending payments with sandbox merchant ID
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SANDBOX_MERCHANT_ID = '1232882';
const PRODUCTION_MERCHANT_ID = '238431';

async function checkPendingTestPayments() {
  console.log('\n' + '=' .repeat(80));
  console.log('🔍 CHECKING PENDING PAYMENTS');
  console.log('=' .repeat(80));

  try {
    const registrations = await prisma.competitionRegistration.findMany({
      include: {
        user: true,
        competition: true,
        payment: true,
      },
    });

    // Filter for pending payments
    const allPending = registrations.filter(r => 
      r.payment && r.payment.status === 'PENDING'
    );

    const testPending = allPending.filter(r => 
      r.payment.merchantId === SANDBOX_MERCHANT_ID
    );

    const productionPending = allPending.filter(r => 
      r.payment.merchantId === PRODUCTION_MERCHANT_ID || 
      r.payment.merchantId !== SANDBOX_MERCHANT_ID
    );

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Pending Payments: ${allPending.length}`);
    console.log(`   🧪 Test Pending: ${testPending.length}`);
    console.log(`   ✅ Production Pending: ${productionPending.length}`);

    if (testPending.length > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log('🧪 PENDING TEST PAYMENTS (Sandbox Merchant 1232882)');
      console.log('=' .repeat(80));

      testPending.forEach((r, i) => {
        console.log(`\n${i + 1}. Registration: ${r.registrationNumber}`);
        console.log(`   User: ${r.user.name} (${r.user.email})`);
        console.log(`   Competition: ${r.competition.title}`);
        console.log(`   Registration Status: ${r.status}`);
        console.log(`   Payment Status: ${r.payment.status}`);
        console.log(`   Payment Method: ${r.payment.paymentMethod}`);
        console.log(`   Amount: ${r.amountPaid.toLocaleString()} ${r.currency}`);
        console.log(`   Order ID: ${r.payment.orderId}`);
        console.log(`   Merchant ID: ${r.payment.merchantId}`);
        console.log(`   Created: ${new Date(r.createdAt).toLocaleString()}`);
        console.log(`   Registration ID: ${r.id}`);
      });
    } else {
      console.log('\n✅ No pending test payments found!');
    }

    if (productionPending.length > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log('⚠️  PENDING PRODUCTION PAYMENTS');
      console.log('=' .repeat(80));

      productionPending.forEach((r, i) => {
        console.log(`\n${i + 1}. Registration: ${r.registrationNumber}`);
        console.log(`   User: ${r.user.name} (${r.user.email})`);
        console.log(`   Competition: ${r.competition.title}`);
        console.log(`   Payment Method: ${r.payment.paymentMethod}`);
        console.log(`   Amount: ${r.amountPaid.toLocaleString()} ${r.currency}`);
        console.log(`   Order ID: ${r.payment.orderId}`);
        console.log(`   Merchant ID: ${r.payment.merchantId || 'N/A'}`);
        console.log(`   Created: ${new Date(r.createdAt).toLocaleString()}`);
      });
    }

    // Check all statuses
    console.log('\n' + '=' .repeat(80));
    console.log('📊 ALL PAYMENT STATUSES BREAKDOWN');
    console.log('=' .repeat(80));

    const statusCounts = {
      COMPLETED: { test: 0, production: 0 },
      PENDING: { test: 0, production: 0 },
      FAILED: { test: 0, production: 0 },
    };

    registrations.forEach(r => {
      if (r.payment) {
        const status = r.payment.status;
        const isTest = r.payment.merchantId === SANDBOX_MERCHANT_ID;
        
        if (statusCounts[status]) {
          statusCounts[status][isTest ? 'test' : 'production']++;
        }
      }
    });

    console.log('\nCOMPLETED:');
    console.log(`   Production: ${statusCounts.COMPLETED.production}`);
    console.log(`   Test: ${statusCounts.COMPLETED.test}`);
    
    console.log('\nPENDING:');
    console.log(`   Production: ${statusCounts.PENDING.production}`);
    console.log(`   Test: ${statusCounts.PENDING.test}`);
    
    console.log('\nFAILED:');
    console.log(`   Production: ${statusCounts.FAILED.production}`);
    console.log(`   Test: ${statusCounts.FAILED.test}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingTestPayments();
