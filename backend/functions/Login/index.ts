import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { query } from '../shared/database'
import { validateRequest } from '../shared/validation'
import { generateToken } from '../shared/auth'
import {
  getSecurityHeaders,
  getCorsHeaders,
  checkRateLimit,
  sanitizeInput,
  createErrorResponse,
  logRequest
} from '../shared/middleware'
import Joi from 'joi'
import crypto from 'crypto'

// Login request schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
})

interface LoginRequest {
  email: string
  password: string
}

// Hash password (in production, use bcrypt or argon2)
function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + 'salt') // In production, use a proper salt
    .digest('hex')
}

export async function Login(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Log request
    logRequest(request, context)
    
    // Check rate limit (stricter for login endpoints)
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous'
    if (!checkRateLimit(`login:${clientId}`)) {
      return createErrorResponse(429, 'Too many login attempts')
    }
    
    // Parse and validate request body
    const body = await request.json() as any
    const sanitizedBody = sanitizeInput(body)
    const validated = validateRequest<LoginRequest>(sanitizedBody, loginSchema)
    
    // Hash the password
    const hashedPassword = hashPassword(validated.password)
    
    // Query user from database
    const sqlQuery = `
      SELECT 
        UserID as id,
        Email as email,
        FullName as name,
        Role as role,
        IsActive as isActive
      FROM Users
      WHERE Email = @email 
        AND PasswordHash = @passwordHash
        AND IsActive = 1
    `
    
    const result = await query(sqlQuery, {
      email: validated.email,
      passwordHash: hashedPassword
    })
    
    if (result.recordset.length === 0) {
      // Invalid credentials
      return createErrorResponse(401, 'Invalid email or password')
    }
    
    const user = result.recordset[0]
    
    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
    
    // Generate refresh token (simplified - in production, store in database)
    const refreshToken = crypto.randomBytes(32).toString('hex')
    
    // Log successful login
    context.log(`User ${user.email} logged in successfully`)
    
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin'))
      },
      body: JSON.stringify({
        success: true,
        data: {
          token,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      })
    }
  } catch (error) {
    context.error('Error in Login:', error)
    
    // Don't expose detailed error messages for security
    if (error.name === 'ValidationError') {
      return createErrorResponse(400, 'Invalid login request')
    }
    
    return createErrorResponse(500, 'Login failed')
  }
}

app.http('Login', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: Login,
})