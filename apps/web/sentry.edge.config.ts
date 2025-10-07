// This file configures the initialization of Sentry for the Edge Runtime
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring (limited in edge runtime)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Edge runtime has limited API surface
  // Many features are not available
  
  // Filtering
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }
    
    // Add edge runtime context
    if (!event.contexts) {
      event.contexts = {};
    }
    event.contexts.runtime = {
      name: 'edge',
      version: process.env.NEXT_RUNTIME,
    };
    
    return event;
  },
});