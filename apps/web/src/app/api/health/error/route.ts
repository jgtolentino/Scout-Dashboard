import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { withSentryApiMiddleware } from '@/app/api/middleware';

/**
 * API Error Handler Test Endpoint
 * Used for testing API error handling and monitoring
 */

const handler = async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const errorType = searchParams.get('type') || '500';
  const message = searchParams.get('message') || 'Test error';

  // Add breadcrumb for error testing
  Sentry.addBreadcrumb({
    message: 'API error test triggered',
    level: 'info',
    category: 'test',
    data: { errorType, message },
  });

  switch (errorType) {
    case '400':
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid request parameters',
          code: 'INVALID_REQUEST',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );

    case '401':
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );

    case '403':
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );

    case '404':
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );

    case '422':
      return NextResponse.json(
        {
          error: 'Unprocessable Entity',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: {
            field: 'example_field',
            reason: 'Invalid format',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 422 }
      );

    case '429':
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60,
          timestamp: new Date().toISOString(),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
          }
        }
      );

    case '500':
    default:
      // Throw an actual error to test error boundary
      throw new Error(message || 'Internal server error test');
  }
};

// Export wrapped handler with Sentry middleware
export const GET = withSentryApiMiddleware(handler);
export const POST = withSentryApiMiddleware(handler);
export const PUT = withSentryApiMiddleware(handler);
export const DELETE = withSentryApiMiddleware(handler);