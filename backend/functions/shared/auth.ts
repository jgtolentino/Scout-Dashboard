import { HttpRequest } from '@azure/functions'
import jwt from 'jsonwebtoken'
import { config } from '../config/environment'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface JWTPayload {
  id: string
  email: string
  name: string
  role: string
  iat?: number
  exp?: number
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN || '24h'
  })
}

export function verifyToken(req: HttpRequest): User | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload
    
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    }
  } catch (error) {
    // Handle token verification errors
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Token expired:', error.message)
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid token:', error.message)
    } else {
      console.error('Token verification error:', error)
    }
    
    // For demo purposes, allow demo-token
    if (token === 'demo-token' && config.NODE_ENV === 'development') {
      return {
        id: '1',
        email: 'demo@scout.com',
        name: 'Demo User',
        role: 'admin'
      }
    }
    
    return null
  }
}

export function requireAuth(req: HttpRequest): User {
  const user = verifyToken(req)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export function requireRole(req: HttpRequest, roles: string[]): User {
  const user = requireAuth(req)
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }
  return user
}