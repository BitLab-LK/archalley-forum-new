const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeBankTransferPayments() {
  try {
    const payments = await prisma.competitionPayment.findMany({
      where: {
        paymentMethod: 'BANK_TRANSFER'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        competition: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('='.repeat(80));
    console.log('🏦 BANK TRANSFER PAYMENTS');
    console.log('='.repeat(80));
    console.log(`\nTotal: ${payments.length}`);
    console.log(`Total Amount: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR\n`);
    
    const byStatus = {};
    payments.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });
    
    console.log('Status Breakdown:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n' + '-'.repeat(80));
    console.log('PAYMENT DETAILS:');
    console.log('-'.repeat(80));
    
    payments.forEach((p, i) => {
      console.log(`\n${i+1}. ${p.user?.name || 'N/A'} (${p.user?.email || 'N/A'})`);
      console.log(`   Order: ${p.orderId}`);
      console.log(`   Amount: ${p.amount} ${p.currency}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Merchant: ${p.merchantId}`);
      console.log(`   Competition: ${p.competition?.title || 'N/A'}`);
      console.log(`   Date: ${p.createdAt.toLocaleString()}`);
      if (p.completedAt) {
        console.log(`   Completed: ${p.completedAt.toLocaleString()}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Group by merchant
    const byMerchant = {};
    payments.forEach(p => {
      if (!byMerchant[p.merchantId]) {
        byMerchant[p.merchantId] = { count: 0, amount: 0, statuses: {} };
      }
      byMerchant[p.merchantId].count++;
      byMerchant[p.merchantId].amount += p.amount;
      byMerchant[p.merchantId].statuses[p.status] = (byMerchant[p.merchantId].statuses[p.status] || 0) + 1;
    });
    
    console.log('BY MERCHANT ID:');
    Object.entries(byMerchant).forEach(([mid, data]) => {
      console.log(`\n  Merchant ${mid}:`);
      console.log(`    Count: ${data.count}`);
      console.log(`    Amount: ${data.amount.toLocaleString()} LKR`);
      console.log(`    Status: ${JSON.stringify(data.statuses)}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeBankTransferPayments();
