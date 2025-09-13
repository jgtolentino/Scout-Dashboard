import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// Example API route showing Sentry error tracking
export async function GET(request: NextRequest) {
  try {
    // Add breadcrumb for tracking
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'Sentry example endpoint called',
      level: 'info',
    });
    
    // Simulate different scenarios based on query params
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario');
    
    switch (scenario) {
      case 'error':
        // Capture handled error
        try {
          throw new Error('This is a test error for Sentry');
        } catch (error) {
          Sentry.captureException(error, {
            tags: {
              section: 'api',
              test: true,
            },
            extra: {
              scenario: 'handled_error',
            },
          });
          
          return NextResponse.json(
            { error: 'Test error captured by Sentry' },
            { status: 500 }
          );
        }
        
      case 'message':
        // Capture custom message
        Sentry.captureMessage('Test message from API', 'info');
        return NextResponse.json({ message: 'Test message sent to Sentry' });
        
      case 'performance':
        // Track performance
        const transaction = Sentry.startTransaction({
          op: 'api.monitoring.example',
          name: 'Example API Transaction',
        });
        
        Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 100));
        
        transaction.finish();
        
        return NextResponse.json({ message: 'Performance tracked' });
        
      case 'user':
        // Set user context
        Sentry.setUser({
          id: '12345',
          email: 'test@example.com',
          username: 'testuser',
        });
        
        return NextResponse.json({ message: 'User context set' });
        
      case 'crash':
        // Unhandled error (will crash the route)
        throw new Error('Unhandled crash for testing');
        
      default:
        return NextResponse.json({
          message: 'Sentry monitoring active',
          scenarios: ['error', 'message', 'performance', 'user', 'crash'],
        });
    }
  } catch (error) {
    // This will be automatically captured by Sentry
    throw error;
  }
}

// Example of custom instrumentation wrapper
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Wrap the handler with Sentry
const handler = Sentry.withSentryAPI(GET, '/api/monitoring/sentry-example');