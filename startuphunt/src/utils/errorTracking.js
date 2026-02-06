// Error tracking utility using Google Analytics

// Track errors with Google Analytics
export const trackError = (error, context = {}) => {
  if (typeof window === 'undefined' || !window.gtag || !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    return;
  }

  const errorMessage = error?.message || 'Unknown error';
  const errorName = error?.name || 'Error';
  const errorStack = error?.stack || '';

  // Send to Google Analytics as exception event
  window.gtag('event', 'exception', {
    description: errorMessage,
    fatal: false, // Set to true for critical errors
    error_name: errorName,
    error_type: context.type || 'javascript_error',
    page_path: window.location.pathname,
    // Additional context (sanitized)
    ...(context.filename && { filename: context.filename }),
    ...(context.lineno && { lineno: context.lineno }),
    ...(context.colno && { colno: context.colno }),
  });
};

// Track custom events (replaces Sentry events)
export const trackEvent = (eventName, data = {}) => {
  if (typeof window === 'undefined' || !window.gtag || !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    return;
  }

  window.gtag('event', eventName, {
    event_category: data.category || 'custom',
    event_label: data.label || '',
    ...data
  });
};

// Add breadcrumb (optional - for debugging, sends to GA as custom event)
export const addBreadcrumb = (message, category = 'custom', data = {}) => {
  // Send as custom event to GA for debugging
  trackEvent('breadcrumb', {
    category: category,
    label: message,
    ...data
  });
};

// No-op functions for compatibility (GA doesn't need user context)
export const setUserContext = () => { };
export const clearUserContext = () => { };

// No-op initialization (GA is initialized in useAnalytics hook)
export const initErrorTracking = () => {
  // Google Analytics is initialized via useAnalytics hook in App.jsx
  // No separate initialization needed here
};
