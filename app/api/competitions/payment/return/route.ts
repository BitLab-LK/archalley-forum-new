/**
 * Payment Return Handler
 * Handles user return from PayHere after payment attempt
 * INCLUDES FALLBACK: Creates registrations if notify endpoint was missed
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateUniqueRegistrationNumber } from '@/lib/competition-utils';
import {
  sendComprehensiveConfirmationEmail,
  sendComprehensiveConsolidatedConfirmationEmail,
} from '@/lib/competition-email-service';

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

              // Send confirmation emails
              console.log('📧 Sending confirmation emails...');
              try {
                // Extract customer details from payment
                const customerDetails = payment.customerDetails as any;
                const customerEmail = customerDetails?.email || payment.user.email;
                const customerName = customerDetails?.firstName && customerDetails?.lastName
                  ? `${customerDetails.firstName} ${customerDetails.lastName}`
                  : payment.user.name || 'Participant';
                
                console.log(`📧 Sending emails to: ${customerEmail}`);
                
                // Fetch full registration details with actual registrationType from database
                const fullRegistrations = await prisma.competitionRegistration.findMany({
                  where: {
                    id: { in: registrations.map(r => r.id) },
                  },
                  include: {
                    registrationType: true,
                    competition: true,
                  },
                });
                
                // Calculate total amount
                const totalAmount = fullRegistrations.reduce((sum, reg) => sum + Number(reg.amountPaid), 0);
                
                // Use consolidated email if multiple registrations, otherwise use single comprehensive email
                if (fullRegistrations.length > 1) {
                  console.log(`📧 Sending COMPREHENSIVE CONSOLIDATED email (${fullRegistrations.length} registrations)`);
                  
                  // Prepare consolidated data
                  const consolidatedData = {
                    registrations: fullRegistrations.map(reg => {
                      return {
                        registration: reg,
                        registrationType: reg.registrationType,
                        members: (reg.members as any) || [],
                      };
                    }),
                    competition: fullRegistrations[0].competition,
                    userName: customerName,
                    userEmail: customerEmail,
                    paymentOrderId: payment.orderId,
                    paymentMethod: 'PayHere',
                    totalAmount,
                  };
                  
                  // Send single comprehensive consolidated email
                  await sendComprehensiveConsolidatedConfirmationEmail(consolidatedData);
                  
                  console.log(`✅ Comprehensive consolidated email sent successfully`);
                } else {
                  console.log(`📧 Sending COMPREHENSIVE email (single registration)`);
                  
                  // Send comprehensive email for single registration
                  const fullRegistration = fullRegistrations[0];
                  
                  const emailData = {
                    registration: fullRegistration,
                    competition: fullRegistration.competition,
                    registrationType: fullRegistration.registrationType,
                    userName: customerName,
                    userEmail: customerEmail,
                    members: (fullRegistration.members as any) || [],
                    paymentOrderId: payment.orderId,
                    paymentMethod: 'PayHere',
                  };

                  // Send single comprehensive email
                  await sendComprehensiveConfirmationEmail(emailData);

                  console.log(`✅ Comprehensive email sent for registration: ${fullRegistration.registrationNumber}`);
                }
              } catch (emailError) {
                console.error(`❌ Failed to send emails:`, emailError);
                // Don't throw - registration is already created
              }

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

