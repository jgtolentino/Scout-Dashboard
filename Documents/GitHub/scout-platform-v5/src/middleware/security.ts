import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Generate nonce for CSP
const generateNonce = () => crypto.randomBytes(16).toString('base64');

// Content Security Policy configuration
export const contentSecurityPolicy = (req: Request, res: Response, next: NextFunction) => {
  const nonce = generateNonce();
  res.locals.nonce = nonce;

  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          `'nonce-${nonce}'`,
          "'strict-dynamic'",
          "https:",
          "http:",
          "'unsafe-inline'", // Remove in production
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for styled-components
          "https://fonts.googleapis.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "*.supabase.co",
          "*.supabase.in",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://*.supabase.co",
          "https://*.supabase.in",
          "wss://*.supabase.co",
          "wss://*.supabase.in",
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
        ],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        childSrc: ["'self'", "blob:"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        ...(process.env.NODE_ENV === 'production' && {
          upgradeInsecureRequests: [],
          blockAllMixedContent: [],
        }),
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    permittedCrossDomainPolicies: false,
  })(req, res, next);
};

// CSRF Protection
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = (req as any).session?.csrfToken;

  if (!token || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

// Generate CSRF token
export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  const session = (req as any).session;
  if (!session.csrfToken) {
    session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = session.csrfToken;
  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
};

// Request sanitization
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  Object.keys(req.query).forEach((key) => {
    if (typeof req.query[key] === 'string') {
      req.query[key] = (req.query[key] as string)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
  });

  // Sanitize body if present
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// Helper function to sanitize objects recursively
const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

// Combined security middleware
export const applySecurity = [
  securityHeaders,
  contentSecurityPolicy,
  sanitizeRequest,
];