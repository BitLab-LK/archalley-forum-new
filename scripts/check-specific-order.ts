import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificOrder() {
  try {
    const orderId = 'ORDER-AC2025-00030-630815';
    
    console.log('\n' + '='.repeat(80));
    console.log(`🔍 CHECKING ORDER: ${orderId}`);
    console.log('='.repeat(80));

    // Find the payment
    const payment = await prisma.competitionPayment.findUnique({
      where: { orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
      },
    });

    if (!payment) {
      console.log('❌ Payment not found!');
      return;
    }

    console.log('\n📄 PAYMENT DETAILS:');
    console.log(`   Order ID: ${payment.orderId}`);
    console.log(`   User: ${payment.user.name} (${payment.user.email})`);
    console.log(`   User ID: ${payment.user.id}`);
    console.log(`   Payment Status: ${payment.status}`);
    console.log(`   Amount: LKR ${payment.amount}`);
    console.log(`   Payment Method: ${payment.paymentMethod}`);
    console.log(`   Created: ${payment.createdAt}`);
    console.log(`   Completed: ${payment.completedAt}`);

    // Check the metadata for cart info
    const metadata = payment.metadata as any;
    if (metadata?.cartId) {
      console.log(`\n🛒 CART METADATA:`);
      console.log(`   Cart ID: ${metadata.cartId}`);
      console.log(`   Item IDs: ${JSON.stringify(metadata.itemIds)}`);

      // Find the cart
      const cart = await prisma.registrationCart.findUnique({
        where: { id: metadata.cartId },
        include: {
          items: true,
        },
      });

      if (cart) {
        console.log(`\n📦 CART DETAILS (Cart ID: ${metadata.cartId}):`);
        console.log(`   Status: ${cart.status} ⚠️`);
        console.log(`   Items Count: ${cart.items.length}`);
        console.log(`   Created: ${cart.createdAt}`);
        console.log(`   Expires: ${cart.expiresAt}`);
        console.log(`   Updated: ${cart.updatedAt}`);
        
        if (cart.items.length > 0) {
          console.log(`\n   Cart Items:`);
          cart.items.forEach((item, idx) => {
            console.log(`   ${idx + 1}. Item ${item.id} - LKR ${item.subtotal}`);
          });
        }
      } else {
        console.log(`\n❌ Cart ${metadata.cartId} not found!`);
      }
    }

    // Check all carts for this user
    console.log(`\n🔍 ALL CARTS FOR USER: ${payment.user.email}`);
    console.log('─'.repeat(80));
    
    const userCarts = await prisma.registrationCart.findMany({
      where: {
        userId: payment.user.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`\nTotal carts: ${userCarts.length}\n`);
    
    userCarts.forEach((cart, idx) => {
      console.log(`${idx + 1}. Cart ${cart.id}`);
      console.log(`   Status: ${cart.status}`);
      console.log(`   Items: ${cart.items.length}`);
      console.log(`   Created: ${cart.createdAt.toISOString()}`);
      console.log(`   Expires: ${cart.expiresAt.toISOString()}`);
      console.log('');
    });

    // Show which cart would be returned by the API
    const activeCart = await prisma.registrationCart.findFirst({
      where: {
        userId: payment.user.id,
        status: 'ACTIVE',
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('='.repeat(80));
    console.log('🎯 CART API WOULD RETURN:');
    console.log('='.repeat(80));
    
    if (activeCart) {
      console.log(`\nCart ID: ${activeCart.id}`);
      console.log(`Status: ${activeCart.status}`);
      console.log(`Items Count: ${activeCart.items.length} ⚠️ THIS IS WHAT TOP BAR SHOWS`);
      console.log(`Created: ${activeCart.createdAt.toISOString()}`);
      
      if (activeCart.items.length > 0) {
        console.log(`\nItems in this cart:`);
        activeCart.items.forEach((item, idx) => {
          console.log(`  ${idx + 1}. ${item.id} - LKR ${item.subtotal}`);
        });
      }
    } else {
      console.log('\nNo ACTIVE cart found - would create new empty cart');
      console.log('Cart count would be: 0');
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 DIAGNOSIS:');
    console.log('='.repeat(80));
    
    if (metadata?.cartId) {
      const cart = await prisma.registrationCart.findUnique({
        where: { id: metadata.cartId },
      });
      
      if (cart?.status !== 'COMPLETED') {
        console.log(`\n❌ PROBLEM FOUND!`);
        console.log(`   Cart ${metadata.cartId} should be COMPLETED but is ${cart?.status}`);
        console.log(`   Payment is ${payment.status} but cart was not updated!`);
      } else {
        console.log(`\n✅ Payment cart is properly marked as COMPLETED`);
        
        if (activeCart && activeCart.id !== metadata.cartId) {
          console.log(`\n⚠️  BUT user has a DIFFERENT active cart with ${activeCart.items.length} items!`);
          console.log(`   This is why the cart icon shows ${activeCart.items.length}`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificOrder();
