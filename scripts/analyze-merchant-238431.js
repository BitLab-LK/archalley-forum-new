const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzePaymentsByMerchant238431() {
  try {
    const payments = await prisma.competitionPayment.findMany({
      where: {
        merchantId: '238431'
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
    console.log('💳 MERCHANT ID: 238431 (OLD PRODUCTION) - USER DETAILS');
    console.log('='.repeat(80));
    console.log(`\nTotal Payments: ${payments.length}`);
    console.log(`Total Amount: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR\n`);
    
    payments.forEach((payment, idx) => {
      console.log(`${idx + 1}. Order ID: ${payment.orderId}`);
      console.log(`   User: ${payment.user?.name || 'N/A'}`);
      console.log(`   Email: ${payment.user?.email || 'N/A'}`);
      console.log(`   Amount: ${payment.amount} ${payment.currency}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Payment Method: ${payment.paymentMethod || 'N/A'}`);
      console.log(`   Competition: ${payment.competition?.title || 'N/A'}`);
      console.log(`   Date: ${payment.createdAt.toLocaleString()}`);
      console.log(`   Payment ID: ${payment.paymentId || 'N/A'}`);
      if (payment.completedAt) {
        console.log(`   Completed: ${payment.completedAt.toLocaleString()}`);
      }
      console.log('-'.repeat(80));
    });
    
    // Unique users
    const uniqueUsers = new Set();
    payments.forEach(p => {
      if (p.user?.email) {
        uniqueUsers.add(p.user.email);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Unique Users: ${uniqueUsers.size}`);
    console.log(`Total Payments: ${payments.length}`);
    console.log(`Total Revenue: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR`);
    
    // Status breakdown
    const statusBreakdown = {};
    payments.forEach(p => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    });
    console.log('\nStatus Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      const total = payments.filter(p => p.status === status).reduce((sum, p) => sum + p.amount, 0);
      console.log(`  ${status}: ${count} payments (${total.toLocaleString()} LKR)`);
    });
    
    console.log('\nUnique Users:');
    uniqueUsers.forEach(email => {
      const userPayments = payments.filter(p => p.user?.email === email);
      const userName = userPayments[0]?.user?.name || 'Unknown';
      const userTotal = userPayments.reduce((sum, p) => sum + p.amount, 0);
      const completed = userPayments.filter(p => p.status === 'COMPLETED').length;
      const pending = userPayments.filter(p => p.status === 'PENDING').length;
      console.log(`  - ${userName} (${email}): ${userPayments.length} payments (${completed} completed, ${pending} pending), ${userTotal.toLocaleString()} LKR`);
    });
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzePaymentsByMerchant238431();
