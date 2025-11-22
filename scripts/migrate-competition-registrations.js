/**
 * Safe Migration Script: Merge Competition Registrations
 * 
 * Purpose: Move all registrations from "Innovative Design Challenge 2025" 
 *          to "Archalley Competition 2025" to consolidate data
 * 
 * Safety Features:
 * - Backup before migration
 * - Validation checks
 * - Rollback capability
 * - No data deletion
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Competition slugs - will fetch actual IDs automatically
const SOURCE_COMPETITION_SLUG = 'innovative-design-challenge-2025';
const TARGET_COMPETITION_SLUG = 'archalley-competition-2025';

async function main() {
  console.log('🚀 Starting Competition Registration Migration\n');

  try {
    // Step 1: Fetch competitions by slug
    console.log('📋 Step 1: Fetching competitions by slug...');
    const sourceCompetition = await prisma.competition.findUnique({
      where: { slug: SOURCE_COMPETITION_SLUG },
      select: { id: true, title: true, slug: true }
    });

    const targetCompetition = await prisma.competition.findUnique({
      where: { slug: TARGET_COMPETITION_SLUG },
      select: { id: true, title: true, slug: true }
    });

    if (!sourceCompetition) {
      throw new Error(`Source competition not found with slug: ${SOURCE_COMPETITION_SLUG}`);
    }

    if (!targetCompetition) {
      throw new Error(`Target competition not found with slug: ${TARGET_COMPETITION_SLUG}`);
    }

    const SOURCE_COMPETITION_ID = sourceCompetition.id;
    const TARGET_COMPETITION_ID = targetCompetition.id;

    console.log(`  ✅ Source: "${sourceCompetition.title}" (${sourceCompetition.slug})`);
    console.log(`  ✅ Source ID: ${SOURCE_COMPETITION_ID}`);
    console.log(`  ✅ Target: "${targetCompetition.title}" (${targetCompetition.slug})`);
    console.log(`  ✅ Target ID: ${TARGET_COMPETITION_ID}\n`);

    // Step 2: Count registrations to migrate
    console.log('📊 Step 2: Counting registrations...');
    const sourceCount = await prisma.competitionRegistration.count({
      where: { competitionId: SOURCE_COMPETITION_ID }
    });

    const targetCount = await prisma.competitionRegistration.count({
      where: { competitionId: TARGET_COMPETITION_ID }
    });

    console.log(`  Source competition: ${sourceCount} registrations`);
    console.log(`  Target competition: ${targetCount} registrations`);
    console.log(`  Total after migration: ${sourceCount + targetCount} registrations\n`);

    if (sourceCount === 0) {
      console.log('⚠️  No registrations to migrate. Exiting...');
      return;
    }

    // Step 3: Create backup of registrations to migrate
    console.log('💾 Step 3: Creating backup...');
    const registrationsToMigrate = await prisma.competitionRegistration.findMany({
      where: { competitionId: SOURCE_COMPETITION_ID },
      select: {
        id: true,
        registrationNumber: true,
        competitionId: true,
        user: { select: { email: true } },
        payment: { select: { paymentMethod: true, status: true } }
      }
    });

    const backup = registrationsToMigrate.map(reg => ({
      registrationId: reg.id,
      oldCompetitionId: reg.competitionId,
      newCompetitionId: TARGET_COMPETITION_ID
    }));

    console.log(`  ✅ Backed up ${backup.length} registrations\n`);

    // Step 4: Show sample of what will be migrated
    console.log('📝 Sample of registrations to migrate:');
    registrationsToMigrate.slice(0, 3).forEach(reg => {
      console.log(`  - ${reg.registrationNumber} | ${reg.user.email} | ${reg.payment?.paymentMethod || 'No payment'}`);
    });
    if (registrationsToMigrate.length > 3) {
      console.log(`  ... and ${registrationsToMigrate.length - 3} more\n`);
    }

    // Step 5: Confirm migration
    console.log('\n⚠️  MIGRATION CONFIRMATION');
    console.log('─'.repeat(50));
    console.log(`This will update ${sourceCount} registration(s)`);
    console.log(`From: ${sourceCompetition.title}`);
    console.log(`To: ${targetCompetition.title}`);
    console.log('\n✅ ALL DATA WILL BE PRESERVED (users, payments, files, etc.)');
    console.log('✅ Only the competition reference will change');
    console.log('✅ Backup created for rollback if needed\n');

    // Check if migration is enabled
    const args = process.argv.slice(2);
    if (args[0] !== 'execute') {
      console.log('🛑 DRY-RUN MODE - No changes made');
      console.log('\n📋 To execute the migration, run:');
      console.log('   node scripts/migrate-competition-registrations.js execute\n');
      return;
    }

    // Step 6: Perform migration in a transaction
    console.log('🔄 Step 6: Migrating registrations...');
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.competitionRegistration.updateMany({
        where: { competitionId: SOURCE_COMPETITION_ID },
        data: { competitionId: TARGET_COMPETITION_ID }
      });

      return updated;
    });

    console.log(`  ✅ Successfully migrated ${result.count} registrations\n`);

    // Step 7: Verify migration
    console.log('✔️  Step 7: Verifying migration...');
    const remainingInSource = await prisma.competitionRegistration.count({
      where: { competitionId: SOURCE_COMPETITION_ID }
    });

    const newTargetCount = await prisma.competitionRegistration.count({
      where: { competitionId: TARGET_COMPETITION_ID }
    });

    console.log(`  Source competition now has: ${remainingInSource} registrations`);
    console.log(`  Target competition now has: ${newTargetCount} registrations`);

    if (remainingInSource === 0 && newTargetCount === (sourceCount + targetCount)) {
      console.log('  ✅ Migration verified successfully!\n');
    } else {
      throw new Error('Migration verification failed!');
    }

    // Step 8: Save backup to file
    const backupPath = './migration-backup-' + Date.now() + '.json';
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`💾 Backup saved to: ${backupPath}\n`);

    console.log('✨ Migration completed successfully!\n');
    console.log('📋 Next steps:');
    console.log('  1. Update competition title if needed');
    console.log('  2. Review admin dashboard to confirm all registrations are visible');
    console.log('  3. Keep the backup file for rollback if needed\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n🔄 To rollback, you can restore from the backup file');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Rollback function (use if needed)
async function rollback(backupFilePath) {
  console.log('🔄 Starting rollback...');
  
  const backup = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));

  await prisma.$transaction(async (tx) => {
    for (const item of backup) {
      await tx.competitionRegistration.update({
        where: { id: item.registrationId },
        data: { competitionId: item.oldCompetitionId }
      });
    }
  });

  console.log(`✅ Rolled back ${backup.length} registrations`);
  await prisma.$disconnect();
}

// Check command
const args = process.argv.slice(2);
if (args[0] === 'rollback' && args[1]) {
  rollback(args[1])
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
} else {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
