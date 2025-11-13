/**
 * SAFE DRY-RUN: Preview what would happen WITHOUT making changes
 * This script is 100% READ-ONLY
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dryRunPreview() {
  console.log('\n🔍 DRY-RUN MODE - NO DATABASE CHANGES WILL BE MADE\n');
  console.log('='.repeat(60));
  console.log('This is a PREVIEW ONLY - completely safe to run');
  console.log('='.repeat(60));
  
  try {
    // Find all pending payments (READ ONLY)
    const pendingPayments = await prisma.competitionPayment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (pendingPayments.length === 0) {
      console.log('\n✅ No pending payments found!\n');
      return;
    }

    console.log(`\n📊 Found ${pendingPayments.length} pending payment(s)\n`);

    let wouldCreate = 0;
    let wouldSkip = 0;
    let wouldFail = 0;

    for (const payment of pendingPayments) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Order ID: ${payment.orderId}`);
      console.log(`User: ${payment.user.name} (${payment.user.email})`);
      console.log(`Amount: ${payment.currency} ${payment.amount}`);
      console.log(`Payment Method: ${payment.paymentMethod || 'NOT SET'}`);

      // Check if registrations exist (READ ONLY)
      const existingRegs = await prisma.competitionRegistration.findMany({
        where: { paymentId: payment.id },
      });

      if (existingRegs.length > 0) {
        console.log(`⏭️  Would SKIP - ${existingRegs.length} registration(s) already exist`);
        existingRegs.forEach(reg => {
          console.log(`     - ${reg.registrationNumber} (${reg.status})`);
        });
        wouldSkip++;
        continue;
      }

      // Check metadata (READ ONLY)
      const metadata = payment.metadata;
      if (!metadata || !metadata.cartId || !metadata.itemIds) {
        console.log('⚠️  Would SKIP - Missing cart metadata');
        wouldSkip++;
        continue;
      }

      // Check cart items (READ ONLY)
      const cartItems = await prisma.registrationCartItem.findMany({
        where: {
          id: { in: metadata.itemIds },
        },
        include: {
          competition: true,
          registrationType: true,
        },
      });

      if (cartItems.length === 0) {
        console.log('⚠️  Would SKIP - No cart items found');
        wouldSkip++;
        continue;
      }

      console.log(`✅ Would CREATE ${cartItems.length} registration(s):`);
      cartItems.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.competition.title} - ${item.registrationType.name}`);
        console.log(`      Country: ${item.country}`);
        console.log(`      Type: ${item.participantType}`);
        console.log(`      Amount: ${payment.currency} ${item.subtotal}`);
        console.log(`      Format: 6-character code (e.g., WW83SJ, 826JK2)`);
      });
      
      console.log(`\n   Actions that WOULD happen (in actual run):`);
      console.log(`   ✓ Create ${cartItems.length} registration record(s)`);
      console.log(`   ✓ Generate unique registration number(s)`);
      console.log(`   ✓ Update payment status: PENDING → COMPLETED`);
      console.log(`   ✓ Update cart status: ACTIVE → COMPLETED`);
      
      wouldCreate++;
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('\n📊 DRY-RUN SUMMARY (NO CHANGES MADE)\n');
    console.log(`Total Payments Found: ${pendingPayments.length}`);
    console.log(`Would Create Registrations: ${wouldCreate}`);
    console.log(`Would Skip (already exist): ${wouldSkip}`);
    console.log(`Would Fail (missing data): ${wouldFail}\n`);

    if (wouldCreate > 0) {
      console.log('💡 To actually process these payments:');
      console.log('   Option 1: Let users visit their payment links (SAFEST)');
      console.log('   Option 2: Process via admin dashboard (SAFE)');
      console.log('   Option 3: Run the actual processing script (AUTOMATED)\n');
      
      console.log('⚠️  RECOMMENDATION:');
      console.log('   For live production data, process 1-2 payments first as a test');
      console.log('   Verify they appear correctly in admin dashboard');
      console.log('   Then process the rest\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run dry-run
dryRunPreview()
  .then(() => {
    console.log('='.repeat(60));
    console.log('✅ Dry-run complete - NO DATABASE CHANGES MADE\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
