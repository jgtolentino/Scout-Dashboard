import { HttpRequest, HttpResponseInit } from '@azure/functions'
import { config } from '../config/environment'

export interface SecurityHeaders {
  [key: string]: string
}

// Security headers middleware
export function getSecurityHeaders(): SecurityHeaders {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
}

// CORS middleware
export function getCorsHeaders(origin?: string): SecurityHeaders {
  const allowedOrigins = config.CORS_ORIGIN.split(',').map(o => o.trim())
  const requestOrigin = origin || '*'
  
  const corsHeaders: SecurityHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  }
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin)) {
    corsHeaders['Access-Control-Allow-Origin'] = requestOrigin
  }
  
  return corsHeaders
}

// Rate limiting (simplified - in production use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const limit = config.API_RATE_LIMIT
  const window = 60000 // 1 minute
  
  const clientData = requestCounts.get(clientId)
  
  if (!clientData || clientData.resetTime < now) {
    requestCounts.set(clientId, { count: 1, resetTime: now + window })
    return true
  }
  
  if (clientData.count >= limit) {
    return false
  }
  
  clientData.count++
  return true
}

// Input validation helper
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS payloads
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// Error response helper
export function createErrorResponse(
  status: number,
  message: string,
  details?: any
): HttpResponseInit {
  const response: HttpResponseInit = {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getSecurityHeaders()
    },
    body: JSON.stringify({
      error: {
        message,
        status,
        timestamp: new Date().toISOString(),
        ...(config.NODE_ENV === 'development' && details ? { details } : {})
      }
    })
  }
  
  return response
}

// Request logging middleware
export function logRequest(req: HttpRequest, context: any): void {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers.get('user-agent'),
      'x-forwarded-for': req.headers.get('x-forwarded-for')
    },
    functionName: context.functionName || 'unknown'
  }
  
  if (config.NODE_ENV === 'development') {
    console.log('Request:', JSON.stringify(logData, null, 2))
  } else {
    console.log('Request:', JSON.stringify(logData))
  }
}

// Timeout wrapper
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = config.API_TIMEOUT
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ])
}