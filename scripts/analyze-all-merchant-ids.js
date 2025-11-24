/**
 * ANALYZE ALL MERCHANT IDs IN DATABASE
 * Identify all unique merchant IDs and their usage
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeAllMerchantIds() {
  console.log('\n' + '=' .repeat(80));
  console.log('🔍 ANALYZING ALL MERCHANT IDs IN DATABASE');
  console.log('=' .repeat(80));

  try {
    const allPayments = await prisma.competitionPayment.findMany({
      include: {
        registrations: {
          include: {
            user: true,
            competition: true,
          }
        }
      }
    });

    console.log(`\n📊 Total Payments: ${allPayments.length}`);

    // Group by merchant ID
    const merchantGroups = {};
    
    allPayments.forEach(payment => {
      const merchantId = payment.merchantId || 'NULL';
      
      if (!merchantGroups[merchantId]) {
        merchantGroups[merchantId] = {
          total: 0,
          completed: 0,
          pending: 0,
          failed: 0,
          payments: []
        };
      }
      
      merchantGroups[merchantId].total++;
      merchantGroups[merchantId][payment.status.toLowerCase()]++;
      merchantGroups[merchantId].payments.push(payment);
    });

    console.log('\n' + '=' .repeat(80));
    console.log('📈 MERCHANT ID BREAKDOWN');
    console.log('=' .repeat(80));

    Object.keys(merchantGroups).sort().forEach(merchantId => {
      const group = merchantGroups[merchantId];
      console.log(`\n🏪 Merchant ID: ${merchantId}`);
      console.log(`   Total: ${group.total}`);
      console.log(`   ✅ COMPLETED: ${group.completed}`);
      console.log(`   ⏳ PENDING: ${group.pending}`);
      console.log(`   ❌ FAILED: ${group.failed}`);
      
      // Show environment classification
      if (merchantId === '238431') {
        console.log(`   🎯 TYPE: PRODUCTION (Live PayHere)`);
      } else if (merchantId === '1232882') {
        console.log(`   🧪 TYPE: SANDBOX (PayHere Sandbox)`);
      } else if (merchantId === '1224208') {
        console.log(`   ❓ TYPE: UNKNOWN - Needs Investigation`);
      } else {
        console.log(`   ❓ TYPE: UNKNOWN`);
      }
    });

    // Detailed breakdown for unknown merchant 1224208
    if (merchantGroups['1224208']) {
      console.log('\n' + '=' .repeat(80));
      console.log('🔬 DETAILED ANALYSIS: Merchant 1224208');
      console.log('=' .repeat(80));

      const unknownPayments = merchantGroups['1224208'].payments;
      
      unknownPayments.slice(0, 10).forEach((payment, index) => {
        const reg = payment.registrations?.[0];
        console.log(`\n${index + 1}. Order ID: ${payment.orderId}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Amount: ${payment.amount} LKR`);
        console.log(`   Method: ${payment.paymentMethod}`);
        console.log(`   User: ${reg?.user?.email || 'N/A'}`);
        console.log(`   Created: ${new Date(payment.createdAt).toLocaleString()}`);
        console.log(`   Payment ID: ${payment.paymentId || 'N/A'}`);
        console.log(`   Status Code: ${payment.statusCode || 'N/A'}`);
      });

      if (unknownPayments.length > 10) {
        console.log(`\n   ... and ${unknownPayments.length - 10} more`);
      }
    }

    // Summary recommendations
    console.log('\n' + '=' .repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('=' .repeat(80));

    console.log('\nMerchant ID Classifications:');
    console.log('  ✅ 238431  = PRODUCTION (Keep all)');
    console.log('  🗑️  1232882 = SANDBOX (Delete all)');
    console.log('  ❓ 1224208 = UNKNOWN (Investigate before action)');
    
    if (merchantGroups['1224208']) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('  1. Verify if merchant 1224208 is test or production');
      console.log('  2. Check PayHere dashboard for this merchant ID');
      console.log('  3. All payments with this ID are currently PENDING');
      console.log(`  4. Total records: ${merchantGroups['1224208'].total}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeAllMerchantIds();
