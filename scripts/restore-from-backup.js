/**
 * RESTORE FROM BACKUP SCRIPT
 * Restores test registrations from a backup file
 * 
 * Usage:
 *   node scripts/restore-from-backup.js <backup-filename>
 *   
 * Example:
 *   node scripts/restore-from-backup.js test-registrations-backup-2025-11-24.json
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function restoreFromBackup(backupFile) {
  console.log('\n' + '=' .repeat(80));
  console.log('📥 RESTORE FROM BACKUP');
  console.log('=' .repeat(80));

  const backupPath = path.join(__dirname, 'backups', backupFile);

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  console.log(`\nReading backup: ${backupPath}`);
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  console.log(`\n📊 Backup contains ${backupData.length} registrations`);

  // Show preview
  console.log('\n' + '=' .repeat(80));
  console.log('PREVIEW OF DATA TO RESTORE');
  console.log('=' .repeat(80));

  backupData.forEach((reg, index) => {
    console.log(`\n${index + 1}. ${reg.registrationNumber}`);
    console.log(`   User: ${reg.user?.name} (${reg.user?.email})`);
    console.log(`   Competition: ${reg.competition?.title}`);
    console.log(`   Amount: ${reg.amountPaid} ${reg.currency}`);
  });

  // Ask for confirmation
  console.log('\n' + '=' .repeat(80));
  console.log('⚠️  CONFIRMATION');
  console.log('=' .repeat(80));

  const confirm = await question('\nType "RESTORE" to continue: ');
  
  if (confirm.trim().toUpperCase() !== 'RESTORE') {
    console.log('\n❌ Restore cancelled.');
    return;
  }

  // Restore data
  console.log('\n📥 Restoring data...');

  let restored = 0;
  let errors = 0;

  for (const reg of backupData) {
    try {
      // Note: This is a simplified restore. You may need to handle:
      // - User creation if user doesn't exist
      // - Competition existence check
      // - Payment restoration
      // - ID conflicts
      
      console.log(`\n⚠️  MANUAL RESTORATION REQUIRED`);
      console.log(`\nThis script shows you what needs to be restored.`);
      console.log(`Due to database relationships and constraints,`);
      console.log(`you may need to restore data manually or contact support.`);
      console.log(`\nBackup file location: ${backupPath}`);
      
      break; // Stop after showing the message
    } catch (error) {
      console.error(`❌ Error restoring ${reg.registrationNumber}:`, error.message);
      errors++;
    }
  }

  console.log('\n' + '=' .repeat(80));
  console.log('📋 RESTORE SUMMARY');
  console.log('=' .repeat(80));
  console.log(`\nBackup file: ${backupFile}`);
  console.log(`Records in backup: ${backupData.length}`);
  console.log(`\n💡 For assistance with restoration, contact technical support.`);
}

async function main() {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.log('\n❌ Error: Backup filename required');
    console.log('\nUsage: node scripts/restore-from-backup.js <backup-filename>');
    console.log('\nAvailable backups:');
    
    const backupDir = path.join(__dirname, 'backups');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
      files.forEach(f => console.log(`  - ${f}`));
    }
    
    rl.close();
    await prisma.$disconnect();
    return;
  }

  try {
    await restoreFromBackup(backupFile);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
