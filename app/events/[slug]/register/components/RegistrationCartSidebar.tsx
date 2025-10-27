/**
 * Registration Cart Sidebar Component
 * Displays cart items and checkout button
 */

'use client';

import { useState, useEffect } from 'react';
import { CartWithItems } from '@/types/competition';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  onCartUpdate: () => void;
  refreshKey?: number;
}

export default function RegistrationCartSidebar({ onCartUpdate, refreshKey = 0 }: Props) {
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, [refreshKey]);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/competitions/cart');
      const data = await response.json();

      if (data.success && data.cart) {
        setCart(data.cart);
      } else {
        setCart(null);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsRemoving(itemId);
    try {
      const response = await fetch(`/api/competitions/cart/remove?itemId=${itemId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Item removed from cart');
        fetchCart(); // Refresh cart
        onCartUpdate();
      } else {
        toast.error(result.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleClearCart = async () => {
    if (!cart || cart.items.length === 0) return;

    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
      const response = await fetch('/api/competitions/cart', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Cart cleared');
        fetchCart(); // Refresh cart
        onCartUpdate();
      } else {
        toast.error(result.error || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsCheckingOut(true);
    router.push('/events/checkout');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Cart</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Cart</h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      </div>
    );
  }

  const totalAmount = cart.items.reduce((sum, item) => {
    const amount = item.registrationType.fee * ((item.members as any)?.length || 1);
    return sum + amount;
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Your Cart</h3>
        <button
          onClick={handleClearCart}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-yellow-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {item.registrationType.name}
                </h4>
                <p className="text-xs text-gray-500">{item.country}</p>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                disabled={isRemoving === item.id}
                className="text-red-500 hover:text-red-700 text-sm ml-2 disabled:opacity-50"
              >
                {isRemoving === item.id ? '...' : '×'}
              </button>
            </div>

            <div className="space-y-1 mb-2">
              {Array.isArray(item.members) && item.members.map((member: any, idx: number) => (
                <p key={idx} className="text-xs text-gray-600">
                  {idx === 0 ? '👤 ' : '   '}
                  {member.name}
                </p>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Amount</span>
              <span className="font-bold text-yellow-600">
                LKR {(item.registrationType.fee * ((item.members as any)?.length || 1)).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Items</span>
          <span className="font-semibold">{cart.items.length}</span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span className="text-yellow-600">LKR {totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isCheckingOut}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCheckingOut ? 'Processing...' : 'Proceed to Checkout →'}
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Cart expires in {Math.floor((new Date(cart.expiresAt).getTime() - Date.now()) / 60000)} minutes
      </p>
    </div>
  );
}
