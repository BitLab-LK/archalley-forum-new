const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function deleteMerchant1221149Data() {
  try {
    console.log('='.repeat(80));
    console.log('🗑️  DELETE MERCHANT 1221149 - GIMHANI JAYASURIYA TEST DATA');
    console.log('='.repeat(80));
    
    // First, get all payments for preview
    const payments = await prisma.competitionPayment.findMany({
      where: {
        merchantId: '1221149'
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        registrations: true
      }
    });
    
    console.log(`\nFound ${payments.length} payments to delete`);
    console.log(`Total Amount: ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} LKR`);
    
    if (payments.length === 0) {
      console.log('\n✅ No payments found for merchant 1221149. Already clean!');
      return;
    }
    
    // Show summary
    const userEmail = payments[0]?.user?.email || 'N/A';
    const userName = payments[0]?.user?.name || 'N/A';
    const totalRegistrations = payments.reduce((sum, p) => sum + p.registrations.length, 0);
    
    console.log(`\nUser: ${userName} (${userEmail})`);
    console.log(`Associated Registrations: ${totalRegistrations}`);
    
    const statusBreakdown = {};
    payments.forEach(p => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    });
    
    console.log('\nStatus Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Create backup
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `merchant-1221149-backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(payments, null, 2));
    console.log(`\n💾 Backup created: ${backupFile}`);
    
    // Delete in transaction
    console.log('\n🗑️  Deleting payments and associated registrations...\n');
    
    const result = await prisma.$transaction(async (tx) => {
      // First delete all associated registrations
      const deletedRegistrations = await tx.competitionRegistration.deleteMany({
        where: {
          paymentId: {
            in: payments.map(p => p.id)
          }
        }
      });
      
      // Then delete all payments
      const deletedPayments = await tx.competitionPayment.deleteMany({
        where: {
          merchantId: '1221149'
        }
      });
      
      return { deletedRegistrations, deletedPayments };
    });
    
    console.log('='.repeat(80));
    console.log('✅ DELETION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Deleted Registrations: ${result.deletedRegistrations.count}`);
    console.log(`Deleted Payments: ${result.deletedPayments.count}`);
    console.log(`Backup Location: ${backupFile}`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error deleting merchant 1221149 data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteMerchant1221149Data();
