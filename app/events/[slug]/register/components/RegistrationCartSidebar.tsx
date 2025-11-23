/**
 * Registration Cart Sidebar Component
 * Displays cart items and checkout button
 */

'use client';

import { useState, useEffect } from 'react';
import { CartWithItems } from '@/types/competition';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCountdown } from '@/hooks/useCountdown';
import { trackViewCart, trackRemoveFromCart, EcommerceItem } from '@/lib/google-analytics';

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
  const [agreedToAll, setAgreedToAll] = useState(false);
  const router = useRouter();

  // Countdown timer for cart expiration
  const countdown = useCountdown(cart?.expiresAt || null);
  
  // Check if expiry is disabled (client-side check)
  const isExpiryDisabled = process.env.NEXT_PUBLIC_CART_EXPIRY_DISABLED === 'true';

  useEffect(() => {
    console.log('🔄 Cart refreshKey changed to:', refreshKey);
    // Add a small delay to ensure database update completes
    const timer = setTimeout(() => {
      fetchCart();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [refreshKey]);

  // Auto-refresh cart when expired (only if expiry is enabled)
  useEffect(() => {
    if (!isExpiryDisabled && countdown.isExpired && cart) {
      toast.error('Your cart has expired. Items have been removed.');
      fetchCart();
      onCartUpdate();
    }
  }, [countdown.isExpired, cart, onCartUpdate, isExpiryDisabled]);

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
        
        // Track view_cart event
        if (data.data.cart.items && data.data.cart.items.length > 0) {
          const items: EcommerceItem[] = data.data.cart.items.map((item: any) => ({
            item_id: `${item.competitionId}_${item.registrationTypeId}`,
            item_name: `${item.competition?.title || 'Competition'} - ${item.registrationType?.name || 'Registration'}`,
            item_category: 'Competition Registration',
            item_category2: item.competition?.title || '',
            item_category3: item.registrationType?.name || '',
            price: item.subtotal,
            quantity: 1,
            currency: 'LKR',
          }));
          trackViewCart(items);
        }
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
        // Track remove_from_cart event
        const itemToRemove = cart?.items.find(i => i.id === itemId);
        if (itemToRemove) {
          const ecommerceItem: EcommerceItem = {
            item_id: `${itemToRemove.competitionId}_${itemToRemove.registrationTypeId}`,
            item_name: `${itemToRemove.competition?.title || 'Competition'} - ${itemToRemove.registrationType?.name || 'Registration'}`,
            item_category: 'Competition Registration',
            item_category2: itemToRemove.competition?.title || '',
            item_category3: itemToRemove.registrationType?.name || '',
            price: itemToRemove.subtotal,
            quantity: 1,
            currency: 'LKR',
          };
          trackRemoveFromCart(ecommerceItem);
        }
        
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

    if (!agreedToAll) {
      toast.error('Please agree to the Terms & Conditions to proceed');
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
              {/* Display name based on registration type */}
              {item.registrationType.type === 'TEAM' && item.teamName && (
                <p className="text-xs text-gray-600">
                  👥 Team: <span className="font-medium">{item.teamName}</span>
                </p>
              )}
              {item.registrationType.type === 'COMPANY' && item.companyName && (
                <p className="text-xs text-gray-600">
                  🏢 Company: <span className="font-medium">{item.companyName}</span>
                </p>
              )}
              {(item.registrationType.type === 'INDIVIDUAL' || item.registrationType.type === 'STUDENT' || item.registrationType.type === 'KIDS') && Array.isArray(item.members) && item.members[0] && typeof item.members[0] === 'object' && 'name' in item.members[0] && (
                <p className="text-xs text-gray-600">
                  {item.registrationType.type === 'INDIVIDUAL' && '👤 Individual: '}
                  {item.registrationType.type === 'STUDENT' && '🎓 Student: '}
                  {item.registrationType.type === 'KIDS' && '👶 Kid: '}
                  <span className="font-medium">{String((item.members[0] as any).name)}</span>
                </p>
              )}
              {/* Show additional team members for TEAM type */}
              {item.registrationType.type === 'TEAM' && Array.isArray(item.members) && item.members.length > 0 && (
                <div className="mt-1 pl-4 border-l-2 border-gray-200">
                  {item.members.map((member: any, idx: number) => (
                    <p key={idx} className="text-xs text-gray-500">
                      • {member.name || 'N/A'}
                    </p>
                  ))}
                </div>
              )}
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

      {/* Terms & Conditions Agreement */}
      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToAll}
            onChange={(e) => setAgreedToAll(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
          />
          <span className="text-xs text-gray-700 leading-tight">
            I agree to the{' '}
            <a href="/events/archalley-competition-2025/terms" target="_blank" className="text-orange-500 hover:underline font-medium">
              Competition Terms & Conditions
            </a>
            ,{' '}
            <a href="/terms-conditions" target="_blank" className="text-orange-500 hover:underline font-medium">
              Website Terms & Conditions
            </a>
            ,{' '}
            <a href="/privacy-policy" target="_blank" className="text-orange-500 hover:underline font-medium">
              Privacy Policy
            </a>
            , and{' '}
            <a href="/refund-policy" target="_blank" className="text-orange-500 hover:underline font-medium">
              Refund Policy
            </a>
          </span>
        </label>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isCheckingOut || !agreedToAll}
        className="w-full bg-black hover:bg-orange-500 text-white font-medium py-2.5 px-6 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isCheckingOut ? 'Processing...' : 'Proceed to Checkout →'}
      </button>

      {/* Timer Display Under Checkout Button - Only show if expiry is enabled */}
      {!isExpiryDisabled && cart?.expiresAt && !countdown.isExpired && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Time Remaining</p>
          <p className={`text-lg font-bold tabular-nums ${
            countdown.minutes < 5 
              ? 'text-red-600' 
              : countdown.minutes < 15 
              ? 'text-orange-600' 
              : 'text-blue-600'
          }`}>
            {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
          </p>
        </div>
      )}
    </div>
  );
}
