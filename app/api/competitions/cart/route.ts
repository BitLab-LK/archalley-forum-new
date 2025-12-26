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
    console.log('🔍 Looking for active cart for user:', session.user.id);
    
    // First, check if user has any COMPLETED carts (for debugging)
    const completedCarts = await prisma.registrationCart.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 5,
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    if (completedCarts.length > 0) {
      console.log(`📦 User has ${completedCarts.length} COMPLETED cart(s) - these will NOT be returned`);
      console.log('Recent completed carts:', completedCarts.map(c => ({ id: c.id, completedAt: c.updatedAt })));
    }
    
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
      console.log('✅ Found ACTIVE cart:', cart.id, 'with', cart.items.length, 'items');
      console.log('Cart status:', cart.status);
      console.log('Cart items:', JSON.stringify(cart.items.map(i => ({
        id: i.id,
        competition: i.competition.title,
        type: i.registrationType.name,
        memberCount: Array.isArray(i.members) ? i.members.length : 0
      })), null, 2));
    } else {
      console.log('⚠️ No ACTIVE cart found - will create new empty cart');
    }

    // Handle expired cart
    if (cart && isCartExpired(cart.expiresAt)) {
      console.log('⏰ Cart expired, marking as EXPIRED');
      // Mark expired cart as expired
      await prisma.registrationCart.update({
        where: { id: cart.id },
        data: { status: 'EXPIRED' },
      });
      // Set cart to null so we return empty cart response
      cart = null;
    }

    // Don't create a new cart on GET - only return what exists
    // New carts will be created when user adds first item (in POST /cart/add)

    // Calculate cart summary (only if cart exists)
    if (cart) {
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
    } else {
      // No active cart - return success with null cart
      console.log('=== RETURNING EMPTY CART RESPONSE ===');
      console.log('📤 No active cart exists for user');
      
      return NextResponse.json(
        {
          success: true,
          data: {
            cart: null,
            summary: {
              itemCount: 0,
              subtotal: 0,
              discount: 0,
              total: 0,
              items: [],
            },
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
    }
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    
    // Handle connection pool exhaustion specifically
    if (error?.code === 'P2037' || error?.message?.includes('too many connections') || error?.message?.includes('connection slots')) {
      console.error('⚠️ Database connection pool exhausted. Retrying after delay...');
      
      // Get session again for retry (might have failed during initial fetch)
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
        
        // Retry once after a short delay to allow connections to free up
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry the query with a simpler query first (just get the cart, no extra queries)
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
        
        if (cart) {
          if (isCartExpired(cart.expiresAt)) {
            await prisma.registrationCart.update({
              where: { id: cart.id },
              data: { status: 'EXPIRED' },
            });
            // Return empty cart after marking as expired
            return NextResponse.json(
              {
                success: true,
                data: {
                  cart: null,
                  summary: {
                    itemCount: 0,
                    subtotal: 0,
                    discount: 0,
                    total: 0,
                    items: [],
                  },
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
          }
          
          const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
          const summary: CartSummary = {
            itemCount: cart.items.length,
            subtotal,
            discount: 0,
            total: subtotal,
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
          
          return NextResponse.json(
            {
              success: true,
              data: { cart, summary },
            },
            {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            }
          );
        }
        
        // Return empty cart if retry succeeded but no cart found
        return NextResponse.json(
          {
            success: true,
            data: {
              cart: null,
              summary: {
                itemCount: 0,
                subtotal: 0,
                discount: 0,
                total: 0,
                items: [],
              },
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
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError);
        return NextResponse.json(
          {
            success: false,
            error: 'Database temporarily unavailable. Please try again in a moment.',
          },
          { 
            status: 503,
            headers: {
              'Retry-After': '5',
            },
          }
        );
      }
    }
    
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
