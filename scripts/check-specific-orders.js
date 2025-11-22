const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificOrders() {
  const orderIds = [
    'ORDER-AC2025-00011',
    'ORDER-AC2025-00013-831915',
    'ORDER-AC2025-00026-265305',
    'ORDER-AC2025-00110-390543'
  ];

  console.log('\n🔍 Checking Order Status...\n');
  console.log('='.repeat(60));

  for (const orderId of orderIds) {
    const payment = await prisma.competitionPayment.findUnique({
      where: { orderId },
      select: {
        orderId: true,
        status: true,
        amount: true,
        currency: true,
        createdAt: true,
        completedAt: true,
        paymentMethod: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (payment) {
      console.log(`\n📦 ${orderId}`);
      console.log(`   Status: ${payment.status === 'PENDING' ? '⏳ PENDING' : payment.status === 'COMPLETED' ? '✅ COMPLETED' : '❌ ' + payment.status}`);
      console.log(`   Amount: ${payment.currency} ${payment.amount.toLocaleString()}`);
      console.log(`   Method: ${payment.paymentMethod || 'N/A'}`);
      console.log(`   User: ${payment.user?.name || 'N/A'} (${payment.user?.email || 'N/A'})`);
      console.log(`   Created: ${payment.createdAt.toLocaleString()}`);
      if (payment.completedAt) {
        console.log(`   Completed: ${payment.completedAt.toLocaleString()}`);
      }
    } else {
      console.log(`\n❌ ${orderId} - NOT FOUND`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
  await prisma.$disconnect();
}

checkSpecificOrders();
