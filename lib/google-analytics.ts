/**
 * Google Analytics Utilities
 * Helper functions for tracking events with Google Analytics 4
 */

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-JQPH81Z02Y';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track custom events
type EventParams = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
};

export const event = ({ action, category, label, value, ...params }: EventParams) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...params,
    });
  }
};

// Track button/link clicks
export const trackButtonClick = (buttonName: string, location?: string) => {
  event({
    action: 'click',
    category: 'engagement',
    label: buttonName,
    location: location,
  });
};

// Track user signup
export const trackSignup = (method: string) => {
  event({
    action: 'sign_up',
    category: 'user',
    label: method,
  });
};

// Track user login
export const trackLogin = (method: string) => {
  event({
    action: 'login',
    category: 'user',
    label: method,
  });
};

// Track search queries
export const trackSearch = (searchTerm: string, resultCount?: number) => {
  event({
    action: 'search',
    category: 'engagement',
    label: searchTerm,
    value: resultCount,
  });
};

// Track post interactions
export const trackPostInteraction = (action: 'upvote' | 'downvote' | 'comment', postId: string) => {
  event({
    action: action,
    category: 'post',
    label: postId,
  });
};

// Track competition events
export const trackCompetitionEvent = (action: string, competitionName: string, details?: any) => {
  event({
    action: action,
    category: 'competition',
    label: competitionName,
    ...details,
  });
};

// Track checkout initiation
export const trackCheckout = (items: any[], totalAmount: number) => {
  event({
    action: 'begin_checkout',
    category: 'ecommerce',
    label: 'competition_registration',
    value: totalAmount,
    items: items,
  });
};

// Track purchase completion
export const trackPurchase = (orderId: string, amount: number, items: any[]) => {
  event({
    action: 'purchase',
    category: 'ecommerce',
    label: 'competition_registration',
    transaction_id: orderId,
    value: amount,
    items: items,
  });
};
