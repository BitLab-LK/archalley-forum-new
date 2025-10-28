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
  onEditItem?: (item: any) => void; // Callback to pass edit data to parent
}

export default function RegistrationCartSidebar({ onCartUpdate, refreshKey = 0, onEditItem }: Props) {
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 Cart refreshKey changed to:', refreshKey);
    // Add a small delay to ensure database update completes
    const timer = setTimeout(() => {
      fetchCart();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [refreshKey]);

  const fetchCart = async () => {
    try {
      console.log('🛒 Fetching cart...');
      const response = await fetch('/api/competitions/cart');
      console.log('Cart fetch response status:', response.status);
      
      const data = await response.json();
      console.log('Cart fetch response data:', data);

      // API returns { success: true, data: { cart, summary } }
      if (data.success && data.data?.cart) {
        console.log('✅ Cart loaded with', data.data.cart.items?.length || 0, 'items');
        setCart(data.data.cart);
      } else {
        console.log('⚠️ No cart data or unsuccessful response');
        setCart(null);
      }
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
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

  const handleEditItem = async (itemId: string) => {
    // Find the item in cart
    const item = cart?.items.find(i => i.id === itemId);
    if (!item) {
      toast.error('Item not found');
      return;
    }

    // Pass the item data to parent for editing
    if (onEditItem) {
      onEditItem(item);
      
      // Scroll to top where the form is
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      toast.info('Form loaded with existing data. Make your changes and add to cart again.');
    } else {
      // Fallback: Confirm and remove (old behavior)
      const confirmed = confirm('Remove this item to edit? You can then fill the form again with updated details.');
      if (!confirmed) return;

      setIsRemoving(itemId);
      try {
        const response = await fetch(`/api/competitions/cart/remove?itemId=${itemId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          toast.success('Item removed. Please fill the form again with updated details.');
          fetchCart();
          onCartUpdate();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          toast.error(result.error || 'Failed to remove item');
        }
      } catch (error) {
        console.error('Error removing item:', error);
        toast.error('An error occurred. Please try again.');
      } finally {
        setIsRemoving(null);
      }
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
      <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
        <h3 className="text-lg font-bold text-black mb-4">Your Cart</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
        <h3 className="text-lg font-bold text-black mb-4 pb-2 border-b border-gray-200">Your Cart</h3>
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🛒</div>
          <p className="text-gray-600 text-sm">Your cart is empty</p>
        </div>
      </div>
    );
  }

  const totalAmount = cart.items.reduce((sum, item) => {
    // Use the subtotal from database which already has the correct calculation
    return sum + item.subtotal;
  }, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <h3 className="text-lg font-bold text-black">Your Cart</h3>
        <button
          onClick={handleClearCart}
          className="text-xs text-gray-600 hover:text-black font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="p-3 border border-gray-200 rounded hover:border-orange-500 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-black text-sm">
                  {item.registrationType.name}
                </h4>
                <p className="text-xs text-gray-500">{item.country}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => handleEditItem(item.id)}
                  disabled={isRemoving === item.id}
                  className="p-1 text-gray-600 hover:text-black rounded transition-colors disabled:opacity-50"
                  title="Edit registration"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={isRemoving === item.id}
                  className="p-1 text-gray-600 hover:text-orange-500 rounded transition-colors disabled:opacity-50"
                  title="Remove from cart"
                >
                  {isRemoving === item.id ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-0.5 mb-2">
              {Array.isArray(item.members) && item.members.map((member: any, idx: number) => (
                <p key={idx} className="text-xs text-gray-600">
                  {idx === 0 ? '👤 ' : '   '}
                  {member.name}
                </p>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Amount</span>
              <span className="font-semibold text-sm text-orange-500">
                LKR {item.subtotal.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-3 mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Items</span>
          <span className="font-medium text-sm">{cart.items.length}</span>
        </div>
        <div className="flex justify-between items-center text-base font-bold">
          <span className="text-black">Total</span>
          <span className="text-orange-500">LKR {totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isCheckingOut}
        className="w-full bg-black hover:bg-orange-500 text-white font-medium py-2.5 px-6 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isCheckingOut ? 'Processing...' : 'Proceed to Checkout →'}
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Cart expires in {Math.floor((new Date(cart.expiresAt).getTime() - Date.now()) / 60000)} minutes
      </p>
    </div>
  );
}
