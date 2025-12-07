/**
 * Revert Sandbox Payment Tagging
 * Safely restores payments to their original state using backup
 * NO DATA LOSS - Only restores metadata to original state
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function revertSandboxTagging(backupFileName) {
  try {
    console.log('🔄 Sandbox Payment Tagging Reverter\n');
    console.log('═══════════════════════════════════════════════\n');

    // Find backup file
    const backupDir = path.join(__dirname, 'backups');
    let backupFile;

    if (backupFileName) {
      // Use specified backup file
      backupFile = path.join(backupDir, backupFileName);
    } else {
      // Find most recent backup
      const backupFiles = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('sandbox-tag-backup-'))
        .sort()
        .reverse();

      if (backupFiles.length === 0) {
        console.error('❌ No backup files found in', backupDir);
        console.log('\nAvailable backups: None');
        return;
      }

      console.log('📋 Available backups:\n');
      backupFiles.forEach((file, idx) => {
        const stats = fs.statSync(path.join(backupDir, file));
        console.log(`${idx + 1}. ${file} (${stats.size} bytes, ${new Date(stats.mtime).toLocaleString()})`);
      });

      backupFile = path.join(backupDir, backupFiles[0]);
      console.log(`\n📂 Using most recent backup: ${backupFiles[0]}\n`);
    }

    // Check if backup file exists
    if (!fs.existsSync(backupFile)) {
      console.error('❌ Backup file not found:', backupFile);
      return;
    }

    // Load backup data
    console.log('📖 Loading backup...\n');
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log('📊 BACKUP INFORMATION\n');
    console.log('─────────────────────────────────────────────────');
    console.log(`Created:        ${backupData.timestamp}`);
    console.log(`Payments:       ${backupData.paymentCount}`);
    console.log(`Sandbox ID:     ${backupData.sandboxMerchantId}`);
    console.log(`Live ID:        ${backupData.liveMerchantId}`);
    console.log('─────────────────────────────────────────────────\n');

    // Show what will be reverted
    console.log('📋 PAYMENTS TO REVERT (sample):\n');
    backupData.payments.slice(0, 10).forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.orderId} (ID: ${p.id})`);
      console.log(`   Merchant: ${p.merchantId}`);
      console.log(`   Original metadata: ${JSON.stringify(p.originalMetadata)?.substring(0, 50)}...`);
    });
    if (backupData.payments.length > 10) {
      console.log(`... and ${backupData.payments.length - 10} more`);
    }
    console.log('\n─────────────────────────────────────────────────\n');

    console.log('⚠️  READY TO REVERT\n');
    console.log(`This will restore ${backupData.paymentCount} payments to their original state:`);
    console.log(`  - Remove metadata.sandbox flag`);
    console.log(`  - Remove metadata.environment`);
    console.log(`  - Restore original metadata`);
    console.log(`  - NO payment data will be deleted`);
    console.log(`  - NO registrations will be affected\n`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔄 Reverting payments...\n');

    let revertedCount = 0;
    let notFoundCount = 0;
    let unchangedCount = 0;

    for (const backupPayment of backupData.payments) {
      try {
        // Check if payment still exists
        const currentPayment = await prisma.competitionPayment.findUnique({
          where: { id: backupPayment.id },
          select: { metadata: true, merchantId: true },
        });

        if (!currentPayment) {
          notFoundCount++;
          console.log(`  ⚠️  Payment ${backupPayment.orderId} not found (may have been deleted)`);
          continue;
        }

        // Check if metadata was actually changed
        if (!currentPayment.metadata?.sandbox) {
          unchangedCount++;
          continue;
        }

        // Restore original metadata
        await prisma.competitionPayment.update({
          where: { id: backupPayment.id },
          data: { metadata: backupPayment.originalMetadata },
        });

        revertedCount++;
        if (revertedCount % 10 === 0) {
          console.log(`  ✓ Reverted ${revertedCount}/${backupData.paymentCount} payments...`);
        }
      } catch (error) {
        console.error(`  ❌ Error reverting payment ${backupPayment.orderId}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully reverted ${revertedCount} payments!`);
    if (unchangedCount > 0) {
      console.log(`ℹ️  Skipped ${unchangedCount} unchanged payments`);
    }
    if (notFoundCount > 0) {
      console.log(`⚠️  ${notFoundCount} payments not found (may have been deleted)`);
    }

    // Verify the revert
    const stillTaggedCount = await prisma.competitionPayment.count({
      where: {
        merchantId: backupData.sandboxMerchantId,
        metadata: {
          path: ['sandbox'],
          equals: true,
        },
      },
    });

    console.log('\n─────────────────────────────────────────────────');
    console.log(`✅ Verification: ${stillTaggedCount} payments still have sandbox flag`);
    console.log(`   (Should be 0 if all were reverted successfully)\n`);

    console.log('💡 NEXT STEPS:\n');
    console.log('1. Run: node scripts/analyze-sandbox-payments.js');
    console.log('   (Should show 0 sandbox payments)\n');
    console.log('2. Check Admin Dashboard:');
    console.log('   - Sandbox badges should be removed');
    console.log('   - All payments shown as production\n');
    console.log('3. Backup file preserved at:');
    console.log(`   ${backupFile}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get backup filename from command line or use latest
const backupFileName = process.argv[2];
revertSandboxTagging(backupFileName);
