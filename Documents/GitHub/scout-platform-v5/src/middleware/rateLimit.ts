import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Custom key generator based on user ID or IP
const keyGenerator = (req: Request): string => {
  return req.user?.id || req.ip || 'anonymous';
};

// Base rate limiter configuration
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: options.message,
        retryAfter: Math.round(options.windowMs / 1000),
      });
    },
  });
};

// General API rate limiter - 100 requests per 15 minutes
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
});

// Strict rate limiter for auth endpoints - 5 requests per 15 minutes
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
});

// Data export rate limiter - 10 requests per hour
export const exportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Export limit exceeded, please try again later',
});

// File upload rate limiter - 20 uploads per hour
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Upload limit exceeded, please try again later',
});

// Dynamic rate limiter based on user role
export const dynamicRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const limits = {
    admin: { windowMs: 15 * 60 * 1000, max: 1000 },
    premium: { windowMs: 15 * 60 * 1000, max: 500 },
    standard: { windowMs: 15 * 60 * 1000, max: 100 },
    guest: { windowMs: 15 * 60 * 1000, max: 20 },
  };

  const userRole = req.user?.role || 'guest';
  const limit = limits[userRole as keyof typeof limits] || limits.guest;

  const limiter = createRateLimiter({
    ...limit,
    message: `Rate limit exceeded for ${userRole} users`,
  });

  limiter(req, res, next);
};

// Distributed rate limiter for microservices
export const distributedRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Service rate limit exceeded',
});

// Cleanup function (placeholder for future Redis integration)
export const cleanupRateLimiters = async () => {
  // Redis cleanup would go here when implemented
  console.log('Rate limiter cleanup complete');
};