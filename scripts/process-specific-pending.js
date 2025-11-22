/**
 * Process Specific Pending PayHere Payments
 * Completes the payment and creates registrations with auto-generated numbers
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Registration number generator (from competition-utils.ts logic)
function generateRegistrationNumber() {
  // Use clear characters only: 2-9 and A-Z (excluding O and I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 characters
  const randomBytes = crypto.randomBytes(6);
  
  let registrationNumber = '';
  for (let i = 0; i < 6; i++) {
    registrationNumber += chars[randomBytes[i] % chars.length];
  }
  
  return registrationNumber;
}

// Generate unique registration number with collision check
async function generateUniqueRegistrationNumber(maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const registrationNumber = generateRegistrationNumber();
    
    // Check if registration number already exists
    const existing = await prisma.competitionRegistration.findFirst({
      where: { registrationNumber },
    });
    
    if (!existing) {
      return registrationNumber;
    }
    
    console.log(`   ⚠️  Collision detected: ${registrationNumber}, retrying...`);
  }
  
  throw new Error('Failed to generate unique registration number after multiple attempts');
}

async function processSpecificOrders() {
  const orderIds = [
    'ORDER-AC2025-00026-265305',
    'ORDER-AC2025-00110-390543'
  ];

  console.log('\n🚀 Processing Specific Pending Orders\n');
  console.log('='.repeat(60));

  let successCount = 0;
  let errorCount = 0;

  for (const orderId of orderIds) {
    try {
      console.log(`\n📦 Processing: ${orderId}`);

      // Get payment with all details
      const payment = await prisma.competitionPayment.findUnique({
        where: { orderId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      if (!payment) {
        console.log(`   ❌ Payment not found`);
        errorCount++;
        continue;
      }

      if (payment.status !== 'PENDING') {
        console.log(`   ⚠️  Already ${payment.status}`);
        continue;
      }

      // Check if registrations already exist
      const existingRegs = await prisma.competitionRegistration.findMany({
        where: { paymentId: payment.id }
      });

      if (existingRegs.length > 0) {
        console.log(`   ✅ Registrations already exist (${existingRegs.length}), just updating payment status`);
        await prisma.competitionPayment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            statusCode: '2',
          }
        });
        successCount++;
        continue;
      }

      // Get cart items to create registrations
      const metadata = payment.metadata;
      if (!metadata || !metadata.cartId) {
        console.log(`   ❌ No cart metadata found`);
        errorCount++;
        continue;
      }

      const cart = await prisma.registrationCart.findUnique({
        where: { id: metadata.cartId },
        include: {
          items: {
            include: {
              competition: true,
              registrationType: true,
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        console.log(`   ❌ Cart not found or empty`);
        errorCount++;
        continue;
      }

      console.log(`   📋 Found ${cart.items.length} item(s) in cart`);

      // Create registrations
      const registrations = [];
      for (const item of cart.items) {
        // Generate unique 6-character registration number
        const registrationNumber = await generateUniqueRegistrationNumber();

        // Map registration type name to proper enum value
        const typeName = item.registrationType.name.toUpperCase();
        let participantType = 'INDIVIDUAL';
        
        if (typeName.includes('TEAM') || typeName.includes('GROUP')) {
          participantType = 'TEAM';
        } else if (typeName.includes('COMPANY')) {
          participantType = 'COMPANY';
        } else if (typeName.includes('STUDENT')) {
          participantType = 'STUDENT';
        } else if (typeName.includes('KIDS') || typeName.includes('KID')) {
          participantType = 'KIDS';
        }

        const registration = await prisma.competitionRegistration.create({
          data: {
            registrationNumber,
            userId: payment.userId,
            competitionId: item.competitionId,
            registrationTypeId: item.registrationTypeId,
            paymentId: payment.id,
            status: 'CONFIRMED',
            country: item.country,
            participantType: participantType,
            members: item.members || [],
            teamName: item.teamName,
            companyName: item.companyName,
            amountPaid: item.subtotal,
            currency: payment.currency,
            confirmedAt: new Date(),
          },
        });

        registrations.push(registration);
        console.log(`   ✅ Created: ${registrationNumber}`);
      }

      // Update payment status
      await prisma.competitionPayment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          statusCode: '2',
          paymentMethod: payment.paymentMethod || 'PAYHERE',
        },
      });

      // Update cart status
      await prisma.registrationCart.update({
        where: { id: metadata.cartId },
        data: { status: 'COMPLETED' },
      });

      console.log(`   💰 Payment: ${payment.currency} ${payment.amount.toLocaleString()}`);
      console.log(`   👤 User: ${payment.user.name} (${payment.user.email})`);
      console.log(`   ✅ SUCCESS - Created ${registrations.length} registration(s)`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully processed: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('');

  await prisma.$disconnect();
}

processSpecificOrders()
  .then(() => {
    console.log('✅ Script completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
