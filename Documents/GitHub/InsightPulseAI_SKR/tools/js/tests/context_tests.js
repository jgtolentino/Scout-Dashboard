/**
 * context_tests.js
 * 
 * Unit tests for Claude CLI context injection functionality
 */

const { describe, test, skipTest, expect } = require('./run_tests');
const { parseContextFlag } = require('../router/context');
const { executeCommand } = require('../router/command_registry');
const path = require('path');

// Test context flag parsing
describe('Context Flag Parsing', () => {
  test('should parse --context flag with equals sign', () => {
    const input = 'run --context=/tmp/test "Tell me about this directory"';
    const result = parseContextFlag(input);
    
    expect(result.command).toBe('run "Tell me about this directory"');
    expect(result.contextPath).toBe('/tmp/test');
  });

  test('should parse --context flag with space separator', () => {
    const input = 'run --context /tmp/test "Tell me about this directory"';
    const result = parseContextFlag(input);
    
    expect(result.command).toBe('run "Tell me about this directory"');
    expect(result.contextPath).toBe('/tmp/test');
  });

  test('should handle quoted context paths with spaces', () => {
    const input = 'run --context="/tmp/test folder" "Tell me about this directory"';
    const result = parseContextFlag(input);
    
    expect(result.command).toBe('run "Tell me about this directory"');
    expect(result.contextPath).toBe('/tmp/test folder');
  });

  test('should handle single quoted context paths', () => {
    const input = "run --context='/tmp/test' 'Tell me about this directory'";
    const result = parseContextFlag(input);
    
    expect(result.command).toBe("run 'Tell me about this directory'");
    expect(result.contextPath).toBe('/tmp/test');
  });

  test('should return null context path when flag is not present', () => {
    const input = 'run "Tell me about this directory"';
    const result = parseContextFlag(input);
    
    expect(result.command).toBe('run "Tell me about this directory"');
    expect(result.contextPath).toBe(null);
  });
});

// Test context validation
describe('Context Validation', () => {
  test('should validate existing directory paths', () => {
    // Use the current directory, which should exist
    const currentDir = process.cwd();
    const { isValid, error } = validateContextPath(currentDir);
    
    expect(isValid).toBe(true);
    expect(error).toBe(null);
  });

  test('should reject non-existent directory paths', () => {
    // Use a path that's very unlikely to exist
    const nonExistentPath = '/path/that/does/not/exist/9999abcxyz';
    const { isValid, error } = validateContextPath(nonExistentPath);
    
    expect(isValid).toBe(false);
    expect(error).toContain('does not exist');
  });
});

// Test context handling in commands
describe('Context in Command Execution', () => {
  // Skip tests that require actual execution
  skipTest('should use specified working directory with run command', async () => {
    // This would require actual execution
  });

  skipTest('should apply context to command environment', async () => {
    // This would require actual execution
  });
});

// Helper function for testing context path validation
function validateContextPath(contextPath) {
  const fs = require('fs');
  
  try {
    const stats = fs.statSync(contextPath);
    if (!stats.isDirectory()) {
      return { isValid: false, error: `Path is not a directory: ${contextPath}` };
    }
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: `Directory does not exist: ${contextPath}` };
  }
}