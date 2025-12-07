/**
 * SAFE TEST DATA DELETION SCRIPT
 * Deletes sandbox/test registrations with automatic backup
 * 
 * SAFETY FEATURES:
 * - Creates full backup before deletion
 * - Only deletes registrations with merchant ID 1232882 (sandbox)
 * - Requires manual confirmation
 * - Shows detailed preview of what will be deleted
 * - Can be reverted using backup
 * 
 * Usage:
 *   node scripts/delete-test-registrations.js --preview   (Preview only, no changes)
 *   node scripts/delete-test-registrations.js             (Full backup + delete with confirmation)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const prisma = new PrismaClient();

// SANDBOX merchant ID - ONLY these will be deleted
const SANDBOX_MERCHANT_ID = '1232882';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function analyzeTestData() {
  console.log('\n🔍 ANALYZING TEST DATA TO DELETE\n');
  console.log('=' .repeat(80));
  
  // Fetch all registrations with payments
  const registrations = await prisma.competitionRegistration.findMany({
    include: {
      user: true,
      competition: true,
      registrationType: true,
      payment: true,
    },
  });

  const testRegistrations = registrations.filter(reg => {
    if (!reg.payment) return false;
    return reg.payment.merchantId === SANDBOX_MERCHANT_ID;
  });

  const productionRegistrations = registrations.filter(reg => {
    if (!reg.payment) return false;
    return reg.payment.merchantId !== SANDBOX_MERCHANT_ID;
  });

  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total Registrations: ${registrations.length}`);
  console.log(`   ✅ Production (KEEP): ${productionRegistrations.length}`);
  console.log(`   🗑️  Test Data (DELETE): ${testRegistrations.length}`);
  console.log(`   ❓ No Payment: ${registrations.filter(r => !r.payment).length}`);

  console.log('\n' + '=' .repeat(80));
  console.log('✅ PRODUCTION DATA (WILL BE KEPT)');
  console.log('=' .repeat(80));
  
  productionRegistrations.forEach((reg, index) => {
    console.log(`\n${index + 1}. ${reg.registrationNumber}`);
    console.log(`   User: ${reg.user.name} (${reg.user.email})`);
    console.log(`   Competition: ${reg.competition.title}`);
    console.log(`   Amount: ${reg.amountPaid.toLocaleString()} ${reg.currency}`);
    console.log(`   Merchant ID: ${reg.payment?.merchantId}`);
  });

  console.log('\n' + '=' .repeat(80));
  console.log('🗑️  TEST DATA (WILL BE DELETED)');
  console.log('=' .repeat(80));
  
  testRegistrations.forEach((reg, index) => {
    console.log(`\n${index + 1}. ${reg.registrationNumber}`);
    console.log(`   User: ${reg.user.name} (${reg.user.email})`);
    console.log(`   Competition: ${reg.competition.title}`);
    console.log(`   Amount: ${reg.amountPaid.toLocaleString()} ${reg.currency}`);
    console.log(`   Order ID: ${reg.payment?.orderId}`);
    console.log(`   Merchant ID: ${reg.payment?.merchantId}`);
    console.log(`   Registration ID: ${reg.id}`);
  });

  return {
    testRegistrations,
    productionRegistrations,
    totalRegistrations: registrations.length,
  };
}

async function createBackup(testRegistrations) {
  console.log('\n' + '=' .repeat(80));
  console.log('💾 CREATING BACKUP');
  console.log('=' .repeat(80));

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `test-registrations-backup-${timestamp}.json`);

  // Fetch full data for backup
  const fullBackupData = await prisma.competitionRegistration.findMany({
    where: {
      id: { in: testRegistrations.map(r => r.id) }
    },
    include: {
      user: true,
      competition: true,
      registrationType: true,
      payment: true,
    }
  });

  fs.writeFileSync(backupFile, JSON.stringify(fullBackupData, null, 2));
  
  console.log(`\n✅ Backup created: ${backupFile}`);
  console.log(`   Records backed up: ${fullBackupData.length}`);
  console.log(`   File size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
  
  return backupFile;
}

async function deleteTestRegistrations(testRegistrations) {
  console.log('\n' + '=' .repeat(80));
  console.log('🗑️  DELETING TEST REGISTRATIONS');
  console.log('=' .repeat(80));

  const registrationIds = testRegistrations.map(r => r.id);
  const paymentIds = testRegistrations.map(r => r.payment?.id).filter(Boolean);

  console.log(`\nDeleting ${registrationIds.length} registrations and ${paymentIds.length} payments...`);

  // Delete in transaction for safety
  const result = await prisma.$transaction(async (tx) => {
    // First, delete the registrations (payments will cascade delete if configured)
    const deletedRegistrations = await tx.competitionRegistration.deleteMany({
      where: {
        id: { in: registrationIds }
      }
    });

    // Explicitly delete payments if cascade isn't configured
    let deletedPayments = { count: 0 };
    if (paymentIds.length > 0) {
      deletedPayments = await tx.competitionPayment.deleteMany({
        where: {
          id: { in: paymentIds }
        }
      });
    }

    return {
      registrations: deletedRegistrations.count,
      payments: deletedPayments.count,
    };
  });

  console.log('\n✅ DELETION COMPLETE');
  console.log(`   Registrations deleted: ${result.registrations}`);
  console.log(`   Payments deleted: ${result.payments}`);

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const previewOnly = args.includes('--preview');

  console.log('\n' + '=' .repeat(80));
  console.log('🗑️  SAFE TEST DATA DELETION SCRIPT');
  console.log('=' .repeat(80));
  console.log(`\nMode: ${previewOnly ? '👁️  PREVIEW ONLY (No changes)' : '⚠️  DELETION MODE (Will delete after confirmation)'}`);

  try {
    // Step 1: Analyze data
    const { testRegistrations, productionRegistrations, totalRegistrations } = await analyzeTestData();

    if (testRegistrations.length === 0) {
      console.log('\n✅ No test data found to delete!');
      console.log('   All registrations appear to be production data.');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    if (previewOnly) {
      console.log('\n' + '=' .repeat(80));
      console.log('👁️  PREVIEW MODE - No changes made');
      console.log('=' .repeat(80));
      console.log(`\nTo actually delete, run: node scripts/delete-test-registrations.js`);
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Step 2: Show warning and ask for confirmation
    console.log('\n' + '=' .repeat(80));
    console.log('⚠️  FINAL CONFIRMATION');
    console.log('=' .repeat(80));
    console.log(`\nYou are about to DELETE ${testRegistrations.length} test registrations.`);
    console.log(`Production data (${productionRegistrations.length} registrations) will be KEPT.`);
    console.log(`\nA backup will be created before deletion.`);

    const confirm1 = await question('\nType "DELETE" to continue: ');
    
    if (confirm1.trim().toUpperCase() !== 'DELETE') {
      console.log('\n❌ Deletion cancelled.');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    const confirm2 = await question('\nAre you absolutely sure? Type "YES" to confirm: ');
    
    if (confirm2.trim().toUpperCase() !== 'YES') {
      console.log('\n❌ Deletion cancelled.');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Step 3: Create backup
    const backupFile = await createBackup(testRegistrations);

    // Step 4: Delete test data
    const result = await deleteTestRegistrations(testRegistrations);

    // Step 5: Verify deletion
    console.log('\n' + '=' .repeat(80));
    console.log('🔍 VERIFYING DELETION');
    console.log('=' .repeat(80));

    const remainingRegistrations = await prisma.competitionRegistration.count();
    const remainingWithSandbox = await prisma.competitionRegistration.count({
      where: {
        payment: {
          merchantId: SANDBOX_MERCHANT_ID
        }
      }
    });

    console.log(`\n✅ Current database state:`);
    console.log(`   Total registrations: ${remainingRegistrations}`);
    console.log(`   Expected: ${productionRegistrations.length}`);
    console.log(`   Sandbox registrations remaining: ${remainingWithSandbox}`);

    if (remainingRegistrations === productionRegistrations.length && remainingWithSandbox === 0) {
      console.log('\n🎉 SUCCESS! Test data deleted, production data intact!');
    } else {
      console.log('\n⚠️  Warning: Numbers don\'t match. Please verify manually.');
    }

    console.log('\n' + '=' .repeat(80));
    console.log('📋 SUMMARY');
    console.log('=' .repeat(80));
    console.log(`\n✅ Deleted: ${result.registrations} registrations`);
    console.log(`✅ Deleted: ${result.payments} payments`);
    console.log(`✅ Remaining: ${remainingRegistrations} registrations`);
    console.log(`✅ Backup: ${backupFile}`);
    console.log(`\n💡 To restore from backup, use: node scripts/restore-from-backup.js ${path.basename(backupFile)}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
