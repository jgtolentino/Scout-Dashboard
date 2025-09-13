// This file is required for Next.js instrumentation
// It runs before your code in both server and edge runtime

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    const { initSentry } = await import('./lib/monitoring/sentry');
    
    initSentry({
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    
    console.log('Sentry initialized for Node.js runtime');
  }
  
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime monitoring (limited Sentry support)
    console.log('Edge runtime detected - limited monitoring available');
  }
}