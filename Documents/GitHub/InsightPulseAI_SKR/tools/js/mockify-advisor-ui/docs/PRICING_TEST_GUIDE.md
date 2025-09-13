# LLM Pricing Calculator Test Guide

This document outlines the testing framework for the LLM Pricing Calculator component, providing guidelines for test creation, validation, and extension.

## Overview

The LLM Pricing Calculator Test Suite allows developers and QA engineers to:

1. Validate cost calculations across different models
2. Test optimization features (caching, batch processing)
3. Verify edge case handling
4. Create custom test scenarios
5. Generate comprehensive test reports

This testing infrastructure ensures that the pricing calculator provides accurate and reliable cost estimates for LLM API usage.

## Test Suite Components

### 1. LLMPricingTester

The `LLMPricingTester` component provides a user interface for running predefined test suites and custom tests against the pricing calculator. Features include:

- Test suite selection and execution
- Individual test case inspection
- Detailed test results with pass/fail indicators
- Custom test case creation
- Test report generation
- Visual feedback for errors and edge cases

### 2. Predefined Test Suites

The system includes several test suites targeting different aspects of the pricing calculator:

#### Basic Cost Calculation

Verifies base cost calculations for different models without optimizations.

```typescript
{
  name: 'Basic Cost Calculation',
  description: 'Verifies the base cost calculations for different models',
  testCases: [
    {
      id: 'basic-gpt41',
      description: 'GPT-4.1 with 1000 input and 2000 output tokens',
      model: 'gpt-4.1',
      inputTokens: 1000,
      outputTokens: 2000,
      expectedResults: {
        baseCost: 18.0,
        optimizedCost: 18.0,
        savingsPercentage: 0
      }
    },
    // More test cases...
  ]
}
```

#### Optimization Features

Tests the pricing calculator's optimization capabilities including prompt caching and batch processing.

```typescript
{
  name: 'Optimization Features',
  description: 'Tests the optimization features like caching and batch processing',
  testCases: [
    {
      id: 'opt-caching',
      description: 'GPT-4.1 with prompt caching enabled',
      model: 'gpt-4.1',
      inputTokens: 1000,
      outputTokens: 2000,
      options: {
        useCache: true
      },
      expectedResults: {
        baseCost: 18.0,
        optimizedCost: 4.5,  // 75% discount
        savingsPercentage: 75
      }
    },
    // More test cases...
  ]
}
```

#### Edge Cases

Verifies calculator behavior in extreme or unusual scenarios.

```typescript
{
  name: 'Edge Cases',
  description: 'Tests edge cases like very large token counts and context limits',
  testCases: [
    {
      id: 'edge-zero-tokens',
      description: 'Zero tokens should result in zero cost',
      model: 'gpt-4.1',
      inputTokens: 0,
      outputTokens: 0,
      expectedResults: {
        baseCost: 0,
        optimizedCost: 0,
        savingsPercentage: 0
      }
    },
    // More test cases...
  ]
}
```

#### Model Aliases

Tests model name normalization and alias resolution.

```typescript
{
  name: 'Model Aliases',
  description: 'Tests model name normalization and aliases',
  testCases: [
    {
      id: 'alias-gpt4-turbo',
      description: 'gpt-4-turbo should match gpt-4.1',
      model: 'gpt-4-turbo',
      inputTokens: 1000,
      outputTokens: 1000,
      expectedResults: {
        baseCost: 10,  // Same as gpt-4.1
        optimizedCost: 10,
        savingsPercentage: 0
      }
    },
    // More test cases...
  ]
}
```

### 3. Custom Test Feature

The test suite also includes a custom testing interface that allows users to:

- Select any model (including aliases)
- Set input and output token counts
- Toggle optimization features
- View detailed calculation results
- See token math formula with real values
- Check for any warnings or issues

## Running Tests

### Predefined Test Suites

To run a predefined test suite:

1. Go to the LLM Pricing Test page
2. Switch to the "Test Suite" tab
3. Select a test suite from the dropdown
4. Click "Run Test Suite"
5. View results for each test case
6. Click "Export Test Report" to download a Markdown report

### Custom Tests

To create and run a custom test:

