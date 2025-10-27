/**
 * Add to Cart API Route
 * Handles adding registration items to cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types/competition';
import {
  calculateCartExpiry,
  validateMemberInfo,
  sanitizeInput,
} from '@/lib/competition-utils';

interface AddToCartRequest {
  competitionId: string;
  registrationTypeId: string;
  country: string;
  participantType: string;
  referralSource?: string;
  members: Array<{
    name: string;
    email: string;
    phone?: string;
    role?: string;
    studentId?: string;
    institution?: string;
  }>;
  agreements: {
    agreedToTerms: boolean;
    agreedToWebsiteTerms: boolean;
    agreedToPrivacyPolicy: boolean;
    agreedToRefundPolicy: boolean;
  };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please sign in to continue.',
        },
        { status: 401 }
      );
    }

    const body: AddToCartRequest = await request.json();

    // Validate required fields
    if (!body.competitionId || !body.registrationTypeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Competition and registration type are required',
        },
        { status: 400 }
      );
    }

    if (!body.country || body.country.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Country is required',
        },
        { status: 400 }
      );
    }

    if (!body.members || body.members.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one member is required',
        },
        { status: 400 }
      );
    }

    // Validate all agreements
    if (
      !body.agreements.agreedToTerms ||
      !body.agreements.agreedToWebsiteTerms ||
      !body.agreements.agreedToPrivacyPolicy ||
      !body.agreements.agreedToRefundPolicy
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'You must agree to all terms and conditions',
        },
        { status: 400 }
      );
    }

    // Validate member information
    const isStudent = body.participantType === 'STUDENT';
    for (let i = 0; i < body.members.length; i++) {
      const validation = validateMemberInfo(body.members[i], isStudent);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: `Member ${i + 1}: ${validation.errors.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Fetch competition and registration type
    const competition = await prisma.competition.findUnique({
      where: { id: body.competitionId },
    });

    if (!competition) {
      return NextResponse.json(
        {
          success: false,
          error: 'Competition not found',
        },
        { status: 404 }
      );
    }

    const registrationType = await prisma.competitionRegistrationType.findUnique({
      where: { id: body.registrationTypeId },
    });

    if (!registrationType || !registrationType.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration type not available',
        },
        { status: 404 }
      );
    }

    // Check if member count exceeds max allowed
    if (body.members.length > registrationType.maxMembers) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${registrationType.maxMembers} member(s) allowed for this registration type`,
        },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (new Date() > new Date(competition.registrationDeadline)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration deadline has passed',
        },
        { status: 400 }
      );
    }

    // Find or create active cart
    let cart = await prisma.registrationCart.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        items: true,
      },
    });

    if (!cart) {
      cart = await prisma.registrationCart.create({
        data: {
          userId: session.user.id,
          status: 'ACTIVE',
          expiresAt: calculateCartExpiry(),
        },
        include: {
          items: true,
        },
      });
    }

    // Allow multiple registrations of the same type
    // Users can register multiple teams or individuals

    // Sanitize member data
    const sanitizedMembers = body.members.map((member) => ({
      name: sanitizeInput(member.name),
      email: sanitizeInput(member.email),
      phone: member.phone ? sanitizeInput(member.phone) : undefined,
      role: member.role ? sanitizeInput(member.role) : undefined,
      studentId: member.studentId ? sanitizeInput(member.studentId) : undefined,
      institution: member.institution ? sanitizeInput(member.institution) : undefined,
    }));

    // Calculate price (you can add early bird discount logic here)
    const unitPrice = registrationType.fee;
    const subtotal = unitPrice * 1; // Quantity is always 1 for registrations

    // Add item to cart
    const cartItem = await prisma.registrationCartItem.create({
      data: {
        cartId: cart.id,
        competitionId: body.competitionId,
        registrationTypeId: body.registrationTypeId,
        country: sanitizeInput(body.country),
        participantType: body.participantType as any,
        referralSource: body.referralSource
          ? sanitizeInput(body.referralSource)
          : undefined,
        members: sanitizedMembers,
        unitPrice,
        quantity: 1,
        subtotal,
        agreedToTerms: body.agreements.agreedToTerms,
        agreedToWebsiteTerms: body.agreements.agreedToWebsiteTerms,
        agreedToPrivacyPolicy: body.agreements.agreedToPrivacyPolicy,
        agreedToRefundPolicy: body.agreements.agreedToRefundPolicy,
      },
    });

    // Update cart expiry
    await prisma.registrationCart.update({
      where: { id: cart.id },
      data: { expiresAt: calculateCartExpiry() },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration added to cart successfully',
      data: { cartItemId: cartItem.id },
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add registration to cart',
      },
      { status: 500 }
    );
  }
}
