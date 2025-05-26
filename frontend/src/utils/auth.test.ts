import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  getAccessToken, 
  setAccessToken, 
  removeAccessToken, 
  isAuthenticated,
  decodeToken,
  getUserFromToken
} from './auth'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('getAccessToken', () => {
    it('returns null when no token exists', () => {
      expect(getAccessToken()).toBeNull()
      expect(localStorageMock.getItem).toHaveBeenCalledWith('access_token')
    })

    it('returns token when it exists', () => {
      const token = 'mock_access_token'
      localStorageMock.getItem.mockReturnValue(token)
      
      expect(getAccessToken()).toBe(token)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('access_token')
    })
  })

  describe('setAccessToken', () => {
    it('stores token in localStorage', () => {
      const token = 'new_access_token'
      setAccessToken(token)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', token)
    })
  })

  describe('removeAccessToken', () => {
    it('removes token from localStorage', () => {
      removeAccessToken()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
    })
  })

  describe('isAuthenticated', () => {
    it('returns false when no token exists', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('returns true when valid token exists', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'
      localStorageMock.getItem.mockReturnValue(validToken)
      
      expect(isAuthenticated()).toBe(true)
    })

    it('returns false when token is expired', () => {
      // Token with exp set to past timestamp
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTE2MjM5MDIyLCJpYXQiOjE1MTYyMzkwMjJ9.4OIL9gkR5u_lNPqKhXXFhJpcnuNLlGuFmP_O8JhoO8E'
      localStorageMock.getItem.mockReturnValue(expiredToken)
      
      expect(isAuthenticated()).toBe(false)
    })

    it('returns false when token is invalid', () => {
      const invalidToken = 'invalid_token_format'
      localStorageMock.getItem.mockReturnValue(invalidToken)
      
      expect(isAuthenticated()).toBe(false)
    })
  })

  describe('decodeToken', () => {
    it('returns null for invalid token', () => {
      expect(decodeToken('invalid_token')).toBeNull()
    })

    it('decodes valid JWT token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const decoded = decodeToken(token)
      
      expect(decoded).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        email: 'john@example.com',
        iat: 1516239022
      })
    })
  })

  describe('getUserFromToken', () => {
    it('returns null when no token exists', () => {
      expect(getUserFromToken()).toBeNull()
    })

    it('returns user info from valid token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.Z3FYOzGrQ1n5cQRGPCT95LjYaZVKJM-x2l0FQBUqO1s'
      localStorageMock.getItem.mockReturnValue(token)
      
      const user = getUserFromToken()
      
      expect(user).toEqual({
        id: '1234567890',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin'
      })
    })

    it('returns null for invalid token', () => {
      localStorageMock.getItem.mockReturnValue('invalid_token')
      expect(getUserFromToken()).toBeNull()
    })
  })
})