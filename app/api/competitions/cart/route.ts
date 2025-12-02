/**
 * Registration Cart API Route
 * Handles getting and managing user's registration cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  ApiResponse,
  CartResponse,
  CartSummary,
} from '@/types/competition';
import {
  calculateCartExpiry,
  isCartExpired,
} from '@/lib/competition-utils';

// Disable all caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET - Fetch user's active cart
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<ApiResponse<CartResponse>>> {
  try {
    console.log('=== CART GET API CALLED ===');
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.error('❌ Unauthorized - No session');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please sign in to continue.',
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', session.user.email);

    // Find or create active cart for user
    console.log('🔍 Looking for active cart...');
    let cart = await prisma.registrationCart.findFirst({
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

    if (cart) {
      console.log('✅ Found cart:', cart.id, 'with', cart.items.length, 'items');
      console.log('Cart items:', JSON.stringify(cart.items.map(i => ({
        id: i.id,
        competition: i.competition.title,
        type: i.registrationType.name,
        memberCount: Array.isArray(i.members) ? i.members.length : 0
      })), null, 2));
    } else {
      console.log('⚠️ No active cart found');
    }

    // Create new cart if none exists or if cart is expired
    if (!cart || isCartExpired(cart.expiresAt)) {
      if (cart && isCartExpired(cart.expiresAt)) {
        console.log('⏰ Cart expired, marking as EXPIRED');
        // Mark expired cart as expired
        await prisma.registrationCart.update({
          where: { id: cart.id },
          data: { status: 'EXPIRED' },
        });
      }

      // Double-check no active cart exists (prevent duplicate carts)
      const existingActiveCart = await prisma.registrationCart.findFirst({
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

      if (existingActiveCart) {
        console.log('⚠️ Active cart exists, using it instead of creating new:', existingActiveCart.id);
        cart = existingActiveCart;
      } else {
        console.log('📝 Creating new empty cart');
        // Create new cart
        cart = await prisma.registrationCart.create({
          data: {
            userId: session.user.id,
            status: 'ACTIVE',
            expiresAt: calculateCartExpiry(),
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
        console.log('✅ New cart created:', cart.id);
      }
    }

    // Calculate cart summary
    console.log('📊 Calculating cart summary...');
    const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    const summary: CartSummary = {
      itemCount: cart.items.length,
      subtotal,
      discount: 0, // Calculate early bird discount if applicable
      total: subtotal, // No discount applied, so total = subtotal
      items: cart.items.map((item) => ({
        id: item.id,
        competitionTitle: item.competition.title,
        registrationType: item.registrationType.name,
        country: item.country,
        memberCount: Array.isArray(item.members) ? (item.members as any[]).length : 0,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    };

    console.log('✅ Summary:', summary);

    console.log('=== RETURNING CART RESPONSE ===');
    console.log(`📤 Returning: ${cart.items.length} items in cart ${cart.id} with status ${cart.status}`);
    
    return NextResponse.json(
      {
        success: true,
        data: {
          cart,
          summary,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cart',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear cart
 */
export async function DELETE(
  _request: NextRequest
): Promise<NextResponse<ApiResponse>> {
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

    // Delete all items from active cart
    await prisma.registrationCartItem.deleteMany({
      where: {
        cart: {
          userId: session.user.id,
          status: 'ACTIVE',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cart',
      },
      { status: 500 }
    );
  }
}
