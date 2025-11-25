const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeProductionMerchants() {
  try {
    // Merchant 238431 - Old Production
    const merchant238431 = await prisma.competitionPayment.findMany({
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
    
    // Merchant 250114 - New Production
    const merchant250114 = await prisma.competitionPayment.findMany({
      where: {
        merchantId: '250114'
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
    console.log('🏢 PRODUCTION MERCHANTS COMPARISON');
    console.log('='.repeat(80));
    
    // Function to display merchant data
    function displayMerchantData(merchantId, payments, label) {
      console.log('\n' + '━'.repeat(80));
      console.log(`${label}: ${merchantId}`);
      console.log('━'.repeat(80));
      console.log(`\nTotal Payments: ${payments.length}`);
      console.log(`Total Amount: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR\n`);
      
      if (payments.length === 0) {
        console.log('❌ No payments found\n');
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
      
      // User breakdown
      console.log('\nUser Breakdown:');
      uniqueUsers.forEach(email => {
        const userPayments = payments.filter(p => p.user?.email === email);
        const userName = userPayments[0]?.user?.name || 'Unknown';
        const userTotal = userPayments.reduce((sum, p) => sum + p.amount, 0);
        const completed = userPayments.filter(p => p.status === 'COMPLETED').length;
        const pending = userPayments.filter(p => p.status === 'PENDING').length;
        console.log(`  ${userName} (${email})`);
        console.log(`    Payments: ${userPayments.length} (${completed} completed, ${pending} pending) - ${userTotal.toLocaleString()} LKR`);
      });
      
      // Payment method breakdown
      const methodBreakdown = {};
      payments.forEach(p => {
        const method = p.paymentMethod || 'UNKNOWN';
        methodBreakdown[method] = (methodBreakdown[method] || 0) + 1;
      });
      
      console.log('\nPayment Methods:');
      Object.entries(methodBreakdown).forEach(([method, count]) => {
        const total = payments.filter(p => (p.paymentMethod || 'UNKNOWN') === method).reduce((sum, p) => sum + p.amount, 0);
        console.log(`  ${method}: ${count} payments (${total.toLocaleString()} LKR)`);
      });
      
      // Revenue calculation
      const completedPayments = payments.filter(p => p.status === 'COMPLETED');
      const completedRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingPayments = payments.filter(p => p.status === 'PENDING');
      const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
      
      console.log('\nRevenue:');
      console.log(`  Completed: ${completedRevenue.toLocaleString()} LKR (${completedPayments.length} payments)`);
      console.log(`  Pending: ${pendingRevenue.toLocaleString()} LKR (${pendingPayments.length} payments)`);
      
      // Total registrations
      const totalRegistrations = payments.reduce((sum, p) => sum + p.registrations.length, 0);
      console.log(`\nTotal Registrations: ${totalRegistrations}`);
      
      // Payment details
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
    }
    
    // Display both merchants
    displayMerchantData('238431', merchant238431, '📦 OLD PRODUCTION');
    displayMerchantData('250114', merchant250114, '🆕 NEW PRODUCTION');
    
    // Summary comparison
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY COMPARISON');
    console.log('='.repeat(80));
    
    const old238431Revenue = merchant238431.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
    const new250114Revenue = merchant250114.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
    
    console.log('\nMerchant 238431 (Old Production):');
    console.log(`  Total Payments: ${merchant238431.length}`);
    console.log(`  Completed Revenue: ${old238431Revenue.toLocaleString()} LKR`);
    console.log(`  Registrations: ${merchant238431.reduce((sum, p) => sum + p.registrations.length, 0)}`);
    
    console.log('\nMerchant 250114 (New Production):');
    console.log(`  Total Payments: ${merchant250114.length}`);
    console.log(`  Completed Revenue: ${new250114Revenue.toLocaleString()} LKR`);
    console.log(`  Registrations: ${merchant250114.reduce((sum, p) => sum + p.registrations.length, 0)}`);
    
    console.log('\nCombined Production Total:');
    console.log(`  Total Payments: ${merchant238431.length + merchant250114.length}`);
    console.log(`  Completed Revenue: ${(old238431Revenue + new250114Revenue).toLocaleString()} LKR`);
    console.log(`  Total Registrations: ${merchant238431.reduce((sum, p) => sum + p.registrations.length, 0) + merchant250114.reduce((sum, p) => sum + p.registrations.length, 0)}`);
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeProductionMerchants();
