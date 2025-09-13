/**
 * Jest test setup file
 */

// Mock DOM elements and browser APIs needed for testing
global.window = Object.create(window);
global.document = Object.create(document);

// Mock fetch API
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      metadata: {
        generated_at: '2025-05-16T10:00:00Z',
        time_period: 'Last 30 days',
        model: 'retail-advisor-gpt-20240229',
        insights_count: 6
      },
      insights: [
        {
          id: 'test-001',
          type: 'general',
          title: 'Test insight title',
          text: 'Test insight text content',
          confidence: 0.92,
          brands: ['Brand A', 'Brand B'],
          tags: ['test', 'mock'],
          date: '2025-05-16'
        }
      ]
    })
  })
);

// Mock CustomEvent
global.CustomEvent = class CustomEvent {
  constructor(event, params) {
    this.type = event;
    this.detail = params?.detail;
    this.bubbles = params?.bubbles || false;
    this.cancelable = params?.cancelable || false;
  }
};

// Mock matchMedia
global.window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    getAll: () => store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Add missing DOM methods
document.createElement = jest.fn().mockImplementation(tag => {
  const element = {
    tagName: tag.toUpperCase(),
    className: '',
    getAttribute: jest.fn().mockReturnValue(null),
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    textContent: '',
    innerHTML: '',
    style: {},
    children: [],
    parentNode: null,
    cloneNode: jest.fn().mockImplementation(deep => {
      return {...element};
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelectorAll: jest.fn().mockReturnValue([]),
    querySelector: jest.fn().mockReturnValue(null),
    createTextNode: jest.fn().mockImplementation(text => ({ 
      textContent: text, 
      nodeType: 3 
    })),
    dataset: {}
  };
  return element;
});

document.createDocumentFragment = jest.fn().mockReturnValue({
  appendChild: jest.fn(),
  children: []
});

document.querySelector = jest.fn().mockReturnValue(null);
document.querySelectorAll = jest.fn().mockReturnValue([]);
document.getElementById = jest.fn().mockReturnValue(null);

// Console mocks for testing
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();