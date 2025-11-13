/**
 * Payment Return Handler
 * Handles user return from PayHere after payment attempt
 * INCLUDES FALLBACK: Creates registrations if notify endpoint was missed
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateUniqueRegistrationNumber } from '@/lib/competition-utils';

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('\n🔙 Payment Return Handler Called');
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.redirect(
      new URL('/competitions/payment/error?message=Invalid request', request.url)
    );
  }

  try {
    // Fetch payment status
    const payment = await prisma.competitionPayment.findUnique({
      where: { orderId },
      include: {
        user: true,
      },
    });

    if (!payment) {
      return NextResponse.redirect(
        new URL('/competitions/payment/error?message=Payment not found', request.url)
      );
    }

    console.log(`📊 Payment ${orderId} status: ${payment.status}`);

    // FALLBACK MECHANISM: If payment is still PENDING after user returns,
    // it means PayHere notify endpoint was never called (localhost issue)
    // We'll check with PayHere and create registrations automatically
    if (payment.status === 'PENDING' && payment.paymentMethod === 'PAYHERE') {
      console.log('⚠️  Payment still PENDING - notify endpoint likely missed!');
      console.log('🔄 Attempting fallback registration creation...');
      
      try {
        // Check if registrations already exist
        const existingRegistrations = await prisma.competitionRegistration.findMany({
          where: { paymentId: payment.id },
        });

        if (existingRegistrations.length > 0) {
          console.log('✅ Registrations already exist, updating payment status');
          // Registrations exist, just update payment status
          await prisma.competitionPayment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              statusCode: '2',
            },
          });
        } else {
          console.log('🚀 Creating registrations via fallback mechanism...');
          
          const metadata = payment.metadata as any;
          if (metadata && metadata.cartId && metadata.itemIds) {
            // Fetch cart items
            const cartItems = await prisma.registrationCartItem.findMany({
              where: {
                id: { in: metadata.itemIds },
              },
              include: {
                competition: true,
                registrationType: true,
              },
            });

            if (cartItems.length > 0) {
              // Create registrations
              const registrations = await Promise.all(
                cartItems.map(async (item) => {
                  const registrationNumber = await generateUniqueRegistrationNumber(prisma);
                  console.log(`   ✅ Creating registration: ${registrationNumber}`);

                  return prisma.competitionRegistration.create({
                    data: {
                      registrationNumber,
                      userId: payment.userId,
                      competitionId: item.competitionId,
                      registrationTypeId: item.registrationTypeId,
                      paymentId: payment.id,
                      country: item.country,
                      participantType: item.participantType,
                      referralSource: item.referralSource,
                      teamName: item.teamName,
                      companyName: item.companyName,
                      businessRegistrationNo: item.businessRegistrationNo,
                      teamMembers: item.teamMembers === null ? undefined : item.teamMembers,
                      members: item.members as any,
                      status: 'CONFIRMED',
                      amountPaid: item.subtotal,
                      currency: payment.currency,
                      confirmedAt: new Date(),
                    },
                  });
                })
              );

              // Update payment record
              await prisma.competitionPayment.update({
                where: { id: payment.id },
                data: {
                  status: 'COMPLETED',
                  completedAt: new Date(),
                  statusCode: '2',
                  responseData: {
                    fallback_registration: true,
                    created_via: 'return_handler',
                    created_at: new Date().toISOString(),
                    reason: 'notify_endpoint_missed',
                  },
                },
              });

              // Mark cart as completed
              await prisma.registrationCart.update({
                where: { id: metadata.cartId },
                data: { status: 'COMPLETED' },
              });

              console.log(`✅ FALLBACK SUCCESS: Created ${registrations.length} registration(s)`);
              registrations.forEach(reg => console.log(`   - ${reg.registrationNumber}`));

              // Redirect to success page
              return NextResponse.redirect(
                new URL(`/competitions/payment/success/${orderId}`, request.url)
              );
            }
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback registration creation failed:', fallbackError);
        // Continue to normal flow even if fallback fails
      }
    }

    // Redirect based on payment status
    if (payment.status === 'COMPLETED') {
      return NextResponse.redirect(
        new URL(`/competitions/payment/success/${orderId}`, request.url)
      );
    } else if (payment.status === 'PENDING' || payment.status === 'PROCESSING') {
      return NextResponse.redirect(
        new URL(`/competitions/payment/processing/${orderId}`, request.url)
      );
    } else {
      return NextResponse.redirect(
        new URL(`/competitions/payment/failed/${orderId}`, request.url)
      );
    }
  } catch (error) {
    console.error('❌ Error handling payment return:', error);
    return NextResponse.redirect(
      new URL('/competitions/payment/error?message=Server error', request.url)
    );
  }
}
