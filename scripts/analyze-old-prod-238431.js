const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeMerchant238431() {
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
        },
        registrations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('='.repeat(80));
    console.log('📦 OLD PRODUCTION MERCHANT: 238431');
    console.log('='.repeat(80));
    console.log(`\nTotal Payments: ${payments.length}`);
    console.log(`Total Amount: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR\n`);
    
    if (payments.length === 0) {
      console.log('❌ No payments found for merchant 238431\n');
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
    
    // Payment method breakdown
    const methodBreakdown = {};
    payments.forEach(p => {
      const method = p.paymentMethod || 'UNKNOWN';
      methodBreakdown[method] = (methodBreakdown[method] || 0) + 1;
    });
    
    console.log('\n' + '-'.repeat(80));
    console.log('PAYMENT METHODS:');
    console.log('-'.repeat(80));
    Object.entries(methodBreakdown).forEach(([method, count]) => {
      const total = payments.filter(p => (p.paymentMethod || 'UNKNOWN') === method).reduce((sum, p) => sum + p.amount, 0);
      console.log(`  ${method}: ${count} payments (${total.toLocaleString()} LKR)`);
    });
    
    // Revenue calculation
    const completedPayments = payments.filter(p => p.status === 'COMPLETED');
    const completedRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status === 'PENDING');
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    console.log('\n' + '-'.repeat(80));
    console.log('REVENUE:');
    console.log('-'.repeat(80));
    console.log(`  Completed: ${completedRevenue.toLocaleString()} LKR (${completedPayments.length} payments)`);
    console.log(`  Pending: ${pendingRevenue.toLocaleString()} LKR (${pendingPayments.length} payments)`);
    
    // Total registrations
    const totalRegistrations = payments.reduce((sum, p) => sum + p.registrations.length, 0);
    console.log(`\nTotal Registrations Created: ${totalRegistrations}`);
    
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
      console.log(`   Created: ${p.createdAt.toLocaleString()}`);
      console.log(`   Payment ID: ${p.paymentId || 'N/A'}`);
      console.log(`   Registrations: ${p.registrations.length}`);
      if (p.completedAt) {
        console.log(`   Completed: ${p.completedAt.toLocaleString()}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY - MERCHANT 238431');
    console.log('='.repeat(80));
    console.log(`Total Payments: ${payments.length}`);
    console.log(`Completed Revenue: ${completedRevenue.toLocaleString()} LKR`);
    console.log(`Pending Amount: ${pendingRevenue.toLocaleString()} LKR`);
    console.log(`Total Registrations: ${totalRegistrations}`);
    console.log(`Unique Users: ${uniqueUsers.size}`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeMerchant238431();
