import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole, generateToken } from '../../src/middleware/auth';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 'test-user-id', email: 'test@example.com', role: 'admin' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should reject request without token', async () => {
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access token required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token verification failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authenticate valid token', async () => {
      const token = jwt.sign(
        { sub: 'test-user-id', email: 'test@example.com', role: 'admin' },
        process.env.JWT_SECRET!
      );
      mockRequest.headers = { authorization: `Bearer ${token}` };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'admin',
      });
    });
  });

  describe('requireRole', () => {
    it('should reject unauthenticated requests', () => {
      const middleware = requireRole(['admin']);
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject users without required role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'viewer' };
      const middleware = requireRole(['admin', 'manager']);
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow users with required role', () => {
      mockRequest.user = { id: '1', email: 'test@example.com', role: 'admin' };
      const middleware = requireRole(['admin', 'manager']);
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const user = { id: '1', email: 'test@example.com', role: 'admin' };
      const token = generateToken(user);

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.sub).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
      expect(decoded.iss).toBe('scout-dashboard');
    });
  });
});