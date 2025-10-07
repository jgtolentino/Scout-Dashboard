/**
 * api_tests.js
 * 
 * Tests for Claude API integration
 */

const { describe, test, skipTest, expect } = require('./run_tests');
const { getClaudeConfig, validateClaudeApiKey } = require('../agents/claude');
const { handle } = require('../errors/ClaudeErrorBoundary');

// Test Claude config
describe('Claude Config', () => {
  test('getClaudeConfig should return a valid config object', () => {
    const config = getClaudeConfig();
    expect(config).toBeTruthy();
    expect(config.api).toBeTruthy();
    expect(config.model).toBeTruthy();
    expect(config.model.name).toBeTruthy();
  });
});

// Test API key validation
describe('API Key Validation', () => {
  test('validateClaudeApiKey should reject empty keys', async () => {
    const result = await validateClaudeApiKey('');
    expect(result).toBe(false);
  });

  test('validateClaudeApiKey should reject null keys', async () => {
    const result = await validateClaudeApiKey(null);
    expect(result).toBe(false);
  });

  // Skip actual API calls in automated tests
  skipTest('validateClaudeApiKey should validate a real key', async () => {
    // We would test with a real key here in manual testing
  });
});

// Test error handling
describe('Error Handling', () => {
  test('handle should format API errors', () => {
    const apiError = new Error('API request failed');
    apiError.message = 'Claude API error: 429 Too Many Requests';
    
    const result = handle(apiError, { command: 'test' });
    expect(result.success).toBe(false);
    expect(result.error.type).toBe('API_ERROR');
  });

  test('handle should format authentication errors', () => {
    const authError = new Error('API key is invalid');
    
    const result = handle(authError, { command: 'test' });
    expect(result.success).toBe(false);
    expect(result.error.type).toBe('AUTH_ERROR');
  });

  test('handle should include timestamp in errors', () => {
    const error = new Error('Test error');
    
    const result = handle(error, { command: 'test' });
    expect(result.error.timestamp).toBeTruthy();
  });
});

// Test context handling
describe('Context Handling', () => {
  // This test verifies that we create and track working directory context correctly
  test('Working directory should be included in error context', () => {
    const error = new Error('Test error');
    
    const result = handle(error, { workingDirectory: '/tmp/test' });
    expect(result.error.context.workingDirectory).toBe('/tmp/test');
  });

  test('Default working directory should be process.cwd()', () => {
    const error = new Error('Test error');
    
    const result = handle(error, {});
    expect(result.error.context.workingDirectory).toBe(process.cwd());
  });
});
