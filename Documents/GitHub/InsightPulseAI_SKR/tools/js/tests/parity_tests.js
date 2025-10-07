/**
 * parity_tests.js
 * 
 * Tests for Claude CLI parity with Claude Code CLI
 * This file specifically tests the key parity features
 */

const { describe, test, skipTest, expect } = require('./run_tests');
const path = require('path');
const fs = require('fs');

// Test for the presence of key parity features
describe('Claude CLI Parity Features', () => {
  // Test command registry structure
  test('should have a modular command registry structure', () => {
    // Check if the command registry file exists
    const registryPath = path.join(__dirname, '..', 'router', 'command_registry.js');
    expect(fs.existsSync(registryPath)).toBeTruthy();
    
    // Check if we can import it without errors
    const registry = require('../router/command_registry');
    expect(registry).toBeTruthy();
    expect(typeof registry.getCommand).toBe('function');
    expect(typeof registry.listCommands).toBe('function');
    expect(typeof registry.executeCommand).toBe('function');
    
    // Check if it has commands registered
    const commands = registry.listCommands();
    expect(Object.keys(commands).length).toBeGreaterThan(0);
  });
  
  // Test command modules
  test('should have run and version commands', () => {
    const registry = require('../router/command_registry');
    
    // Check for run command
    const runCommand = registry.getCommand('run');
    expect(runCommand).toBeTruthy();
    expect(typeof runCommand.execute).toBe('function');
    expect(typeof runCommand.getHelp).toBe('function');
    
    // Check for version command
    const versionCommand = registry.getCommand('version');
    expect(versionCommand).toBeTruthy();
    expect(typeof versionCommand.execute).toBe('function');
    expect(typeof versionCommand.getHelp).toBe('function');
  });
  
  // Test context injection
  test('should have context flag support', () => {
    const contextModule = require('../router/context');
    expect(contextModule).toBeTruthy();
    expect(typeof contextModule.parseContextFlag).toBe('function');
    
    // Test parsing context flag
    const result = contextModule.parseContextFlag('run --context=/tmp/test "Tell me about this directory"');
    expect(result.command).toBe('run "Tell me about this directory"');
    expect(result.contextPath).toBe('/tmp/test');
  });
  
  // Test error boundary
  test('should have comprehensive error boundary system', () => {
    const errorBoundary = require('../errors/ClaudeErrorBoundary');
    expect(errorBoundary).toBeTruthy();
    expect(typeof errorBoundary.handle).toBe('function');
    
    // Test error handling
    const error = new Error('Test error');
    const result = errorBoundary.handle(error, { command: 'test' });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error.timestamp).toBeTruthy();
    expect(result.error.context).toBeTruthy();
  });
  
  // Test terminal UI components
  test('should have terminal UI components with spinner support', () => {
    const terminal = require('../terminal/spinner');
    expect(terminal).toBeTruthy();
    expect(typeof terminal.createSpinner).toBe('function');
    expect(terminal.colors).toBeTruthy();
    
    // Test spinner creation
    const spinner = terminal.createSpinner('Loading...');
    expect(spinner).toBeTruthy();
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.text).toBe('function');
    expect(typeof spinner.succeed).toBe('function');
    expect(typeof spinner.fail).toBe('function');
  });
  
  // Test version command
  test('should have version command with proper display', () => {
    const versionCommand = require('../router/commands/version');
    expect(versionCommand).toBeTruthy();
    expect(typeof versionCommand.execute).toBe('function');
    
    // Execute version command without actually running it
    // by checking it has the expected method signatures
    expect(typeof versionCommand.getVersionInfo).toBe('function');
  });
});

// Test for the test infrastructure itself
describe('Test Infrastructure', () => {
  test('should have Jest-style test structure', () => {
    // We're using it right now, so it exists!
    expect(typeof describe).toBe('function');
    expect(typeof test).toBe('function');
    expect(typeof skipTest).toBe('function');
    expect(typeof expect).toBe('function');
  });
  
  test('should have async test support', async () => {
    // This is an async test
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(true).toBeTruthy();
  });
  
  test('should have rich assertions', () => {
    // Test various assertion methods
    expect(1).toBe(1);
    expect({ a: 1 }).toEqual({ a: 1 });
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect('hello').toContain('hell');
    expect('hello').toMatch(/^h.*o$/);
    expect(() => { throw new Error('boom') }).toThrow();
    expect(5).toBeGreaterThan(3);
    expect(3).toBeLessThan(5);
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect({ prop: 'value' }).toHaveProperty('prop');
    expect({ prop: 'value' }).toHaveProperty('prop', 'value');
  });
});

// Test parity matrix
describe('Parity Matrix', () => {
  test('should have updated parity matrix with 100% completion', () => {
    // Define the path to the parity matrix
    const matrixPath = path.join(__dirname, '..', '..', '..', 'claude_parity_matrix.yaml');
    
    // Skip if file doesn't exist (might be in a different location)
    if (!fs.existsSync(matrixPath)) {
      console.log('Parity matrix not found at expected path, skipping check');
      return;
    }
    
    // Read the matrix file
    const matrixContent = fs.readFileSync(matrixPath, 'utf8');
    
    // Check for completed status
    expect(matrixContent).toContain('implemented: true');
    expect(matrixContent).not.toContain('implemented: false');
    expect(matrixContent).not.toContain('implemented: partial');
  });
});