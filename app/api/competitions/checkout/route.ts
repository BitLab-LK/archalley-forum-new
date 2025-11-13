/**
 * Checkout API Route
 * Initiates payment process for cart items
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  ApiResponse,
  PaymentInitiationResponse,
  CheckoutData,
} from '@/types/competition';
import {
  generateOrderId,
  getNextOrderSequence,
  generatePayHereHash,
  isCartExpired,
  generateUniqueRegistrationNumber,
} from '@/lib/competition-utils';
import { getPayHereConfig } from '@/lib/payhere-config';
import { sendBankTransferPendingEmail, sendConsolidatedBankTransferPendingEmail } from '@/lib/competition-email-service';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaymentInitiationResponse>>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body: CheckoutData = await request.json();

    const paymentMethod = body.paymentMethod || 'card'; // Default to card payment

    // Validate customer info
    if (
      !body.customerInfo ||
      !body.customerInfo.firstName ||
      !body.customerInfo.lastName ||
      !body.customerInfo.email ||
      !body.customerInfo.country
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Complete customer information is required',
        },
        { status: 400 }
      );
    }

    // Fetch cart with items
    const cart = await prisma.registrationCart.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        items: {
          include: {
            competition: true,
            registrationType: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart is empty',
        },
        { status: 400 }
      );
    }

    // Check if cart is expired
    if (isCartExpired(cart.expiresAt)) {
      await prisma.registrationCart.update({
        where: { id: cart.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Cart has expired. Please add items again.',
        },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Generate order ID
    const orderSequence = await getNextOrderSequence(prisma);
    let orderId = generateOrderId(orderSequence); // Use 'let' to allow reassignment in retry logic

    // Get PayHere configuration
    const payHereConfig = getPayHereConfig();
    console.log('PayHere config loaded:', {
      hasMerchantId: !!payHereConfig.merchantId,
      hasMerchantSecret: !!payHereConfig.merchantSecret,
      paymentUrl: payHereConfig.paymentUrl
    });

    // Handle Bank Transfer Payment
    if (paymentMethod === 'bank') {
      console.log('=== Bank Transfer Payment Processing ===');
      console.log('Cart items:', cart.items.length);
      console.log('Total amount:', totalAmount);
      console.log('Bank slip URL:', body.bankSlipUrl);
      console.log('Will send via WhatsApp:', body.willSendViaWhatsApp);
      console.log('Customer info:', body.customerInfo);
      
      try {
        // Get all unique competition IDs from cart
      const competitionIds = [...new Set(cart.items.map((item) => item.competitionId))];
      
      let payment;
      let retryCount = 0;
      const maxRetries = 3;
      
      // Retry logic for handling potential duplicate orderId race conditions
      while (retryCount < maxRetries) {
        try {
          // Create payment record with PENDING status for manual verification
          payment = await prisma.competitionPayment.create({
            data: {
              orderId,
              userId: session.user.id,
              competitionId: cart.items[0].competitionId, // Primary competition for compatibility
              amount: totalAmount,
              currency: 'LKR',
              merchantId: payHereConfig.merchantId!,
              status: 'PENDING',
              paymentMethod: 'BANK_TRANSFER',
              items: cart.items.map((item) => ({
                id: item.id,
                competitionTitle: item.competition.title,
                registrationType: item.registrationType.name,
                country: item.country,
                memberCount: Array.isArray(item.members) ? (item.members as any[]).length : 0,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              })),
              customerDetails: body.customerInfo,
              metadata: {
                cartId: cart.id,
                itemIds: cart.items.map((item) => item.id),
                competitionIds: competitionIds, // Track all competitions
                bankSlipUrl: body.bankSlipUrl,
                bankSlipFileName: body.bankSlipFileName,
                willSendViaWhatsApp: body.willSendViaWhatsApp,
                paymentMethod: 'bank',
              },
            },
          });
          break; // Success, exit retry loop
        } catch (createError: any) {
          // Check if it's a unique constraint error on orderId
          if (createError?.code === 'P2002' && createError?.meta?.target?.includes('orderId')) {
            retryCount++;
            console.log(`⚠️ Duplicate orderId detected, retry ${retryCount}/${maxRetries}`);
            
            if (retryCount >= maxRetries) {
              throw new Error('Failed to generate unique order ID after multiple attempts');
            }
            
            // Generate a new orderId with updated timestamp
            const newSequence = await getNextOrderSequence(prisma);
            orderId = generateOrderId(newSequence);
            console.log(`🔄 Generated new orderId: ${orderId}`);
            
            // Small delay to prevent rapid retries
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            // Different error, throw it
            throw createError;
          }
        }
      }
      
      if (!payment) {
        throw new Error('Failed to create payment record');
      }

      // Create registration records with PENDING status (awaiting bank transfer verification)
      const registrations = await Promise.all(
        cart.items.map(async (item) => {
          // Map registration type name to proper enum value
          const typeName = item.registrationType.name.toUpperCase();
          let participantType: 'INDIVIDUAL' | 'TEAM' | 'COMPANY' | 'STUDENT' | 'KIDS' = 'INDIVIDUAL';
          
          if (typeName.includes('TEAM') || typeName.includes('GROUP')) {
            participantType = 'TEAM';
          } else if (typeName.includes('COMPANY')) {
            participantType = 'COMPANY';
          } else if (typeName.includes('STUDENT')) {
            participantType = 'STUDENT';
          } else if (typeName.includes('KIDS') || typeName.includes('KID')) {
            participantType = 'KIDS';
          }
          
          console.log(`Mapping registration type: "${item.registrationType.name}" -> "${participantType}"`);
          
          // Generate unique random registration number
          const regNumber = await generateUniqueRegistrationNumber(prisma);
          
          console.log(`✅ Generated registration number: ${regNumber}`);
          
          const registration = await prisma.competitionRegistration.create({
            data: {
              userId: session.user.id,
              competitionId: item.competitionId,
              registrationTypeId: item.registrationTypeId,
              registrationNumber: regNumber,
              country: item.country,
              members: item.members as any,
              teamName: item.teamName,
              companyName: item.companyName,
              participantType: participantType,
              amountPaid: item.subtotal,
              status: 'PENDING',
              paymentId: payment.id,
            },
          });
          
          // Return registration with type name for display
          return {
            ...registration,
            typeName: item.registrationType.name,
          };
        })
      );

      // Update cart status
      await prisma.registrationCart.update({
        where: { id: cart.id },
        data: { status: 'COMPLETED' },
      });

      // Send bank transfer pending email directly
      console.log('📧 Sending bank transfer pending email...');
      try {
        // Calculate total amount
        const totalAmount = registrations.reduce((sum, reg) => sum + Number(reg.amountPaid), 0);
        
        if (registrations.length > 1) {
          console.log(`📧 Using CONSOLIDATED bank transfer email (${registrations.length} registrations, total: LKR ${totalAmount.toLocaleString()})`);
          
          // Send consolidated email for multiple registrations
          await sendConsolidatedBankTransferPendingEmail({
            registrations: registrations.map((reg, index) => ({
              registration: reg,
              registrationType: cart.items[index].registrationType,
              members: (cart.items[index].members as any) || [],
            })),
            competition: cart.items[0].competition,
            userName: `${body.customerInfo.firstName} ${body.customerInfo.lastName}`,
            userEmail: body.customerInfo.email,
            paymentOrderId: orderId,
            totalAmount,
          });
        } else {
          console.log(`📧 Using INDIVIDUAL bank transfer email (single registration)`);
          
          // Send individual email for single registration
          const firstRegistration = registrations[0];
          const firstItem = cart.items[0];
          
          await sendBankTransferPendingEmail({
            registration: firstRegistration,
            competition: firstItem.competition,
            registrationType: firstItem.registrationType,
            userName: `${body.customerInfo.firstName} ${body.customerInfo.lastName}`,
            userEmail: body.customerInfo.email,
          });
        }
        
        console.log('✅ Bank transfer pending email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send bank transfer pending email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          registrationNumber: registrations[0].registrationNumber, // For backward compatibility
          registrationNumbers: registrations.map(r => r.registrationNumber),
          registrations: registrations.map(r => ({
            registrationNumber: r.registrationNumber,
            registrationTypeId: r.registrationTypeId,
            typeName: r.typeName,
          })),
          paymentData: null as any,
          paymentUrl: '',
        },
        message: 'Bank transfer details submitted. Awaiting verification.',
      });
      } catch (bankTransferError) {
        console.error('❌ Bank transfer processing error:', bankTransferError);
        console.error('Error details:', bankTransferError instanceof Error ? bankTransferError.message : 'Unknown');
        console.error('Error stack:', bankTransferError instanceof Error ? bankTransferError.stack : '');
        throw bankTransferError; // Re-throw to be caught by outer catch
      }
    }

    // Handle Card Payment (PayHere)
    // Get all unique competition IDs from cart
    const competitionIds = [...new Set(cart.items.map((item) => item.competitionId))];
    
    const payment = await prisma.competitionPayment.create({
      data: {
        orderId,
        userId: session.user.id,
        competitionId: cart.items[0].competitionId, // Primary competition for compatibility
        amount: totalAmount,
        currency: 'LKR',
        merchantId: payHereConfig.merchantId!,
        status: 'PENDING',
        paymentMethod: 'PAYHERE', // Set payment method for tracking
        items: cart.items.map((item) => ({
          id: item.id,
          competitionTitle: item.competition.title,
          registrationType: item.registrationType.name,
          country: item.country,
          memberCount: Array.isArray(item.members) ? (item.members as any[]).length : 0,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
        customerDetails: body.customerInfo,
        metadata: {
          cartId: cart.id,
          itemIds: cart.items.map((item) => item.id),
          competitionIds: competitionIds, // Track all competitions
          paymentMethod: 'card',
        },
      },
    });

    // Prepare PayHere payment data
    const itemsDescription = cart.items
      .map((item) => `${item.competition.title} - ${item.registrationType.name}`)
      .join(', ');

    const hash = generatePayHereHash(
      payHereConfig.merchantId!,
      orderId,
      totalAmount.toFixed(2),
      payHereConfig.currency,
      payHereConfig.merchantSecret!
    );

    const paymentData = {
      merchant_id: payHereConfig.merchantId!,
      return_url: payHereConfig.returnUrl,
      cancel_url: payHereConfig.cancelUrl,
      notify_url: payHereConfig.notifyUrl,
      order_id: orderId,
      items: itemsDescription,
      currency: payHereConfig.currency,
      amount: totalAmount.toFixed(2),
      first_name: body.customerInfo.firstName,
      last_name: body.customerInfo.lastName,
      email: body.customerInfo.email,
      phone: body.customerInfo.phone || '',
      address: body.customerInfo.address || '',
      city: body.customerInfo.city || '',
      country: body.customerInfo.country,
      hash,
    };

    // Store cart reference in payment metadata
    await prisma.competitionPayment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          cartId: cart.id,
          itemIds: cart.items.map((item) => item.id),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        paymentData,
        paymentUrl: payHereConfig.paymentUrl,
      },
    });
  } catch (error) {
    console.error('Error initiating checkout:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : '');
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment',
      },
      { status: 500 }
    );
  }
}
