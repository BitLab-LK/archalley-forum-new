const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showCompletedCartUsers() {
  try {
    console.log('='.repeat(80));
    console.log('✅ COMPLETED CART USERS');
    console.log('='.repeat(80));
    
    const completedCarts = await prisma.registrationCart.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        items: {
          include: {
            competition: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\nTotal Completed Carts: ${completedCarts.length}\n`);
    
    if (completedCarts.length === 0) {
      console.log('No completed carts found.');
      return;
    }
    
    // Group by user
    const userMap = new Map();
    
    completedCarts.forEach(cart => {
      const key = cart.userEmail || 'Unknown';
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
        competitions: cart.items.map(item => item.competition?.title || 'Unknown'),
        createdAt: cart.createdAt,
        expiresAt: cart.expiresAt
      });
    });
    
    console.log('='.repeat(80));
    console.log(`📊 ${userMap.size} USERS WITH COMPLETED CARTS`);
    console.log('='.repeat(80));
    
    let userIndex = 1;
    userMap.forEach((userData, email) => {
      const totalItems = userData.carts.reduce((sum, c) => sum + c.itemCount, 0);
      const totalCompletedCarts = userData.carts.length;
      
      console.log(`\n${userIndex}. 👤 ${userData.name || 'Unknown Name'}`);
      console.log(`   Email: ${email}`);
      console.log(`   Completed Carts: ${totalCompletedCarts}`);
      console.log(`   Total Registrations: ${totalItems}`);
      
      // Show recent cart details
      console.log(`\n   Recent Carts:`);
      userData.carts.slice(0, 3).forEach((cart, idx) => {
        console.log(`     ${idx + 1}. Cart ID: ${cart.id}`);
        console.log(`        Items: ${cart.itemCount}`);
        console.log(`        Competitions: ${cart.competitions.join(', ')}`);
        console.log(`        Completed: ${cart.createdAt.toLocaleString()}`);
      });
      
      if (userData.carts.length > 3) {
        console.log(`     ... and ${userData.carts.length - 3} more carts`);
      }
      
      userIndex++;
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Users: ${userMap.size}`);
    console.log(`Total Completed Carts: ${completedCarts.length}`);
    console.log(`Total Registrations: ${completedCarts.reduce((sum, c) => sum + c.items.length, 0)}`);
    
    // Top users
    const sortedUsers = Array.from(userMap.entries())
      .sort((a, b) => b[1].carts.length - a[1].carts.length);
    
    console.log('\n🏆 Top 5 Users by Cart Count:');
    sortedUsers.slice(0, 5).forEach((entry, idx) => {
      const [email, userData] = entry;
      console.log(`  ${idx + 1}. ${userData.name} (${email}): ${userData.carts.length} carts`);
    });
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('Error analyzing completed carts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showCompletedCartUsers();
