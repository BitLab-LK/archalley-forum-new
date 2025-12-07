/**
 * ANALYZE REGISTRATION CART TABLE
 * Check expired carts, user details, and identify test data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeRegistrationCarts() {
  console.log('\n' + '='.repeat(80));
  console.log('🛒 ANALYZING REGISTRATION CART TABLE');
  console.log('='.repeat(80));

  try {
    // Get all carts with user information
    const allCarts = await prisma.registrationCart.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Total Carts: ${allCarts.length}`);

    // Group by status
    const statusGroups = {
      ACTIVE: [],
      COMPLETED: [],
      EXPIRED: [],
      CANCELLED: []
    };

    allCarts.forEach(cart => {
      if (statusGroups[cart.status]) {
        statusGroups[cart.status].push(cart);
      } else {
        statusGroups[cart.status] = [cart];
      }
    });

    console.log('\n📈 Status Breakdown:');
    Object.keys(statusGroups).forEach(status => {
      const count = statusGroups[status]?.length || 0;
      const icon = status === 'COMPLETED' ? '✅' : status === 'ACTIVE' ? '🟢' : status === 'EXPIRED' ? '⏰' : '❌';
      console.log(`   ${icon} ${status}: ${count}`);
    });

    // Analyze EXPIRED carts
    if (statusGroups.EXPIRED && statusGroups.EXPIRED.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('⏰ EXPIRED CARTS DETAILS');
      console.log('='.repeat(80));

      statusGroups.EXPIRED.forEach((cart, index) => {
        console.log(`\n${index + 1}. Cart ID: ${cart.id}`);
        console.log(`   User: ${cart.user?.name || 'N/A'} (${cart.user?.email || 'N/A'})`);
        console.log(`   Created: ${new Date(cart.createdAt).toLocaleString()}`);
        console.log(`   Expired: ${cart.expiresAt ? new Date(cart.expiresAt).toLocaleString() : 'N/A'}`);
        console.log(`   Items: ${cart.items?.length || 0}`);
      });
    }

    // Analyze ACTIVE carts
    if (statusGroups.ACTIVE && statusGroups.ACTIVE.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('🟢 ACTIVE CARTS DETAILS');
      console.log('='.repeat(80));

      statusGroups.ACTIVE.forEach((cart, index) => {
        const now = new Date();
        const expiresAt = cart.expiresAt ? new Date(cart.expiresAt) : null;
        const isExpiringSoon = expiresAt && (expiresAt - now) < 3600000; // Less than 1 hour
        
        console.log(`\n${index + 1}. Cart ID: ${cart.id}`);
        console.log(`   User: ${cart.user?.name || 'N/A'} (${cart.user?.email || 'N/A'})`);
        console.log(`   Created: ${new Date(cart.createdAt).toLocaleString()}`);
        console.log(`   Expires: ${expiresAt ? expiresAt.toLocaleString() : 'N/A'} ${isExpiringSoon ? '⚠️ EXPIRING SOON' : ''}`);
        console.log(`   Items: ${cart.items?.length || 0}`);
      });
    }

    // Check for test users (common test email patterns)
    console.log('\n' + '='.repeat(80));
    console.log('🧪 CHECKING FOR TEST USER CARTS');
    console.log('='.repeat(80));

    const testPatterns = [
      'test',
      'demo',
      'sample',
      'example',
      'fake',
      'dummy',
      'temp',
      'trial',
      'sandbox',
      'dev',
      'debug'
    ];

    const testUserCarts = allCarts.filter(cart => {
      if (!cart.user?.email) return false;
      const email = cart.user.email.toLowerCase();
      return testPatterns.some(pattern => email.includes(pattern));
    });

    if (testUserCarts.length > 0) {
      console.log(`\n⚠️  Found ${testUserCarts.length} carts from potential test users:`);
      
      testUserCarts.forEach((cart, index) => {
        console.log(`\n${index + 1}. Cart ID: ${cart.id}`);
        console.log(`   User: ${cart.user?.name || 'N/A'} (${cart.user?.email})`);
        console.log(`   Status: ${cart.status}`);
        console.log(`   Created: ${new Date(cart.createdAt).toLocaleString()}`);
        console.log(`   Items: ${cart.items?.length || 0}`);
      });
    } else {
      console.log('\n✅ No obvious test user carts found');
    }

    // User frequency analysis
    console.log('\n' + '='.repeat(80));
    console.log('👥 USER CART FREQUENCY');
    console.log('='.repeat(80));

    const userCartCount = {};
    allCarts.forEach(cart => {
      if (cart.user?.email) {
        userCartCount[cart.user.email] = (userCartCount[cart.user.email] || 0) + 1;
      }
    });

    // Show users with multiple carts
    const multiCartUsers = Object.entries(userCartCount)
      .filter(([email, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    if (multiCartUsers.length > 0) {
      console.log(`\n📊 Users with multiple carts:`);
      multiCartUsers.slice(0, 10).forEach(([email, count]) => {
        const userCarts = allCarts.filter(c => c.user?.email === email);
        const statuses = userCarts.map(c => c.status).join(', ');
        console.log(`   • ${email}: ${count} carts (${statuses})`);
      });
    }

    // Summary and recommendations
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(80));

    const expiredCount = statusGroups.EXPIRED?.length || 0;
    const activeCount = statusGroups.ACTIVE?.length || 0;
    const completedCount = statusGroups.COMPLETED?.length || 0;

    console.log(`\nCart Health:`);
    console.log(`  ✅ COMPLETED: ${completedCount} (Good - processed successfully)`);
    console.log(`  🟢 ACTIVE: ${activeCount} (Normal - users shopping)`);
    console.log(`  ⏰ EXPIRED: ${expiredCount} (Can be cleaned up)`);

    if (expiredCount > 0) {
      console.log(`\n🧹 Cleanup Suggestion:`);
      console.log(`  - ${expiredCount} expired carts can be safely deleted`);
      console.log(`  - Run: node scripts/cleanup-expired-carts.js`);
    }

    if (testUserCarts.length > 0) {
      console.log(`\n🧪 Test Data Cleanup:`);
      console.log(`  - ${testUserCarts.length} potential test user carts found`);
      console.log(`  - Review and delete if confirmed as test data`);
    }

    // Cart IDs for potential cleanup
    const expiredIds = statusGroups.EXPIRED?.map(c => c.id) || [];
    const testIds = testUserCarts.map(c => c.id);

    if (expiredIds.length > 0 || testIds.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('📝 CART IDs FOR CLEANUP');
      console.log('='.repeat(80));
      
      if (expiredIds.length > 0) {
        console.log(`\nExpired Cart IDs (${expiredIds.length}):`);
        console.log(expiredIds.slice(0, 5).join('\n'));
        if (expiredIds.length > 5) {
          console.log(`... and ${expiredIds.length - 5} more`);
        }
      }

      if (testIds.length > 0) {
        console.log(`\nTest User Cart IDs (${testIds.length}):`);
        console.log(testIds.slice(0, 5).join('\n'));
        if (testIds.length > 5) {
          console.log(`... and ${testIds.length - 5} more`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRegistrationCarts();
