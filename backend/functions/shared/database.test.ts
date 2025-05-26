import * as sql from 'mssql'
import { getConnection, closeConnection, executeQuery } from './database'

jest.mock('mssql')

describe('Database Module', () => {
  const mockConfig = {
    user: 'test_user',
    password: 'test_password',
    database: 'test_db',
    server: 'test_server',
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  }

  beforeEach(() => {
    // Set up environment variables
    process.env.SQL_USER = mockConfig.user
    process.env.SQL_PASSWORD = mockConfig.password
    process.env.SQL_DATABASE = mockConfig.database
    process.env.SQL_SERVER = mockConfig.server

    jest.clearAllMocks()
  })

  describe('getConnection', () => {
    it('creates a new connection when none exists', async () => {
      const mockConnectionPool = {
        connect: jest.fn().mockResolvedValue(true),
        connected: true,
        close: jest.fn()
      }

      ;(sql.ConnectionPool as jest.Mock).mockImplementation(() => mockConnectionPool)

      const connection = await getConnection()

      expect(sql.ConnectionPool).toHaveBeenCalledWith(mockConfig)
      expect(mockConnectionPool.connect).toHaveBeenCalled()
      expect(connection).toBe(mockConnectionPool)
    })

    it('reuses existing connection when available', async () => {
      const mockConnectionPool = {
        connect: jest.fn().mockResolvedValue(true),
        connected: true,
        close: jest.fn()
      }

      ;(sql.ConnectionPool as jest.Mock).mockImplementation(() => mockConnectionPool)

      const connection1 = await getConnection()
      const connection2 = await getConnection()

      expect(sql.ConnectionPool).toHaveBeenCalledTimes(1)
      expect(connection1).toBe(connection2)
    })

    it('creates new connection when existing one is not connected', async () => {
      const mockDisconnectedPool = {
        connect: jest.fn().mockResolvedValue(true),
        connected: false,
        close: jest.fn()
      }

      const mockNewPool = {
        connect: jest.fn().mockResolvedValue(true),
        connected: true,
        close: jest.fn()
      }

      ;(sql.ConnectionPool as jest.Mock)
        .mockImplementationOnce(() => mockDisconnectedPool)
        .mockImplementationOnce(() => mockNewPool)

      await getConnection() // First call
      const connection = await getConnection() // Second call

      expect(sql.ConnectionPool).toHaveBeenCalledTimes(2)
      expect(connection).toBe(mockNewPool)
    })

    it('throws error when connection fails', async () => {
      const mockConnectionPool = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        connected: false
      }

      ;(sql.ConnectionPool as jest.Mock).mockImplementation(() => mockConnectionPool)

      await expect(getConnection()).rejects.toThrow('Connection failed')
    })
  })

  describe('closeConnection', () => {
    it('closes existing connection', async () => {
      const mockConnectionPool = {
        connect: jest.fn().mockResolvedValue(true),
        connected: true,
        close: jest.fn().mockResolvedValue(true)
      }

      ;(sql.ConnectionPool as jest.Mock).mockImplementation(() => mockConnectionPool)

      await getConnection()
      await closeConnection()

      expect(mockConnectionPool.close).toHaveBeenCalled()
    })

    it('handles case when no connection exists', async () => {
      await expect(closeConnection()).resolves.not.toThrow()
    })
  })

  describe('executeQuery', () => {
    it('executes query successfully', async () => {
      const mockResult = {
        recordset: [
          { id: 1, name: 'Test Product', price: 100 },
          { id: 2, name: 'Another Product', price: 200 }
        ]
      }

      const mockRequest = {
        query: jest.fn().mockResolvedValue(mockResult)
      }

      const mockConnectionPool = {
        connect: jest.fn().mockResolvedValue(true),
        connected: true,
        request: jest.fn().mockReturnValue(mockRequest),
        close: jest.fn()
      }

      ;(sql.ConnectionPool as jest.Mock).mockImplementation(() => mockConnectionPool)

      const query = 'SELECT * FROM products'
      const result = await executeQuery(query)

      expect(mockConnectionPool.request).toHaveBeenCalled()
      expect(mockRequest.query).toHaveBeenCalledWith(query)
      expect(result).toEqual(mockResult.recordset)
    })

    it('executes query with parameters', async () => {
      const mockResult = { recordset: [{ total: 5000 }] }

      const mockRequest = {
        input: jest.fn().mockReturnThis(),
        query: jest.fn().mockResolvedValue(mockResult)
      }

      const mockConnectionPool = {
        connect: jest.fn().mockResolvedValue(true),
        connected: true,
        request: jest.fn().mockReturnValue(mockRequest),
        close: jest.fn()
      }

      ;(sql.ConnectionPool as jest.Mock).mockImplementation(() => mockConnectionPool)

      const query = 'SELECT SUM(amount) as total FROM sales WHERE date >= @startDate AND date <= @endDate'
      const params = {
        startDate: { value: '2024-01-01', type: sql.Date },
        endDate: { value: '2024-01-31', type: sql.Date }
      }

      const result = await executeQuery(query, params)

      expect(mockRequest.input).toHaveBeenCalledWith('startDate', sql.Date, '2024-01-01')
      expect(mockRequest.input).toHaveBeenCalledWith('endDate', sql.Date, '2024-01-31')
      expect(mockRequest.query).toHaveBeenCalledWith(query)
      expect(result).toEqual(mockResult.recordset)
    })

    it('throws error when query fails', async () => {
      const mockRequest = {
        query: jest.fn().mockRejectedValue(new Error('Query failed'))
      }

      const mockConnectionPool = {
        connect: jest.fn().mockResolvedValue(true),
        connected: true,
        request: jest.fn().mockReturnValue(mockRequest),
        close: jest.fn()
      }

      ;(sql.ConnectionPool as jest.Mock).mockImplementation(() => mockConnectionPool)

      await expect(executeQuery('SELECT * FROM invalid_table')).rejects.toThrow('Query failed')
    })
  })
})