# Mock Implementation Guide

This document explains how the mocking system works in the Scout Dashboard QA Framework and how to maintain it as the framework evolves.

## Table of Contents
- [Overview](#overview)
- [Mock Architecture](#mock-architecture)
- [Mock Test Files](#mock-test-files)
- [Jest Setup](#jest-setup)
- [Helper Utilities](#helper-utilities)
- [Adding New Mocks](#adding-new-mocks)
- [Troubleshooting Mocks](#troubleshooting-mocks)

## Overview

The QA framework uses a comprehensive mocking system to enable tests to run in CI/CD environments where browsers and actual dashboards may not be available. This mocking system provides simulated versions of:

- Browser APIs via Puppeteer
- Image processing for visual comparison
- Accessibility testing
- Performance measurement
- File system operations

## Mock Architecture

The mocking architecture consists of four main components:

1. **Mock Test Files** - Simplified test implementations that use mocks
2. **Jest Setup** - Global mock objects and functions set up before tests run
3. **Helper Utilities** - Functions that behave differently in mock vs. real mode
4. **Mock-Specific Utilities** - Specialized mock implementations for complex functionality

### Environment Detection

The framework automatically detects whether to use mocks based on the `CI` environment variable:

```javascript
// From test_helper.js
const isMockBrowser = process.env.CI === 'true';
```

## Mock Test Files

Mock test files are parallel versions of real tests that use the mocking system:

- `tests/mock-visual-parity.test.js`
- `tests/mock-behavior-parity.test.js`
- `tests/mock-accessibility.test.js`
- `tests/mock-performance.test.js`

These files maintain the same test structure but:
- Skip actual browser interactions
- Return predetermined success results
- Maintain compatibility with reporting systems

Example:

```javascript
// From mock-visual-parity.test.js
describe('Dashboard Visual Parity Tests (Mock)', () => {
  describe('Component Visual Matching', () => {
    dashboards.forEach(dashboard => {
      dashboard.components.forEach(component => {
        it(`${dashboard.name} - ${component} should match baseline`, () => {
          // Mock test always passes
          expect(true).toBe(true);
        });
      });
    });
  });
});
```

## Jest Setup

The `jest.setup.js` file is the foundation of the mocking system, setting up global mocks before tests run:

### Browser Mocking

```javascript
// Mock browser page and browser objects
global.mockPage = {
  goto: jest.fn().mockResolvedValue({}),
  waitForSelector: jest.fn().mockResolvedValue({}),
  $: jest.fn().mockResolvedValue(mockElement),
  $$: jest.fn().mockResolvedValue([mockElement]),
  screenshot: jest.fn().mockResolvedValue(global.MOCK_PNG_DATA),
  evaluate: jest.fn().mockResolvedValue({}),
  close: jest.fn().mockResolvedValue({}),
  // More methods...
};

global.mockBrowser = {
  newPage: jest.fn().mockResolvedValue(global.mockPage),
  close: jest.fn().mockResolvedValue({}),
};
```

### PNG and Image Processing Mocks

```javascript
// Mock PNG data
global.MOCK_PNG_DATA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// Mock PNG structure
global.MOCK_PNG_STRUCT = {
  width: 100,
  height: 100,
  data: new Uint8Array(100 * 100 * 4).fill(255),
  depth: 8,
  colorType: 6
};

// Mock pixelmatch module
jest.mock('pixelmatch', () => {
  return jest.fn().mockReturnValue(0); // 0 difference
});
```

### File System Mocks

```javascript
// Mock fs module operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn((path) => {
    if (path.endsWith('.png')) {
      return global.MOCK_PNG_DATA;
    }
    return '';
  }),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
}));
```

## Helper Utilities

The `utils/test_helper.js` file provides functions that automatically adapt to the current environment:

```javascript
/**
 * Wait for selector in mock mode immediately returns with a mock element.
 * In real mode, it's a wrapper for page.waitForSelector and page.$
 */
async function waitAndGetElement(page, selector, options = {}) {
  if (isMockBrowser) {
    // In mock mode, just return a mock element for any selector
    return new MockElement(selector);
  } else {
    // In real mode, actually wait and get the element
    await page.waitForSelector(selector, options);
    return page.$(selector);
  }
}

/**
 * Take a screenshot in mock mode returns mock PNG data.
 * In real mode, it's a wrapper for page.screenshot
 */
async function takeScreenshot(page, options = {}) {
  if (isMockBrowser) {
    return global.MOCK_PNG_DATA;
  } else {
    return page.screenshot(options);
  }
}
```

## Adding New Mocks

When adding new functionality to the QA framework, follow these steps to maintain mock compatibility:

1. **Identify External Dependencies**
   - Identify any new external dependencies (libraries, APIs, browser features)
   - Determine what mocks are needed for CI environments

2. **Update Jest Setup**
   - Add any global mocks to `jest.setup.js`
   - Mock both success and failure scenarios

3. **Update Helper Utilities**
   - Add environment-aware helpers in `test_helper.js`
   - Implement both real and mock versions

4. **Create Mock Implementations**
   - Create any specialized mock implementations as needed
   - Place in `utils/` directory with a `mock-` prefix

5. **Update Mock Test Files**
   - Ensure mock test files include the new functionality
   - Follow the same structure as real tests

6. **Test in CI Mode**
   - Verify your mocks work by running with `CI=true`

### Example: Adding a New Library

If adding a new data visualization library:

```javascript
// In jest.setup.js
jest.mock('new-visualization-library', () => ({
  render: jest.fn(),
  analyze: jest.fn().mockReturnValue({
    nodes: 10,
    edges: 15,
    density: 0.5
  }),
}));

// In test_helper.js
function renderVisualization(element, data, options) {
  if (isMockBrowser) {
    return {
      chart: {
        width: 500,
        height: 300,
        elements: data.length
      }
    };
  } else {
    return visualizationLibrary.render(element, data, options);
  }
}
```

## Troubleshooting Mocks

### Mock Not Working in CI

If a mock is not working in CI but tests pass locally:

1. Verify that the `CI` environment variable is set
2. Check for missing or incomplete mock implementations
3. Look for direct imports bypassing mocked modules
4. Ensure Jest is configured to use the setup file

### Test Passes with Mock but Real Implementation Fails

If tests pass with mocks but fail with real implementations:

1. Compare the mock return values with real ones
2. Check for missing edge cases in mocks
3. Verify that mocks accurately represent real behavior
4. Add more detailed error handling to real implementations

### "TypeError: Cannot read property of undefined"

Often indicates a missing mock for a property chain:

```javascript
// Problem:
page.evaluate(() => document.querySelector('.chart').getBoundingClientRect());

// Solution in jest.setup.js:
global.mockPage = {
  evaluate: jest.fn().mockImplementation((fn) => {
    // Mock document and other browser APIs
    global.document = {
      querySelector: jest.fn().mockReturnValue({
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 0, left: 0, width: 100, height: 100
        })
      })
    };
    
    try {
      return Promise.resolve(fn());
    } catch (error) {
      return Promise.resolve({});
    } finally {
      delete global.document;
    }
  })
};
```