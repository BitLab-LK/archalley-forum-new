/**
 * Remove Cart Item API Route
 * Removes a specific item from the user's cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/types/competition';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { itemId: string } }
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

    const { itemId } = params;

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

    // Verify ownership
    if (cartItem.cart.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 }
      );
    }

    // Delete the item
    await prisma.registrationCartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove item',
      },
      { status: 500 }
    );
  }
}
