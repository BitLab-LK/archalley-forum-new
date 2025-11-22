/**
 * Create Test Competition Registration
 * Bypasses PayHere payment for development testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestRegistration() {
  try {
    console.log('🔍 Finding user, competition, and registration type...\n');

    // Find user
    const user = await prisma.users.findUnique({
      where: { email: 'gimhanijayasuriya109@gmail.com' },
    });

    if (!user) {
      console.error('❌ User not found: gimhanijayasuriya109@gmail.com');
      console.log('💡 Create user first or use a different email');
      return;
    }
    console.log('✅ User found:', user.name, `(${user.email})`);

    // Find competition
    const competition = await prisma.competition.findUnique({
      where: { slug: 'innovative-design-challenge-2025' },
    });

    if (!competition) {
      console.error('❌ Competition not found: innovative-design-challenge-2025');
      console.log('💡 Run: npx tsx scripts/seed-competitions.ts');
      return;
    }
    console.log('✅ Competition found:', competition.title);

    // Find registration type (Individual)
    const registrationType = await prisma.competitionRegistrationType.findFirst({
      where: {
        competitionId: competition.id,
        name: { contains: 'Individual' },
      },
    });

    if (!registrationType) {
      console.error('❌ Registration type not found');
      return;
    }
    console.log('✅ Registration type found:', registrationType.name, `(LKR ${registrationType.fee})`);

    // Check if registration already exists
    const existing = await prisma.competitionRegistration.findFirst({
      where: {
        userId: user.id,
        competitionId: competition.id,
      },
    });

    if (existing) {
      console.log('\n⚠️  Registration already exists!');
      console.log('Registration Number:', existing.registrationNumber);
      console.log('Status:', existing.status);
      console.log('\n💡 Delete it first or use a different user');
      return;
    }

    // Generate registration number
    const year = new Date().getFullYear();
    const type = 'IND'; // Individual
    const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const registrationNumber = `AC${year}-${type}-${sequence}`;

    // Create registration
    console.log('\n📝 Creating test registration...');
    const registration = await prisma.competitionRegistration.create({
      data: {
        registrationNumber,
        userId: user.id,
        competitionId: competition.id,
        registrationTypeId: registrationType.id,
        country: 'Sri Lanka',
        participantType: 'INDIVIDUAL',
        members: {
          memberInfo: [
            {
              name: user.name || 'Gimhani Jayasuriya',
              email: user.email,
              phone: '+94712345678',
              idCardUrl: 'test-document.pdf',
              portfolioUrl: 'https://example.com',
            },
          ],
        },
        status: 'CONFIRMED',
        submissionStatus: 'NOT_SUBMITTED',
        amountPaid: registrationType.fee,
        currency: 'LKR',
        registeredAt: new Date(),
        confirmedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        competition: {
          select: {
            title: true,
          },
        },
        registrationType: {
          select: {
            name: true,
            fee: true,
          },
        },
      },
    });

    console.log('\n✅ Registration created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 REGISTRATION DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Registration Number:', registration.registrationNumber);
    console.log('User:', registration.user.name);
    console.log('Email:', registration.user.email);
    console.log('Competition:', registration.competition.title);
    console.log('Type:', registration.registrationType.name);
    console.log('Amount:', `LKR ${registration.amountPaid}`);
    console.log('Status:', registration.status);
    console.log('Submission Status:', registration.submissionStatus);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎯 Next Steps:');
    console.log('1. Go to: http://localhost:3000/admin/competitions/registrations');
    console.log('2. Sign in as admin');
    console.log('3. You should see the registration!');
    console.log('4. Test the email functionality\n');
  } catch (error) {
    console.error('❌ Error creating test registration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRegistration();
