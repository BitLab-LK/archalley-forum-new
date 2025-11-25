const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeSandboxMerchants() {
  try {
    const merchants = ['1224208', '1221149'];
    
    console.log('='.repeat(80));
    console.log('🔍 ANALYZING SANDBOX MERCHANT IDs: 1224208, 1221149');
    console.log('='.repeat(80));
    
    for (const merchantId of merchants) {
      const payments = await prisma.competitionPayment.findMany({
        where: { merchantId },
        include: {
          user: {
            select: { name: true, email: true }
          },
          competition: {
            select: { title: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`💳 MERCHANT ID: ${merchantId}`);
      console.log('='.repeat(80));
      console.log(`Total Payments: ${payments.length}`);
      console.log(`Total Amount: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR\n`);
      
      if (payments.length === 0) {
        console.log('❌ No payments found for this merchant ID\n');
        continue;
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
        if (p.user?.email) uniqueUsers.add(p.user.email);
      });
      
      console.log(`\nUnique Users: ${uniqueUsers.size}`);
      
      // User details
      console.log('\nUser Breakdown:');
      uniqueUsers.forEach(email => {
        const userPayments = payments.filter(p => p.user?.email === email);
        const userName = userPayments[0]?.user?.name || 'Unknown';
        const userTotal = userPayments.reduce((sum, p) => sum + p.amount, 0);
        const completed = userPayments.filter(p => p.status === 'COMPLETED').length;
        const pending = userPayments.filter(p => p.status === 'PENDING').length;
        console.log(`  - ${userName} (${email})`);
        console.log(`    Payments: ${userPayments.length} (${completed} completed, ${pending} pending)`);
        console.log(`    Total: ${userTotal.toLocaleString()} LKR`);
      });
      
      // Show first 5 payment details
      console.log(`\nRecent Payments (showing first 5):`);
      payments.slice(0, 5).forEach((p, i) => {
        console.log(`\n  ${i + 1}. ${p.user?.name || 'N/A'} (${p.user?.email || 'N/A'})`);
        console.log(`     Order: ${p.orderId}`);
        console.log(`     Amount: ${p.amount} ${p.currency}`);
        console.log(`     Status: ${p.status}`);
        console.log(`     Date: ${p.createdAt.toLocaleString()}`);
        console.log(`     Payment ID: ${p.paymentId || 'N/A'}`);
      });
      
      if (payments.length > 5) {
        console.log(`\n  ... and ${payments.length - 5} more payments`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 OVERALL SUMMARY');
    console.log('='.repeat(80));
    
    const allPayments = await prisma.competitionPayment.findMany({
      where: {
        merchantId: { in: merchants }
      }
    });
    
    console.log(`Total Payments Across Both Merchants: ${allPayments.length}`);
    console.log(`Total Amount: ${allPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR`);
    
    const totalByMerchant = {};
    merchants.forEach(mid => {
      const count = allPayments.filter(p => p.merchantId === mid).length;
      totalByMerchant[mid] = count;
    });
    
    console.log('\nBreakdown:');
    Object.entries(totalByMerchant).forEach(([mid, count]) => {
      console.log(`  Merchant ${mid}: ${count} payments`);
    });
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSandboxMerchants();
