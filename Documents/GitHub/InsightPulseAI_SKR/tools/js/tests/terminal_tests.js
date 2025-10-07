/**
 * terminal_tests.js
 * 
 * Unit tests for Claude CLI terminal UI components
 */

const { describe, test, skipTest, expect } = require('./run_tests');
const { createSpinner, colors } = require('../terminal/spinner');

// Test color formatting
describe('Terminal Colors', () => {
  test('colors object should exist and have basic colors', () => {
    expect(colors).toBeTruthy();
    expect(colors.red).toBeTruthy();
    expect(colors.green).toBeTruthy();
    expect(colors.yellow).toBeTruthy();
    expect(colors.blue).toBeTruthy();
    expect(colors.cyan).toBeTruthy();
  });
  
  test('colors should format text correctly', () => {
    const redText = colors.red('error');
    expect(typeof redText).toBe('string');
    expect(redText.includes('error')).toBeTruthy();

    const greenText = colors.green('success');
    expect(typeof greenText).toBe('string');
    expect(greenText.includes('success')).toBeTruthy();
  });
});

// Test spinner creation
describe('Terminal Spinner', () => {
  test('createSpinner should return a spinner object', () => {
    const spinner = createSpinner('Loading...');
    expect(spinner).toBeTruthy();
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.text).toBe('function');
  });
  
  test('spinner should handle text updates', () => {
    const spinner = createSpinner('Initial text');
    
    // Test the getter first
    const currentText = spinner.text();
    expect(currentText).toBe('Initial text');
    
    // Test the setter
    spinner.text('Updated text');
    expect(spinner.text()).toBe('Updated text');
  });
  
  test('spinner should handle color changes', () => {
    const spinner = createSpinner('Loading...');
    
    // Change spinner color
    spinner.color('red');
    
    // Can't easily verify the color change in a unit test
    // but we can verify it doesn't crash
    expect(spinner.text()).toBe('Loading...');
  });
  
  test('spinner start and stop should work', () => {
    const spinner = createSpinner('Loading...');
    
    // Start the spinner
    spinner.start();
    
    // Stop it after a short delay
    setTimeout(() => {
      spinner.stop();
      // Again, we can't easily verify the animation in a unit test
      // but we can verify it doesn't crash when started and stopped
    }, 100);
    
    // Instead of waiting, we'll just call stop immediately
    // in the test environment
    spinner.stop();
    
    // No assertions needed here as we're just checking that
    // the methods don't throw errors
  });
  
  test('spinner should have a succeed method', () => {
    const spinner = createSpinner('Loading...');
    expect(typeof spinner.succeed).toBe('function');
    
    // Test succeed method
    spinner.succeed('Success message');
    // No crash = test passed
  });
  
  test('spinner should have a fail method', () => {
    const spinner = createSpinner('Loading...');
    expect(typeof spinner.fail).toBe('function');
    
    // Test fail method
    spinner.fail('Error message');
    // No crash = test passed
  });
  
  test('spinner should support custom frames', () => {
    const customFrames = ['1', '2', '3'];
    const spinner = createSpinner('Loading...', { frames: customFrames });
    
    // Start and stop to exercise the custom frames
    spinner.start();
    setTimeout(() => {
      spinner.stop();
    }, 100);
    
    // Force stop for test
    spinner.stop();
    // No crash = test passed
  });
});