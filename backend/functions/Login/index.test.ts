import { Context, HttpRequest } from '@azure/functions'
import httpTrigger from './index'
import * as database from '../shared/database'
import * as auth from '../shared/auth'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

jest.mock('../shared/database')
jest.mock('../shared/auth')
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

describe('Login Function', () => {
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
        functionName: 'Login',
        functionDirectory: '/test',
        retryContext: null
      }
    }

    mockRequest = {
      method: 'POST',
      url: 'http://localhost/api/login',
      headers: {
        'content-type': 'application/json'
      },
      query: {},
      params: {},
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    } as HttpRequest

    process.env.JWT_SECRET = 'test-secret'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when email is missing', async () => {
    mockRequest.body = { password: 'password123' }

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.res).toEqual({
      status: 400,
      body: { error: 'Email and password are required' }
    })
  })

  it('returns 400 when password is missing', async () => {
    mockRequest.body = { email: 'test@example.com' }

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.res).toEqual({
      status: 400,
      body: { error: 'Email and password are required' }
    })
  })

  it('returns 400 when email format is invalid', async () => {
    mockRequest.body = {
      email: 'invalid-email',
      password: 'password123'
    }

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.res).toEqual({
      status: 400,
      body: { error: 'Invalid email format' }
    })
  })

  it('returns 401 when user is not found', async () => {
    ;(database.executeQuery as jest.Mock).mockResolvedValue([])

    await httpTrigger(mockContext, mockRequest)

    expect(database.executeQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      expect.objectContaining({
        email: { value: 'test@example.com', type: expect.anything() }
      })
    )
    expect(mockContext.res).toEqual({
      status: 401,
      body: { error: 'Invalid credentials' }
    })
  })

  it('returns 401 when password is incorrect', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      role: 'user'
    }

    ;(database.executeQuery as jest.Mock).mockResolvedValue([mockUser])
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    await httpTrigger(mockContext, mockRequest)

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password')
    expect(mockContext.res).toEqual({
      status: 401,
      body: { error: 'Invalid credentials' }
    })
  })

  it('returns token and user data on successful login', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      role: 'admin'
    }

    const mockToken = 'mock_jwt_token'

    ;(database.executeQuery as jest.Mock).mockResolvedValue([mockUser])
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    ;(jwt.sign as jest.Mock).mockReturnValue(mockToken)

    await httpTrigger(mockContext, mockRequest)

    expect(jwt.sign).toHaveBeenCalledWith(
      {
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role
      },
      'test-secret',
      { expiresIn: '24h' }
    )

    expect(mockContext.res).toEqual({
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        token: mockToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role
        }
      }
    })
  })

  it('updates last login timestamp on successful login', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      role: 'user'
    }

    ;(database.executeQuery as jest.Mock).mockResolvedValue([mockUser])
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('token')

    await httpTrigger(mockContext, mockRequest)

    expect(database.executeQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET last_login'),
      expect.objectContaining({
        userId: { value: mockUser.id, type: expect.anything() }
      })
    )
  })

  it('handles database errors gracefully', async () => {
    ;(database.executeQuery as jest.Mock).mockRejectedValue(new Error('Database error'))

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.log).toHaveBeenCalledWith('Login error:', expect.any(Error))
    expect(mockContext.res).toEqual({
      status: 500,
      body: { error: 'Internal server error' }
    })
  })

  it('handles missing request body', async () => {
    mockRequest.body = null

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.res).toEqual({
      status: 400,
      body: { error: 'Email and password are required' }
    })
  })
})