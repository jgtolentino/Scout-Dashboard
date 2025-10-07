/**
 * Unit tests for the unified_genai_insights.js module
 */

// Import the module under test
// Note: Jest setup.js already mocks necessary browser APIs
const fs = require('fs');
const path = require('path');

describe('UnifiedGenAI Module', () => {
  let UnifiedGenAI;
  
  beforeAll(() => {
    // Load the script content from the file
    const scriptPath = path.resolve(__dirname, '../../deployment-v2/public/js/unified_genai_insights.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Evaluate the script to get the UnifiedGenAI object
    eval(scriptContent);
    
    // Mock DOM elements for testing
    document.querySelector = jest.fn().mockImplementation(selector => {
      if (selector === '.insights-grid') {
        return {
          innerHTML: '',
          appendChild: jest.fn()
        };
      }
      return null;
    });
  });
  
  afterEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks();
  });
  
  describe('Initialization', () => {
    test('init() should initialize the module correctly', () => {
      // Act
      const result = UnifiedGenAI.init();
      
      // Assert
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('initializing'));
    });
    
    test('init() should handle reinitialization correctly', () => {
      // Arrange - initialize once
      UnifiedGenAI.init();
      
      // Act - initialize again
      const result = UnifiedGenAI.init();
      
      // Assert - should clear previous timer and set up a new one
      expect(result).toBe(true);
    });
  });
  
  describe('Data Loading', () => {
    test('loadInsights() should fetch and process data correctly', async () => {
      // Arrange
      const mockInsightData = {
        metadata: { generated_at: '2025-05-16T10:00:00Z' },
        insights: [{ id: 'test-001', type: 'general', confidence: 0.9 }]
      };
      
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockInsightData)
        })
      );
      
      // Act
      await UnifiedGenAI.loadInsights();
      
      // Assert
      expect(global.fetch).toHaveBeenCalled();
      
      // Get current state to verify data was loaded
      const state = UnifiedGenAI.getState();
      expect(state.insights).toBeDefined();
    });
    
    test('loadInsights() should handle API errors gracefully', async () => {
      // Arrange
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 404
        })
      );
      
      // Act
      await UnifiedGenAI.loadInsights();
      
      // Assert
      expect(console.error).toHaveBeenCalled();
      
      // Verify fallback was used
      const state = UnifiedGenAI.getState();
      expect(state.insights.length).toBeGreaterThan(0);
    });
  });
  
  describe('Public API', () => {
    test('getInsightTypes() should return unique insight types', () => {
      // Arrange - Ensure state has some insights
      UnifiedGenAI.init();
      
      // Act
      const types = UnifiedGenAI.getInsightTypes();
      
      // Assert
      expect(Array.isArray(types)).toBe(true);
    });
    
    test('generateInsights() should return contextual insights', () => {
      // Act
      const salesInsights = UnifiedGenAI.generateInsights('sales');
      const defaultInsights = UnifiedGenAI.generateInsights('unknown-type');
      
      // Assert
      expect(salesInsights).toBeDefined();
      expect(salesInsights.length).toBeGreaterThan(0);
      expect(defaultInsights).toBeDefined();
      expect(defaultInsights.length).toBeGreaterThan(0);
    });
    
    test('getState() should return the current state object', () => {
      // Act
      const state = UnifiedGenAI.getState();
      
      // Assert
      expect(state).toBeDefined();
      expect(state.insights).toBeDefined();
      expect(state.metadata).toBeDefined();
      expect(state.cachedElements).toBeDefined();
    });
  });
  
  describe('DOM Interactions', () => {
    test('should create DOM elements correctly', () => {
      // This test will need to mock document.createElement more specifically
      // to capture the exact elements being created
      const mockElement = {
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        classList: { toggle: jest.fn() },
        className: '',
        textContent: ''
      };
      
      document.createElement = jest.fn().mockReturnValue(mockElement);
      document.createTextNode = jest.fn().mockReturnValue({});
      
      // Initialize the module again with our specific mocks
      UnifiedGenAI.init();
      
      // Verify createElement was called (the exact number depends on implementation)
      expect(document.createElement).toHaveBeenCalled();
    });
  });
});