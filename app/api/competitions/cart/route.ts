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
  calculateCartTotal,
  isCartExpired,
} from '@/lib/competition-utils';

/**
 * GET - Fetch user's active cart
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<ApiResponse<CartResponse>>> {
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

    // Find or create active cart for user
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

    // Create new cart if none exists or if cart is expired
    if (!cart || isCartExpired(cart.expiresAt)) {
      if (cart && isCartExpired(cart.expiresAt)) {
        // Mark expired cart as expired
        await prisma.registrationCart.update({
          where: { id: cart.id },
          data: { status: 'EXPIRED' },
        });
      }

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
    }

    // Calculate cart summary
    const summary: CartSummary = {
      itemCount: cart.items.length,
      subtotal: cart.items.reduce((sum, item) => sum + item.subtotal, 0),
      discount: 0, // Calculate early bird discount if applicable
      total: 0,
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

    summary.total = calculateCartTotal(summary.subtotal, summary.discount);

    return NextResponse.json({
      success: true,
      data: {
        cart,
        summary,
      },
    });
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
