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
        earlyBirdDeadline: new Date('2025-04-15'),
        registrationDeadline: new Date('2025-06-15'),
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

    // Create Archalley Competition 2025
    // All dates are in Sri Lanka timezone (Asia/Colombo, UTC+5:30)
    const archalleyCompetition2025 = await prisma.competition.upsert({
      where: { slug: 'archalley-competition-2025' },
      update: {
        // Update dates to ensure they're correct in Sri Lanka timezone (UTC+5:30)
        startDate: new Date('2025-11-11T00:00:00+05:30'), // Registration starts: 11th November 2025, 00:00:00 IST
        endDate: new Date('2026-01-10T23:59:59+05:30'), // Winners announced: 10th January 2026, 23:59:59 IST
        earlyBirdDeadline: new Date('2025-11-20T23:59:59+05:30'), // Early bird ends: 20th November 2025, 23:59:59 IST
        registrationDeadline: new Date('2025-12-24T23:59:59+05:30'), // Late registration ends: 24th December 2025, 23:59:59 IST
        status: CompetitionStatus.REGISTRATION_OPEN,
        timeline: {
          registration: {
            opens: '2025-11-11',
            earlybird: { start: '2025-11-11', end: '2025-11-20' },
            standard: { start: '2025-11-21', end: '2025-12-20' },
            late: { start: '2025-12-21', end: '2025-12-24' },
            kids: { start: '2025-11-11', end: '2025-12-24' }, // Kids can register from Nov 11 to Dec 24
          },
          submissions: {
            start: '2025-12-11',
            faqDeadline: '2025-12-20',
            kidsDeadline: '2025-12-24',
            otherDeadline: '2025-12-24',
          },
          voting: {
            start: '2025-12-25',
            end: '2026-01-04',
          },
          results: {
            announcement: '2026-01-10',
          },
        },
      },
      create: {
        slug: 'archalley-competition-2025',
        title: 'Archalley Competition 2025 - Innovative Christmas Tree',
        description: `"What will a Christmas tree look like in 50 years? Will it float, glow, or live in the metaverse? This year's competition invites you to imagine the tree of tomorrow." Participants are encouraged to explore unconventional, futuristic, and conceptual interpretations, from virtual models to physical tree designs. Your tree can be either minimal or detailed, digital, tech-infused, or completely surreal. There are no rules... Only imagination.`,
        year: 2025,
        // Registration dates in Sri Lanka timezone (Asia/Colombo, UTC+5:30)
        startDate: new Date('2025-11-11T00:00:00+05:30'), // Registration starts: 11th November 2025, 00:00:00 IST
        endDate: new Date('2026-01-10T23:59:59+05:30'), // Winners announced: 10th January 2026, 23:59:59 IST
        status: CompetitionStatus.REGISTRATION_OPEN,
        registrationFee: 2000, // Base fee in LKR
        earlyBirdDeadline: new Date('2025-11-20T23:59:59+05:30'), // Early bird ends: 20th November 2025, 23:59:59 IST
        registrationDeadline: new Date('2025-12-24T23:59:59+05:30'), // Late registration ends: 24th December 2025, 23:59:59 IST
        totalPrizeFund: 0, // Will be updated based on actual prize structure
        prizes: {
          physical: {
            first: { title: '1st Prize', item: 'TABLET' },
            second: { title: '2nd Prize', item: 'DRAWING PAD' },
          },
          digital: {
            first: { title: '1st Prize', item: 'TABLET' },
            second: { title: '2nd Prize', item: 'DRAWING PAD' },
          },
          special: [
            { title: 'Archalley Most Popular Tree Award', description: 'Award for most popular tree' },
          ],
        },
        timeline: {
          registration: {
            opens: '2025-11-11', // Competition Registration starts: 11th November 2025
            earlybird: { start: '2025-11-11', end: '2025-11-20' }, // Early bird: 11th - 20th November 2025
            standard: { start: '2025-11-21', end: '2025-12-20' }, // Standard: 21st November - 20th December 2025
            late: { start: '2025-12-21', end: '2025-12-24' }, // Late: 21st - 24th December 2025
            kids: { start: '2025-11-11', end: '2025-12-24' }, // Kids' Category: 11th November - 24th December 2025
          },
          submissions: {
            start: '2025-12-11', // Submission Start: 11th December 2025
            faqDeadline: '2025-12-20', // Closing Date for FAQ: 20th December 2025
            kidsDeadline: '2025-12-24', // Submission Deadline for Kids' Category: 24th December 2025
            otherDeadline: '2025-12-24', // Submission Deadline for other categories: 24th December 2025
          },
          voting: {
            start: '2025-12-25', // Most popular category voting: 25th December 2025
            end: '2026-01-04', // Voting ends: 4th January 2026
          },
          results: {
            announcement: '2026-01-10', // Announcement of the Winners: 10th January 2026
          },
        },
        requirements: {
          theme: 'Christmas in Future',
          categories: ['Physical Category', 'Digital Category', 'Kids\' Tree Category'],
        },
      },
    });

    console.log('✅ Created competition:', archalleyCompetition2025.title);

    // Create registration types for Archalley Competition 2025
    // Note: Pricing varies by registration period (Earlybird, Standard, Late)
    // These are base prices; the registration system should handle period-based pricing
    const archalleyRegistrationTypes = [
      {
        competitionId: archalleyCompetition2025.id,
        type: RegistrationType.INDIVIDUAL,
        name: 'Single Entry',
        description: 'Individual participant registration',
        fee: 3000, // Standard registration fee
        maxMembers: 1,
        isActive: true,
        displayOrder: 1,
      },
      {
        competitionId: archalleyCompetition2025.id,
        type: RegistrationType.TEAM,
        name: 'Group Entry',
        description: 'Team registration (2 or more members)',
        fee: 5000, // Standard registration fee
        maxMembers: 10,
        isActive: true,
        displayOrder: 2,
      },
      {
        competitionId: archalleyCompetition2025.id,
        type: RegistrationType.STUDENT,
        name: 'Student Entry',
        description: 'Student registration with valid ID',
        fee: 2000,
        maxMembers: 1,
        isActive: true,
        displayOrder: 3,
      },
      {
        competitionId: archalleyCompetition2025.id,
        type: RegistrationType.KIDS,
        name: 'Kids\' Tree Category',
        description: 'For participants under 12 years (single entry only)',
        fee: 2000,
        maxMembers: 1,
        minAge: 5,
        maxAge: 12,
        isActive: true,
        displayOrder: 4,
      },
    ];

    for (const regType of archalleyRegistrationTypes) {
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
