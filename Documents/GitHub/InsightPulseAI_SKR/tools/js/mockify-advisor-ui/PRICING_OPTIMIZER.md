# LLM Pricing Optimizer for Pulser

![LLM Pricing Calculator](https://via.placeholder.com/800x400/0078D4/FFFFFF/?text=LLM+Pricing+Calculator)

## Overview

The LLM Pricing Optimizer provides tools to calculate, monitor, and optimize costs when working with large language models in the Pulser runtime. This document outlines the implementation and usage of these utilities.

## Quick Links

- [Features](#features)
- [Pricing Reference](#pricing-reference)
- [Implementation Details](#implementation-details)
- [Usage Examples](#usage-examples)
- [Integration Guide](#integration-guide)
- [Optimization Strategies](#optimization-strategies)

## Features

The LLM Pricing Optimizer includes:

* **Interactive Calculator**: Real-time cost estimation based on token usage
* **Model Comparison**: Side-by-side cost analysis across different models
* **Optimization Tools**: Support for caching and batch processing with cost savings
* **Usage Tracking**: Monitor API calls and projected costs
* **Recommendation Engine**: Get personalized optimization suggestions

## Pricing Reference

### LLM Model Pricing Summary (per 1K tokens)

| Model | Input | Output |
|-------|-------|--------|
| GPT-4.1 | $2.00 | $8.00 |
| GPT-4.1 nano | $0.10 | $0.40 |
| GPT-4o mini | $0.15 | $0.60 |
| GPT-3.5 Turbo | $0.50 | $1.50 |
| o-series (reasoning) | $1.10 | $60.00 |

### Cost Formula

```
[(Input tokens × rate) + (Output tokens × rate)] ÷ 1,000
```

**Example:**
200 input + 900 output with GPT-4o mini = (200 × $0.15 + 900 × $0.60) ÷ 1000 = approx $0.59

## Implementation Details

### 1. LLM Pricing Calculator Utility

The core calculator utility (`llm-pricing-calculator.ts`) provides:

* **Model Registry**: Comprehensive pricing data for all supported models
* **Cost Calculation**: Functions to calculate costs based on token usage
* **Optimization Features**: Support for prompt caching and batch processing
* **Cost Comparison**: Tools to compare costs across different models
* **Model Recommendations**: AI-driven model selection based on use case
* **Usage Tracking**: System to monitor and project LLM usage costs

```typescript
// Example: Calculate cost with optimizations
const result = calculateLLMCost(
  'gpt-4.1', 
  1000,   // input tokens
  2000,   // output tokens
  {
    useCache: true,
    useBatch: true
  }
);
```

### 2. React Hook

A custom `useLLMPricing` hook (`useLLMPricing.ts`) provides:

* State management for model selection
* Token count estimation utilities
* Cost calculation with current settings
* Usage tracking and statistics
* Optimization recommendations

```typescript
// Example: Using the hook in a component
const {
  calculateCost,
  compareModels,
  getRecommendedModel,
  currentModel,
  setCurrentModel,
  useCaching,
  setUseCaching
} = useLLMPricing();
```

### 3. UI Component

The `LLMPricingPanel` component provides an interactive interface with:

* Token input controls
* Model selection dropdown
* Optimization toggles
* Cost calculation results
* Model comparison table
* Usage statistics and charts
* Optimization recommendations

![LLM Pricing Panel UI](https://via.placeholder.com/600x400/0078D4/FFFFFF/?text=Interactive+Pricing+Panel)

### 4. Test Page

A dedicated test page at `/llm-pricing` showcases:

* Pricing reference tables
* Interactive calculator
* Cost optimization features
* Usage tracking demonstration
* Implementation tips

## Usage Examples

### Basic Cost Calculation

```typescript
import { calculateLLMCost } from '@/utils/llm-pricing-calculator';

// Calculate the cost of a GPT-4.1 request
const cost = calculateLLMCost(
  'gpt-4.1',
  500,    // input tokens
  1500,   // output tokens
);

console.log(`Base cost: $${cost.baseCost.toFixed(4)}`);
```

### Using the React Hook

```tsx
import { useLLMPricing } from '@/hooks/useLLMPricing';

function MyComponent() {
  const {
    calculateCost,
    currentModel,
    setCurrentModel,
    useCaching,
    setUseCaching
  } = useLLMPricing();
  
  const handleCalculate = () => {
    const result = calculateCost(
      inputTokens,
      outputTokens
    );
    
    setCalculatedCost(result.optimizedCost);
  };
  
  return (
    <div>
      <select
        value={currentModel}
        onChange={(e) => setCurrentModel(e.target.value)}
      >
        <option value="gpt-4-1106-preview">GPT-4.1</option>
        <option value="gpt-4o-mini">GPT-4o mini</option>
      </select>
      
      <label>
        <input
          type="checkbox"
          checked={useCaching}
          onChange={(e) => setUseCaching(e.target.checked)}
        />
        Enable Caching
      </label>
      
      <button onClick={handleCalculate}>
        Calculate Cost
      </button>
    </div>
  );
}
```

## Integration Guide

To integrate the LLM Pricing Optimizer into your project:

1. **Add the utility files:**
   - `src/utils/llm-pricing-calculator.ts`
   - `src/hooks/useLLMPricing.ts`
   - `src/components/advisor/LLMPricingPanel.tsx`

2. **Import and use the hook:**
   ```tsx
   import { useLLMPricing } from '@/hooks/useLLMPricing';
   
   function YourComponent() {
     const { calculateCost } = useLLMPricing();
     // ...
   }
   ```

3. **Add the panel component:**
   ```tsx
   import { LLMPricingPanel } from '@/components/advisor/LLMPricingPanel';
   
   function YourPage() {
     return (
       <div>
         <h1>LLM Cost Management</h1>
         <LLMPricingPanel />
       </div>
     );
   }
   ```

## Optimization Strategies

### 1. Prompt Caching

GPT-4.1 supports caching, providing up to 75% savings on repeated calls with similar inputs. Implement by:

* Enabling caching in API calls
* Setting up a local or distributed cache
* Storing processed results with appropriate TTL

### 2. Batch API Processing

Submit multiple requests as a batch operation to receive up to 50% discount. Useful for:

* Multiple similar processing tasks
* High-volume, non-interactive scenarios
* Background processing jobs

### 3. Long Context Handling

GPT-4.1 supports 128K tokens with no extra charge, ideal for:

* Full session memory retention
* Document processing without truncation
* Comprehensive context-aware operations

### 4. Model Selection Optimization

Use the right model for each task:

* **GPT-4.1 nano**: Simple tasks, classification, short responses
* **GPT-4o mini**: General-purpose tasks with moderate complexity
* **GPT-4.1**: Complex reasoning, creative generation, specialized domains
* **GPT-3.5 Turbo**: High-throughput, cost-sensitive operations

## Further Resources

For more information, see:

* [README.md](README.md#llm-pricing-calculator) - Project documentation
* [Theme & Accessibility Guide](theme-audit) - UI/UX standards
* [LLM Pricing Test Page](llm-pricing) - Interactive demonstration

## Screenshots

![Cost Calculator Tab](https://via.placeholder.com/400x300/0078D4/FFFFFF/?text=Cost+Calculator+Tab)
![Model Comparison Tab](https://via.placeholder.com/400x300/107c10/FFFFFF/?text=Model+Comparison+Tab)
![Usage Statistics Tab](https://via.placeholder.com/400x300/5c2d91/FFFFFF/?text=Usage+Statistics+Tab)
![Optimization Tips Tab](https://via.placeholder.com/400x300/FF8C00/FFFFFF/?text=Optimization+Tips+Tab)