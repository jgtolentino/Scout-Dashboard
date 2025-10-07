// This file configures the initialization of Sentry on the server side
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Debugging
  debug: process.env.NODE_ENV === 'development',
  
  // Server-specific options
  autoSessionTracking: true,
  
  // Integrations
  integrations: [
    // HTTP integration for tracing
    new Sentry.Integrations.Http({ tracing: true }),
    
    // Undici integration for fetch tracing
    new Sentry.Integrations.Undici({
      breadcrumbs: true,
      tracing: true,
    }),
  ],
  
  // Filtering
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_SEND_IN_DEV) {
      return null;
    }
    
    // Filter out health check requests
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }
    
    // Remove sensitive data
    if (event.request) {
      // Remove auth headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      
      // Remove sensitive query params
      if (event.request.query_string) {
        event.request.query_string = event.request.query_string.replace(
          /token=[^&]*/g,
          'token=***'
        );
      }
    }
    
    return event;
  },
  
  // Profiling (requires @sentry/profiling-node)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});