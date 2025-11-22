/**
 * Script to check for PayHere payments in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPayHerePayments() {
  try {
    console.log('🔍 Checking for PayHere payments in database...\n');

    // Get all payments with PayHere method
    const payherePayments = await prisma.competitionPayment.findMany({
      where: {
        paymentMethod: 'PAYHERE',
      },
      include: {
        registrations: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            registrationType: {
              select: {
                name: true,
              },
            },
            competition: {
              select: {
                title: true,
                year: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Total PayHere Payments Found: ${payherePayments.length}\n`);

    if (payherePayments.length === 0) {
      console.log('❌ No PayHere payments found in the database.');
      console.log('💡 This could mean:');
      console.log('   - No users have paid via PayHere yet');
      console.log('   - Payment method field is stored differently');
      console.log('   - PayHere integration hasn\'t been tested yet\n');
    } else {
      console.log('✅ PayHere Payments Found!\n');
      console.log('═'.repeat(80));

      // Group by status
      const byStatus = {
        COMPLETED: payherePayments.filter(p => p.status === 'COMPLETED'),
        PENDING: payherePayments.filter(p => p.status === 'PENDING'),
        FAILED: payherePayments.filter(p => p.status === 'FAILED'),
      };

      console.log('\n📈 Payment Status Breakdown:');
      console.log(`   ✅ Completed: ${byStatus.COMPLETED.length}`);
      console.log(`   ⏳ Pending: ${byStatus.PENDING.length}`);
      console.log(`   ❌ Failed: ${byStatus.FAILED.length}`);
      console.log('');

      // Calculate revenue
      const totalRevenue = byStatus.COMPLETED.reduce((sum, p) => sum + p.amount, 0);
      console.log(`💰 Total Revenue from PayHere: LKR ${totalRevenue.toLocaleString()}\n`);

      console.log('═'.repeat(80));
      console.log('\n📋 Recent PayHere Payments:\n');

      payherePayments.slice(0, 10).forEach((payment, index) => {
        const regs = payment.registrations;
        if (regs && regs.length > 0) {
          const reg = regs[0]; // First registration
          console.log(`${index + 1}. ${reg.user.name || 'N/A'} (${reg.user.email})`);
          console.log(`   Competition: ${reg.competition.title} ${reg.competition.year}`);
          console.log(`   Type: ${reg.registrationType.name}`);
          console.log(`   Registrations: ${regs.length} item(s)`);
          console.log(`   Order ID: ${payment.orderId}`);
          console.log(`   Amount: LKR ${payment.amount.toLocaleString()}`);
          console.log(`   Status: ${payment.status}`);
          console.log(`   Date: ${payment.createdAt.toLocaleString()}`);
          if (payment.completedAt) {
            console.log(`   Completed: ${payment.completedAt.toLocaleString()}`);
          }
          if (payment.paymentId) {
            console.log(`   PayHere Payment ID: ${payment.paymentId}`);
          }
          console.log('');
        }
      });

      if (payherePayments.length > 10) {
        console.log(`... and ${payherePayments.length - 10} more payments\n`);
      }
    }

    // Also check total registrations for comparison
    const totalRegistrations = await prisma.competitionRegistration.count();
    const totalPayments = await prisma.competitionPayment.count();
    const bankTransferPayments = await prisma.competitionPayment.count({
      where: {
        paymentMethod: 'BANK_TRANSFER',
      },
    });

    console.log('═'.repeat(80));
    console.log('\n📊 Overall Statistics:');
    console.log(`   Total Registrations: ${totalRegistrations}`);
    console.log(`   Total Payments: ${totalPayments}`);
    console.log(`   PayHere Payments: ${payherePayments.length} (${totalPayments > 0 ? ((payherePayments.length / totalPayments) * 100).toFixed(1) : 0}%)`);
    console.log(`   Bank Transfer Payments: ${bankTransferPayments} (${totalPayments > 0 ? ((bankTransferPayments / totalPayments) * 100).toFixed(1) : 0}%)`);
    console.log('');

  } catch (error) {
    console.error('❌ Error checking PayHere payments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPayHerePayments();
