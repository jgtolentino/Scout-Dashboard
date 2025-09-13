import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { logger } from '../utils/logger.js'
import { supabase } from '../config/database.js'

export const authMiddleware = async (request, reply) => {
  // Skip auth for health checks and public endpoints
  const publicPaths = ['/healthz', '/metrics', '/docs']
  if (publicPaths.some(path => request.url.startsWith(path))) {
    return
  }

  try {
    const authHeader = request.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.security('Missing or invalid authorization header', {
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      })
      
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded
    try {
      decoded = jwt.verify(token, config.auth.jwtSecret)
    } catch (jwtError) {
      // Try Supabase JWT verification as fallback
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        logger.security('Invalid JWT token', {
          error: jwtError.message,
          supabaseError: error?.message,
          url: request.url,
          ip: request.ip
        })
        
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        })
      }
      
      // Use Supabase user data
      decoded = {
        userId: user.id,
        email: user.email,
        role: user.role || 'user',
        metadata: user.user_metadata
      }
    }

    // Attach user info to request
    request.user = {
      id: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user',
      metadata: decoded.metadata || {}
    }

    // Log successful authentication
    logger.info('User authenticated', {
      userId: request.user.id,
      email: request.user.email,
      role: request.user.role,
      url: request.url
    })

  } catch (error) {
    logger.error('Authentication error', {
      error: error.message,
      url: request.url,
      ip: request.ip,
      stack: error.stack
    })
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Authentication service unavailable'
    })
  }
}

// Optional: Role-based access control middleware
export const requireRole = (requiredRole) => {
  return async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    const userRole = request.user.role
    const roleHierarchy = {
      'user': 1,
      'manager': 2,
      'admin': 3,
      'super_admin': 4
    }

    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 999

    if (userLevel < requiredLevel) {
      logger.security('Insufficient role for access', {
        userId: request.user.id,
        userRole,
        requiredRole,
        url: request.url
      })
      
      return reply.code(403).send({
        error: 'Forbidden',
        message: `Requires ${requiredRole} role or higher`
      })
    }
  }
}

// Rate limiting by user
export const rateLimitByUser = (maxRequests = 100, windowMs = 60000) => {
  const userLimits = new Map()
  
  return async (request, reply) => {
    if (!request.user) return
    
    const userId = request.user.id
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean old entries
    if (userLimits.has(userId)) {
      const userRequests = userLimits.get(userId)
      userLimits.set(userId, userRequests.filter(time => time > windowStart))
    } else {
      userLimits.set(userId, [])
    }
    
    const userRequests = userLimits.get(userId)
    
    if (userRequests.length >= maxRequests) {
      logger.security('Rate limit exceeded', {
        userId,
        requestCount: userRequests.length,
        maxRequests,
        windowMs
      })
      
      return reply.code(429).send({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs/1000} seconds.`
      })
    }
    
    userRequests.push(now)
  }
}

export default authMiddleware