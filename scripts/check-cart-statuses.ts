import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCartStatuses() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🛒 CHECKING CART STATUS UPDATE FLOW');
    console.log('='.repeat(80));

    // Get all carts grouped by status
    const allCarts = await prisma.registrationCart.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        },
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Last 50 carts
    });

    console.log(`\nTotal carts (last 50): ${allCarts.length}\n`);

    // Group by status
    const byStatus: Record<string, typeof allCarts> = {
      ACTIVE: [],
      COMPLETED: [],
      EXPIRED: [],
      ABANDONED: [],
    };

    allCarts.forEach(cart => {
      if (byStatus[cart.status]) {
        byStatus[cart.status].push(cart);
      }
    });

    console.log('📊 CART STATUS BREAKDOWN:');
    console.log('─'.repeat(80));
    Object.entries(byStatus).forEach(([status, carts]) => {
      console.log(`\n${status}: ${carts.length} carts`);
      
      if (carts.length > 0) {
        carts.slice(0, 5).forEach(cart => {
          console.log(`  • Cart ${cart.id.slice(0, 8)}... - ${cart.user.email}`);
          console.log(`    Items: ${cart.items.length} | Created: ${cart.createdAt.toISOString()}`);
          console.log(`    Expires: ${cart.expiresAt.toISOString()}`);
        });
        if (carts.length > 5) {
          console.log(`  ... and ${carts.length - 5} more`);
        }
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔍 HOW CART STATUS IS UPDATED:');
    console.log('='.repeat(80));
    console.log(`
1️⃣  ACTIVE → COMPLETED (When payment succeeds):
   - PayHere Success: /api/competitions/payment/notify
     → Updates cart.status = 'COMPLETED'
   - Bank Transfer: /api/competitions/checkout
     → Updates cart.status = 'COMPLETED'
   - Payment Return Handler: /api/competitions/payment/return
     → Updates cart.status = 'COMPLETED' (fallback)

2️⃣  ACTIVE → EXPIRED (When cart expires):
   - Cart API: /api/competitions/cart
     → Checks isCartExpired(cart.expiresAt)
     → If expired: Updates cart.status = 'EXPIRED'
   - Checkout API: /api/competitions/checkout
     → Checks isCartExpired(cart.expiresAt)
     → If expired: Updates cart.status = 'EXPIRED'

3️⃣  ACTIVE cart query:
   - Cart API queries: WHERE status = 'ACTIVE'
   - If NO ACTIVE cart found → Creates new empty ACTIVE cart
   - If ACTIVE cart exists but expired → Marks as EXPIRED, creates new ACTIVE cart
   
📝 CURRENT ISSUE:
   - If cart expiry is DISABLED (CART_EXPIRY_DISABLED=true):
     → isCartExpired() always returns FALSE
     → Expired check never triggers
     → Multiple ACTIVE carts can exist per user
     → Query finds FIRST ACTIVE cart (might be old COMPLETED one!)
   
✅ SOLUTION:
   - Query should be: WHERE userId = X AND status = 'ACTIVE'
   - COMPLETED carts should NEVER have status 'ACTIVE'
   - The current code is CORRECT if cart status updates work properly
   - Problem: Need to verify cart.status is actually being updated to COMPLETED
`);

    console.log('\n' + '='.repeat(80));
    console.log('🔎 CHECKING FOR POTENTIAL ISSUES:');
    console.log('='.repeat(80));

    // Check if any user has multiple ACTIVE carts
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

    if (usersWithMultipleCarts.length > 0) {
      console.log(`\n⚠️  WARNING: ${usersWithMultipleCarts.length} user(s) have multiple ACTIVE carts!`);
      for (const userGroup of usersWithMultipleCarts) {
        const userCarts = await prisma.registrationCart.findMany({
          where: {
            userId: userGroup.userId,
            status: 'ACTIVE',
          },
          include: {
            user: { select: { email: true } },
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        
        console.log(`\n  User: ${userCarts[0].user.email} (${userCarts.length} ACTIVE carts)`);
        userCarts.forEach((cart, idx) => {
          console.log(`    ${idx + 1}. Cart ${cart.id.slice(0, 8)}... - ${cart.items.length} items - Created: ${cart.createdAt.toISOString()}`);
        });
      }
    } else {
      console.log('\n✅ No users with multiple ACTIVE carts (good!)');
    }

    // Check environment variable
    console.log('\n' + '─'.repeat(80));
    console.log('⚙️  ENVIRONMENT CONFIGURATION:');
    console.log(`CART_EXPIRY_DISABLED: ${process.env.CART_EXPIRY_DISABLED || 'not set (default: false)'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCartStatuses();
