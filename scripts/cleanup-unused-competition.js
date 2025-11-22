/**
 * Cleanup Script: Remove Unused Competition
 * 
 * Purpose: Delete "Innovative Design Challenge 2025" after migration
 * 
 * Safety: Checks for any remaining registrations before deletion
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UNUSED_COMPETITION_SLUG = 'innovative-design-challenge-2025';

async function main() {
  console.log('🧹 Starting Competition Cleanup\n');

  try {
    // Step 1: Find the unused competition
    console.log('📋 Step 1: Finding unused competition...');
    const unusedCompetition = await prisma.competition.findUnique({
      where: { slug: UNUSED_COMPETITION_SLUG },
      select: { 
        id: true, 
        title: true, 
        slug: true,
        _count: {
          select: {
            registrations: true,
            registrationTypes: true
          }
        }
      }
    });

    if (!unusedCompetition) {
      console.log('⚠️  Competition not found. Already deleted?');
      return;
    }

    console.log(`  ✅ Found: "${unusedCompetition.title}"`);
    console.log(`  📊 Registrations: ${unusedCompetition._count.registrations}`);
    console.log(`  📊 Registration Types: ${unusedCompetition._count.registrationTypes}\n`);

    // Step 2: Safety check - ensure no registrations
    if (unusedCompetition._count.registrations > 0) {
      throw new Error('❌ Cannot delete! Competition still has registrations. Run migration first.');
    }

    // Step 3: Show what will be deleted
    console.log('⚠️  DELETION CONFIRMATION');
    console.log('─'.repeat(50));
    console.log(`Competition: ${unusedCompetition.title}`);
    console.log(`Slug: ${unusedCompetition.slug}`);
    console.log(`ID: ${unusedCompetition.id}`);
    console.log('\n🗑️  This will delete:');
    console.log(`  - Competition record`);
    if (unusedCompetition._count.registrationTypes > 0) {
      console.log(`  - ${unusedCompetition._count.registrationTypes} registration type(s)`);
    }
    console.log('\n✅ No registrations to lose (already migrated)\n');

    // Check if execution is confirmed
    const args = process.argv.slice(2);
    if (args[0] !== 'confirm') {
      console.log('🛑 DRY-RUN MODE - No deletion performed');
      console.log('\n📋 To delete the unused competition, run:');
      console.log('   node scripts/cleanup-unused-competition.js confirm\n');
      return;
    }

    // Step 4: Delete registration types first (if any)
    if (unusedCompetition._count.registrationTypes > 0) {
      console.log('🔄 Step 4: Deleting registration types...');
      const deletedTypes = await prisma.competitionRegistrationType.deleteMany({
        where: { competitionId: unusedCompetition.id }
      });
      console.log(`  ✅ Deleted ${deletedTypes.count} registration type(s)\n`);
    }

    // Step 5: Delete the competition
    console.log('🔄 Step 5: Deleting competition...');
    await prisma.competition.delete({
      where: { id: unusedCompetition.id }
    });
    console.log('  ✅ Competition deleted successfully!\n');

    // Step 6: Verify deletion
    console.log('✔️  Step 6: Verifying deletion...');
    const checkDeleted = await prisma.competition.findUnique({
      where: { slug: UNUSED_COMPETITION_SLUG }
    });

    if (checkDeleted === null) {
      console.log('  ✅ Verified: Competition no longer exists\n');
    } else {
      throw new Error('Deletion verification failed!');
    }

    console.log('✨ Cleanup completed successfully!\n');
    console.log('📋 Summary:');
    console.log('  ✅ Unused competition removed');
    console.log('  ✅ All registrations preserved in main competition');
    console.log('  ✅ Database cleaned up\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
