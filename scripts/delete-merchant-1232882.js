const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function deleteMerchant1232882Data() {
  try {
    console.log('='.repeat(80));
    console.log('🗑️  DELETING MERCHANT 1232882 (SANDBOX) DATA');
    console.log('='.repeat(80));
    
    // Find all payments for merchant 1232882
    const payments = await prisma.competitionPayment.findMany({
      where: {
        merchantId: '1232882'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        registrations: true
      }
    });
    
    if (payments.length === 0) {
      console.log('\n❌ No payments found for merchant 1232882\n');
      return;
    }
    
    console.log(`\nFound ${payments.length} payments to delete`);
    console.log(`Total Amount: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR`);
    
    // Show user details
    const uniqueUsers = new Set();
    payments.forEach(p => {
      if (p.user?.email) {
        uniqueUsers.add(`${p.user.name} (${p.user.email})`);
      }
    });
    console.log(`Users: ${[...uniqueUsers].join(', ')}`);
    
    // Count associated registrations
    const totalRegistrations = payments.reduce((sum, p) => sum + p.registrations.length, 0);
    console.log(`Associated Registrations: ${totalRegistrations}`);
    
    // Status breakdown
    const statusBreakdown = {};
    payments.forEach(p => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    });
    console.log('\nStatus Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Create backup
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFile = `merchant-1232882-backup-${timestamp}.json`;
    const backupData = {
      timestamp: new Date().toISOString(),
      merchantId: '1232882',
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      payments: payments
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`\n✅ Backup created: ${backupFile}`);
    
    // Delete in transaction
    console.log('\n🔄 Starting deletion...\n');
    
    const result = await prisma.$transaction(async (tx) => {
      // Delete all registrations associated with these payments
      const deletedRegistrations = await tx.competitionRegistration.deleteMany({
        where: {
          paymentId: {
            in: payments.map(p => p.id)
          }
        }
      });
      
      // Delete all payments
      const deletedPayments = await tx.competitionPayment.deleteMany({
        where: {
          merchantId: '1232882'
        }
      });
      
      return {
        deletedRegistrations: deletedRegistrations.count,
        deletedPayments: deletedPayments.count
      };
    });
    
    console.log('✅ Deletion Complete!');
    console.log(`   Deleted Registrations: ${result.deletedRegistrations}`);
    console.log(`   Deleted Payments: ${result.deletedPayments}`);
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteMerchant1232882Data();
