import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { config } from '../config/security';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

// Development error handler
const developmentErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: {
      message: err.message,
      code: err.code,
      statusCode,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  });
};

// Production error handler
const productionErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  
  // Log to Sentry in production
  if (!err.isOperational) {
    Sentry.captureException(err, {
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      extra: {
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
      },
    });
  }

  // Don't leak error details in production
  const message = err.isOperational ? err.message : 'Internal server error';
  
  res.status(statusCode).json({
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      statusCode,
      timestamp: new Date().toISOString(),
    },
  });
};

// Main error handler
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (config.NODE_ENV === 'development') {
    developmentErrorHandler(err, req, res, next);
  } else {
    productionErrorHandler(err, req, res, next);
  }
};

// Validation error handler
export const validationErrorHandler = (errors: any[]) => {
  const message = errors.map((e) => e.message).join(', ');
  throw new AppError(`Validation failed: ${message}`, 400, 'VALIDATION_ERROR');
};

// Database error handler
export const databaseErrorHandler = (error: any) => {
  if (error.code === '23505') {
    throw new AppError('Duplicate entry found', 409, 'DUPLICATE_ENTRY');
  }
  if (error.code === '23503') {
    throw new AppError('Referenced entity not found', 404, 'REFERENCE_NOT_FOUND');
  }
  if (error.code === '23502') {
    throw new AppError('Required field missing', 400, 'REQUIRED_FIELD_MISSING');
  }
  throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

// Authentication error handler
export const authErrorHandler = (error: any) => {
  if (error.message === 'jwt expired') {
    throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
  }
  if (error.message === 'invalid signature') {
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
};

// Rate limit error handler
export const rateLimitHandler = (req: Request, res: Response) => {
  throw new AppError(
    'Too many requests, please try again later',
    429,
    'RATE_LIMIT_EXCEEDED'
  );
};

// File upload error handler
export const fileUploadErrorHandler = (error: any) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    throw new AppError('File size too large', 413, 'FILE_TOO_LARGE');
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    throw new AppError('Unexpected file field', 400, 'UNEXPECTED_FILE');
  }
  throw new AppError('File upload failed', 400, 'UPLOAD_FAILED');
};