/**
 * Seed Competition Data
 * This script seeds the database with competition and registration type data
 */

import { PrismaClient, CompetitionStatus, RegistrationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding competition data...\n');

  try {
    // Create Innovative Design Challenge 2025
    const competition2025 = await prisma.competition.upsert({
      where: { slug: 'innovative-design-challenge-2025' },
      update: {},
      create: {
        slug: 'innovative-design-challenge-2025',
        title: 'Innovative Design Challenge',
        description: `Design a sustainable living space that seamlessly integrates with its environment while maximizing energy efficiency and minimizing ecological footprint. Your design should address modern urban challenges including space optimization, resource management, and community integration.`,
        year: 2025,
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-08-15'),
        status: CompetitionStatus.REGISTRATION_OPEN,
        registrationFee: 2000, // Base fee in LKR
        earlyBirdDiscount: 20, // 20% discount
        earlyBirdDeadline: new Date('2025-04-15'),
        registrationDeadline: new Date('2025-06-15'),
        maxTeamSize: 4,
        totalPrizeFund: 500000,
        thumbnail: '/uploads/innovative-design-2025-thumb.svg',
        heroImage: '/uploads/innovative-design-2025-hero.svg',
        prizes: {
          first: { amount: 200000, title: '1st Prize' },
          second: { amount: 100000, title: '2nd Prize' },
          third: { amount: 50000, title: '3rd Prize' },
          innovation: { amount: 150000, title: 'Best Innovation Award' },
          honorableMentions: { count: 3, title: 'Certificate of Excellence' },
          finalists: { count: 15, title: 'Finalist Certificate' },
        },
        requirements: {
          features: [
            'Incorporate at least 3 sustainable design features',
            'Demonstrate innovative use of materials',
            'Include renewable energy integration',
            'Show consideration for local climate and context',
            'Present scalable and adaptable solutions',
            'Address social and community needs',
          ],
        },
        timeline: {
          phases: [
            { number: 1, title: 'Registration Opens', date: '2025-03-15' },
            { number: 2, title: 'Submission Deadline', date: '2025-06-30' },
            { number: 3, title: 'Jury Evaluation', date: '2025-07-01 - 2025-07-31' },
            { number: 4, title: 'Winners Announced', date: '2025-08-15' },
          ],
        },
        judgePanel: {
          judges: [
            { name: 'To Be Announced', title: 'Principal Architect', bio: '' },
            { name: 'To Be Announced', title: 'Sustainable Design Specialist', bio: '' },
            { name: 'To Be Announced', title: 'Urban Planning Expert', bio: '' },
          ],
        },
      },
    });

    console.log('✅ Created competition:', competition2025.title);

    // Create registration types for 2025 competition
    const registrationTypes = [
      {
        competitionId: competition2025.id,
        type: RegistrationType.INDIVIDUAL,
        name: 'Individual',
        description: 'Perfect for solo architects and designers',
        fee: 2000,
        maxMembers: 1,
        isActive: true,
        displayOrder: 1,
      },
      {
        competitionId: competition2025.id,
        type: RegistrationType.TEAM,
        name: 'Team',
        description: 'For collaborative design teams (2-4 members)',
        fee: 2000,
        maxMembers: 4,
        isActive: true,
        displayOrder: 2,
      },
      {
        competitionId: competition2025.id,
        type: RegistrationType.COMPANY,
        name: 'Company',
        description: 'For established firms and companies',
        fee: 2000,
        maxMembers: 6,
        isActive: true,
        displayOrder: 3,
      },
      {
        competitionId: competition2025.id,
        type: RegistrationType.STUDENT,
        name: 'Student',
        description: 'Special rate for students with valid ID',
        fee: 2000,
        maxMembers: 1,
        isActive: true,
        displayOrder: 4,
      },
      {
        competitionId: competition2025.id,
        type: RegistrationType.KIDS,
        name: 'Kids (below 12)',
        description: 'For young creative minds under 12 years',
        fee: 2000,
        maxMembers: 1,
        minAge: 5,
        maxAge: 12,
        isActive: true,
        displayOrder: 5,
      },
    ];

    for (const regType of registrationTypes) {
      const created = await prisma.competitionRegistrationType.upsert({
        where: {
          competitionId_type: {
            competitionId: regType.competitionId,
            type: regType.type,
          },
        },
        update: {},
        create: regType,
      });
      console.log(`  ✅ Created registration type: ${created.name}`);
    }

    // Create Tree Without a Tree 2024 (Past Competition)
    const competition2024 = await prisma.competition.upsert({
      where: { slug: 'tree-without-a-tree' },
      update: {},
      create: {
        slug: 'tree-without-a-tree',
        title: 'Tree without a Tree',
        description: `A competition designed to explore alternative solutions for traditional methods of building Christmas trees, beyond the conventional approach. During the Christmas season, we embraced the spirit of giving by expressing our love and concern for the environment.`,
        year: 2024,
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-12-25'),
        status: CompetitionStatus.COMPLETED,
        registrationFee: 1500,
        registrationDeadline: new Date('2024-11-30'),
        maxTeamSize: 1,
        totalPrizeFund: 250000,
        thumbnail: '/uploads/tree-competition-thumb.jpg',
        prizes: {
          first: { amount: 100000, title: '1st Prize' },
          second: { amount: 75000, title: '2nd Prize' },
          third: { amount: 50000, title: '3rd Prize' },
          honorableMentions: { count: 5, title: 'Certificate of Excellence' },
        },
      },
    });

    console.log('✅ Created competition:', competition2024.title);

    console.log('\n✨ Competition seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding competitions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
