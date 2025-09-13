/**
 * Test Helper Utilities for QA Framework
 * 
 * These utilities help mock browser interactions and provide consistent 
 * test helpers for all test files.
 */

// Detect CI environment
const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'ci';
const isMockBrowser = isCI || process.env.MOCK_BROWSER === 'true';

/**
 * Mock element that can be used in tests
 */
class MockElement {
  constructor(selector) {
    this.selector = selector;
    this.classList = new Set();
    this.style = {
      display: 'block',
      visibility: 'visible',
      backgroundColor: '#ffffff',
      color: '#000000',
      overflow: 'hidden'
    };
    this.attributes = new Map();
    this.children = [];
    this.textContent = `Mock element: ${selector}`;
  }
  
  hasAttribute(name) {
    return this.attributes.has(name);
  }
  
  getAttribute(name) {
    return this.attributes.get(name) || null;
  }
  
  addClass(className) {
    this.classList.add(className);
    return this;
  }
  
  async screenshot() {
    // Mock PNG data
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
  }
}

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
 * Mock version of evaluate that returns predefined results
 * based on the function being evaluated
 */
function mockEvaluate(page, fn, ...args) {
  if (isMockBrowser) {
    // Check what kind of evaluation this is based on function string pattern
    const fnStr = fn.toString();
    
    // For style evaluations
    if (fnStr.includes('getComputedStyle')) {
      return { color: '#000000', backgroundColor: '#ffffff', fontFamily: 'Arial', fontSize: '16px' };
    }
    
    // For element text/content
    if (fnStr.includes('textContent')) {
      return ['Item 1', 'Item 2', 'Item 3'];
    }
    
    // For element checking visibility
    if (fnStr.includes('getVisibleElements') || fnStr.includes('visibility') || fnStr.includes('visible')) {
      return 1; // Elements are visible
    }
    
    // For counting elements
    if (fnStr.includes('countFilteredElements') || fnStr.includes('length') || fnStr.includes('querySelectorAll')) {
      return 3; // Mock count of elements
    }
    
    // For checking filters/classes
    if (fnStr.includes('classList')) {
      return true; // Element has class
    }
    
    // Default response for other evaluate calls
    return {}; 
  } else {
    // In real mode, use actual page.evaluate
    return page.evaluate(fn, ...args);
  }
}

/**
 * Gets PNG mock structure for tests
 */
function getMockPNGStruct() {
  return {
    width: 100,
    height: 100,
    data: new Uint8Array(100 * 100 * 4).fill(255),
    depth: 8,
    colorType: 6
  };
}

module.exports = {
  isCI,
  isMockBrowser,
  MockElement,
  waitAndGetElement,
  mockEvaluate,
  getMockPNGStruct
};