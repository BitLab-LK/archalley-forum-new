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
  item_id: string; // Required* (one of item_id or item_name is required)
  item_name: string; // Required* (one of item_id or item_name is required)
  affiliation?: string; // Product affiliation (item-scope only)
  coupon?: string; // Coupon name/code associated with the item
  discount?: number; // Unit monetary discount value
  index?: number; // Index/position of the item in a list
  item_brand?: string; // Brand of the item
  item_category?: string; // Category of the item (first category in hierarchy)
  item_category2?: string; // Second category hierarchy
  item_category3?: string; // Third category hierarchy
  item_category4?: string; // Fourth category hierarchy
  item_category5?: string; // Fifth category hierarchy
  item_list_id?: string; // ID of the list (if set at item-level, event-level is ignored)
  item_list_name?: string; // Name of the list (if set at item-level, event-level is ignored)
  item_variant?: string; // Item variant or unique code/description
  location_id?: string; // Physical location associated with the item (item-scope only)
  price?: number; // Monetary unit price of the item
  quantity?: number; // Item quantity (defaults to 1 if not set)
  promotion_id?: string; // Promotion ID
  promotion_name?: string; // Promotion name
  currency?: string; // Currency (legacy support)
  [key: string]: any; // Allow additional custom parameters (up to 27 custom params)
}

// View Item List - Track when user lands on competition registration page
// Log this event when the user has been presented with a list of items of a certain category.
// Reference: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce-events
export const trackViewItemList = (
  items: EcommerceItem[], 
  currency: string = 'LKR',
  itemListId?: string,
  itemListName?: string
) => {
  // Clear previous ecommerce object
  pushToDataLayer({ ecommerce: null });
  
  const defaultItemListId = itemListId || 'competition_registration_types';
  const defaultItemListName = itemListName || 'Competition Registration Types';
  
  pushToDataLayer({
    event: 'view_item_list',
    ecommerce: {
      currency: currency, // Required if value is set (for revenue metrics)
      item_list_id: defaultItemListId, // Optional: ID of the list (ignored if set at item-level)
      item_list_name: defaultItemListName, // Optional: Name of the list (ignored if set at item-level)
      items: items.map((item, index) => {
        // Item-level item_list_id and item_list_name override event-level
        // If set at item-level, event-level is ignored per GA4 spec
        const itemData: any = {
          ...item,
          index: item.index !== undefined ? item.index : index, // Use provided index or calculated index
        };
        
        // Set item_list_id: use item-level if provided, otherwise use event-level
        if (!itemData.item_list_id) {
          itemData.item_list_id = defaultItemListId;
        }
        
        // Set item_list_name: use item-level if provided, otherwise use event-level
        if (!itemData.item_list_name) {
          itemData.item_list_name = defaultItemListName;
        }
        
        return itemData;
      }),
    },
  });
};

// Select Item - Track when user selects a registration type
// Log this event when a user selects an item from a list.
// Reference: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce-events
export const trackSelectItem = (
  item: EcommerceItem, 
  itemListId?: string,
  itemListName?: string
) => {
  // Clear previous ecommerce object
  pushToDataLayer({ ecommerce: null });
  
  const defaultItemListId = itemListId || 'competition_registration_types';
  const defaultItemListName = itemListName || 'Competition Registration Types';
  
  // Build item object with proper item_list_id and item_list_name handling
  // Item-level item_list_id and item_list_name override event-level per GA4 spec
  const itemData: any = {
    ...item,
    index: item.index !== undefined ? item.index : 0, // Use provided index or default to 0
  };
  
  // Set item_list_id: use item-level if provided, otherwise use event-level
  if (!itemData.item_list_id) {
    itemData.item_list_id = defaultItemListId;
  }
  
  // Set item_list_name: use item-level if provided, otherwise use event-level
  if (!itemData.item_list_name) {
    itemData.item_list_name = defaultItemListName;
  }
  
  pushToDataLayer({
    event: 'select_item',
    ecommerce: {
      item_list_id: defaultItemListId, // Optional: ID of the list (ignored if set at item-level)
      item_list_name: defaultItemListName, // Optional: Name of the list (ignored if set at item-level)
      items: [itemData],
    },
  });
};

