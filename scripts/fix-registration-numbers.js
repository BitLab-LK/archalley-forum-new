/**
 * Fix Registration Numbers - Replace Long Format with 6-Digit Format
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Registration number generator (from competition-utils.ts logic)
function generateRegistrationNumber() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomBytes = crypto.randomBytes(6);
  
  let registrationNumber = '';
  for (let i = 0; i < 6; i++) {
    registrationNumber += chars[randomBytes[i] % chars.length];
  }
  
  return registrationNumber;
}

async function generateUniqueRegistrationNumber(maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    const registrationNumber = generateRegistrationNumber();
    
    const existing = await prisma.competitionRegistration.findFirst({
      where: { registrationNumber },
    });
    
    if (!existing) {
      return registrationNumber;
    }
    
    console.log(`   ⚠️  Collision: ${registrationNumber}, retrying...`);
  }
  
  throw new Error('Failed to generate unique registration number');
}

async function fixRegistrationNumbers() {
  console.log('\n🔧 Fixing Registration Numbers\n');
  console.log('='.repeat(60));

  try {
    // Find registrations with long format (starts with REG-)
    const badRegistrations = await prisma.competitionRegistration.findMany({
      where: {
        registrationNumber: {
          startsWith: 'REG-'
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        competition: {
          select: {
            title: true,
          }
        }
      }
    });

    if (badRegistrations.length === 0) {
      console.log('\n✅ No registrations with long format found. All good!\n');
      return;
    }

    console.log(`\n📋 Found ${badRegistrations.length} registration(s) with long format\n`);

    for (const reg of badRegistrations) {
      const oldNumber = reg.registrationNumber;
      const newNumber = await generateUniqueRegistrationNumber();

      await prisma.competitionRegistration.update({
        where: { id: reg.id },
        data: { registrationNumber: newNumber }
      });

      console.log(`✅ Updated: ${oldNumber}`);
      console.log(`   -> New: ${newNumber}`);
      console.log(`   User: ${reg.user?.name || 'N/A'} (${reg.user?.email || 'N/A'})`);
      console.log(`   Competition: ${reg.competition.title}`);
      console.log('');
    }

    console.log('='.repeat(60));
    console.log(`\n✅ Successfully updated ${badRegistrations.length} registration number(s)\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixRegistrationNumbers()
  .then(() => {
    console.log('✅ Script completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
