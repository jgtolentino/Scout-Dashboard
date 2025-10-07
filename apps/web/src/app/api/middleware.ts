import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * API middleware for Sentry error tracking and performance monitoring
 */

export function withSentryApiMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Start transaction for API request
    const transaction = Sentry.startTransaction({
      name: `API ${req.method} ${req.nextUrl.pathname}`,
      op: 'http.server',
    });

    // Set initial context
    Sentry.setTag('api_route', req.nextUrl.pathname);
    Sentry.setTag('method', req.method);
    Sentry.setTag('user_agent', req.headers.get('user-agent') || 'unknown');

    // Add request context
    Sentry.setContext('request', {
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(
        Array.from(req.headers.entries()).filter(([key]) => 
          !['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())
        )
      ),
      query: Object.fromEntries(req.nextUrl.searchParams),
    });

    const startTime = performance.now();

    try {
      // Execute the API handler
      const response = await handler(req);
      const duration = performance.now() - startTime;

      // Record successful response
      transaction.setStatus('ok');
      transaction.setData('status_code', response.status);
      transaction.setData('duration_ms', duration);
      transaction.setData('success', true);

      // Add performance breadcrumb
      Sentry.addBreadcrumb({
        message: `API call completed: ${req.method} ${req.nextUrl.pathname}`,
        level: 'info',
        data: {
          status: response.status,
          duration,
        },
      });

      // Check for slow requests
      if (duration > 1000) {
        Sentry.addBreadcrumb({
          message: 'Slow API request detected',
          level: 'warning',
          data: {
            endpoint: req.nextUrl.pathname,
            duration,
            threshold: 1000,
          },
        });
      }

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      // Record error details
      transaction.setStatus('internal_error');
      transaction.setData('duration_ms', duration);
      transaction.setData('success', false);

      // Capture error with additional context
      Sentry.withScope((scope) => {
        scope.setLevel('error');
        scope.setTag('api_error', 'true');
        scope.setContext('error_details', {
          endpoint: req.nextUrl.pathname,
          method: req.method,
          duration,
          timestamp: new Date().toISOString(),
        });

        // Add error classification
        if (error instanceof Error) {
          scope.setTag('error_type', error.name);
          scope.setFingerprint(['api-error', req.nextUrl.pathname, error.name]);
        }

        Sentry.captureException(error);
      });

      // Re-throw the error to be handled by Next.js
      throw error;
    } finally {
      transaction.finish();
    }
  };
}

/**
 * Middleware for monitoring API performance specifically
 */
export function withApiPerformanceMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  options: {
    operationName: string;
    expectedDuration?: number;
    tags?: Record<string, string>;
  }
) {
  return async (...args: T): Promise<R> => {
    const transaction = Sentry.startTransaction({
      name: options.operationName,
      op: 'function.api',
    });

    // Add tags
    if (options.tags) {
      Object.entries(options.tags).forEach(([key, value]) => {
        transaction.setTag(key, value);
      });
    }

    const startTime = performance.now();

    try {
      const result = await handler(...args);
      const duration = performance.now() - startTime;

      transaction.setStatus('ok');
      transaction.setData('duration_ms', duration);
      transaction.setData('success', true);

      // Check if operation exceeded expected duration
      if (options.expectedDuration && duration > options.expectedDuration) {
        Sentry.addBreadcrumb({
          message: `Slow operation: ${options.operationName}`,
          level: 'warning',
          data: {
            duration,
            expected: options.expectedDuration,
            operation: options.operationName,
          },
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      transaction.setStatus('internal_error');
      transaction.setData('duration_ms', duration);
      transaction.setData('success', false);

      Sentry.withScope((scope) => {
        scope.setTag('operation', options.operationName);
        scope.setLevel('error');
        Sentry.captureException(error);
      });

      throw error;
    } finally {
      transaction.finish();
    }
  };
}

/**
 * Rate limiting with Sentry monitoring
 */
export function withRateLimitMonitoring(
  rateLimitCheck: (req: NextRequest) => Promise<boolean>,
  identifier = 'api_rate_limit'
) {
  return async (req: NextRequest): Promise<boolean> => {
    try {
      const isAllowed = await rateLimitCheck(req);
      
      if (!isAllowed) {
        // Log rate limit hit
        Sentry.addBreadcrumb({
          message: 'Rate limit exceeded',
          level: 'warning',
          data: {
            endpoint: req.nextUrl.pathname,
            method: req.method,
            ip: req.ip,
            userAgent: req.headers.get('user-agent'),
          },
        });

        // Capture rate limit event
        Sentry.captureMessage(
          `Rate limit exceeded for ${req.nextUrl.pathname}`,
          'warning'
        );
      }

      return isAllowed;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'rate_limiter',
          identifier,
        },
      });
      
      // Fail open - allow request if rate limiting fails
      return true;
    }
  };
}

/**
 * Authentication monitoring
 */
export function withAuthMonitoring<T>(
  authCheck: (req: NextRequest) => Promise<T | null>,
  options: {
    requireAuth?: boolean;
    roles?: string[];
  } = {}
) {
  return async (req: NextRequest): Promise<T | null> => {
    try {
      const authResult = await authCheck(req);
      
      if (!authResult && options.requireAuth) {
        Sentry.addBreadcrumb({
          message: 'Authentication failed',
          level: 'warning',
          data: {
            endpoint: req.nextUrl.pathname,
            method: req.method,
            hasAuthHeader: !!req.headers.get('authorization'),
          },
        });
      }

      // Set user context if authentication succeeded
      if (authResult && typeof authResult === 'object' && 'id' in authResult) {
        Sentry.setUser({
          id: String((authResult as any).id),
          email: (authResult as any).email,
        });
      }

      return authResult;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'authentication',
          endpoint: req.nextUrl.pathname,
        },
      });
      
      return null;
    }
  };
}

/**
 * Database operation monitoring
 */
export function withDatabaseMonitoring<T extends any[], R>(
  dbOperation: (...args: T) => Promise<R>,
  options: {
    operation: string;
    table?: string;
    query?: string;
  }
) {
  return async (...args: T): Promise<R> => {
    const transaction = Sentry.startTransaction({
      name: `DB ${options.operation}`,
      op: 'db.query',
    });

    transaction.setTag('table', options.table || 'unknown');
    transaction.setTag('operation', options.operation);

    if (options.query) {
      transaction.setData('query', options.query);
    }

    const startTime = performance.now();

    try {
      const result = await dbOperation(...args);
      const duration = performance.now() - startTime;

      transaction.setStatus('ok');
      transaction.setData('duration_ms', duration);
      transaction.setData('success', true);

      // Add result metrics
      if (Array.isArray(result)) {
        transaction.setData('rows_affected', result.length);
      }

      // Monitor for slow queries
      if (duration > 1000) {
        Sentry.addBreadcrumb({
          message: 'Slow database query detected',
          level: 'warning',
          data: {
            operation: options.operation,
            table: options.table,
            duration,
          },
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      transaction.setStatus('internal_error');
      transaction.setData('duration_ms', duration);
      transaction.setData('success', false);

      Sentry.withScope((scope) => {
        scope.setTag('db_operation', options.operation);
        scope.setTag('table', options.table || 'unknown');
        scope.setLevel('error');
        
        if (error instanceof Error) {
          scope.setFingerprint(['db-error', options.operation, error.name]);
        }
        
        Sentry.captureException(error);
      });

      throw error;
    } finally {
      transaction.finish();
    }
  };
}