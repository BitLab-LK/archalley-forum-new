/**
 * Script to tag existing sandbox payments based on merchant ID
 * This will add metadata flags to identify sandbox payments retroactively
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Your merchant IDs from .env
const SANDBOX_MERCHANT_ID = '1232882'; // From your .env
const LIVE_MERCHANT_ID = '238431';     // From your .env

async function tagSandboxPayments() {
  try {
    console.log('🏷️  Tagging Sandbox Payments...\n');
    console.log('═══════════════════════════════════════════════\n');

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
        status: true,
        metadata: true,
        createdAt: true,
      },
    });

    console.log(`📊 Found ${sandboxPayments.length} payments with sandbox merchant ID\n`);

    if (sandboxPayments.length === 0) {
      console.log('✅ No sandbox payments found to tag.\n');
      return;
    }

    // Show summary before tagging
    console.log('Payments to be tagged:\n');
    console.log('─────────────────────────────────────────────────');
    sandboxPayments.slice(0, 10).forEach(payment => {
      console.log(`${payment.orderId} | LKR ${payment.amount} | ${payment.status}`);
    });
    if (sandboxPayments.length > 10) {
      console.log(`... and ${sandboxPayments.length - 10} more`);
    }
    console.log('─────────────────────────────────────────────────\n');

    // Confirm before proceeding
    console.log('⚠️  This will update the metadata of these payments to mark them as sandbox.\n');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔄 Updating payments...\n');

    // Update each payment with sandbox metadata
    let updatedCount = 0;
    for (const payment of sandboxPayments) {
      const currentMetadata = payment.metadata || {};
      const newMetadata = {
        ...currentMetadata,
        sandbox: true,
        environment: 'sandbox',
        sandboxMerchantId: SANDBOX_MERCHANT_ID,
        taggedAt: new Date().toISOString(),
        taggedBy: 'identify-sandbox-script',
      };

      await prisma.competitionPayment.update({
        where: { id: payment.id },
        data: { metadata: newMetadata },
      });

      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`  ✓ Updated ${updatedCount}/${sandboxPayments.length} payments...`);
      }
    }

    console.log(`\n✅ Successfully tagged ${updatedCount} sandbox payments!\n`);

    // Verify the update
    const verifyCount = await prisma.competitionPayment.count({
      where: {
        metadata: {
          path: ['sandbox'],
          equals: true,
        },
      },
    });

    console.log('─────────────────────────────────────────────────');
    console.log(`Verification: ${verifyCount} payments now have sandbox flag\n`);

    // Show revenue breakdown
    const totalSandboxRevenue = sandboxPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const allPayments = await prisma.competitionPayment.findMany({
      select: { amount: true, merchantId: true },
    });
    
    const liveRevenue = allPayments
      .filter(p => p.merchantId === LIVE_MERCHANT_ID)
      .reduce((sum, p) => sum + p.amount, 0);
    
    console.log('💰 REVENUE BREAKDOWN\n');
    console.log('─────────────────────────────────────────────────');
    console.log(`🟢 Live Revenue:    LKR ${liveRevenue.toLocaleString()}`);
    console.log(`🏖️  Sandbox Revenue: LKR ${totalSandboxRevenue.toLocaleString()}`);
    console.log('─────────────────────────────────────────────────\n');

    console.log('💡 Next Steps:\n');
    console.log('1. Run: node scripts/analyze-sandbox-payments.js');
    console.log('   (You should now see sandbox payments detected!)\n');
    console.log('2. Check the admin dashboard');
    console.log('   - Use Environment filter to view sandbox payments');
    console.log('   - See sandbox badges on payment rows\n');
    console.log('3. Consider cleaning up sandbox data:');
    console.log('   - Filter for sandbox payments in admin');
    console.log('   - Review and delete test registrations\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

tagSandboxPayments();
