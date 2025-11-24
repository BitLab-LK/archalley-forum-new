const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeExpiredCarts() {
  try {
    const now = new Date();
    
    console.log('='.repeat(80));
    console.log('🕐 EXPIRED CARTS ANALYSIS');
    console.log('='.repeat(80));
    console.log(`\nCurrent Date: ${now.toLocaleString()}\n`);
    
    // First check ACTIVE expired carts
    const expiredActiveCarts = await prisma.registrationCart.findMany({
      where: {
        expiresAt: { lt: now },
        status: 'ACTIVE'
      },
      include: {
        items: true
      },
      orderBy: {
        expiresAt: 'desc'
      }
    });
    
    console.log(`Total Expired Carts (ACTIVE status): ${expiredActiveCarts.length}\n`);
    
    if (expiredActiveCarts.length > 0) {
      console.log('='.repeat(80));
      console.log('📋 EXPIRED ACTIVE CART DETAILS');
      console.log('='.repeat(80));
      
      const userMap = new Map();
      
      expiredActiveCarts.forEach(cart => {
        const key = `${cart.userEmail}|${cart.userName}`;
        if (!userMap.has(key)) {
          userMap.set(key, {
            email: cart.userEmail,
            name: cart.userName,
            carts: []
          });
        }
        
        userMap.get(key).carts.push({
          id: cart.id,
          itemCount: cart.items.length,
          expiresAt: cart.expiresAt,
          createdAt: cart.createdAt,
          daysSinceExpired: Math.floor((now - cart.expiresAt) / (1000 * 60 * 60 * 24))
        });
      });
      
      userMap.forEach((userData) => {
        console.log(`\n👤 User: ${userData.name}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Expired Carts: ${userData.carts.length}`);
        console.log(`   Total Items: ${userData.carts.reduce((sum, c) => sum + c.itemCount, 0)}`);
        
        userData.carts.forEach((cart, idx) => {
          console.log(`\n   Cart ${idx + 1}:`);
          console.log(`     ID: ${cart.id}`);
          console.log(`     Items: ${cart.itemCount}`);
          console.log(`     Created: ${cart.createdAt.toLocaleString()}`);
          console.log(`     Expired: ${cart.expiresAt.toLocaleString()}`);
          console.log(`     Days Expired: ${cart.daysSinceExpired} days ago`);
        });
        console.log('');
      });
      
      console.log('='.repeat(80));
      console.log('📊 ACTIVE EXPIRED SUMMARY');
      console.log('='.repeat(80));
      console.log(`Total Users with Expired ACTIVE Carts: ${userMap.size}`);
      console.log(`Total Expired ACTIVE Carts: ${expiredActiveCarts.length}`);
      console.log(`Total Items in Expired ACTIVE Carts: ${expiredActiveCarts.reduce((sum, c) => sum + c.items.length, 0)}`);
    } else {
      console.log('✅ No expired ACTIVE carts found!');
    }
    
    // Check all expired carts regardless of status
    console.log('\n' + '='.repeat(80));
    console.log('📊 ALL EXPIRED CARTS (ALL STATUSES)');
    console.log('='.repeat(80));
    
    const allExpiredCarts = await prisma.registrationCart.findMany({
      where: {
        expiresAt: { lt: now }
      },
      include: {
        items: true
      },
      orderBy: {
        status: 'asc'
      }
    });
    
    console.log(`\nTotal Expired Carts (All Statuses): ${allExpiredCarts.length}`);
    
    const byStatus = {};
    const usersByStatus = {};
    
    allExpiredCarts.forEach(cart => {
      byStatus[cart.status] = (byStatus[cart.status] || 0) + 1;
      
      if (!usersByStatus[cart.status]) {
        usersByStatus[cart.status] = new Set();
      }
      usersByStatus[cart.status].add(cart.userEmail);
    });
    
    console.log('\nBreakdown by Status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} carts (${usersByStatus[status].size} unique users)`);
    });
    
    // Show users with expired carts by status
    console.log('\n' + '='.repeat(80));
    console.log('👥 USERS WITH EXPIRED CARTS BY STATUS');
    console.log('='.repeat(80));
    
    for (const [status, userEmails] of Object.entries(usersByStatus)) {
      console.log(`\n${status} (${userEmails.size} users):`);
      const userArray = Array.from(userEmails);
      userArray.forEach(email => {
        const userCarts = allExpiredCarts.filter(c => c.userEmail === email && c.status === status);
        const userName = userCarts[0]?.userName || 'Unknown';
        const totalItems = userCarts.reduce((sum, c) => sum + c.items.length, 0);
        console.log(`  - ${userName} (${email})`);
        console.log(`    Carts: ${userCarts.length}, Items: ${totalItems}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('Error analyzing expired carts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeExpiredCarts();
