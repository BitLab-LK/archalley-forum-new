/**
 * Open Competition Registration
 * Updates competition status and sets future deadline
 * Run: npx tsx scripts/open-competition-registration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔓 Opening competition registration...\n');

  const slug = 'innovative-design-challenge-2025';

  // Find the competition
  const competition = await prisma.competition.findUnique({
    where: { slug },
  });

  if (!competition) {
    console.log(`❌ Competition not found with slug: ${slug}`);
    console.log('Available competitions:');
    const allCompetitions = await prisma.competition.findMany({
      select: { slug: true, title: true, status: true },
    });
    allCompetitions.forEach((c) => {
      console.log(`  - ${c.slug} (${c.title}) - Status: ${c.status}`);
    });
    return;
  }

  console.log(`📋 Found competition: ${competition.title}`);
  console.log(`   Current status: ${competition.status}`);
  console.log(`   Current deadline: ${competition.registrationDeadline}`);

  // Set registration deadline to 3 months from now
  const newDeadline = new Date();
  newDeadline.setMonth(newDeadline.getMonth() + 3);

  // Update competition
  const updated = await prisma.competition.update({
    where: { slug },
    data: {
      status: 'REGISTRATION_OPEN',
      registrationDeadline: newDeadline,
    },
  });

  console.log('\n✅ Competition registration opened!');
  console.log(`   New status: ${updated.status}`);
  console.log(`   New deadline: ${updated.registrationDeadline.toLocaleDateString()}`);
  console.log(`\n🎉 You can now register at: http://localhost:3000/events/${slug}/register\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error opening registration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