// View Item - Track when user views a competition registration page
// Log this event when a user views the details of a specific item.
// Reference: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce-events
export const trackViewItem = (item: EcommerceItem, currency?: string) => {
  // Clear previous ecommerce object
  pushToDataLayer({ ecommerce: null });
  
  const ecommerceData: any = {
    items: [item],
  };
  
  // Add currency if provided
  if (currency) {
    ecommerceData.currency = currency;
  }
  
  // Add value if price and quantity are available
  if (item.price !== undefined && item.quantity !== undefined) {
    ecommerceData.value = item.price * item.quantity;
  } else if (item.price !== undefined) {
    ecommerceData.value = item.price;
  }
  
  pushToDataLayer({
    event: 'view_item',
    ecommerce: ecommerceData,
  });
};

// Add to Cart - Track when user adds registration to cart
// Log this event when a user adds an item to their shopping cart.
// Reference: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce-events
export const trackAddToCart = (items: EcommerceItem[], currency?: string) => {
  // Clear previous ecommerce object
  pushToDataLayer({ ecommerce: null });
  
  const ecommerceData: any = {
    items: items.map((item, index) => ({
      ...item,
      index: item.index !== undefined ? item.index : index,
    })),
  };
  
  // Add currency if provided
  if (currency) {
    ecommerceData.currency = currency;
  }
  
  // Calculate and add value if prices and quantities are available
  const value = items.reduce((sum, item) => {
    const itemPrice = item.price !== undefined ? item.price : 0;
    const itemQuantity = item.quantity !== undefined ? item.quantity : 1;
    return sum + (itemPrice * itemQuantity);
  }, 0);
  
  if (value > 0) {
    ecommerceData.value = value;
  }
  
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: ecommerceData,
  });
};

// View Cart - Track when user views their cart
// Note: This is a custom event (not a standard GA4 e-commerce event)
// Standard GA4 doesn't have view_cart, but we track it for cart analytics
export const trackViewCart = (items: EcommerceItem[], currency?: string) => {
  // Clear previous ecommerce object
  pushToDataLayer({ ecommerce: null });
  
  const ecommerceData: any = {
    items: items.map((item, index) => ({
      ...item,
      index: item.index !== undefined ? item.index : index,
    })),
  };
  
  // Add currency if provided
  if (currency) {
    ecommerceData.currency = currency;
  }
  
  // Calculate and add value if prices and quantities are available
  const value = items.reduce((sum, item) => {
    const itemPrice = item.price !== undefined ? item.price : 0;
    const itemQuantity = item.quantity !== undefined ? item.quantity : 1;
    return sum + (itemPrice * itemQuantity);
  }, 0);
  
  if (value > 0) {
    ecommerceData.value = value;
  }
  
  pushToDataLayer({
    event: 'view_cart',
    ecommerce: ecommerceData,
  });
};

// Begin Checkout - Track when user initiates checkout
// Log this event when a user initiates the checkout process.
// Reference: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce-events
export const trackBeginCheckout = (items: EcommerceItem[], currency?: string, coupon?: string) => {
  // Clear previous ecommerce object
  pushToDataLayer({ ecommerce: null });
  
  const ecommerceData: any = {
    items: items.map((item, index) => ({
      ...item,
      index: item.index !== undefined ? item.index : index,
    })),
  };
  
  // Add currency if provided
  if (currency) {
    ecommerceData.currency = currency;
  }
  
  // Add coupon if provided
  if (coupon) {
    ecommerceData.coupon = coupon;
  }
  
  // Calculate and add value if prices and quantities are available
  const value = items.reduce((sum, item) => {
    const itemPrice = item.price !== undefined ? item.price : 0;
    const itemQuantity = item.quantity !== undefined ? item.quantity : 1;
    return sum + (itemPrice * itemQuantity);
  }, 0);
  
  if (value > 0) {
    ecommerceData.value = value;
  }
  
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: ecommerceData,
  });
};

