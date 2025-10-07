# LLM Pricing Optimizer - Technical Implementation

## Architecture Overview

The LLM Pricing Optimizer is built with a three-tiered architecture:

1. **Core Utility Layer**: Base calculation and data structures
2. **Hook Layer**: React state management and API
3. **UI Layer**: Interactive components and visualizations

This document provides technical details for developers integrating the pricing optimizer into Pulser workflows.

## Core Utility Layer

### File: `src/utils/llm-pricing-calculator.ts`

The core utility implements the following key components:

#### Model Registry

```typescript
export const MODEL_REGISTRY: Record<string, {
  rates: ModelRates;
  features: OptimizationFeatures;
  alias?: string[];
}> = {
  'gpt-4-1106-preview': {
    rates: { input: 2.00, output: 8.00 },
    features: {
      promptCaching: true,
      cachingDiscount: 0.75, // 75% discount
      batchProcessing: true,
      batchDiscount: 0.5,    // 50% discount
      maxContextSize: 128000,
      truncationPenalty: 1.2
    },
    alias: ['gpt-4.1', 'gpt-4-turbo']
  },
  // Additional models...
};
```

#### Cost Calculation Logic

```typescript
export function calculateLLMCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  options?: {
    useCache?: boolean;
    useBatch?: boolean;
    sessionTokens?: number;
  }
): {
  baseCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  optimizations: string[];
  warnings: string[];
} {
  // Implementation details
  // 1. Validate model and get pricing data
  // 2. Calculate base cost using token rates
  // 3. Apply optimization discounts (caching, batching)
  // 4. Check for context size warnings
  // 5. Return detailed cost breakdown
}
```

#### Model Recommendation Engine

```typescript
export function recommendCostEffectiveModel(
  inputTokens: number,
  outputTokens: number,
  options?: {
    useCache?: boolean;
    useBatch?: boolean;
    requireFeatures?: Array<'promptCaching' | 'batchProcessing'>;
    minContextSize?: number;
  }
): {
  recommendedModel: string;
  cost: number;
  reasoning: string;
} {
  // Implementation details
  // 1. Filter models based on requirements
  // 2. Calculate costs for eligible models
  // 3. Identify the most cost-effective option
  // 4. Generate reasoning with potential alternatives
}
```

#### Usage Tracking System

```typescript
export class LLMUsageTracker {
  private history: Array<{
    timestamp: Date;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }> = [];
  
  // Methods:
  // - recordUsage: Log a new API call
  // - getUsageStats: Calculate usage metrics
  // - getOptimizationRecommendations: Generate cost-saving suggestions
  // - findRepeatedCallsInTimeframe: Identify caching opportunities
  // - findSequentialSimilarCalls: Identify batching opportunities
}
```

## Hook Layer

### File: `src/hooks/useLLMPricing.ts`

The React hook provides a convenient API for components to access the pricing utilities:

```typescript
export function useLLMPricing({
  defaultModel = 'gpt-4-1106-preview',
  trackUsage = true,
  autoOptimize = true
}: UseLLMPricingProps = {}): LLMPricingResult {
  // State
  const [currentModel, setCurrentModel] = useState(defaultModel);
  const [useCaching, setUseCaching] = useState(autoOptimize);
  const [useBatchProcessing, setUseBatchProcessing] = useState(autoOptimize);
  
  // Callback implementations for:
  // - calculateCost
  // - compareModels
  // - getRecommendedModel
  // - estimateTokenCount
  // - recordUsage
  // - getUsageStats
  // - getOptimizationTips
  
  // Return the full API
  return {
    calculateCost,
    compareModels,
    getRecommendedModel,
    estimateTokenCount,
    recordUsage,
    getUsageStats,
    getOptimizationTips,
    currentModel,
    setCurrentModel,
    useCaching,
    setUseCaching,
    useBatchProcessing,
    setUseBatchProcessing
  };
}
```

## UI Layer

