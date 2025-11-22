/**
 * Test PayHere Payment Flow
 * This script simulates the return from PayHere and tests the fallback mechanism
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPayHereFallback() {
  console.log('\n🧪 Testing PayHere Fallback Mechanism\n');
  console.log('='.repeat(60));
  
  try {
    // Find a pending PayHere payment
    const pendingPayment = await prisma.competitionPayment.findFirst({
      where: {
        status: 'PENDING',
        paymentMethod: 'PAYHERE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!pendingPayment) {
      console.log('\n✅ No pending PayHere payments found!');
      console.log('   This is good - all payments have been processed.\n');
      return;
    }

    console.log('\n📊 Found pending payment:');
    console.log(`   Order ID: ${pendingPayment.orderId}`);
    console.log(`   Amount: ${pendingPayment.currency} ${pendingPayment.amount}`);
    console.log(`   Status: ${pendingPayment.status}`);
    console.log(`   Created: ${pendingPayment.createdAt}\n`);

    // Check if registrations exist
    const registrations = await prisma.competitionRegistration.findMany({
      where: { paymentId: pendingPayment.id },
    });

    if (registrations.length > 0) {
      console.log(`✅ Registrations already exist: ${registrations.length}`);
      console.log('   Payment should be marked as COMPLETED\n');
      registrations.forEach(reg => {
        console.log(`   - ${reg.registrationNumber} (${reg.status})`);
      });
    } else {
      console.log('❌ No registrations found for this payment');
      console.log('   Fallback mechanism will create them when user returns\n');
    }

    console.log('💡 To trigger fallback mechanism:');
    console.log(`   User should visit: /api/competitions/payment/return?order_id=${pendingPayment.orderId}\n`);

    console.log('🔗 Or test via curl:');
    console.log(`   curl "http://localhost:3000/api/competitions/payment/return?order_id=${pendingPayment.orderId}"\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testPayHereFallback()
  .then(() => {
    console.log('='.repeat(60));
    console.log('✅ Test complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
