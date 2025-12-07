/**
 * SAFE Sandbox Payment Tagger with Backup & Revert
 * Tags payments with merchant ID 1232882 as sandbox
 * Creates backup before any changes for safe reverting
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Your merchant IDs from .env
const SANDBOX_MERCHANT_ID = '1232882';
const LIVE_MERCHANT_ID = '238431';

// Backup file path
const BACKUP_DIR = path.join(__dirname, 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `sandbox-tag-backup-${Date.now()}.json`);

async function createBackup(payments) {
  try {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Save original payment data
    const backupData = {
      timestamp: new Date().toISOString(),
      sandboxMerchantId: SANDBOX_MERCHANT_ID,
      liveMerchantId: LIVE_MERCHANT_ID,
      paymentCount: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        orderId: p.orderId,
        merchantId: p.merchantId,
        originalMetadata: p.metadata,
      })),
    };

    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup created: ${BACKUP_FILE}\n`);
    return BACKUP_FILE;
  } catch (error) {
    console.error('❌ Failed to create backup:', error);
    throw error;
  }
}

async function tagSandboxPayments(dryRun = false) {
  try {
    console.log('🏷️  Safe Sandbox Payment Tagger\n');
    console.log('═══════════════════════════════════════════════\n');

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    console.log(`Sandbox Merchant ID: ${SANDBOX_MERCHANT_ID}`);
    console.log(`Live Merchant ID: ${LIVE_MERCHANT_ID}\n`);

    // Find all payments with sandbox merchant ID
    const sandboxPayments = await prisma.competitionPayment.findMany({
      where: {
        merchantId: SANDBOX_MERCHANT_ID,
      },
      select: {
        id: true,
        orderId: true,
        merchantId: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        metadata: true,
        createdAt: true,
        registrations: {
          select: {
            id: true,
            registrationNumber: true,
            status: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${sandboxPayments.length} payments with sandbox merchant ID\n`);

    if (sandboxPayments.length === 0) {
      console.log('✅ No sandbox payments found to tag.\n');
      return null;
    }

    // Calculate stats
    const totalRevenue = sandboxPayments.reduce((sum, p) => sum + p.amount, 0);
    const completedCount = sandboxPayments.filter(p => p.status === 'COMPLETED').length;
    const pendingCount = sandboxPayments.filter(p => p.status === 'PENDING').length;
    const totalRegistrations = sandboxPayments.reduce((sum, p) => sum + p.registrations.length, 0);

    // Check how many already tagged
    const alreadyTagged = sandboxPayments.filter(p => p.metadata?.sandbox === true).length;

    console.log('📈 SANDBOX PAYMENT SUMMARY\n');
    console.log('─────────────────────────────────────────────────');
    console.log(`Total Payments:        ${sandboxPayments.length}`);
    console.log(`Already Tagged:        ${alreadyTagged}`);
    console.log(`Need Tagging:          ${sandboxPayments.length - alreadyTagged}`);
    console.log(`Completed:             ${completedCount}`);
    console.log(`Pending:               ${pendingCount}`);
    console.log(`Total Registrations:   ${totalRegistrations}`);
    console.log(`Total Revenue:         LKR ${totalRevenue.toLocaleString()}`);
    console.log('─────────────────────────────────────────────────\n');

    // Show sample payments
    console.log('📋 SAMPLE PAYMENTS (first 10):\n');
    console.log('─────────────────────────────────────────────────');
    sandboxPayments.slice(0, 10).forEach((payment, idx) => {
      const tagged = payment.metadata?.sandbox ? '🏷️  TAGGED' : '⚪ UNTAGGED';
      console.log(`${idx + 1}. ${payment.orderId}`);
      console.log(`   Amount: LKR ${payment.amount} | Status: ${payment.status} | ${tagged}`);
      console.log(`   Registrations: ${payment.registrations.length}`);
    });
    if (sandboxPayments.length > 10) {
      console.log(`... and ${sandboxPayments.length - 10} more`);
    }
    console.log('─────────────────────────────────────────────────\n');

    if (dryRun) {
      console.log('✅ DRY RUN COMPLETE - No changes made\n');
      console.log('💡 To apply changes, run without --dry-run flag\n');
      return null;
    }

    // Create backup before making changes
    console.log('💾 Creating backup before tagging...\n');
    const backupFile = await createBackup(sandboxPayments);

    // Confirm before proceeding
    console.log('⚠️  READY TO TAG PAYMENTS\n');
    console.log(`This will update ${sandboxPayments.length - alreadyTagged} payments:`);
    console.log(`  - Add metadata.sandbox = true`);
    console.log(`  - Add metadata.environment = "sandbox"`);
    console.log(`  - Keep original data intact`);
    console.log(`  - Backup saved to: ${path.basename(backupFile)}\n`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔄 Tagging payments...\n');

    // Update each payment with sandbox metadata
    let updatedCount = 0;
    let skippedCount = 0;

    for (const payment of sandboxPayments) {
      // Skip if already tagged
      if (payment.metadata?.sandbox === true) {
        skippedCount++;
        continue;
      }

      const currentMetadata = payment.metadata || {};
      const newMetadata = {
        ...currentMetadata,
        sandbox: true,
        environment: 'sandbox',
        sandboxMerchantId: SANDBOX_MERCHANT_ID,
        taggedAt: new Date().toISOString(),
        taggedBy: 'safe-sandbox-tagger-v1',
        backupFile: path.basename(backupFile),
      };

      await prisma.competitionPayment.update({
        where: { id: payment.id },
        data: { metadata: newMetadata },
      });

      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`  ✓ Tagged ${updatedCount}/${sandboxPayments.length - alreadyTagged} payments...`);
      }
    }

    console.log(`\n✅ Successfully tagged ${updatedCount} sandbox payments!`);
    if (skippedCount > 0) {
      console.log(`ℹ️  Skipped ${skippedCount} already tagged payments\n`);
    }

    // Verify the update
    const verifyCount = await prisma.competitionPayment.count({
      where: {
        merchantId: SANDBOX_MERCHANT_ID,
        metadata: {
          path: ['sandbox'],
          equals: true,
        },
      },
    });

    console.log('\n─────────────────────────────────────────────────');
    console.log(`✅ Verification: ${verifyCount} payments now have sandbox flag\n`);

    // Show revenue breakdown
    const allPayments = await prisma.competitionPayment.findMany({
      select: { amount: true, merchantId: true, status: true },
    });
    
    const livePayments = allPayments.filter(p => p.merchantId === LIVE_MERCHANT_ID);
    const liveRevenue = livePayments.reduce((sum, p) => sum + p.amount, 0);
    const liveCompleted = livePayments.filter(p => p.status === 'COMPLETED').length;
    
    console.log('💰 FINAL REVENUE BREAKDOWN\n');
    console.log('─────────────────────────────────────────────────');
    console.log(`🟢 Live Revenue:    LKR ${liveRevenue.toLocaleString()} (${livePayments.length} payments, ${liveCompleted} completed)`);
    console.log(`🏖️  Sandbox Revenue: LKR ${totalRevenue.toLocaleString()} (${sandboxPayments.length} payments, ${completedCount} completed)`);
    console.log('─────────────────────────────────────────────────\n');

    console.log('💡 NEXT STEPS:\n');
    console.log('1. ✅ Backup saved to: ' + backupFile);
    console.log('2. Run: node scripts/analyze-sandbox-payments.js');
    console.log('   (Should now show sandbox payments detected!)\n');
    console.log('3. Check Admin Dashboard:');
    console.log('   - Navigate to Admin → Registrations');
    console.log('   - Use Environment filter → Sandbox Only');
    console.log('   - See 🏖️ SANDBOX badges on payments\n');
    console.log('4. To revert changes if needed:');
    console.log(`   node scripts/revert-sandbox-tagging.js ${path.basename(backupFile)}\n`);

    return backupFile;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Check for command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

tagSandboxPayments(isDryRun);