### File: `src/components/advisor/LLMPricingPanel.tsx`

The UI component is organized into tabbed sections:

1. **Calculator Tab**: Input controls for token counts and model selection
2. **Comparison Tab**: Side-by-side model comparison with recommendations
3. **Usage Tab**: Usage statistics with visualizations
4. **Tips Tab**: Optimization recommendations and examples

Key implementation details:

```typescript
export function LLMPricingPanel({ className }: LLMPricingPanelProps) {
  // State
  const [inputTokens, setInputTokens] = useState(800);
  const [outputTokens, setOutputTokens] = useState(1200);
  const [sampleText, setSampleText] = useState('');
  
  // Hook integration
  const {
    calculateCost,
    compareModels,
    getRecommendedModel,
    // ...other hook returns
  } = useLLMPricing();
  
  // Calculations
  const costResult = calculateCost(inputTokens, outputTokens);
  const modelComparison = compareModels(inputTokens, outputTokens);
  const recommendation = getRecommendedModel(inputTokens, outputTokens);
  
  // Rendering logic for tabs, controls, and visualizations
}
```

## Integration Patterns

### 1. Direct Utility Usage

For backend or utility code:

```typescript
import { calculateLLMCost, MODEL_REGISTRY } from '@/utils/llm-pricing-calculator';

// Example: Calculate cost for prompt with system message
function estimatePromptCost(systemMessage: string, userMessage: string, model = 'gpt-4.1') {
  const systemTokens = Math.ceil(systemMessage.split(/\s+/).length * 1.3);
  const userTokens = Math.ceil(userMessage.split(/\s+/).length * 1.3);
  const expectedOutputTokens = Math.ceil((systemTokens + userTokens) * 1.5); // Estimate
  
  return calculateLLMCost(model, systemTokens + userTokens, expectedOutputTokens);
}
```

### 2. Component Integration

For UI components:

```tsx
import { useLLMPricing } from '@/hooks/useLLMPricing';

function PromptEditor() {
  const [prompt, setPrompt] = useState('');
  const { estimateTokenCount, calculateCost, currentModel } = useLLMPricing();
  
  const tokenCount = estimateTokenCount(prompt);
  const estimatedCost = calculateCost(tokenCount, tokenCount * 1.5);
  
  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt here..."
      />
      <div className="stats">
        <p>Tokens: {tokenCount}</p>
        <p>Estimated Cost: ${estimatedCost.optimizedCost.toFixed(4)}</p>
      </div>
    </div>
  );
}
```

### 3. Cost Monitoring

For tracking API usage:

```typescript
import { LLMUsageTracker } from '@/utils/llm-pricing-calculator';

// Create a global tracker instance
const globalTracker = new LLMUsageTracker();

// Instrument API calls
async function callLLMAPI(prompt: string, model: string) {
  const startTime = Date.now();
  const inputTokens = estimateTokens(prompt);
  
  try {
    const response = await apiClient.complete({
      model,
      prompt,
      max_tokens: 1000
    });
    
    // Record usage for cost tracking
    globalTracker.recordUsage(
      model,
      inputTokens,
      response.usage.completion_tokens
    );
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Report usage statistics
function generateMonthlyReport() {
  const stats = globalTracker.getUsageStats(30);
  const recommendations = globalTracker.getOptimizationRecommendations();
  
  return {
    totalCost: stats.totalCost,
    totalCalls: stats.totalCalls,
    projectedMonthlyCost: stats.projectedMonthlyCost,
    modelBreakdown: stats.modelBreakdown,
    recommendedOptimizations: recommendations
  };
}
```

## Performance Considerations

### Memoization

The hook uses `useCallback` to memoize calculation functions for better performance:

```typescript
const calculateCost = useCallback((
  inputTokens: number, 
  outputTokens: number,
  options?: any
) => {
  // Implementation
}, [currentModel, useCaching, useBatchProcessing]);
```

### Token Estimation

