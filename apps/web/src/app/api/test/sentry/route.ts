import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { captureException, addBreadcrumb, ErrorLevel } from '@/lib/monitoring/sentry';

/**
 * Sentry Test Endpoint - For verifying Sentry integration
 * Use this endpoint to test error tracking and performance monitoring
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'info';

    // Add breadcrumb for test
    addBreadcrumb({
      message: 'Sentry test endpoint called',
      category: 'test',
      level: 'info',
      data: { testType },
    });

    switch (testType) {
      case 'error':
        // Test error capture
        throw new Error('Test error from Sentry test endpoint');
        
      case 'warning':
        // Test warning capture
        Sentry.captureMessage('Test warning message', 'warning');
        return NextResponse.json({
          status: 'success',
          message: 'Warning captured in Sentry',
          testType: 'warning',
        });
        
      case 'performance':
        // Test performance monitoring
        const transaction = Sentry.startTransaction({
          name: 'sentry-test-performance',
          op: 'test.performance',
        });
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 100));
        
        transaction.setData('test_data', { duration: 100 });
        transaction.setStatus('ok');
        transaction.finish();
        
        return NextResponse.json({
          status: 'success',
          message: 'Performance transaction captured',
          testType: 'performance',
        });
        
      case 'breadcrumb':
        // Test breadcrumb capture
        addBreadcrumb({
          message: 'Test breadcrumb #1',
          category: 'test',
          level: 'info',
        });
        
        addBreadcrumb({
          message: 'Test breadcrumb #2',
          category: 'test',
          level: 'debug',
        });
        
        Sentry.captureMessage('Test message with breadcrumbs', 'info');
        
        return NextResponse.json({
          status: 'success',
          message: 'Breadcrumbs captured',
          testType: 'breadcrumb',
        });
        
      case 'user':
        // Test user context
        Sentry.setUser({
          id: 'test-user-123',
          email: 'test@example.com',
          username: 'testuser',
        });
        
        Sentry.captureMessage('Test message with user context', 'info');
        
        return NextResponse.json({
          status: 'success',
          message: 'User context set and message captured',
          testType: 'user',
        });
        
      case 'tags':
        // Test tags and context
        Sentry.setTag('test_tag', 'test_value');
        Sentry.setContext('test_context', {
          feature: 'sentry_testing',
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        });
        
        Sentry.captureMessage('Test message with tags and context', 'info');
        
        return NextResponse.json({
          status: 'success',
          message: 'Tags and context captured',
          testType: 'tags',
        });
        
      default:
        // Default info test
        Sentry.captureMessage('Sentry test endpoint called successfully', 'info');
        
        return NextResponse.json({
          status: 'success',
          message: 'Sentry is working correctly',
          testType: 'info',
          availableTests: [
            'error',
            'warning', 
            'performance',
            'breadcrumb',
            'user',
            'tags'
          ],
        });
    }
  } catch (error) {
    // Capture the error with enhanced context
    captureException(error as Error, {
      tags: {
        endpoint: 'sentry-test',
        testType: new URL(request.url).searchParams.get('type') || 'unknown',
      },
      extra: {
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        status: 'error',
        message: 'Error captured in Sentry',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test custom error with request data
    Sentry.withScope((scope) => {
      scope.setTag('method', 'POST');
      scope.setContext('request_body', body);
      
      if (body.test_error) {
        throw new Error('Test POST error with custom data');
      }
      
      Sentry.captureMessage('POST test successful', 'info');
    });

    return NextResponse.json({
      status: 'success',
      message: 'POST test completed',
      received: body,
    });
  } catch (error) {
    captureException(error as Error, {
      tags: {
        endpoint: 'sentry-test-post',
        method: 'POST',
      },
    });

    return NextResponse.json(
      {
        status: 'error',
        message: 'POST error captured',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}