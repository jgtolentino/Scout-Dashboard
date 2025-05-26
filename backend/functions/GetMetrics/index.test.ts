import { Context, HttpRequest } from '@azure/functions'
import httpTrigger from './index'
import * as database from '../shared/database'
import * as middleware from '../shared/middleware'

jest.mock('../shared/database')
jest.mock('../shared/middleware')

describe('GetMetrics Function', () => {
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
        functionName: 'GetMetrics',
        functionDirectory: '/test',
        retryContext: null
      }
    }

    mockRequest = {
      method: 'GET',
      url: 'http://localhost/api/metrics',
      headers: {
        authorization: 'Bearer valid_token'
      },
      query: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      params: {},
      body: null
    } as HttpRequest

    // Mock middleware to always pass
    ;(middleware.verifyToken as jest.Mock).mockReturnValue({
      sub: 'user123',
      email: 'user@example.com'
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when date parameters are missing', async () => {
    mockRequest.query = {}

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.res).toEqual({
      status: 400,
      body: { error: 'Start date and end date are required' }
    })
  })

  it('returns 400 when date format is invalid', async () => {
    mockRequest.query = {
      startDate: 'invalid-date',
      endDate: '2024-01-31'
    }

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.res).toEqual({
      status: 400,
      body: { error: 'Invalid date format. Use YYYY-MM-DD' }
    })
  })

  it('returns 400 when start date is after end date', async () => {
    mockRequest.query = {
      startDate: '2024-02-01',
      endDate: '2024-01-31'
    }

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.res).toEqual({
      status: 400,
      body: { error: 'Start date must be before end date' }
    })
  })

  it('returns metrics successfully with valid parameters', async () => {
    const mockMetrics = {
      totalSales: 150000,
      totalOrders: 450,
      averageOrderValue: 333.33,
      conversionRate: 3.2,
      topProducts: [
        { id: '1', name: 'Product A', sales: 50000 },
        { id: '2', name: 'Product B', sales: 45000 }
      ],
      salesByDay: [
        { date: '2024-01-01', sales: 5000 },
        { date: '2024-01-02', sales: 4500 }
      ]
    }

    ;(database.getMetrics as jest.Mock).mockResolvedValue(mockMetrics)

    await httpTrigger(mockContext, mockRequest)

    expect(database.getMetrics).toHaveBeenCalledWith('2024-01-01', '2024-01-31', {})
    expect(mockContext.res).toEqual({
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: mockMetrics
    })
  })

  it('applies optional filters when provided', async () => {
    mockRequest.query = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      brandId: 'brand123',
      storeId: 'store456'
    }

    const mockMetrics = { totalSales: 100000 }
    ;(database.getMetrics as jest.Mock).mockResolvedValue(mockMetrics)

    await httpTrigger(mockContext, mockRequest)

    expect(database.getMetrics).toHaveBeenCalledWith(
      '2024-01-01',
      '2024-01-31',
      {
        brandId: 'brand123',
        storeId: 'store456'
      }
    )
  })

  it('handles database errors gracefully', async () => {
    ;(database.getMetrics as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.log).toHaveBeenCalledWith('Error fetching metrics:', expect.any(Error))
    expect(mockContext.res).toEqual({
      status: 500,
      body: { error: 'Failed to fetch metrics' }
    })
  })

  it('returns 401 when authentication fails', async () => {
    ;(middleware.verifyToken as jest.Mock).mockReturnValue(null)

    await httpTrigger(mockContext, mockRequest)

    expect(mockContext.res).toEqual({
      status: 401,
      body: { error: 'Unauthorized' }
    })
  })
})