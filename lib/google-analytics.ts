/**
 * Google Analytics Utilities (GTM-based)
 * Helper functions for tracking events with Google Analytics 4 via Google Tag Manager
 * Uses dataLayer.push() for GTM integration
 */

// Extend Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}

// Initialize dataLayer if it doesn't exist
const initDataLayer = () => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
  }
};

// Push event to dataLayer (GTM)
const pushToDataLayer = (eventData: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    initDataLayer();
    window.dataLayer.push(eventData);
  }
};

// Track page views
export const pageview = (url: string) => {
  pushToDataLayer({
    event: 'page_view',
    page_path: url,
  });
};

// Track custom events
type EventParams = {
  event: string;
  [key: string]: any;
};

export const event = (params: EventParams) => {
  pushToDataLayer(params);
};

// Track button/link clicks
export const trackButtonClick = (buttonName: string, location?: string) => {
  event({
    event: 'click',
    button_name: buttonName,
    location: location,
  });
};

// Track user signup
export const trackSignup = (method: string) => {
  event({
    event: 'sign_up',
    method: method,
  });
};

// Track user login
export const trackLogin = (method: string) => {
  event({
    event: 'login',
    method: method,
  });
};

// Track search queries
export const trackSearch = (searchTerm: string) => {
  event({
    event: 'search',
    search_term: searchTerm,
  });
};

// Track post interactions
export const trackPostInteraction = (action: 'upvote' | 'downvote' | 'comment', postId: string) => {
  event({
    event: action,
    post_id: postId,
  });
};

// Track competition events
export const trackCompetitionEvent = (action: string, competitionName: string, details?: any) => {
  event({
    event: action,
    competition_name: competitionName,
    ...details,
  });
};

// ============ E-COMMERCE EVENTS ============

// GA4 E-commerce Item type
export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_brand?: string;
  price: number;
  quantity: number;
  currency?: string;
  [key: string]: any; // Allow additional custom parameters
}

// View Item - Track when user views a competition registration page
export const trackViewItem = (item: EcommerceItem, currency: string = 'LKR') => {
  pushToDataLayer({
    event: 'view_item',
    currency: currency,
    value: item.price,
    items: [item],
  });
};

// Add to Cart - Track when user adds registration to cart
export const trackAddToCart = (items: EcommerceItem[], currency: string = 'LKR') => {
  const value = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  pushToDataLayer({
    event: 'add_to_cart',
    currency: currency,
    value: value,
    items: items,
  });
};

// View Cart - Track when user views their cart
export const trackViewCart = (items: EcommerceItem[], currency: string = 'LKR') => {
  const value = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  pushToDataLayer({
    event: 'view_cart',
    currency: currency,
    value: value,
    items: items,
  });
};

// Begin Checkout - Track when user initiates checkout
export const trackBeginCheckout = (items: EcommerceItem[], currency: string = 'LKR') => {
  const value = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  pushToDataLayer({
    event: 'begin_checkout',
    currency: currency,
    value: value,
    items: items,
  });
};

// Add Payment Info - Track when user selects payment method
export const trackAddPaymentInfo = (
  items: EcommerceItem[],
  paymentType: string,
  currency: string = 'LKR'
) => {
  const value = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  pushToDataLayer({
    event: 'add_payment_info',
    currency: currency,
    value: value,
    payment_type: paymentType,
    items: items,
  });
};

// Purchase - Track completed purchase
export const trackPurchase = (
  transactionId: string,
  items: EcommerceItem[],
  value: number,
  currency: string = 'LKR',
  tax?: number,
  shipping?: number,
  coupon?: string
) => {
  pushToDataLayer({
    event: 'purchase',
    transaction_id: transactionId,
    currency: currency,
    value: value,
    tax: tax,
    shipping: shipping,
    coupon: coupon,
    items: items,
  });
};

// Remove from Cart - Track when user removes item from cart
export const trackRemoveFromCart = (item: EcommerceItem, currency: string = 'LKR') => {
  pushToDataLayer({
    event: 'remove_from_cart',
    currency: currency,
    value: item.price * item.quantity,
    items: [item],
  });
};

// Legacy function names for backward compatibility (deprecated)
export const trackCheckout = (items: any[], totalAmount: number) => {
  const ecommerceItems: EcommerceItem[] = items.map((item, index) => ({
    item_id: item.id || item.item_id || `item_${index}`,
    item_name: item.name || item.item_name || 'Competition Registration',
    price: item.price || item.subtotal || 0,
    quantity: item.quantity || 1,
  }));
  
  trackBeginCheckout(ecommerceItems);
};
