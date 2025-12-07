/**
 * Script to identify sandbox payments by merchant ID
 * Since your sandbox payments don't have explicit test markers,
 * we'll identify them by comparing merchant IDs
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Known PayHere Merchant IDs
const KNOWN_MERCHANT_IDS = {
  // Your merchant IDs from .env
  SANDBOX: '1232882', // Your sandbox merchant ID
  LIVE: '238431',     // Your live merchant ID from .env
};

async function identifySandboxByMerchant() {
  try {
    console.log('🔍 Identifying Sandbox Payments by Merchant ID...\n');
    console.log('═══════════════════════════════════════════════\n');

    // Fetch all payments with merchant IDs
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

    // Group by merchant ID
    const merchantGroups = {};
    payments.forEach(payment => {
      const merchantId = payment.merchantId || 'UNKNOWN';
      if (!merchantGroups[merchantId]) {
        merchantGroups[merchantId] = [];
      }
      merchantGroups[merchantId].push(payment);
    });

    console.log('📋 MERCHANT ID BREAKDOWN\n');
    console.log('─────────────────────────────────────────────────');
    
    Object.entries(merchantGroups).forEach(([merchantId, paymentList]) => {
      const totalAmount = paymentList.reduce((sum, p) => sum + p.amount, 0);
      const completedCount = paymentList.filter(p => p.status === 'COMPLETED').length;
      
      // Determine if this is sandbox
      let environment = '🟢 LIVE';
      if (merchantId === KNOWN_MERCHANT_IDS.SANDBOX || merchantId.match(/^121\d{4}$/)) {
        environment = '🏖️ SANDBOX';
      } else if (merchantId === KNOWN_MERCHANT_IDS.LIVE) {
        environment = '🟢 LIVE';
      } else if (merchantId.toUpperCase().includes('TEST') || merchantId === 'UNKNOWN') {
        environment = '🧪 TEST/UNKNOWN';
      }
      
      console.log(`\n${environment} Merchant ID: ${merchantId}`);
      console.log(`  Payments: ${paymentList.length}`);
      console.log(`  Completed: ${completedCount}`);
      console.log(`  Total Revenue: LKR ${totalAmount.toLocaleString()}`);
    });

    console.log('\n─────────────────────────────────────────────────\n');

    // Check for date-based patterns (sandbox testing often happens in bursts)
    console.log('📅 DATE PATTERN ANALYSIS\n');
    console.log('─────────────────────────────────────────────────');
    
    const dateGroups = {};
    payments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = { count: 0, amount: 0, pending: 0, completed: 0 };
      }
      dateGroups[date].count++;
      dateGroups[date].amount += payment.amount;
      if (payment.status === 'PENDING') dateGroups[date].pending++;
      if (payment.status === 'COMPLETED') dateGroups[date].completed++;
    });

    // Show days with unusual patterns (potential test days)
    const sortedDates = Object.entries(dateGroups).sort((a, b) => b[0].localeCompare(a[0]));
    console.log('\nRecent Activity (potential sandbox test days marked):');
    sortedDates.slice(0, 15).forEach(([date, stats]) => {
      const suspiciousPattern = 
        (stats.pending > stats.completed * 2) || // Many pending vs completed
        (stats.count > 10 && stats.completed === 0) || // Many payments, none completed
        (stats.amount === stats.count * 2000 && stats.count > 5); // Same amount pattern
      
      const marker = suspiciousPattern ? '⚠️  POTENTIAL TEST DAY' : '';
      console.log(`${date}: ${stats.count} payments (${stats.completed} completed, ${stats.pending} pending) - LKR ${stats.amount.toLocaleString()} ${marker}`);
    });

    console.log('\n─────────────────────────────────────────────────\n');

    // Amount pattern analysis
    console.log('💰 AMOUNT PATTERN ANALYSIS\n');
    console.log('─────────────────────────────────────────────────');
    
    const amountGroups = {};
    payments.forEach(payment => {
      const amount = payment.amount;
      if (!amountGroups[amount]) {
        amountGroups[amount] = { count: 0, completed: 0, pending: 0 };
      }
      amountGroups[amount].count++;
      if (payment.status === 'COMPLETED') amountGroups[amount].completed++;
      if (payment.status === 'PENDING') amountGroups[amount].pending++;
    });

    console.log('Amount patterns (suspicious if many pending):');
    Object.entries(amountGroups)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([amount, stats]) => {
        const suspiciousRatio = stats.pending > stats.completed * 3;
        const marker = suspiciousRatio ? '⚠️' : '';
        console.log(`LKR ${amount}: ${stats.count} payments (${stats.completed} completed, ${stats.pending} pending) ${marker}`);
      });

    console.log('\n─────────────────────────────────────────────────\n');

    // Recommendations
    console.log('💡 RECOMMENDATIONS\n');
    console.log('─────────────────────────────────────────────────\n');
    
    const totalPending = payments.filter(p => p.status === 'PENDING').length;
    const totalCompleted = payments.filter(p => p.status === 'COMPLETED').length;
    const pendingRatio = (totalPending / payments.length * 100).toFixed(1);

    console.log(`1. You have ${totalPending} PENDING payments (${pendingRatio}%)`);
    console.log(`   - If these are from sandbox testing, they should be tagged/cleaned`);
    console.log(`   - Real pending payments should be investigated\n`);

    console.log(`2. To manually tag sandbox payments, you can:`);
    console.log(`   a) Create a migration to add metadata flag`);
    console.log(`   b) Use the admin dashboard to review and delete`);
    console.log(`   c) Tag by date range if you know testing periods\n`);

    console.log(`3. Look for these indicators in the data above:`);
    console.log(`   - Days with many PENDING but no COMPLETED`);
    console.log(`   - Consistent amounts (2000 LKR repeated)`);
    console.log(`   - Merchant IDs that aren't your live ID (${KNOWN_MERCHANT_IDS.LIVE})\n`);

    console.log('\n✅ Analysis Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

identifySandboxByMerchant();
