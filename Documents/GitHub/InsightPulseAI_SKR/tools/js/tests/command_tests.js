/**
 * command_tests.js
 * 
 * Unit tests for Claude CLI command registry and command modules
 */

const { describe, test, skipTest, expect } = require('./run_tests');
const { getCommand, listCommands, executeCommand } = require('../router/command_registry');
const path = require('path');

// Test the command registry
describe('Command Registry', () => {
  test('should initialize correctly', () => {
    const commands = listCommands();
    expect(Object.keys(commands).length).toBeTruthy();
  });

  test('should have run command', () => {
    const runCommand = getCommand('run');
    expect(runCommand).toBeTruthy();
    expect(typeof runCommand.execute).toBe('function');
    expect(typeof runCommand.getHelp).toBe('function');
  });

  test('should have version command', () => {
    const versionCommand = getCommand('version');
    expect(versionCommand).toBeTruthy();
    expect(typeof versionCommand.execute).toBe('function');
    expect(typeof versionCommand.getHelp).toBe('function');
  });

  test('should return null for non-existent command', () => {
    const nonExistentCommand = getCommand('nonexistent');
    expect(nonExistentCommand).toBe(null);
  });
});

// Test the run command
describe('Run Command', () => {
  test('getHelp should return usage instructions', () => {
    const runCommand = getCommand('run');
    const help = runCommand.getHelp();
    expect(help).toContain('Usage:');
    expect(help).toContain('--context');
  });

  // Skip actual execution tests since they require Claude API
  skipTest('should execute a simple command', () => {
    // This would require Claude API access
  });

  skipTest('should respect context flag', () => {
    // This would require Claude API access
  });
});

// Test the version command
describe('Version Command', () => {
  test('getHelp should return usage instructions', () => {
    const versionCommand = getCommand('version');
    const help = versionCommand.getHelp();
    expect(help).toContain('version');
  });

  // This test doesn't require API access, so we can run it
  test('execute should return version information', async () => {
    const versionCommand = getCommand('version');
    const result = await versionCommand.execute();
    expect(result).toContain('Claude CLI Version:');
    expect(result).toContain('Claude API Version:');
  });
});

// Test command execution through registry
describe('Command Execution', () => {
  test('executeCommand should handle unknown commands', async () => {
    const result = await executeCommand('nonexistent', '', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown command');
  });

  test('executeCommand should handle version command', async () => {
    const result = await executeCommand('version', '', {});
    expect(result.success).toBe(true);
    expect(result.result).toContain('Claude CLI Version:');
  });
});
