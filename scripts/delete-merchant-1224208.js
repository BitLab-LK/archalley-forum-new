/**
 * DELETE MERCHANT 1224208 TEST PAYMENTS
 * Removes all payments and registrations with sandbox merchant ID 1224208
 * 
 * SAFETY FEATURES:
 * - Creates full backup before deletion
 * - Only deletes merchant ID 1224208
 * - Requires double confirmation
 * - Shows detailed preview
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const prisma = new PrismaClient();

const SANDBOX_MERCHANT_1224208 = '1224208';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function analyzeData() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANALYZING MERCHANT 1224208 DATA');
  console.log('='.repeat(80));

  // Get all payments with this merchant ID
  const payments = await prisma.competitionPayment.findMany({
    where: {
      merchantId: SANDBOX_MERCHANT_1224208
    },
    include: {
      registrations: {
        include: {
          user: true,
          competition: true,
        }
      }
    }
  });

  console.log(`\n📊 Found ${payments.length} payments with merchant ID ${SANDBOX_MERCHANT_1224208}`);

  // Get all registrations linked to these payments
  const registrationIds = [];
  payments.forEach(payment => {
    if (payment.registrations) {
      payment.registrations.forEach(reg => {
        registrationIds.push(reg.id);
      });
    }
  });

  console.log(`📊 Found ${registrationIds.length} registrations linked to these payments`);

  // Show sample data
  console.log('\n' + '='.repeat(80));
  console.log('📋 SAMPLE DATA (First 10)');
  console.log('='.repeat(80));

  payments.slice(0, 10).forEach((payment, index) => {
    const reg = payment.registrations?.[0];
    console.log(`\n${index + 1}. Order: ${payment.orderId}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Amount: ${payment.amount} LKR`);
    console.log(`   User: ${reg?.user?.email || 'N/A'}`);
    console.log(`   Created: ${new Date(payment.createdAt).toLocaleString()}`);
    console.log(`   Payment ID: ${payment.id}`);
  });

  if (payments.length > 10) {
    console.log(`\n   ... and ${payments.length - 10} more`);
  }

  return {
    payments,
    registrationIds,
    paymentIds: payments.map(p => p.id)
  };
}

async function createBackup(payments, registrationIds) {
  console.log('\n' + '='.repeat(80));
  console.log('💾 CREATING BACKUP');
  console.log('='.repeat(80));

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `merchant-1224208-backup-${timestamp}.json`);

  // Get full data for backup
  const fullPayments = await prisma.competitionPayment.findMany({
    where: {
      id: { in: payments.map(p => p.id) }
    },
    include: {
      registrations: {
        include: {
          user: true,
          competition: true,
          registrationType: true,
        }
      }
    }
  });

  const backupData = {
    timestamp: new Date().toISOString(),
    merchantId: SANDBOX_MERCHANT_1224208,
    totalPayments: payments.length,
    totalRegistrations: registrationIds.length,
    payments: fullPayments
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

  console.log(`\n✅ Backup created: ${backupFile}`);
  console.log(`   Payments: ${payments.length}`);
  console.log(`   Registrations: ${registrationIds.length}`);
  console.log(`   File size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

  return backupFile;
}

async function deleteData(paymentIds, registrationIds) {
  console.log('\n' + '='.repeat(80));
  console.log('🗑️  DELETING DATA');
  console.log('='.repeat(80));

  console.log(`\nDeleting ${registrationIds.length} registrations and ${paymentIds.length} payments...`);

  // Delete in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Delete registrations first
    const deletedRegistrations = await tx.competitionRegistration.deleteMany({
      where: {
        id: { in: registrationIds }
      }
    });

    // Delete payments
    const deletedPayments = await tx.competitionPayment.deleteMany({
      where: {
        id: { in: paymentIds }
      }
    });

    return {
      registrations: deletedRegistrations.count,
      payments: deletedPayments.count
    };
  });

  console.log('\n✅ DELETION COMPLETE');
  console.log(`   Registrations deleted: ${result.registrations}`);
  console.log(`   Payments deleted: ${result.payments}`);

  return result;
}

async function verifyDeletion() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFYING DELETION');
  console.log('='.repeat(80));

  const remaining = await prisma.competitionPayment.count({
    where: {
      merchantId: SANDBOX_MERCHANT_1224208
    }
  });

  console.log(`\n✅ Merchant ${SANDBOX_MERCHANT_1224208} payments remaining: ${remaining}`);

  // Show current merchant breakdown
  const allPayments = await prisma.competitionPayment.findMany();
  const merchantGroups = {};
  
  allPayments.forEach(payment => {
    const mid = payment.merchantId || 'NULL';
    merchantGroups[mid] = (merchantGroups[mid] || 0) + 1;
  });

  console.log('\n📊 Current Database State:');
  Object.keys(merchantGroups).sort().forEach(mid => {
    const symbol = mid === '238431' ? '✅' : mid === '1232882' ? '🧪' : '❓';
    console.log(`   ${symbol} ${mid}: ${merchantGroups[mid]} payments`);
  });

  return remaining === 0;
}

async function main() {
  const args = process.argv.slice(2);
  const previewOnly = args.includes('--preview');

  console.log('\n' + '='.repeat(80));
  console.log('🗑️  DELETE MERCHANT 1224208 TEST PAYMENTS');
  console.log('='.repeat(80));
  console.log(`\nMode: ${previewOnly ? '👁️  PREVIEW ONLY' : '⚠️  DELETION MODE'}`);

  try {
    // Analyze data
    const { payments, registrationIds, paymentIds } = await analyzeData();

    if (payments.length === 0) {
      console.log('\n✅ No payments found with merchant ID 1224208!');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    if (previewOnly) {
      console.log('\n' + '='.repeat(80));
      console.log('👁️  PREVIEW MODE - No changes made');
      console.log('='.repeat(80));
      console.log(`\nTo delete, run: node scripts/delete-merchant-1224208.js`);
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Confirm deletion
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  FINAL CONFIRMATION');
    console.log('='.repeat(80));
    console.log(`\nYou are about to DELETE:`);
    console.log(`   • ${payments.length} payments`);
    console.log(`   • ${registrationIds.length} registrations`);
    console.log(`   • Merchant ID: ${SANDBOX_MERCHANT_1224208}`);
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
    const backupFile = await createBackup(payments, registrationIds);

    // Delete data
    const result = await deleteData(paymentIds, registrationIds);

    // Verify
    const success = await verifyDeletion();

    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Deleted: ${result.registrations} registrations`);
    console.log(`✅ Deleted: ${result.payments} payments`);
    console.log(`✅ Backup: ${path.basename(backupFile)}`);
    console.log(`✅ Verification: ${success ? 'PASSED' : 'FAILED'}`);

    if (success) {
      console.log('\n🎉 SUCCESS! Merchant 1224208 test data removed!');
    } else {
      console.log('\n⚠️  Warning: Some data may still remain. Check manually.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
