/**
 * Auto-Process All Pending PayHere Payments
 * This script triggers the fallback mechanism for all pending payments
 * by simulating the return from PayHere
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function autoProcessPendingPayments() {
  console.log('\n🚀 Auto-Processing All Pending PayHere Payments\n');
  console.log('='.repeat(60));
  
  try {
    // Find all pending PayHere payments
    const pendingPayments = await prisma.competitionPayment.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { paymentMethod: 'PAYHERE' },
          { paymentMethod: null }, // Old payments without method set
        ],
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
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
      console.log('\n✅ No pending payments found. All clear!\n');
      return;
    }

    console.log(`\n📊 Found ${pendingPayments.length} pending payment(s)\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const payment of pendingPayments) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Processing: ${payment.orderId}`);
      console.log(`User: ${payment.user.name} (${payment.user.email})`);
      console.log(`Amount: ${payment.currency} ${payment.amount}`);

      try {
        // Check if registrations already exist
        const existingRegs = await prisma.competitionRegistration.findMany({
          where: { paymentId: payment.id },
        });

        if (existingRegs.length > 0) {
          console.log(`⏭️  Skipped - ${existingRegs.length} registration(s) already exist`);
          skipCount++;
          continue;
        }

        // Get metadata
        const metadata = payment.metadata;
        if (!metadata || !metadata.cartId || !metadata.itemIds) {
          console.log('⚠️  Skipped - Missing cart metadata');
          skipCount++;
          continue;
        }

        // Fetch cart items
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
          console.log('⚠️  Skipped - No cart items found');
          skipCount++;
          continue;
        }

        // Create registrations
        const registrations = [];
        for (const item of cartItems) {
          // Generate 6-character alphanumeric code to match existing format
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let registrationNumber = '';
          
          // Ensure unique
          let isUnique = false;
          while (!isUnique) {
            registrationNumber = '';
            for (let i = 0; i < 6; i++) {
              registrationNumber += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            const existing = await prisma.competitionRegistration.findUnique({
              where: { registrationNumber },
            });
            if (!existing) {
              isUnique = true;
            }
          }

          const reg = await prisma.competitionRegistration.create({
            data: {
              registrationNumber,
              userId: payment.userId,
              competitionId: item.competitionId,
              registrationTypeId: item.registrationTypeId,
              paymentId: payment.id,
              country: item.country,
              participantType: item.participantType,
              referralSource: item.referralSource,
              teamName: item.teamName,
              companyName: item.companyName,
              businessRegistrationNo: item.businessRegistrationNo,
              teamMembers: item.teamMembers === null ? undefined : item.teamMembers,
              members: item.members,
              status: 'CONFIRMED',
              amountPaid: item.subtotal,
              currency: payment.currency,
              confirmedAt: new Date(),
            },
          });

          registrations.push(reg);
          console.log(`   ✅ Created: ${registrationNumber}`);
        }

        // Update payment
        await prisma.competitionPayment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            statusCode: '2',
            paymentMethod: payment.paymentMethod || 'PAYHERE',
            responseData: {
              auto_processed: true,
              processed_via: 'batch_script',
              processed_at: new Date().toISOString(),
              registrations_created: registrations.length,
            },
          },
        });

        // Update cart
        await prisma.registrationCart.update({
          where: { id: metadata.cartId },
          data: { status: 'COMPLETED' },
        });

        console.log(`✅ SUCCESS - Created ${registrations.length} registration(s)`);
        successCount++;

      } catch (error) {
        console.error(`❌ ERROR - ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('\n📊 PROCESSING COMPLETE\n');
    console.log(`Total Payments: ${pendingPayments.length}`);
    console.log(`✅ Successfully Processed: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}\n`);

    if (successCount > 0) {
      console.log('🎉 Registrations are now visible in admin dashboard!');
      console.log('📧 Consider sending confirmation emails to users\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
autoProcessPendingPayments()
  .then(() => {
    console.log('='.repeat(60));
    console.log('✅ Script completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
