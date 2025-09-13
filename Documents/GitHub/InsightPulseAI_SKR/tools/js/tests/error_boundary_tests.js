/**
 * error_boundary_tests.js
 * 
 * Unit tests for Claude CLI error boundary system
 */

const { describe, test, skipTest, expect } = require('./run_tests');
const { handle, mapErrorType, formatError, logError } = require('../errors/ClaudeErrorBoundary');

// Test error type mapping
describe('Error Type Mapping', () => {
  test('should map API errors correctly', () => {
    const apiError = new Error('API request failed');
    apiError.message = 'Claude API error: 429 Too Many Requests';
    
    const errorType = mapErrorType(apiError);
    expect(errorType.code).toBe('API_ERROR');
  });
  
  test('should map authentication errors correctly', () => {
    const authError = new Error('API key is invalid');
    
    const errorType = mapErrorType(authError);
    expect(errorType.code).toBe('AUTH_ERROR');
  });
  
  test('should map network errors correctly', () => {
    const networkError = new Error('Network connection failed');
    networkError.code = 'ECONNREFUSED';
    
    const errorType = mapErrorType(networkError);
    expect(errorType.code).toBe('NETWORK_ERROR');
  });
  
  test('should map timeout errors correctly', () => {
    const timeoutError = new Error('Request timed out');
    timeoutError.code = 'ETIMEDOUT';
    
    const errorType = mapErrorType(timeoutError);
    expect(errorType.code).toBe('TIMEOUT_ERROR');
  });
  
  test('should provide a default error type for unknown errors', () => {
    const unknownError = new Error('Something unexpected happened');
    
    const errorType = mapErrorType(unknownError);
    expect(errorType.code).toBe('UNKNOWN_ERROR');
  });
});

// Test error handling
describe('Error Handling', () => {
  test('handle should return a formatted error object', () => {
    const error = new Error('Test error');
    
    const result = handle(error, { command: 'test' });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error.message).toBe('Test error');
    expect(result.error.type).toBeTruthy();
    expect(result.error.timestamp).toBeTruthy();
    expect(result.error.context).toBeTruthy();
    expect(result.error.context.command).toBe('test');
  });
  
  test('handle should include working directory in context', () => {
    const error = new Error('Test error');
    
    const result = handle(error, { command: 'test', workingDirectory: '/tmp/test' });
    expect(result.error.context.workingDirectory).toBe('/tmp/test');
  });
  
  test('handle should include mode in context if provided', () => {
    const error = new Error('Test error');
    
    const result = handle(error, { command: 'test', mode: 'verbose' });
    expect(result.error.context.mode).toBe('verbose');
  });
  
  test('handle should provide a user-friendly message', () => {
    const error = new Error('Test error');
    
    const result = handle(error, { command: 'test' });
    expect(result.userMessage).toBeTruthy();
    expect(result.userMessage).toContain('Test error');
  });
});

// Test error formatting
describe('Error Formatting', () => {
  test('formatError should create a well-structured error object', () => {
    const error = new Error('Test error');
    const errorType = { code: 'TEST_ERROR', description: 'Test error type' };
    
    const formattedError = formatError(error, errorType, { command: 'test' });
    expect(formattedError.type).toBe('TEST_ERROR');
    expect(formattedError.code).toBe('TEST_ERROR');
    expect(formattedError.message).toBe('Test error');
    expect(formattedError.details).toBeTruthy();
    expect(formattedError.context).toBeTruthy();
  });
  
  test('formatError should include stack trace in details', () => {
    const error = new Error('Test error');
    const errorType = { code: 'TEST_ERROR', description: 'Test error type' };
    
    const formattedError = formatError(error, errorType, { command: 'test' });
    expect(formattedError.details.stack).toBeTruthy();
  });
});

// Test error logging
describe('Error Logging', () => {
  // This test verifies that the logging function exists but doesn't test actual file I/O
  test('logError should accept an error object without throwing', () => {
    const error = {
      type: 'TEST_ERROR',
      message: 'Test error',
      timestamp: new Date().toISOString(),
      details: { stack: 'test stack' },
      context: { command: 'test' }
    };
    
    // This shouldn't throw
    logError(error);
    
    // No assertions needed since we're just verifying it doesn't throw
  });
});