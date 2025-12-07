const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzePaymentsByMerchant() {
  try {
    const payments = await prisma.competitionPayment.groupBy({
      by: ['merchantId'],
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });
    
    console.log('='.repeat(80));
    console.log('📊 PAYMENTS BY MERCHANT ID');
    console.log('='.repeat(80));
    
    // Sort by count descending
    payments.sort((a, b) => b._count.id - a._count.id);
    
    payments.forEach(p => {
      console.log(`\nMerchant ID: ${p.merchantId}`);
      console.log(`  Total Payments: ${p._count.id}`);
      console.log(`  Total Amount: ${p._sum.amount?.toLocaleString()} LKR`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total Merchants: ${payments.length}`);
    console.log(`Total Payments: ${payments.reduce((sum, p) => sum + p._count.id, 0)}`);
    console.log(`Total Revenue: ${payments.reduce((sum, p) => sum + (p._sum.amount || 0), 0).toLocaleString()} LKR`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzePaymentsByMerchant();
