/**
 * Test script to send submission completed email
 * Uses an existing submitted submission from the database
 * 
 * Usage:
 *   npx tsx scripts/test-submission-email.ts [registrationNumber] [testEmail]
 * 
 * Examples:
 *   npx tsx scripts/test-submission-email.ts
 *   npx tsx scripts/test-submission-email.ts 64H945
 *   npx tsx scripts/test-submission-email.ts 64H945 test@example.com
 */

import { PrismaClient } from '@prisma/client';
import { sendSubmissionCreatedEmail } from '../lib/competition-email-service';

const prisma = new PrismaClient();

// Get arguments from command line
const args = process.argv.slice(2);
const registrationNumber = args[0] || null;
const testEmail = args[1] || 'chavindun@gmail.com';

async function testSubmissionEmail() {
  console.log('🚀 Testing Submission Completed Email');
  console.log('─'.repeat(60));
  
  try {
    let submission;
    let registration;
    let competition;
    let user;

    if (registrationNumber) {
      // Find submission by registration number
      console.log(`\n🔍 Looking for submission with registration number: ${registrationNumber}`);
      
      registration = await prisma.competitionRegistration.findUnique({
        where: { registrationNumber },
        include: {
          competition: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!registration) {
        throw new Error(`Registration with number ${registrationNumber} not found`);
      }

      submission = await prisma.competitionSubmission.findUnique({
        where: { registrationId: registration.id },
      });

      if (!submission) {
        throw new Error(`No submission found for registration ${registrationNumber}`);
      }

      competition = registration.competition;
      user = registration.user;
    } else {
      // Find any submitted submission
      console.log('\n🔍 Looking for any submitted submission...');
      
      submission = await prisma.competitionSubmission.findFirst({
        where: {
          status: {
            in: ['PUBLISHED', 'SUBMITTED', 'VALIDATED'],
          },
        },
        include: {
          registration: {
            include: {
              competition: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      if (!submission) {
        throw new Error('No submitted submission found in database. Please provide a registration number or ensure there are submitted submissions.');
      }

      registration = submission.registration;
      competition = registration.competition;
      user = registration.user;
    }

    console.log(`\n✅ Found submission:`);
    console.log(`   Registration Number: ${registration.registrationNumber}`);
    console.log(`   Submission ID: ${submission.id}`);
    console.log(`   Status: ${submission.status}`);
    console.log(`   Category: ${submission.submissionCategory || 'N/A'}`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Competition: ${competition.title}`);

    // Prepare email data
    const emailData = {
      submission: {
        registrationNumber: registration.registrationNumber,
        title: submission.title || `Submission ${registration.registrationNumber}`,
        submissionCategory: submission.submissionCategory || 'N/A',
        submittedAt: submission.submittedAt,
      },
      competition: competition as any,
      userName: user.name || 'Participant',
      userEmail: testEmail, // Use test email instead of actual user email
    };

    console.log(`\n📧 Sending test email to: ${testEmail}`);
    console.log('─'.repeat(60));

    // Send the email
    const success = await sendSubmissionCreatedEmail(emailData);

    if (success) {
      console.log('\n✅ Email sent successfully!');
      console.log(`📬 Please check ${testEmail} for the test email.`);
      console.log('\n📋 Email Details:');
      console.log(`   Subject: Submission Completed - Archalley Competition 2025 - Christmas in Future ✅`);
      console.log(`   Registration Number: ${registration.registrationNumber}`);
      console.log(`   Submission Title: ${emailData.submission.title}`);
      console.log(`   Category: ${emailData.submission.submissionCategory}`);
    } else {
      console.log('\n❌ Failed to send email');
      console.log('Please check the error logs above for details.');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSubmissionEmail()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });

