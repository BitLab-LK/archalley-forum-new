import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateActiveCarts() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 FIXING DUPLICATE ACTIVE CARTS');
    console.log('='.repeat(80));

    // Find all users with multiple ACTIVE carts
    const usersWithMultipleCarts = await prisma.registrationCart.groupBy({
      by: ['userId'],
      where: {
        status: 'ACTIVE',
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    console.log(`\nFound ${usersWithMultipleCarts.length} user(s) with multiple ACTIVE carts\n`);

    if (usersWithMultipleCarts.length === 0) {
      console.log('✅ No duplicate active carts found!');
      return;
    }

    for (const userGroup of usersWithMultipleCarts) {
      const userCarts = await prisma.registrationCart.findMany({
        where: {
          userId: userGroup.userId,
          status: 'ACTIVE',
        },
        include: {
          user: { select: { email: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' }, // Newest first
      });

      console.log('─'.repeat(80));
      console.log(`\n👤 User: ${userCarts[0].user.name} (${userCarts[0].user.email})`);
      console.log(`   Has ${userCarts.length} ACTIVE carts:\n`);

      userCarts.forEach((cart, idx) => {
        console.log(`   ${idx + 1}. Cart ${cart.id.slice(0, 12)}...`);
        console.log(`      Items: ${cart.items.length}`);
        console.log(`      Created: ${cart.createdAt.toISOString()}`);
      });

      // Keep the NEWEST cart (most recently created)
      const cartToKeep = userCarts[0];
      const cartsToRemove = userCarts.slice(1);

      console.log(`\n   ✅ Keeping: Cart ${cartToKeep.id.slice(0, 12)}... (${cartToKeep.items.length} items)`);
      
      // Mark old carts as ABANDONED
      for (const oldCart of cartsToRemove) {
        if (oldCart.items.length > 0) {
          console.log(`   ⚠️  Marking as ABANDONED: Cart ${oldCart.id.slice(0, 12)}... (${oldCart.items.length} items)`);
          await prisma.registrationCart.update({
            where: { id: oldCart.id },
            data: { status: 'ABANDONED' },
          });
        } else {
          console.log(`   🗑️  Marking as ABANDONED: Cart ${oldCart.id.slice(0, 12)}... (empty)`);
          await prisma.registrationCart.update({
            where: { id: oldCart.id },
            data: { status: 'ABANDONED' },
          });
        }
      }

      console.log(`   ✅ Fixed! User now has 1 ACTIVE cart with ${cartToKeep.items.length} items\n`);
    }

    console.log('='.repeat(80));
    console.log('✅ All duplicate carts have been fixed!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateActiveCarts();
