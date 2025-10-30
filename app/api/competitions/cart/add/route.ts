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
  teamName?: string;
  companyName?: string;
  businessRegistrationNo?: string;
  teamMembers?: string[];
  members: Array<{
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    studentId?: string;
    institution?: string;
    courseOfStudy?: string;
    dateOfBirth?: string;
    studentEmail?: string;
    idCardUrl?: string;
    // For kids registration
    parentFirstName?: string;
    parentLastName?: string;
    parentEmail?: string;
    parentPhone?: string;
    postalAddress?: string;
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
    console.log('=== CART ADD API CALLED ===');
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.error('❌ Unauthorized - No session found');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please sign in to continue.',
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', session.user.email, 'ID:', session.user.id);

    const body: AddToCartRequest = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

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

    // Validate member information
    const isStudent = body.participantType === 'STUDENT';
    const isKids = body.participantType === 'KIDS';
    console.log('🔍 Validating members, isStudent:', isStudent, 'isKids:', isKids);
    for (let i = 0; i < body.members.length; i++) {
      console.log(`Validating member ${i + 1}:`, body.members[i]);
      const validation = validateMemberInfo(body.members[i], isStudent, isKids);
      if (!validation.valid) {
        console.error(`❌ Validation failed for member ${i + 1}:`, validation.errors);
        return NextResponse.json(
          {
            success: false,
            error: `Member ${i + 1}: ${validation.errors.join(', ')}`,
          },
          { status: 400 }
        );
      }
      console.log(`✅ Member ${i + 1} validated successfully`);
    }

    // Fetch competition and registration type
    console.log('🔍 Fetching competition:', body.competitionId);
    const competition = await prisma.competition.findUnique({
      where: { id: body.competitionId },
    });

    if (!competition) {
      console.error('❌ Competition not found');
      return NextResponse.json(
        {
          success: false,
          error: 'Competition not found',
        },
        { status: 404 }
      );
    }
    console.log('✅ Competition found:', competition.title);

    console.log('🔍 Fetching registration type:', body.registrationTypeId);
    const registrationType = await prisma.competitionRegistrationType.findUnique({
      where: { id: body.registrationTypeId },
    });

    if (!registrationType || !registrationType.isActive) {
      console.error('❌ Registration type not found or inactive');
      return NextResponse.json(
        {
          success: false,
          error: 'Registration type not available',
        },
        { status: 404 }
      );
    }
    console.log('✅ Registration type found:', registrationType.name, 'Fee:', registrationType.fee);

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
    console.log('🔍 Finding active cart for user:', session.user.id);
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
      console.log('📝 Creating new cart for user');
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
      console.log('✅ Cart created:', cart.id);
    } else {
      console.log('✅ Active cart found:', cart.id, 'with', cart.items.length, 'items');
    }

    // Allow multiple registrations of the same type
    // Users can register multiple teams or individuals

    // Sanitize member data
    console.log('🧹 Sanitizing member data...');
    const sanitizedMembers = body.members.map((member) => ({
      name: sanitizeInput(member.name),
      firstName: member.firstName ? sanitizeInput(member.firstName) : undefined,
      lastName: member.lastName ? sanitizeInput(member.lastName) : undefined,
      email: member.email ? sanitizeInput(member.email) : undefined,
      phone: member.phone ? sanitizeInput(member.phone) : undefined,
      role: member.role ? sanitizeInput(member.role) : undefined,
      studentId: member.studentId ? sanitizeInput(member.studentId) : undefined,
      institution: member.institution ? sanitizeInput(member.institution) : undefined,
      courseOfStudy: member.courseOfStudy ? sanitizeInput(member.courseOfStudy) : undefined,
      dateOfBirth: member.dateOfBirth ? sanitizeInput(member.dateOfBirth) : undefined,
      studentEmail: member.studentEmail ? sanitizeInput(member.studentEmail) : undefined,
      idCardUrl: member.idCardUrl ? sanitizeInput(member.idCardUrl) : undefined,
      // Kids registration fields
      parentFirstName: member.parentFirstName ? sanitizeInput(member.parentFirstName) : undefined,
      parentLastName: member.parentLastName ? sanitizeInput(member.parentLastName) : undefined,
      parentEmail: member.parentEmail ? sanitizeInput(member.parentEmail) : undefined,
      parentPhone: member.parentPhone ? sanitizeInput(member.parentPhone) : undefined,
      postalAddress: member.postalAddress ? sanitizeInput(member.postalAddress) : undefined,
    }));
    console.log('✅ Sanitized members:', sanitizedMembers);

    // Calculate price (you can add early bird discount logic here)
    const unitPrice = registrationType.fee;
    const subtotal = unitPrice; // Single registration per cart item
    console.log('💰 Price calculation - Unit:', unitPrice, 'Subtotal:', subtotal);

    // Add item to cart
    console.log('📦 Creating cart item...');
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
        teamName: body.teamName ? sanitizeInput(body.teamName) : undefined,
        companyName: body.companyName ? sanitizeInput(body.companyName) : undefined,
        businessRegistrationNo: body.businessRegistrationNo ? sanitizeInput(body.businessRegistrationNo) : undefined,
        teamMembers: body.teamMembers || undefined,
        members: sanitizedMembers,
        unitPrice,
        subtotal,
        agreedToTerms: body.agreements?.agreedToTerms || true,
        agreedToWebsiteTerms: body.agreements?.agreedToWebsiteTerms || true,
        agreedToPrivacyPolicy: body.agreements?.agreedToPrivacyPolicy || true,
        agreedToRefundPolicy: body.agreements?.agreedToRefundPolicy || true,
      },
    });
    console.log('✅ Cart item created successfully:', cartItem.id);

    // Update cart expiry
    console.log('⏰ Updating cart expiry...');
    await prisma.registrationCart.update({
      where: { id: cart.id },
      data: { expiresAt: calculateCartExpiry() },
    });
    console.log('✅ Cart expiry updated');

    console.log('=== SUCCESS - Returning response ===');
    return NextResponse.json({
      success: true,
      message: 'Registration added to cart successfully',
      data: { cartItemId: cartItem.id },
    });
  } catch (error) {
    console.error('❌❌❌ ERROR IN CART ADD API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add registration to cart',
      },
      { status: 500 }
    );
  }
}
