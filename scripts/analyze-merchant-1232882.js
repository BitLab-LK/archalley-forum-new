const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeMerchant1232882() {
  try {
    const payments = await prisma.competitionPayment.findMany({
      where: {
        merchantId: '1232882'
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
        },
        registrations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('='.repeat(80));
    console.log('🧪 MERCHANT ID: 1232882 (SANDBOX) - USER DETAILS');
    console.log('='.repeat(80));
    console.log(`\nTotal Payments: ${payments.length}`);
    console.log(`Total Amount: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR\n`);
    
    if (payments.length === 0) {
      console.log('❌ No payments found for merchant 1232882\n');
      return;
    }
    
    // Status breakdown
    const statusBreakdown = {};
    payments.forEach(p => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    });
    
    console.log('Status Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      const total = payments.filter(p => p.status === status).reduce((sum, p) => sum + p.amount, 0);
      console.log(`  ${status}: ${count} payments (${total.toLocaleString()} LKR)`);
    });
    
    // Unique users
    const uniqueUsers = new Set();
    payments.forEach(p => {
      if (p.user?.email) {
        uniqueUsers.add(p.user.email);
      }
    });
    
    console.log(`\nUnique Users: ${uniqueUsers.size}`);
    
    // User details
    console.log('\n' + '-'.repeat(80));
    console.log('USER BREAKDOWN:');
    console.log('-'.repeat(80));
    uniqueUsers.forEach(email => {
      const userPayments = payments.filter(p => p.user?.email === email);
      const userName = userPayments[0]?.user?.name || 'Unknown';
      const userTotal = userPayments.reduce((sum, p) => sum + p.amount, 0);
      const completed = userPayments.filter(p => p.status === 'COMPLETED').length;
      const pending = userPayments.filter(p => p.status === 'PENDING').length;
      console.log(`\n${userName} (${email})`);
      console.log(`  Payments: ${userPayments.length} (${completed} completed, ${pending} pending)`);
      console.log(`  Total: ${userTotal.toLocaleString()} LKR`);
    });
    
    // Show all payment details
    console.log('\n' + '-'.repeat(80));
    console.log('PAYMENT DETAILS:');
    console.log('-'.repeat(80));
    
    payments.forEach((p, i) => {
      console.log(`\n${i + 1}. Order: ${p.orderId}`);
      console.log(`   User: ${p.user?.name || 'N/A'} (${p.user?.email || 'N/A'})`);
      console.log(`   Amount: ${p.amount} ${p.currency}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Payment Method: ${p.paymentMethod || 'N/A'}`);
      console.log(`   Competition: ${p.competition?.title || 'N/A'}`);
      console.log(`   Date: ${p.createdAt.toLocaleString()}`);
      console.log(`   Payment ID: ${p.paymentId || 'N/A'}`);
      console.log(`   Registrations: ${p.registrations.length}`);
      if (p.completedAt) {
        console.log(`   Completed: ${p.completedAt.toLocaleString()}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Payments: ${payments.length}`);
    console.log(`Total Revenue: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR`);
    console.log(`Total Registrations: ${payments.reduce((sum, p) => sum + p.registrations.length, 0)}`);
    console.log(`Unique Users: ${uniqueUsers.size}`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeMerchant1232882();
