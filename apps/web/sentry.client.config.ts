// This file configures the initialization of Sentry on the client side
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Debugging
  debug: process.env.NODE_ENV === 'development',
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      // Performance monitoring for Next.js
      routingInstrumentation: Sentry.nextRouterInstrumentation,
      
      // Trace HTTP requests
      tracingOrigins: [
        'localhost',
        /^https:\/\/[^/]*\.vercel\.app\//,
        // Add your production domain here
      ],
    }),
    new Sentry.Replay({
      // Privacy settings
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
      
      // Only capture errors and rage clicks
      stickySession: true,
    }),
  ],
  
  // Filtering
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }
    
    // Filter out non-app errors
    if (event.exception) {
      const error = hint.originalException;
      // Filter browser extension errors
      if (error && error.message && error.message.match(/extension|chrome-extension|moz-extension/i)) {
        return null;
      }
    }
    
    return event;
  },
  
  // Don't capture certain errors
  ignoreErrors: [
    // Browser errors
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    
    // Network errors that are expected
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    
    // Browser extension errors
    'Extension context invalidated',
    'chrome-extension',
    'moz-extension',
  ],
});