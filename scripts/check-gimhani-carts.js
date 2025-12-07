const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGimhaniCarts() {
  try {
    const userEmail = 'gimhanijayasuriya109@gmail.com';
    
    // First find the user
    const user = await prisma.users.findFirst({
      where: {
        email: userEmail
      }
    });
    
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.id}\n`);
    
    // Now find their carts
    const carts = await prisma.registrationCart.findMany({
      where: {
        userId: user.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
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
    
    console.log('='.repeat(80));
    console.log('👤 GIMHANI JAYASURIYA - CART DATA');
    console.log('='.repeat(80));
    console.log(`Email: ${userEmail}`);
    console.log(`\nTotal Carts: ${carts.length}`);
    console.log(`Total Items: ${carts.reduce((sum, c) => sum + c.items.length, 0)}`);
    
    const byStatus = {};
    carts.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    });
    
    console.log(`\nBreakdown by Status:`);
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} carts`);
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('📋 CART DETAILS:');
    console.log('='.repeat(80));
    
    carts.forEach((cart, idx) => {
      console.log(`\n${idx + 1}. Cart ID: ${cart.id}`);
      console.log(`   Status: ${cart.status}`);
      console.log(`   User: ${cart.user.name} (${cart.user.email})`);
      console.log(`   Items: ${cart.items.length}`);
      console.log(`   Created: ${cart.createdAt.toLocaleString()}`);
      console.log(`   Expires: ${cart.expiresAt.toLocaleString()}`);
      
      if (cart.items.length > 0) {
        console.log(`   Competitions:`);
        cart.items.forEach((item, i) => {
          console.log(`     ${i + 1}. ${item.competition?.title || 'Unknown'}`);
        });
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGimhaniCarts();
