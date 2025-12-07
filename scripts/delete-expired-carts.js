const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function deleteExpiredCarts() {
  try {
    const now = new Date();
    
    console.log('='.repeat(80));
    console.log('🗑️  DELETE EXPIRED CARTS');
    console.log('='.repeat(80));
    console.log(`\nCurrent Date: ${now.toLocaleString()}\n`);
    
    // Find all expired carts
    const expiredCarts = await prisma.registrationCart.findMany({
      where: {
        expiresAt: { lt: now }
      },
      include: {
        items: true
      }
    });
    
    console.log(`Found ${expiredCarts.length} expired carts to delete\n`);
    
    if (expiredCarts.length === 0) {
      console.log('✅ No expired carts found!');
      return;
    }
    
    // Show details
    const byStatus = {};
    expiredCarts.forEach(cart => {
      byStatus[cart.status] = (byStatus[cart.status] || 0) + 1;
    });
    
    console.log('Breakdown by Status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} carts`);
    });
    
    const totalItems = expiredCarts.reduce((sum, c) => sum + c.items.length, 0);
    console.log(`\nTotal Items to Delete: ${totalItems}`);
    
    // Create backup
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `expired-carts-backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(expiredCarts, null, 2));
    console.log(`\n💾 Backup created: ${backupFile}`);
    
    // Delete in transaction
    console.log('\n🗑️  Deleting expired carts...\n');
    
    const result = await prisma.$transaction(async (tx) => {
      // Delete all cart items first
      const deletedItems = await tx.registrationCartItem.deleteMany({
        where: {
          cartId: {
            in: expiredCarts.map(c => c.id)
          }
        }
      });
      
      // Delete all carts
      const deletedCarts = await tx.registrationCart.deleteMany({
        where: {
          id: {
            in: expiredCarts.map(c => c.id)
          }
        }
      });
      
      return { deletedItems, deletedCarts };
    });
    
    console.log('='.repeat(80));
    console.log('✅ DELETION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Deleted Items: ${result.deletedItems.count}`);
    console.log(`Deleted Carts: ${result.deletedCarts.count}`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error deleting expired carts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteExpiredCarts();
