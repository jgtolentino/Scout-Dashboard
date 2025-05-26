import { HttpRequest } from '@azure/functions'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export function verifyToken(req: HttpRequest): User | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  // Simple demo authentication - in production use proper JWT library
  if (token === 'demo-token') {
    return {
      id: '1',
      email: 'demo@scout.com',
      name: 'Demo User',
      role: 'admin'
    }
  }

  return null
}

export function requireAuth(req: HttpRequest): User {
  const user = verifyToken(req)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}