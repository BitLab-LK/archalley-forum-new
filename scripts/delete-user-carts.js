/**
 * DELETE SPECIFIC USER CARTS
 * Removes all carts for specified test users
 * 
 * Target users:
 * - Gimhani Jayasuriya (gimhanijayasuriya109@gmail.com)
 * - Chavindu Nuwanpriya (chavindun@gmail.com)
 * - Neranjan Embogama (neranjan.dee@gmail.com)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const prisma = new PrismaClient();

const TARGET_USERS = [
  'gimhanijayasuriya109@gmail.com',
  'chavindun@gmail.com',
  'neranjan.dee@gmail.com'
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function analyzeUserCarts() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANALYZING TARGET USER CARTS');
  console.log('='.repeat(80));

  const userCarts = {};

  for (const email of TARGET_USERS) {
    const carts = await prisma.registrationCart.findMany({
      where: {
        user: {
          email: email
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    userCarts[email] = carts;
  }

  // Display findings
  let totalCarts = 0;
  let totalItems = 0;

  console.log('\n📊 CART BREAKDOWN BY USER:\n');

  TARGET_USERS.forEach(email => {
    const carts = userCarts[email] || [];
    const itemCount = carts.reduce((sum, cart) => sum + (cart.items?.length || 0), 0);
    totalCarts += carts.length;
    totalItems += itemCount;

    console.log(`👤 ${carts[0]?.user?.name || email}`);
    console.log(`   Email: ${email}`);
    console.log(`   Total Carts: ${carts.length}`);
    console.log(`   Total Items: ${itemCount}`);
    
    // Status breakdown
    const statuses = {};
    carts.forEach(cart => {
      statuses[cart.status] = (statuses[cart.status] || 0) + 1;
    });
    
    console.log(`   Status: ${Object.entries(statuses).map(([s, c]) => `${s}:${c}`).join(', ')}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log(`📊 TOTAL TO DELETE: ${totalCarts} carts, ${totalItems} cart items`);
  console.log('='.repeat(80));

  // Detailed cart list
  console.log('\n📋 DETAILED CART LIST:\n');

  TARGET_USERS.forEach(email => {
    const carts = userCarts[email] || [];
    
    if (carts.length > 0) {
      console.log(`\n${carts[0]?.user?.name || email} (${email}):`);
      
      carts.forEach((cart, index) => {
        console.log(`  ${index + 1}. ID: ${cart.id}`);
        console.log(`     Status: ${cart.status}`);
        console.log(`     Items: ${cart.items?.length || 0}`);
        console.log(`     Created: ${new Date(cart.createdAt).toLocaleString()}`);
      });
    }
  });

  return userCarts;
}

async function createBackup(userCarts) {
  console.log('\n' + '='.repeat(80));
  console.log('💾 CREATING BACKUP');
  console.log('='.repeat(80));

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `user-carts-backup-${timestamp}.json`);

  const backupData = {
    timestamp: new Date().toISOString(),
    users: TARGET_USERS,
    carts: userCarts
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

  const totalCarts = Object.values(userCarts).reduce((sum, carts) => sum + carts.length, 0);

  console.log(`\n✅ Backup created: ${backupFile}`);
  console.log(`   Total carts backed up: ${totalCarts}`);
  console.log(`   File size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

  return backupFile;
}

async function deleteCarts(userCarts) {
  console.log('\n' + '='.repeat(80));
  console.log('🗑️  DELETING CARTS');
  console.log('='.repeat(80));

  const allCartIds = [];
  Object.values(userCarts).forEach(carts => {
    carts.forEach(cart => allCartIds.push(cart.id));
  });

  console.log(`\nDeleting ${allCartIds.length} carts...`);

  // Delete in transaction
  const result = await prisma.$transaction(async (tx) => {
    // First delete cart items
    const deletedItems = await tx.registrationCartItem.deleteMany({
      where: {
        cartId: { in: allCartIds }
      }
    });

    // Then delete carts
    const deletedCarts = await tx.registrationCart.deleteMany({
      where: {
        id: { in: allCartIds }
      }
    });

    return {
      items: deletedItems.count,
      carts: deletedCarts.count
    };
  });

  console.log('\n✅ DELETION COMPLETE');
  console.log(`   Cart items deleted: ${result.items}`);
  console.log(`   Carts deleted: ${result.carts}`);

  return result;
}

async function verifyDeletion() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFYING DELETION');
  console.log('='.repeat(80));

  for (const email of TARGET_USERS) {
    const remaining = await prisma.registrationCart.count({
      where: {
        user: {
          email: email
        }
      }
    });

    const icon = remaining === 0 ? '✅' : '❌';
    console.log(`${icon} ${email}: ${remaining} carts remaining`);
  }

  // Overall stats
  const totalRemaining = await prisma.registrationCart.count();
  console.log(`\n📊 Total carts in database: ${totalRemaining}`);
}

async function main() {
  const args = process.argv.slice(2);
  const previewOnly = args.includes('--preview');

  console.log('\n' + '='.repeat(80));
  console.log('🗑️  DELETE SPECIFIC USER CARTS');
  console.log('='.repeat(80));
  console.log(`\nMode: ${previewOnly ? '👁️  PREVIEW ONLY' : '⚠️  DELETION MODE'}`);

  try {
    // Analyze
    const userCarts = await analyzeUserCarts();

    const totalCarts = Object.values(userCarts).reduce((sum, carts) => sum + carts.length, 0);

    if (totalCarts === 0) {
      console.log('\n✅ No carts found for these users!');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    if (previewOnly) {
      console.log('\n' + '='.repeat(80));
      console.log('👁️  PREVIEW MODE - No changes made');
      console.log('='.repeat(80));
      console.log(`\nTo delete, run: node scripts/delete-user-carts.js`);
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Confirm deletion
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  FINAL CONFIRMATION');
    console.log('='.repeat(80));
    console.log(`\nYou are about to DELETE all carts for:`);
    TARGET_USERS.forEach(email => {
      const count = userCarts[email]?.length || 0;
      console.log(`   • ${email} (${count} carts)`);
    });
    console.log(`\nTotal: ${totalCarts} carts will be deleted`);
    console.log(`\nA backup will be created before deletion.`);

    const confirm1 = await question('\nType "DELETE" to continue: ');
    if (confirm1.trim().toUpperCase() !== 'DELETE') {
      console.log('\n❌ Deletion cancelled.');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    const confirm2 = await question('\nAre you absolutely sure? Type "YES": ');
    if (confirm2.trim().toUpperCase() !== 'YES') {
      console.log('\n❌ Deletion cancelled.');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Create backup
    const backupFile = await createBackup(userCarts);

    // Delete
    const result = await deleteCarts(userCarts);

    // Verify
    await verifyDeletion();

    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Deleted: ${result.carts} carts`);
    console.log(`✅ Deleted: ${result.items} cart items`);
    console.log(`✅ Backup: ${path.basename(backupFile)}`);
    console.log('\n🎉 SUCCESS! User carts removed!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
