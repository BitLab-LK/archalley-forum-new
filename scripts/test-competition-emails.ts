/**
 * Test script to send all competition registration and payment emails
 * Sends all email types to chavindu@bitlab.lk for testing
 */

import { PrismaClient } from '@prisma/client';
import {
  sendRegistrationConfirmationEmail,
  sendPaymentReceiptEmail,
  sendCompetitionGuidelinesEmail,
  sendBankTransferPendingEmail,
  sendPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
  sendSubmissionReminderEmail,
} from '../lib/competition-email-service';

const prisma = new PrismaClient();

// Test email address
const TEST_EMAIL = 'chavindun@gmail.com';
const TEST_USER_NAME = 'Chavindu';

// Create mock data for testing
async function createMockData() {
  // Get the first competition (preferably one that's open for registration)
  const competition = await prisma.competition.findFirst({
    where: {
      status: {
        in: ['REGISTRATION_OPEN', 'IN_PROGRESS', 'UPCOMING'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!competition) {
    throw new Error('No active competition found. Please create a competition first.');
  }

  // Get the first registration type
  const registrationType = await prisma.competitionRegistrationType.findFirst({
    where: {
      competitionId: competition.id,
    },
  });

  if (!registrationType) {
    throw new Error('No registration type found for the competition.');
  }

  // Create a mock registration
  const mockRegistration = {
    id: 'test-registration-id',
    registrationNumber: `TEST-${Date.now()}`,
    competitionId: competition.id,
    userId: 'test-user-id',
    registrationTypeId: registrationType.id,
    amountPaid: Number(registrationType.fee) || 5000, // Ensure it's a number
    currency: 'LKR',
    country: 'Sri Lanka',
    participantType: 'INDIVIDUAL' as const,
    status: 'PENDING' as const,
    submissionStatus: 'NOT_SUBMITTED' as const,
    registeredAt: new Date(),
    confirmedAt: null,
    submittedAt: null,
    members: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    paymentId: null,
    paymentOrderId: `TEST-ORDER-${Date.now()}`,
    teamName: null,
    companyName: null,
    businessRegistrationNo: null,
    teamMembers: null,
    referralSource: null,
    submissionFiles: null,
    submissionNotes: null,
    submissionUrl: null,
    score: null,
    judgeComments: null,
    rank: null,
    award: null,
    certificateUrl: null,
    metadata: null,
  };

  return {
    competition,
    registrationType,
    mockRegistration,
  };
}

async function testAllEmails() {
  console.log('🚀 Starting email tests...');
  console.log(`📧 Test email address: ${TEST_EMAIL}`);
  console.log('─'.repeat(60));

  try {
    const { competition, registrationType, mockRegistration } = await createMockData();

    const emailData = {
      registration: mockRegistration as any,
      competition: competition as any,
      registrationType: registrationType as any,
      userName: TEST_USER_NAME,
      userEmail: TEST_EMAIL,
      members: [],
      paymentOrderId: mockRegistration.paymentOrderId,
    };

    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    // Test 1: Registration Confirmation Email
    console.log('\n📧 Test 1: Registration Confirmation Email');
    try {
      const success = await sendRegistrationConfirmationEmail(emailData);
      results.push({ name: 'Registration Confirmation', success });
      console.log(success ? '✅ Sent successfully' : '❌ Failed to send');
    } catch (error: any) {
      results.push({ name: 'Registration Confirmation', success: false, error: error.message });
      console.log(`❌ Error: ${error.message}`);
    }

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Payment Receipt Email
    console.log('\n📧 Test 2: Payment Receipt Email');
    try {
      const success = await sendPaymentReceiptEmail(emailData);
      results.push({ name: 'Payment Receipt', success });
      console.log(success ? '✅ Sent successfully' : '❌ Failed to send');
    } catch (error: any) {
      results.push({ name: 'Payment Receipt', success: false, error: error.message });
      console.log(`❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Competition Guidelines Email
    console.log('\n📧 Test 3: Competition Guidelines Email');
    try {
      const success = await sendCompetitionGuidelinesEmail(emailData);
      results.push({ name: 'Competition Guidelines', success });
      console.log(success ? '✅ Sent successfully' : '❌ Failed to send');
    } catch (error: any) {
      results.push({ name: 'Competition Guidelines', success: false, error: error.message });
      console.log(`❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Bank Transfer Pending Email
    console.log('\n📧 Test 4: Bank Transfer Pending Email');
    try {
      const success = await sendBankTransferPendingEmail({
        registration: mockRegistration as any,
        competition: competition as any,
        registrationType: registrationType as any,
        userName: TEST_USER_NAME,
        userEmail: TEST_EMAIL,
      });
      results.push({ name: 'Bank Transfer Pending', success });
      console.log(success ? '✅ Sent successfully' : '❌ Failed to send');
    } catch (error: any) {
      results.push({ name: 'Bank Transfer Pending', success: false, error: error.message });
      console.log(`❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Payment Verified Email
    console.log('\n📧 Test 5: Payment Verified Email');
    try {
      const success = await sendPaymentVerifiedEmail({
        registration: mockRegistration as any,
        competition: competition as any,
        registrationType: registrationType as any,
        userName: TEST_USER_NAME,
        userEmail: TEST_EMAIL,
      });
      results.push({ name: 'Payment Verified', success });
      console.log(success ? '✅ Sent successfully' : '❌ Failed to send');
    } catch (error: any) {
      results.push({ name: 'Payment Verified', success: false, error: error.message });
      console.log(`❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 6: Payment Rejected Email
    console.log('\n📧 Test 6: Payment Rejected Email');
    try {
      const success = await sendPaymentRejectedEmail({
        registration: mockRegistration as any,
        competition: competition as any,
        registrationType: registrationType as any,
        userName: TEST_USER_NAME,
        userEmail: TEST_EMAIL,
        rejectReason: 'Bank slip image is unclear or unreadable. Please resubmit with a clear image.',
      });
      results.push({ name: 'Payment Rejected', success });
      console.log(success ? '✅ Sent successfully' : '❌ Failed to send');
    } catch (error: any) {
      results.push({ name: 'Payment Rejected', success: false, error: error.message });
      console.log(`❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 7: Submission Reminder Email
    console.log('\n📧 Test 7: Submission Reminder Email');
    try {
      const success = await sendSubmissionReminderEmail(
        TEST_EMAIL,
        TEST_USER_NAME,
        competition as any,
        mockRegistration.registrationNumber,
        7 // 7 days remaining
      );
      results.push({ name: 'Submission Reminder', success });
      console.log(success ? '✅ Sent successfully' : '❌ Failed to send');
    } catch (error: any) {
      results.push({ name: 'Submission Reminder', success: false, error: error.message });
      console.log(`❌ Error: ${error.message}`);
    }

    // Print summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n' + '─'.repeat(60));
    console.log(`Total: ${results.length} emails`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('─'.repeat(60));

    if (failed === 0) {
      console.log('\n🎉 All emails sent successfully!');
      console.log(`📬 Please check ${TEST_EMAIL} for all test emails.`);
    } else {
      console.log('\n⚠️  Some emails failed. Please check the errors above.');
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testAllEmails()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });

