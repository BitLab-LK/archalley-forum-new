/**
 * Script to create a test PayHere payment for testing admin dashboard
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestPayHerePayment() {
  try {
    console.log('🧪 Creating test PayHere payment...\n');

    // Get a user to associate with the payment
    const user = await prisma.users.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      console.error('❌ No users found in database. Please create a user first.');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})\n`);

    // Get a competition
    const competition = await prisma.competition.findFirst({
      where: {
        status: 'REGISTRATION_OPEN',
      },
      select: {
        id: true,
        title: true,
        year: true,
        slug: true,
      },
    });

    if (!competition) {
      console.error('❌ No competitions found. Please create a competition first.');
      return;
    }

    console.log(`✅ Found competition: ${competition.title} (${competition.year})\n`);

    // Get a registration type
    const registrationType = await prisma.competitionRegistrationType.findFirst({
      where: {
        competitionId: competition.id,
      },
      select: {
        id: true,
        name: true,
        fee: true,
      },
    });

    if (!registrationType) {
      console.error('❌ No registration types found. Please create registration types first.');
      return;
    }

    console.log(`✅ Found registration type: ${registrationType.name} (LKR ${registrationType.fee})\n`);

    // Generate unique order ID
    const timestamp = Date.now();
    const orderId = `TEST-PAYHERE-${timestamp}`;

    console.log('📝 Creating test payment record...');

    // Create payment with PayHere details
    const payment = await prisma.competitionPayment.create({
      data: {
        orderId: orderId,
        userId: user.id,
        competitionId: competition.id,
        amount: registrationType.fee,
        currency: 'LKR',
        merchantId: 'TEST_MERCHANT',
        status: 'COMPLETED', // Simulating successful payment
        paymentId: `PH-TEST-${timestamp}`, // PayHere payment ID
        statusCode: '2', // Success code
        md5sig: 'test_signature_hash',
        paymentMethod: 'PAYHERE', // THIS IS THE KEY FIELD
        cardHolderName: 'Test Card Holder',
        cardNo: 'XXXX-XXXX-XXXX-1234', // Masked card number
        completedAt: new Date(),
        items: [
          {
            id: 'test-item-1',
            competitionTitle: competition.title,
            registrationType: registrationType.name,
            country: 'Sri Lanka',
            memberCount: 1,
            unitPrice: registrationType.fee,
            subtotal: registrationType.fee,
          },
        ],
        customerDetails: {
          firstName: 'Test',
          lastName: 'User',
          email: user.email,
          phone: '+94771234567',
          address: '123 Test Street',
          city: 'Colombo',
          country: 'Sri Lanka',
        },
        responseData: {
          merchant_id: 'TEST_MERCHANT',
          order_id: orderId,
          payhere_amount: registrationType.fee.toString(),
          payhere_currency: 'LKR',
          status_code: '2',
          md5sig: 'test_signature_hash',
          method: 'VISA',
          status_message: 'Successfully completed',
          card_holder_name: 'Test Card Holder',
          card_no: 'XXXX-XXXX-XXXX-1234',
          payment_id: `PH-TEST-${timestamp}`,
        },
        metadata: {
          cartId: 'test-cart-id',
          itemIds: ['test-item-1'],
          competitionIds: [competition.id],
          testPayment: true,
        },
      },
    });

    console.log(`✅ Payment created with ID: ${payment.id}\n`);

    // Generate unique registration number (6 random characters)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let registrationNumber = '';
    for (let i = 0; i < 6; i++) {
      registrationNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Generate unique display code
    const displayCode = `ARC${competition.year}-${registrationNumber}`;

    console.log('📝 Creating registration record...');

    // Create registration
    const registration = await prisma.competitionRegistration.create({
      data: {
        registrationNumber: registrationNumber,
        displayCode: displayCode,
        userId: user.id,
        competitionId: competition.id,
        registrationTypeId: registrationType.id,
        paymentId: payment.id,
        country: 'Sri Lanka',
        participantType: 'INDIVIDUAL',
        status: 'CONFIRMED',
        amountPaid: registrationType.fee,
        currency: 'LKR',
        confirmedAt: new Date(),
        members: [
          {
            name: user.name,
            email: user.email,
            phone: '+94771234567',
            address: '123 Test Street',
          },
        ],
      },
    });

    console.log(`✅ Registration created: ${registration.registrationNumber}\n`);

    console.log('═'.repeat(80));
    console.log('\n🎉 Test PayHere Payment Created Successfully!\n');
    console.log('📊 Details:');
    console.log(`   Order ID: ${payment.orderId}`);
    console.log(`   PayHere Payment ID: ${payment.paymentId}`);
    console.log(`   Registration Number: ${registration.registrationNumber}`);
    console.log(`   Display Code: ${registration.displayCode}`);
    console.log(`   Amount: LKR ${payment.amount.toLocaleString()}`);
    console.log(`   Payment Method: ${payment.paymentMethod}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Card Holder: ${payment.cardHolderName}`);
    console.log(`   Card Number: ${payment.cardNo}`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Competition: ${competition.title} ${competition.year}`);
    console.log(`   Registration Type: ${registrationType.name}`);
    console.log('');
    console.log('✅ You can now view this payment in the admin dashboard!');
    console.log('   URL: http://localhost:3000/admin/competitions/registrations');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating test payment:', error);
    if (error.code === 'P2002') {
      console.error('💡 Unique constraint violation. Try running the script again.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestPayHerePayment();
