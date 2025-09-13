import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Test endpoint for Sentry error tracking
 * This endpoint is used to verify Sentry integration and test different error scenarios
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get('scenario') || 'info';
  
  try {
    // Set user context for better error tracking
    Sentry.setUser({
      id: 'test-user',
      email: 'test@example.com',
      ip_address: request.ip,
    });
    
    // Add breadcrumb for this request
    Sentry.addBreadcrumb({
      message: 'Sentry test endpoint accessed',
      category: 'http',
      level: 'info',
      data: {
        scenario,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
      },
    });
    
    switch (scenario) {
      case 'error':
        throw new Error('Test error from API route');
        
      case 'async-error':
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Async test error')), 100);
        });
        break;
        
      case 'unhandled-promise':
        // Intentional unhandled promise rejection
        Promise.reject(new Error('Unhandled promise rejection test'));
        break;
        
      case 'database-error':
        // Simulate database error
        const dbError = new Error('Database connection failed');
        dbError.name = 'DatabaseError';
        throw dbError;
        
      case 'validation-error':
        // Simulate validation error
        const validationError = new Error('Invalid input data');
        validationError.name = 'ValidationError';
        throw validationError;
        
      case 'auth-error':
        // Simulate authentication error
        const authError = new Error('Authentication failed');
        authError.name = 'AuthenticationError';
        throw authError;
        
      case 'rate-limit':
        // Simulate rate limit error
        const rateLimitError = new Error('Rate limit exceeded');
        rateLimitError.name = 'RateLimitError';
        throw rateLimitError;
        
      case 'timeout':
        // Simulate timeout
        await new Promise((resolve) => setTimeout(resolve, 30000));
        break;
        
      case 'memory':
        // Simulate memory issue (careful - don't actually exhaust memory)
        const memoryError = new Error('Memory allocation failed');
        memoryError.name = 'MemoryError';
        throw memoryError;
        
      case 'performance':
        // Test performance monitoring
        const transaction = Sentry.startTransaction({
          name: 'sentry-test-performance',
          op: 'http.server',
        });
        
        // Simulate slow operation
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 500));
        const endTime = Date.now();
        
        transaction.setTag('slow_operation', true);
        transaction.setData('duration_ms', endTime - startTime);
        transaction.finish();
        
        return NextResponse.json({
          success: true,
          message: 'Performance test completed',
          duration: endTime - startTime,
          scenarios: getAvailableScenarios(),
        });
        
      case 'warning':
        Sentry.captureMessage('Test warning message', 'warning');
        break;
        
      case 'info':
        Sentry.captureMessage('Test info message', 'info');
        break;
        
      case 'custom-error':
        // Test custom error with additional context
        const customError = new Error('Custom error with context');
        Sentry.withScope((scope) => {
          scope.setTag('error_type', 'custom');
          scope.setLevel('error');
          scope.setContext('custom_data', {
            component: 'sentry-test',
            feature: 'error-tracking',
            timestamp: new Date().toISOString(),
          });
          Sentry.captureException(customError);
        });
        throw customError;
        
      default:
        // Default success response
        return NextResponse.json({
          success: true,
          message: 'Sentry test endpoint is working',
          timestamp: new Date().toISOString(),
          scenarios: getAvailableScenarios(),
        });
    }
    
    return NextResponse.json({
      success: true,
      message: `Test scenario '${scenario}' completed successfully`,
      scenarios: getAvailableScenarios(),
    });
    
  } catch (error) {
    // Capture the error with Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'sentry-test',
        scenario,
      },
      extra: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        timestamp: new Date().toISOString(),
      },
    });
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        scenario,
        scenarios: getAvailableScenarios(),
      },
      { status: 500 }
    );
  }
}

function getAvailableScenarios() {
  return [
    'info',
    'warning',
    'error',
    'async-error',
    'unhandled-promise',
    'database-error',
    'validation-error',
    'auth-error',
    'rate-limit',
    'timeout',
    'memory',
    'performance',
    'custom-error',
  ];
}

// POST endpoint for testing form submission errors
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.type) {
      throw new Error('Missing required field: type');
    }
    
    // Add breadcrumb for form submission
    Sentry.addBreadcrumb({
      message: 'Form submission test',
      category: 'form',
      level: 'info',
      data: body,
    });
    
    // Simulate different error scenarios based on form type
    switch (body.type) {
      case 'validation':
        if (!body.email || !body.email.includes('@')) {
          throw new Error('Invalid email format');
        }
        break;
        
      case 'server':
        throw new Error('Server processing error');
        
      case 'network':
        // Simulate network timeout
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 1000);
        });
        break;
        
      default:
        // Success case
        break;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Form submission processed successfully',
      data: body,
    });
    
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: 'sentry-test',
        method: 'POST',
      },
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}