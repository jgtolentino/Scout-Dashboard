import { NextRequest, NextResponse } from 'next/server';
import { log } from 'observability/log';
import { handleApiError } from '@/lib/errors/api-error-handler';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
const CSP_NONCE_SIZE = 16;

// API version configuration
const API_VERSIONS = {
  v1: {
    supported: true,
    deprecated: false,
    sunset: null,
  },
  v2: {
    supported: true,
    deprecated: false,
    sunset: null,
  },
  // Legacy version example
  legacy: {
    supported: true,
    deprecated: true,
    sunset: '2024-12-31',
  },
};

const DEFAULT_VERSION = 'v1';
const LATEST_VERSION = 'v2';

function generateNonce() {
  const array = new Uint8Array(CSP_NONCE_SIZE);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

function getCspHeader(nonce: string) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    `img-src 'self' data: https:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`
  ].join('; ');
}

function handleApiVersioning(req: NextRequest, res: NextResponse) {
  const { pathname } = req.nextUrl;
  
  // Only process API routes
  if (!pathname.startsWith('/api')) {
    return { rewrite: false, res };
  }

  // Extract version from path or header
  const pathMatch = pathname.match(/^\/api\/(v\d+|legacy)\//);
  const versionFromPath = pathMatch ? pathMatch[1] : null;
  const versionFromHeader = req.headers.get('api-version');
  
  // Determine the API version to use
  let version = versionFromPath || versionFromHeader || DEFAULT_VERSION;
  
  // Check if version is supported
  const versionConfig = API_VERSIONS[version as keyof typeof API_VERSIONS];
  
  if (!versionConfig || !versionConfig.supported) {
    return {
      rewrite: false,
      res: NextResponse.json(
        {
          error: 'Unsupported API version',
          message: `API version '${version}' is not supported`,
          supported_versions: Object.keys(API_VERSIONS).filter(
            v => API_VERSIONS[v as keyof typeof API_VERSIONS].supported
          ),
        },
        { status: 400 }
      )
    };
  }
  
  // Add version headers to response
  res.headers.set('X-API-Version', version);
  res.headers.set('X-API-Latest-Version', LATEST_VERSION);
  
  // Add deprecation warning if applicable
  if (versionConfig.deprecated) {
    res.headers.set('X-API-Deprecated', 'true');
    res.headers.set(
      'X-API-Deprecation-Date',
      versionConfig.sunset || 'TBD'
    );
    res.headers.set(
      'Warning',
      `299 - "API version ${version} is deprecated and will be sunset on ${versionConfig.sunset || 'TBD'}"`
    );
  }
  
  // Add rate limit headers based on version
  const rateLimits = {
    v1: { requests: 100, window: '15m' },
    v2: { requests: 200, window: '15m' },
    legacy: { requests: 50, window: '15m' },
  };
  
  const limits = rateLimits[version as keyof typeof rateLimits] || rateLimits.v1;
  res.headers.set('X-RateLimit-Limit', limits.requests.toString());
  res.headers.set('X-RateLimit-Window', limits.window);
  
  // Rewrite the URL to remove version prefix for internal routing
  if (versionFromPath) {
    const newPathname = pathname.replace(`/api/${version}`, '/api');
    const url = req.nextUrl.clone();
    url.pathname = newPathname;
    
    // Add version to request headers for handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-api-version', version);
    
    return {
      rewrite: true,
      url,
      headers: requestHeaders,
      res
    };
  }
  
  return { rewrite: false, res };
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  let res = NextResponse.next();
  
  // Generate request ID for tracing
  const rid = crypto.randomUUID();
  res.headers.set('X-Request-ID', rid);

  try {
    // Validate request
    validateRequest(req);
    
    // Handle API versioning
    const versioningResult = handleApiVersioning(req, res);
    if (versioningResult.rewrite) {
      res = NextResponse.rewrite(versioningResult.url!, {
        request: {
          headers: versioningResult.headers,
        },
      });
      // Apply headers from versioning
      versioningResult.res.headers.forEach((value, key) => {
        res.headers.set(key, value);
      });
    } else if (versioningResult.res !== res) {
      return versioningResult.res;
    }
    
    // CORS
    if (origin && allowedOrigins.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Credentials', 'true');
      res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,API-Version');
      res.headers.set('Access-Control-Expose-Headers', 'X-API-Version,X-API-Latest-Version,X-API-Deprecated');
    }
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: res.headers });
    }
    
    // Enhanced Security headers
    const nonce = generateNonce();
    const securityHeaders = getSecurityHeaders(nonce);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    
    // Add nonce to res for use in app
    res.headers.set('X-Nonce', nonce);
    
    log('info', 'Request', {
      rid,
      method: req.method,
      path: req.nextUrl.pathname,
      origin: origin || 'none',
      apiVersion: res.headers.get('X-API-Version') || 'none'
    });
    
    return res;
  } catch (error) {
    // Log middleware error
    log('error', 'Middleware error', {
      rid,
      error: error instanceof Error ? error.message : String(error),
      method: req.method,
      path: req.nextUrl.pathname,
    });

    // For API routes, return JSON error response
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return handleApiError(error, { requestId: rid });
    }

    // For pages, let Next.js handle the error
    return res;
  }
}

/**
 * Validate incoming request
 */
function validateRequest(req: NextRequest): void {
  const contentLength = req.headers.get('content-length');
  const maxBodySize = 10 * 1024 * 1024; // 10MB

  // Check content length
  if (contentLength && parseInt(contentLength) > maxBodySize) {
    throw new Error('Request body too large');
  }

  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers.get('content-type') || '';
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ];

    if (!allowedTypes.some(type => contentType.startsWith(type))) {
      throw new Error('Unsupported content type');
    }
  }

  // Basic URL validation
  const pathname = req.nextUrl.pathname;
  if (pathname.includes('..') || pathname.includes('%2e%2e')) {
    throw new Error('Invalid URL path');
  }
}

/**
 * Get enhanced security headers
 */
function getSecurityHeaders(nonce: string): Record<string, string> {
  return {
    // Content Security Policy (enhanced)
    'Content-Security-Policy': getCspHeader(nonce),
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Enhanced Permissions Policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    
    // HSTS (force HTTPS)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Cross-Origin Policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    
    // DNS prefetch control
    'X-DNS-Prefetch-Control': 'on',
    
    // Additional security headers
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-Download-Options': 'noopen',
  };
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};