// Add Payment Info - Track when user selects payment method
// Log this event when a user adds payment information during checkout.
// Reference: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce-events
export const trackAddPaymentInfo = (
  items: EcommerceItem[],
  paymentType?: string,
  currency?: string,
  coupon?: string
) => {
  // Clear previous ecommerce object
  pushToDataLayer({ ecommerce: null });
  
  const ecommerceData: any = {
    items: items.map((item, index) => ({
      ...item,
      index: item.index !== undefined ? item.index : index,
    })),
  };
  
  // Add currency if provided
  if (currency) {
    ecommerceData.currency = currency;
  }
  
  // Add coupon if provided
  if (coupon) {
    ecommerceData.coupon = coupon;
  }
  
  // Add payment_type if provided
  if (paymentType) {
    ecommerceData.payment_type = paymentType;
  }
  
  // Calculate and add value if prices and quantities are available
  const value = items.reduce((sum, item) => {
    const itemPrice = item.price !== undefined ? item.price : 0;
    const itemQuantity = item.quantity !== undefined ? item.quantity : 1;
    return sum + (itemPrice * itemQuantity);
  }, 0);
  
  if (value > 0) {
    ecommerceData.value = value;
  }
  
  pushToDataLayer({
    event: 'add_payment_info',
    ecommerce: ecommerceData,
  });
};

// Purchase - Track completed purchase
// Log this event when a user completes a purchase.
// Reference: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce-events
export const trackPurchase = (
  transactionId: string,
  items: EcommerceItem[],
  value?: number,
  currency?: string,
  tax?: number,
  shipping?: number,
  coupon?: string,
  affiliation?: string
) => {
  // Clear previous ecommerce object
  pushToDataLayer({ ecommerce: null });
  
  const ecommerceData: any = {
    transaction_id: transactionId,
    items: items.map((item, index) => ({
      ...item,
      index: item.index !== undefined ? item.index : index,
    })),
  };
  
  // Add currency if provided
  if (currency) {
    ecommerceData.currency = currency;
  }
  
  // Add value if provided, otherwise calculate from items
  if (value !== undefined) {
    ecommerceData.value = value;
  } else {
    // Calculate value from items if not provided
    const calculatedValue = items.reduce((sum, item) => {
      const itemPrice = item.price !== undefined ? item.price : 0;
      const itemQuantity = item.quantity !== undefined ? item.quantity : 1;
      return sum + (itemPrice * itemQuantity);
    }, 0);
    if (calculatedValue > 0) {
      ecommerceData.value = calculatedValue;
    }
  }
  
  // Add optional parameters if provided
  if (tax !== undefined) {
    ecommerceData.tax = tax;
  }
  
  if (shipping !== undefined) {
    ecommerceData.shipping = shipping;
  }
  
  if (coupon) {
    ecommerceData.coupon = coupon;
  }
  
  if (affiliation) {
    ecommerceData.affiliation = affiliation;
  }
  
  pushToDataLayer({
    event: 'purchase',
    ecommerce: ecommerceData,
  });
};

// Remove from Cart - Track when user removes item from cart
// Log this event when a user removes an item from their shopping cart.
// Reference: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce-events
export const trackRemoveFromCart = (item: EcommerceItem, currency?: string) => {
  // Clear previous ecommerce object
  pushToDataLayer({ ecommerce: null });
  
  const ecommerceData: any = {
    items: [{
      ...item,
      index: item.index !== undefined ? item.index : 0,
    }],
  };
  
  // Add currency if provided
  if (currency) {
    ecommerceData.currency = currency;
  }
  
  // Add value if price and quantity are available
  const itemPrice = item.price !== undefined ? item.price : 0;
  const itemQuantity = item.quantity !== undefined ? item.quantity : 1;
  const value = itemPrice * itemQuantity;
  
  if (value > 0) {
    ecommerceData.value = value;
  }
  
  pushToDataLayer({
    event: 'remove_from_cart',
    ecommerce: ecommerceData,
  });
};

// Legacy function names for backward compatibility (deprecated)
export const trackCheckout = (items: any[], _totalAmount: number) => {
  const ecommerceItems: EcommerceItem[] = items.map((item, index) => ({
    item_id: item.id || item.item_id || `item_${index}`,
    item_name: item.name || item.item_name || 'Competition Registration',
    price: item.price || item.subtotal || 0,
    quantity: item.quantity || 1,
  }));
  
  trackBeginCheckout(ecommerceItems);
};