Token counting is approximated for UI responsiveness:

```typescript
const estimateTokenCount = useCallback((text: string): number => {
  // Average English words are ~1.3 tokens
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount * 1.3);
}, []);
```

For production accuracy, consider implementing:
1. Language-specific token counting models
2. BPE tokenizer integration (similar to tiktoken)
3. Pre-computed lookup tables for common patterns

## Extension Points

### 1. Custom Model Registry

Extend the `MODEL_REGISTRY` with additional models:

```typescript
// Add Anthropic Claude models
MODEL_REGISTRY['claude-3-opus'] = {
  rates: { input: 15.00, output: 75.00 },
  features: {
    promptCaching: false,
    cachingDiscount: 0,
    batchProcessing: false,
    batchDiscount: 0,
    maxContextSize: 200000,
    truncationPenalty: 1.0
  }
};
```

### 2. Advanced Optimization Rules

Add model-specific optimization rules:

```typescript
function applyAdvancedOptimizations(model: string, cost: number) {
  // Volume discounts
  if (getMonthlyVolume() > 1000000) {
    cost *= 0.9; // 10% volume discount
  }
  
  // Special model-specific rules
  if (model.includes('gpt-4-32k')) {
    // Optimize large context window usage
    const utilizationRatio = getContextUtilization();
    if (utilizationRatio < 0.5) {
      return {
        cost,
        warning: "Consider using a smaller context model - current utilization is low"
      };
    }
  }
  
  return { cost };
}
```

### 3. Integration with Backend Cost Management

Create a server-side endpoint for cost tracking:

```typescript
// API endpoint for recording usage
app.post('/api/llm/usage', (req, res) => {
  const { model, inputTokens, outputTokens, timestamp, requestId } = req.body;
  
  // Record to database
  db.recordUsage({
    requestId,
    model,
    inputTokens,
    outputTokens,
    timestamp: new Date(timestamp),
    cost: calculateLLMCost(model, inputTokens, outputTokens).baseCost
  });
  
  res.status(200).json({ success: true });
});
```

## Testing Strategy

The pricing calculator can be tested with:

1. **Unit Tests**: Verify calculation accuracy
   ```typescript
   test('calculates base cost correctly', () => {
     const result = calculateLLMCost('gpt-4.1', 1000, 2000);
     expect(result.baseCost).toBeCloseTo(18.0, 5);
   });
   ```

2. **Property Tests**: Verify calculation invariants
   ```typescript
   test('optimized cost is always <= base cost', () => {
     for (let i = 0; i < 100; i++) {
       const inputTokens = Math.floor(Math.random() * 5000);
       const outputTokens = Math.floor(Math.random() * 5000);
       const result = calculateLLMCost('gpt-4.1', inputTokens, outputTokens, { 
         useCache: true, 
         useBatch: true 
       });
       
       expect(result.optimizedCost).toBeLessThanOrEqual(result.baseCost);
     }
   });
   ```

3. **Snapshot Tests**: Verify UI rendering
   ```typescript
   test('renders pricing panel correctly', () => {
     const { asFragment } = render(<LLMPricingPanel />);
     expect(asFragment()).toMatchSnapshot();
   });
   ```

## Conclusion

The LLM Pricing Optimizer provides a comprehensive solution for calculating, monitoring, and optimizing LLM usage costs in the Pulser system. By integrating the utility, hook, and UI components, developers can provide transparent cost information and optimization recommendations to users.

This implementation is designed to be:

- **Extensible**: Support for new models and pricing structures
- **Accurate**: Precise calculations based on token usage and model rates
- **Performant**: Optimized for UI responsiveness and large-scale usage tracking
- **User-friendly**: Clear visualizations and actionable recommendations

For future enhancements, consider:
- Integration with actual tokenizers for precise token counting
- API integration with OpenAI/Anthropic billing endpoints
- Automated optimization suggestions based on usage patterns
- Budget management features with alerts and limits