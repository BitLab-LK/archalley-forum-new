/**
 * Remove from Cart API Route
 * Handles removing registration items from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types/competition';

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item ID is required',
        },
        { status: 400 }
      );
    }

    // Find the cart item
    const cartItem = await prisma.registrationCartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart item not found',
        },
        { status: 404 }
      );
    }

    // Verify the cart belongs to the user
    if (cartItem.cart.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to remove this item',
        },
        { status: 403 }
      );
    }

    // Delete the cart item
    await prisma.registrationCartItem.delete({
      where: { id: itemId },
    });

    // Check if cart is now empty and delete it
    const remainingItems = await prisma.registrationCartItem.count({
      where: { cartId: cartItem.cartId },
    });

    if (remainingItems === 0) {
      await prisma.registrationCart.delete({
        where: { id: cartItem.cartId },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove item from cart',
      },
      { status: 500 }
    );
  }
}
