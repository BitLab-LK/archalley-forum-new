/**
 * Cleanup Script: Remove Old Draft Submissions
 * Run this once to clean up draft submissions since we removed the draft feature
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDraftSubmissions() {
  try {
    console.log('🧹 Starting cleanup of DRAFT submissions...\n');

    // First, get all draft submissions to show what will be deleted
    const draftSubmissions = await prisma.competitionSubmission.findMany({
      where: { status: 'DRAFT' },
      select: {
        id: true,
        registrationNumber: true,
        title: true,
        submissionCategory: true,
        userId: true,
        createdAt: true,
      },
    });

    if (draftSubmissions.length === 0) {
      console.log('✅ No DRAFT submissions found. Database is clean!');
      return;
    }

    console.log(`📋 Found ${draftSubmissions.length} DRAFT submission(s):\n`);
    draftSubmissions.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.registrationNumber || 'N/A'} - "${sub.title || 'Untitled'}"`);
      console.log(`   Category: ${sub.submissionCategory}`);
      console.log(`   Created: ${sub.createdAt.toLocaleDateString()}\n`);
    });

    // Delete all draft submissions and their related votes
    const result = await prisma.competitionSubmission.deleteMany({
      where: { status: 'DRAFT' },
    });

    console.log(`✅ Successfully deleted ${result.count} DRAFT submission(s)!`);
    console.log('🎉 Cleanup completed!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDraftSubmissions()
  .then(() => {
    console.log('✨ Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