1. Go to the LLM Pricing Test page
2. Switch to the "Test Suite" tab
3. Select the "Custom Test" tab
4. Configure the model, token counts, and optimization settings
5. Click "Calculate Cost"
6. Review the detailed results

## Test Case Structure

Each test case includes:

```typescript
interface TestCase {
  id: string;                  // Unique identifier
  description: string;         // Human-readable description
  model: string;               // Model identifier (e.g., 'gpt-4.1')
  inputTokens: number;         // Number of input tokens
  outputTokens: number;        // Number of output tokens
  options?: {                  // Optional parameters
    useCache?: boolean;        // Enable prompt caching
    useBatch?: boolean;        // Enable batch processing
    sessionTokens?: number;    // Total session token count
  };
  expectedResults: {           // Expected calculation results
    baseCost: number;          // Base cost without optimizations
    optimizedCost: number;     // Cost after optimizations
    savingsPercentage: number; // Savings percentage
    hasWarnings?: boolean;     // Whether warnings are expected
  };
}
```

## Adding New Test Suites

To extend the test suite with additional test cases:

1. Add a new entry to the `TEST_SUITES` array in `LLMPricingTester.tsx`:

```typescript
const TEST_SUITES: TestSuite[] = [
  // Existing test suites...
  
  {
    name: 'New Test Suite',
    description: 'Description of the new test suite',
    testCases: [
      {
        id: 'new-test-1',
        description: 'Description of the test case',
        model: 'model-name',
        inputTokens: 1000,
        outputTokens: 2000,
        options: {
          // Optional parameters
        },
        expectedResults: {
          baseCost: 10.0,
          optimizedCost: 5.0,
          savingsPercentage: 50
        }
      },
      // More test cases...
    ]
  }
]
```

## Test Report Format

The test report is generated in Markdown format and includes:

- Test suite name and description
- Date and time of test execution
- Overall pass/fail count
- Detailed results for each test case
- Expected vs. actual values for each measurement
- Warnings and error messages

Example:

```markdown
# LLM Pricing Calculator Test Report

Test Suite: Basic Cost Calculation
Description: Verifies the base cost calculations for different models
Date: May 16, 2025, 10:30:45 AM
Result: 3/3 tests passed

## Test Results

### GPT-4.1 with 1000 input and 2000 output tokens
Status: PASSED
Model: gpt-4.1
Input Tokens: 1000
Output Tokens: 2000

Expected:
- Base Cost: $18.0000
- Optimized Cost: $18.0000
- Savings: 0.0%

Actual:
- Base Cost: $18.0000
- Optimized Cost: $18.0000
- Savings: 0.0%
- Has Warnings: false

---
```

## Validation Rules

The test suite applies the following validation rules when determining if a test passes:

1. **Base Cost**: Must match expected value with a tolerance of ±0.001
2. **Optimized Cost**: Must match expected value with a tolerance of ±0.001
3. **Savings Percentage**: Must match expected value with a tolerance of ±0.1%
4. **Warnings**: Must match expected warning presence (if specified)

## Future Improvements

Planned enhancements for the test suite:

1. **Batch Test Execution**: Run multiple test suites simultaneously
2. **Performance Testing**: Measure calculation speed for large-scale usage
3. **Visual Regression**: Compare results against baseline snapshots
4. **CI Integration**: Automated testing in the CI/CD pipeline
5. **Coverage Analysis**: Track which models and features are tested
6. **Fuzzing**: Generate random inputs to find edge cases

## Troubleshooting

### Common Issues

1. **Test Failures Due to Rounding**
   - Ensure expected values account for JavaScript floating-point precision
   - Use tolerance values in comparisons (already implemented)

2. **Model Alias Resolution**
   - Verify model aliases are up-to-date in the MODEL_REGISTRY
   - Check the normalizeModelName function if alias tests fail

3. **Missing Models**
   - Ensure all models referenced in tests exist in MODEL_REGISTRY

## Conclusion

The LLM Pricing Calculator Test Suite provides comprehensive testing of pricing calculations, ensuring that cost estimates remain accurate as the calculator evolves. By maintaining and extending these tests, we can guarantee reliable cost projections for Pulser's LLM usage.