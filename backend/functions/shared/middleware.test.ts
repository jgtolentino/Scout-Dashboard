import { Context, HttpRequest } from '@azure/functions'
import { verifyToken, authenticate } from './middleware'
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken')

describe('Auth Middleware', () => {
  let mockContext: Context
  let mockRequest: HttpRequest

  beforeEach(() => {
    mockContext = {
      log: jest.fn(),
      done: jest.fn(),
      bindingData: {},
      bindings: {},
      traceContext: {} as any,
      bindingDefinitions: [],
      invocationId: 'test-invocation-id',
      executionContext: {
        invocationId: 'test-invocation-id',
        functionName: 'test-function',
        functionDirectory: '/test',
        retryContext: null
      }
    }

    mockRequest = {
      method: 'GET',
      url: 'http://localhost/api/test',
      headers: {},
      query: {},
      params: {},
      body: null
    } as HttpRequest
  })

  describe('verifyToken', () => {
    const mockSecret = 'test-secret'
    process.env.JWT_SECRET = mockSecret

    it('returns null when no authorization header is provided', () => {
      const result = verifyToken(mockRequest)
      expect(result).toBeNull()
    })

    it('returns null when authorization header has invalid format', () => {
      mockRequest.headers = { authorization: 'InvalidFormat' }
      const result = verifyToken(mockRequest)
      expect(result).toBeNull()
    })

    it('returns null when token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid_token' }
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = verifyToken(mockRequest)
      expect(result).toBeNull()
    })

    it('returns decoded token when token is valid', () => {
      const mockDecodedToken = {
        sub: 'user123',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      mockRequest.headers = { authorization: 'Bearer valid_token' }
      ;(jwt.verify as jest.Mock).mockReturnValue(mockDecodedToken)

      const result = verifyToken(mockRequest)
      expect(result).toEqual(mockDecodedToken)
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', mockSecret)
    })
  })

  describe('authenticate', () => {
    it('returns 401 when no token is provided', async () => {
      const handler = jest.fn()
      const authenticatedHandler = authenticate(handler)

      await authenticatedHandler(mockContext, mockRequest)

      expect(handler).not.toHaveBeenCalled()
      expect(mockContext.res).toEqual({
        status: 401,
        body: { error: 'Unauthorized - No token provided' }
      })
    })

    it('returns 401 when token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid_token' }
      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const handler = jest.fn()
      const authenticatedHandler = authenticate(handler)

      await authenticatedHandler(mockContext, mockRequest)

      expect(handler).not.toHaveBeenCalled()
      expect(mockContext.res).toEqual({
        status: 401,
        body: { error: 'Unauthorized - Invalid token' }
      })
    })

    it('calls handler with user when token is valid', async () => {
      const mockUser = {
        sub: 'user123',
        email: 'user@example.com',
        name: 'Test User',
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      mockRequest.headers = { authorization: 'Bearer valid_token' }
      ;(jwt.verify as jest.Mock).mockReturnValue(mockUser)

      const handler = jest.fn().mockResolvedValue({ status: 200, body: 'Success' })
      const authenticatedHandler = authenticate(handler)

      await authenticatedHandler(mockContext, mockRequest)

      expect(handler).toHaveBeenCalledWith(mockContext, mockRequest, mockUser)
      expect(mockContext.res).toEqual({ status: 200, body: 'Success' })
    })

    it('handles handler errors properly', async () => {
      const mockUser = {
        sub: 'user123',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      mockRequest.headers = { authorization: 'Bearer valid_token' }
      ;(jwt.verify as jest.Mock).mockReturnValue(mockUser)

      const handler = jest.fn().mockRejectedValue(new Error('Handler error'))
      const authenticatedHandler = authenticate(handler)

      await authenticatedHandler(mockContext, mockRequest)

      expect(mockContext.res).toEqual({
        status: 500,
        body: { error: 'Internal server error' }
      })
    })
  })
})