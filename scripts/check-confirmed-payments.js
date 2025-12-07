const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfirmedPayments() {
  try {
    const payments = await prisma.competitionPayment.findMany({
      where: {
        status: 'COMPLETED'
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
    console.log('✅ COMPLETED PAYMENTS ANALYSIS');
    console.log('='.repeat(80));
    console.log(`Total Completed Payments: ${payments.length}\n`);
    
    payments.forEach((p, idx) => {
      console.log(`${idx + 1}. User: ${p.user?.name || 'N/A'}`);
      console.log(`   Email: ${p.user?.email || 'N/A'}`);
      console.log(`   Amount: ${p.amount} ${p.currency || 'LKR'}`);
      console.log(`   Merchant ID: ${p.merchantId || 'NULL/MISSING'}`);
      console.log(`   Order ID: ${p.orderId}`);
      console.log(`   Payment ID: ${p.paymentId || 'N/A'}`);
      console.log(`   Method: ${p.paymentMethod}`);
      console.log(`   Competition: ${p.competition?.title || 'N/A'}`);
      console.log(`   Date: ${p.createdAt.toLocaleString()}`);
      console.log('-'.repeat(80));
    });
    
    // Check merchant IDs
    const merchantCounts = {};
    payments.forEach(p => {
      const mid = p.merchantId || 'NULL';
      merchantCounts[mid] = (merchantCounts[mid] || 0) + 1;
    });
    
    console.log('\n📊 MERCHANT ID BREAKDOWN:');
    Object.entries(merchantCounts).forEach(([mid, count]) => {
      console.log(`  ${mid}: ${count} payments`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfirmedPayments();
