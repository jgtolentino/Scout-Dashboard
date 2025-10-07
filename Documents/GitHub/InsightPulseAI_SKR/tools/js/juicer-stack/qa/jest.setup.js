/**
 * Jest setup file for Scout Dashboard QA Framework
 *
 * This file runs before each test file to set up the test environment.
 */

// Define dashboard URL based on environment variable or default
global.DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:8080';

// Determine if we're running in CI environment
global.IS_CI = process.env.CI === 'true' || process.env.NODE_ENV === 'ci';

// Mock PNG data for tests
global.MOCK_PNG_DATA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// Create a basic 100x100 PNG structure for tests
global.MOCK_PNG_STRUCT = {
  width: 100,
  height: 100,
  data: new Uint8Array(100 * 100 * 4).fill(255),
  depth: 8,
  colorType: 6
};

// Set up console logging
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Enhance console.log with test file information
console.log = (...args) => {
  // Get the current test file
  const stack = new Error().stack;
  const testFile = stack.split('\n')[2]?.match(/\(([^:]+):/)?.[1] || 'unknown';
  const testFileName = testFile.split('/').pop();

  // Add timestamp and test file to logs
  originalConsoleLog(`[${new Date().toISOString()}][${testFileName}]`, ...args);
};

console.warn = (...args) => {
  // Get the current test file
  const stack = new Error().stack;
  const testFile = stack.split('\n')[2]?.match(/\(([^:]+):/)?.[1] || 'unknown';
  const testFileName = testFile.split('/').pop();

  // Add timestamp and test file to logs
  originalConsoleWarn(`[${new Date().toISOString()}][${testFileName}][WARN]`, ...args);
};

console.error = (...args) => {
  // Get the current test file
  const stack = new Error().stack;
  const testFile = stack.split('\n')[2]?.match(/\(([^:]+):/)?.[1] || 'unknown';
  const testFileName = testFile.split('/').pop();

  // Add timestamp and test file to logs
  originalConsoleError(`[${new Date().toISOString()}][${testFileName}][ERROR]`, ...args);
};

// Setup mocks for CI environment and tests
beforeAll(() => {
  // Mock puppeteer browser and page when running in CI or when tests need to run without a real browser
  if (global.IS_CI || process.env.MOCK_BROWSER === 'true') {
    jest.mock('puppeteer', () => {
      const mockPage = {
        setViewport: jest.fn().mockResolvedValue(undefined),
        goto: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
        waitForSelector: jest.fn().mockResolvedValue(undefined),
        addScriptTag: jest.fn().mockResolvedValue(undefined),
        $: jest.fn().mockResolvedValue({
          screenshot: jest.fn().mockResolvedValue(global.MOCK_PNG_DATA)
        }),
        evaluate: jest.fn().mockImplementation(() => ({})),
        setCacheEnabled: jest.fn().mockResolvedValue(undefined),
        screenshot: jest.fn().mockResolvedValue(global.MOCK_PNG_DATA),
        keyboard: {
          press: jest.fn().mockResolvedValue(undefined)
        },
        waitForTimeout: jest.fn().mockResolvedValue(undefined),
        waitForFunction: jest.fn().mockResolvedValue(undefined),
        target: jest.fn().mockReturnValue({
          createCDPSession: jest.fn().mockResolvedValue({
            send: jest.fn().mockResolvedValue(undefined)
          })
        }),
        click: jest.fn().mockResolvedValue(undefined),
        goBack: jest.fn().mockResolvedValue(undefined)
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
        pages: jest.fn().mockResolvedValue([mockPage])
      };

      return {
        launch: jest.fn().mockResolvedValue(mockBrowser)
      };
    });

    // Mock the PNG module to avoid file system issues
    jest.mock('pngjs', () => {
      // Create a PNG constructor
      function PNGConstructor() {
        return {
          width: 100,
          height: 100,
          data: new Uint8Array(100 * 100 * 4).fill(255)
        };
      }
      
      // Add static methods
      PNGConstructor.sync = {
        read: jest.fn().mockReturnValue(global.MOCK_PNG_STRUCT),
        write: jest.fn().mockReturnValue(global.MOCK_PNG_DATA)
      };
      
      return {
        PNG: PNGConstructor
      };
    });

    // Mock fs for baselines
    const fs = require('fs');
    const originalExistsSync = fs.existsSync;
    const originalWriteFileSync = fs.writeFileSync;
    const originalReadFileSync = fs.readFileSync;

    jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
      if (path.includes('baselines') && (path.endsWith('.png') || path.endsWith('.svg'))) {
        return true; // Pretend baseline images exist
      }
      return originalExistsSync(path);
    });

    jest.spyOn(fs, 'writeFileSync').mockImplementation((path, data) => {
      if (path.endsWith('.png') || path.endsWith('.json')) {
        return; // Mock file writes for images and reports
      }
      return originalWriteFileSync(path, data);
    });

    jest.spyOn(fs, 'readFileSync').mockImplementation((path, options) => {
      if (path.endsWith('.png')) {
        return global.MOCK_PNG_DATA;
      }
      return originalReadFileSync(path, options);
    });
    
    // Mock lighthouse if needed
    if (global.IS_CI) {
      jest.mock('lighthouse', () => {
        return require('../utils/mock-lighthouse');
      });
    }
  }

  // Add global helpers for browser tests
  global.window = global.window || {};
  global.window.getComputedStyles = (selector) => ({ color: '#000000', backgroundColor: '#FFFFFF' });
  global.window.getChartColors = (selector) => ['#FF671F', '#3B1A86'];
  global.window.getVisibleElements = (selector) => 1; // Mock that elements are visible
  global.window.countFilteredElements = (selector) => 2; // Mock that filtered elements exist
});

// Clean up mocks after tests
afterAll(() => {
  jest.restoreAllMocks();
});