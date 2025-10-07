/**
 * Unit tests for LLM Pricing Calculator
 */

import { 
  calculateLLMCost, 
  compareModelCosts,
  recommendCostEffectiveModel 
} from '../utils/llm-pricing-calculator';

import { countTokens, estimateMessageTokens } from '../utils/token-counter';

describe('LLM Pricing Calculator', () => {
  // Calculate LLM Cost
  describe('calculateLLMCost', () => {
    test('calculates basic cost correctly', () => {
      const result = calculateLLMCost('gpt-4.1', 1000, 2000);
      expect(result.baseCost).toBeCloseTo(18.0, 5);
      expect(result.optimizedCost).toBeCloseTo(18.0, 5);
      expect(result.savings).toBeCloseTo(0.0, 5);
      expect(result.savingsPercentage).toBeCloseTo(0.0, 5);
    });

    test('applies caching discount correctly', () => {
      const result = calculateLLMCost('gpt-4.1', 1000, 2000, { useCache: true });
      expect(result.baseCost).toBeCloseTo(18.0, 5);
      expect(result.optimizedCost).toBeCloseTo(4.5, 5); // 75% discount
      expect(result.savings).toBeCloseTo(13.5, 5);
      expect(result.savingsPercentage).toBeCloseTo(75.0, 5);
    });

    test('applies batch processing discount correctly', () => {
      const result = calculateLLMCost('gpt-4.1', 1000, 2000, { useBatch: true });
      expect(result.baseCost).toBeCloseTo(18.0, 5);
      expect(result.optimizedCost).toBeCloseTo(9.0, 5); // 50% discount
      expect(result.savings).toBeCloseTo(9.0, 5);
      expect(result.savingsPercentage).toBeCloseTo(50.0, 5);
    });

    test('applies combined discounts correctly', () => {
      const result = calculateLLMCost('gpt-4.1', 1000, 2000, { useCache: true, useBatch: true });
      expect(result.baseCost).toBeCloseTo(18.0, 5);
      expect(result.optimizedCost).toBeCloseTo(2.25, 5); // 87.5% combined discount
      expect(result.savings).toBeCloseTo(15.75, 5);
      expect(result.savingsPercentage).toBeCloseTo(87.5, 5);
    });
  });

  // Model Comparison
  describe('compareModelCosts', () => {
    test('compares models correctly', () => {
      const results = compareModelCosts(1000, 1000);
      
      // Should have one result for each model
      expect(results.length).toBeGreaterThan(3);
      
      // Results should be sorted by cost (cheapest first)
      expect(results[0].optimizedCost).toBeLessThanOrEqual(results[1].optimizedCost);
      
      // Each result should have the required properties
      results.forEach(result => {
        expect(result).toHaveProperty('model');
        expect(result).toHaveProperty('baseCost');
        expect(result).toHaveProperty('optimizedCost');
        expect(result).toHaveProperty('savings');
        expect(result).toHaveProperty('savingsPercentage');
      });
    });
  });
  
  // Recommend Cost Effective Model
  describe('recommendCostEffectiveModel', () => {
    test('recommends the cheapest model by default', () => {
      const recommendation = recommendCostEffectiveModel(1000, 1000);
      
      expect(recommendation).toHaveProperty('recommendedModel');
      expect(recommendation).toHaveProperty('cost');
      expect(recommendation).toHaveProperty('reasoning');
      
      // Should recommend a model with the lowest cost for this scenario
      const comparisons = compareModelCosts(1000, 1000);
      const cheapestModel = comparisons[0].model;
      
      expect(recommendation.recommendedModel).toBe(cheapestModel);
    });
  });
});

describe('Token Counter', () => {
  // Token Counting
  describe('countTokens', () => {
    test('estimates token count for simple text', () => {
      const text = 'This is a simple test sentence.';
      const count = countTokens(text);
      
      // Simple test to ensure count is reasonable
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(text.length); // Tokens should be fewer than chars
    });
    
    test('returns 0 for empty text', () => {
      expect(countTokens('')).toBe(0);
      expect(countTokens(null as any)).toBe(0);
      expect(countTokens(undefined as any)).toBe(0);
    });
  });
  
  // Message Token Estimation
  describe('estimateMessageTokens', () => {
    test('estimates tokens for a message exchange', () => {
      const system = 'You are a helpful assistant.';
      const user = 'What is the capital of France?';
      
      const result = estimateMessageTokens(system, user);
      
      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('estimatedOutputTokens');
      expect(result).toHaveProperty('total');
      
      // Basic validation
      expect(result.inputTokens).toBeGreaterThan(0);
      expect(result.estimatedOutputTokens).toBeGreaterThan(0);
      expect(result.total).toBe(result.inputTokens + result.estimatedOutputTokens);
    });
  });
});