import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { ZodError } from 'zod';

/**
 * Standardized API Error Handling
 * - Security-hardened error responses
 * - Comprehensive error tracking
 * - Consistent error format
 * - Production-safe error exposure
 */

export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export interface ApiError {
  error: string;
  message: string;
  code: ErrorCode;
  timestamp: string;
  requestId?: string;
  details?: Record<string, any>;
}

export interface ApiErrorOptions {
  cause?: Error;
  details?: Record<string, any>;
  requestId?: string;
  statusCode?: number;
  exposeStack?: boolean;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly requestId?: string;
  public readonly timestamp: string;
  public readonly exposeStack: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    options: ApiErrorOptions = {}
  ) {
    super(message, { cause: options.cause });
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = options.details;
    this.requestId = options.requestId;
    this.timestamp = new Date().toISOString();
    this.exposeStack = options.exposeStack ?? process.env.NODE_ENV !== 'production';

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON(): ApiError {
    return {
      error: this.getErrorName(),
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      requestId: this.requestId,
      details: this.details,
    };
  }

  private getErrorName(): string {
    const statusCode = this.statusCode;
    
    if (statusCode >= 400 && statusCode < 500) {
      return 'Client Error';
    } else if (statusCode >= 500) {
      return 'Server Error';
    }
    
    return 'Unknown Error';
  }
}

/**
 * Global API Error Handler
 */
export function handleApiError(error: unknown, options: ApiErrorOptions = {}): NextResponse<ApiError> {
  const isProduction = process.env.NODE_ENV === 'production';
  const requestId = options.requestId || generateRequestId();

  let appError: AppError;

  // Handle different error types
  if (error instanceof AppError) {
    appError = error;
    appError.requestId = appError.requestId || requestId;
  } else if (error instanceof ZodError) {
    // Validation errors
    appError = new AppError(
      'Validation failed',
      ErrorCode.VALIDATION_ERROR,
      422,
      {
        ...options,
        requestId,
        details: {
          validationErrors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        },
      }
    );
  } else if (error instanceof Error) {
    // Generic JavaScript errors
    const statusCode = getStatusCodeFromError(error);
    const code = getErrorCodeFromError(error, statusCode);
    
    appError = new AppError(
      isProduction ? getGenericMessage(statusCode) : error.message,
      code,
      statusCode,
      {
        ...options,
        requestId,
        cause: error,
      }
    );
  } else {
    // Unknown error type
    appError = new AppError(
      isProduction ? 'An unexpected error occurred' : String(error),
      ErrorCode.INTERNAL_ERROR,
      500,
      {
        ...options,
        requestId,
      }
    );
  }

  // Capture error in Sentry
  captureApiError(appError, error);

  // Create response
  const response = NextResponse.json(appError.toJSON(), {
    status: appError.statusCode,
    headers: {
      'X-Request-ID': requestId,
      'X-Error-Code': appError.code,
    },
  });

  return response;
}

/**
 * Capture API error in Sentry with enhanced context
 */
function captureApiError(appError: AppError, originalError: unknown): void {
  Sentry.withScope((scope) => {
    // Set error level based on status code
    const level = appError.statusCode >= 500 ? 'error' : 'warning';
    scope.setLevel(level);

    // Set tags
    scope.setTag('error_code', appError.code);
    scope.setTag('status_code', appError.statusCode);
    scope.setTag('api_error', 'true');

    // Set request context
    if (appError.requestId) {
      scope.setTag('request_id', appError.requestId);
    }

    // Set error details as context
    scope.setContext('error_details', {
      code: appError.code,
      statusCode: appError.statusCode,
      timestamp: appError.timestamp,
      details: appError.details,
    });

    // Set fingerprint for better grouping
    scope.setFingerprint(['api-error', appError.code, appError.statusCode.toString()]);

    // Add breadcrumb
    scope.addBreadcrumb({
      message: `API Error: ${appError.message}`,
      level,
      category: 'error',
      data: {
        code: appError.code,
        statusCode: appError.statusCode,
      },
    });

    // Capture the original error if it's different
    if (originalError instanceof Error && originalError !== appError) {
      Sentry.captureException(originalError);
    } else {
      Sentry.captureException(appError);
    }
  });
}

/**
 * Determine status code from error type
 */
function getStatusCodeFromError(error: Error): number {
  const message = error.message.toLowerCase();
  
  if (message.includes('unauthorized') || message.includes('authentication')) {
    return 401;
  }
  if (message.includes('forbidden') || message.includes('permission')) {
    return 403;
  }
  if (message.includes('not found')) {
    return 404;
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 422;
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 429;
  }
  if (message.includes('timeout')) {
    return 504;
  }
  
  return 500;
}

/**
 * Determine error code from error and status code
 */
function getErrorCodeFromError(error: Error, statusCode: number): ErrorCode {
  const message = error.message.toLowerCase();
  
  switch (statusCode) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.RATE_LIMIT_EXCEEDED;
    case 504:
      return ErrorCode.TIMEOUT_ERROR;
    default:
      if (message.includes('database') || message.includes('db')) {
        return ErrorCode.DATABASE_ERROR;
      }
      if (message.includes('fetch') || message.includes('network') || message.includes('api')) {
        return ErrorCode.EXTERNAL_SERVICE_ERROR;
      }
      return ErrorCode.INTERNAL_ERROR;
  }
}

/**
 * Get generic error message for production
 */
function getGenericMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad request';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Conflict with current state';
    case 422:
      return 'Invalid input data';
    case 429:
      return 'Too many requests';
    case 500:
      return 'Internal server error';
    case 502:
      return 'Bad gateway';
    case 503:
      return 'Service unavailable';
    case 504:
      return 'Gateway timeout';
    default:
      return 'An error occurred';
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Predefined error factory functions
 */
export const createApiError = {
  badRequest: (message: string, details?: Record<string, any>) =>
    new AppError(message, ErrorCode.BAD_REQUEST, 400, { details }),
    
  unauthorized: (message: string = 'Authentication required') =>
    new AppError(message, ErrorCode.UNAUTHORIZED, 401),
    
  forbidden: (message: string = 'Access denied') =>
    new AppError(message, ErrorCode.FORBIDDEN, 403),
    
  notFound: (resource: string = 'Resource') =>
    new AppError(`${resource} not found`, ErrorCode.NOT_FOUND, 404),
    
  conflict: (message: string, details?: Record<string, any>) =>
    new AppError(message, ErrorCode.CONFLICT, 409, { details }),
    
  validation: (message: string, details?: Record<string, any>) =>
    new AppError(message, ErrorCode.VALIDATION_ERROR, 422, { details }),
    
  rateLimit: (retryAfter: number = 60) =>
    new AppError(
      'Rate limit exceeded', 
      ErrorCode.RATE_LIMIT_EXCEEDED, 
      429, 
      { details: { retryAfter } }
    ),
    
  internal: (message: string = 'Internal server error') =>
    new AppError(message, ErrorCode.INTERNAL_ERROR, 500),
    
  database: (message: string = 'Database error') =>
    new AppError(message, ErrorCode.DATABASE_ERROR, 500),
    
  external: (service: string, message?: string) =>
    new AppError(
      message || `External service error: ${service}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      502,
      { details: { service } }
    ),
    
  timeout: (operation: string = 'Operation') =>
    new AppError(
      `${operation} timed out`,
      ErrorCode.TIMEOUT_ERROR,
      504,
      { details: { operation } }
    ),
};