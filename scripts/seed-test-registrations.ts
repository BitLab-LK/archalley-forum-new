/**
 * Test Data Generator for Competition Registration System
 * Run: npx tsx scripts/seed-test-registrations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test registration data...\n');

  // Find or create test users
  console.log('👤 Creating test users...');
  
  const testUsers = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.users.upsert({
      where: { email: `testuser${i}@test.com` },
      update: {},
      create: {
        id: `test-user-${i}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        email: `testuser${i}@test.com`,
        name: `Test User ${i}`,
        password: '$2a$10$test.hash.here', // You should hash properly
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    testUsers.push(user);
  }
  console.log(`✅ Created ${testUsers.length} test users\n`);

  // Get competitions
  console.log('🏆 Fetching competitions...');
  const competitions = await prisma.competition.findMany({
    include: {
      registrationTypes: true,
    },
    take: 2,
  });

  if (competitions.length === 0) {
    console.log('❌ No competitions found. Please run seed-competitions.ts first!');
    return;
  }
  console.log(`✅ Found ${competitions.length} competitions\n`);

  // Create test registrations
  console.log('📝 Creating test registrations...');
  
  const statuses = ['PENDING', 'CONFIRMED', 'SUBMITTED', 'CANCELLED'];
  const submissionStatuses = ['NOT_SUBMITTED', 'DRAFT', 'IN_PROGRESS', 'SUBMITTED'];
  const countries = ['Sri Lanka', 'India', 'United States', 'United Kingdom', 'Australia'];
  
  let registrationCount = 0;

  for (const competition of competitions) {
    for (let i = 0; i < 10; i++) {
      const user = testUsers[i % testUsers.length];
      const regType = competition.registrationTypes[i % competition.registrationTypes.length];
      const status = statuses[i % statuses.length];
      const country = countries[i % countries.length];
      
      const registrationNumber = `REG-${competition.slug.toUpperCase()}-${String(i + 1).padStart(4, '0')}`;
      
      // Create team members for team registrations
      const isTeam = regType.name.toLowerCase().includes('team');
      const members = isTeam ? [
        {
          name: user.name,
          email: user.email,
          role: 'Team Lead',
          isPrimary: true,
        },
        {
          name: `Team Member ${i + 1}`,
          email: `member${i + 1}@test.com`,
          role: 'Designer',
          isPrimary: false,
        },
        {
          name: `Team Member ${i + 2}`,
          email: `member${i + 2}@test.com`,
          role: 'Developer',
          isPrimary: false,
        },
      ] : [];

      // Create registration
      const registration = await prisma.competitionRegistration.create({
        data: {
          registrationNumber,
          userId: user.id,
          competitionId: competition.id,
          registrationTypeId: regType.id,
          participantType: isTeam ? 'TEAM' : 'INDIVIDUAL',
          status: status as any,
          submissionStatus: submissionStatuses[i % submissionStatuses.length] as any,
          country,
          amountPaid: regType.fee,
          members: members,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      });

      // Create payment for confirmed registrations
      if (status === 'CONFIRMED') {
        const orderId = `ORDER-${competition.slug.toUpperCase()}-${String(i + 1).padStart(5, '0')}`;
        
        await prisma.competitionPayment.create({
          data: {
            orderId,
            userId: user.id,
            competitionId: competition.id,
            amount: regType.fee,
            currency: 'LKR',
            merchantId: 'TEST_MERCHANT',
            status: 'COMPLETED',
            paymentMethod: ['VISA', 'MASTER', 'AMEX'][i % 3],
            cardHolderName: user.name || 'Test User',
            items: [
              {
                registrationId: registration.id,
                competitionId: competition.id,
                registrationTypeId: regType.id,
                quantity: 1,
                amount: regType.fee,
              },
            ],
            completedAt: new Date(),
          },
        });
      }

      registrationCount++;
      process.stdout.write(`\rCreated ${registrationCount} registrations...`);
    }
  }

  console.log(`\n✅ Created ${registrationCount} test registrations\n`);

  // Print summary
  console.log('📊 Summary:');
  const totalRegs = await prisma.competitionRegistration.count();
  const confirmedRegs = await prisma.competitionRegistration.count({
    where: { status: 'CONFIRMED' },
  });
  const pendingRegs = await prisma.competitionRegistration.count({
    where: { status: 'PENDING' },
  });
  const submittedRegs = await prisma.competitionRegistration.count({
    where: { submissionStatus: 'SUBMITTED' },
  });
  const totalPayments = await prisma.competitionPayment.count();

  console.log(`  Total Registrations: ${totalRegs}`);
  console.log(`  Confirmed: ${confirmedRegs}`);
  console.log(`  Pending: ${pendingRegs}`);
  console.log(`  Submitted: ${submittedRegs}`);
  console.log(`  Total Payments: ${totalPayments}`);
  console.log('\n✨ Test data seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
