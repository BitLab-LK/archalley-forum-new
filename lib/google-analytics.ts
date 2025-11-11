// Google Analytics utility functions
// Documentation: https://developers.google.com/analytics/devguides/collection/gtagjs

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Initialize Google Analytics
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track specific events (helper functions)
export const trackButtonClick = (buttonName: string) => {
  event({
    action: 'click',
    category: 'engagement',
    label: buttonName,
  });
};

export const trackSearch = (searchTerm: string) => {
  event({
    action: 'search',
    category: 'engagement',
    label: searchTerm,
  });
};

export const trackSignup = (method: string) => {
  event({
    action: 'sign_up',
    category: 'user',
    label: method,
  });
};

export const trackLogin = (method: string) => {
  event({
    action: 'login',
    category: 'user',
    label: method,
  });
};

export const trackShare = (contentType: string, contentId: string) => {
  event({
    action: 'share',
    category: 'engagement',
    label: `${contentType}_${contentId}`,
  });
};
