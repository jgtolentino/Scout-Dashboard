/**
 * LLM Pricing Calculator for Pulser Runtime Profiler
 * 
 * Provides utilities for calculating and optimizing LLM costs
 * based on token usage and model selection.
 */

// Model pricing per 1K tokens
export type ModelRates = {
  input: number;  // Cost per 1K input tokens
  output: number; // Cost per 1K output tokens
};

// Optimization strategies supported by model
export type OptimizationFeatures = {
  promptCaching: boolean;     // Supports prompt caching
  cachingDiscount: number;    // Discount percentage when caching is applied
  batchProcessing: boolean;   // Supports batch API processing
  batchDiscount: number;      // Discount percentage for batch processing
  maxContextSize: number;     // Maximum context size in tokens
  truncationPenalty: number;  // Additional cost factor if truncation is needed
};

// Model registry with pricing information
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
  
  'gpt-4-1106-nano': {
    rates: { input: 0.10, output: 0.40 },
    features: {
      promptCaching: true,
      cachingDiscount: 0.75,
      batchProcessing: true,
      batchDiscount: 0.5,
      maxContextSize: 128000,
      truncationPenalty: 1.2
    },
    alias: ['gpt-4.1-nano', 'gpt-4-turbo-nano']
  },
  
  'gpt-4o-mini': {
    rates: { input: 0.15, output: 0.60 },
    features: {
      promptCaching: true,
      cachingDiscount: 0.7,
      batchProcessing: true,
      batchDiscount: 0.5,
      maxContextSize: 128000,
      truncationPenalty: 1.2
    }
  },
  
  'gpt-3.5-turbo': {
    rates: { input: 0.50, output: 1.50 },
    features: {
      promptCaching: true,
      cachingDiscount: 0.6,
      batchProcessing: true,
      batchDiscount: 0.4,
      maxContextSize: 16000,
      truncationPenalty: 1.5
    }
  },
  
  'claude-3-opus': {
    rates: { input: 15.00, output: 75.00 },
    features: {
      promptCaching: false,
      cachingDiscount: 0,
      batchProcessing: false,
      batchDiscount: 0,
      maxContextSize: 200000,
      truncationPenalty: 1.0
    },
    alias: ['claude-3-opus-20240229', 'claude-opus']
  },
  
  'claude-3-sonnet': {
    rates: { input: 3.00, output: 15.00 },
    features: {
      promptCaching: false,
      cachingDiscount: 0,
      batchProcessing: false,
      batchDiscount: 0,
      maxContextSize: 200000,
      truncationPenalty: 1.0
    },
    alias: ['claude-3-sonnet-20240229', 'claude-sonnet']
  },
  
  'claude-3-haiku': {
    rates: { input: 0.25, output: 1.25 },
    features: {
      promptCaching: false,
      cachingDiscount: 0,
      batchProcessing: false,
      batchDiscount: 0,
      maxContextSize: 200000,
      truncationPenalty: 1.0
    },
    alias: ['claude-3-haiku-20240307', 'claude-haiku']
  },
  
  'o-series-reasoning': {
    rates: { input: 1.10, output: 60.00 },
    features: {
      promptCaching: false,
      cachingDiscount: 0,
      batchProcessing: false,
      batchDiscount: 0,
      maxContextSize: 32000,
      truncationPenalty: 2.0
    },
    alias: ['anthropic-o1-reasoning']
  }
};

/**
 * Calculate LLM API cost based on token usage
 * 
 * @param model Model identifier
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @param options Optional settings for optimizations
 * @returns Calculated cost and optimization details
 */
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
  // Normalize model name and get pricing data
  const modelKey = normalizeModelName(model);
  const modelData = MODEL_REGISTRY[modelKey];
  
  if (!modelData) {
    throw new Error(`Unknown model: ${model}`);
  }
  
  const { rates, features } = modelData;
  const { useCache = false, useBatch = false, sessionTokens } = options || {};
  
  // Calculate base cost
  const baseCost = ((inputTokens * rates.input) + (outputTokens * rates.output)) / 1000;
  
  // Initialize optimization tracking
  let optimizedCost = baseCost;
  const optimizations: string[] = [];
  const warnings: string[] = [];
  
  // Apply caching discount if applicable
  if (useCache && features.promptCaching) {
    optimizedCost *= (1 - features.cachingDiscount);
    optimizations.push(`Prompt caching: ${features.cachingDiscount * 100}% saved`);
  }
  
  // Apply batch processing discount if applicable
  if (useBatch && features.batchProcessing) {
    optimizedCost *= (1 - features.batchDiscount);
    optimizations.push(`Batch processing: ${features.batchDiscount * 100}% saved`);
  }
  
  // Check for potential context truncation
  if (sessionTokens && sessionTokens > features.maxContextSize) {
    const truncationPercent = ((sessionTokens - features.maxContextSize) / sessionTokens) * 100;
    warnings.push(
      `Session exceeds context limit (${sessionTokens}/${features.maxContextSize} tokens). ` +
      `Approximately ${truncationPercent.toFixed(1)}% of context will be truncated.`
    );
    
    // Suggest alternative models with larger context
    const largerContextModels = Object.entries(MODEL_REGISTRY)
      .filter(([_, data]) => data.features.maxContextSize > features.maxContextSize)
      .map(([key, _]) => key);
    
    if (largerContextModels.length > 0) {
      warnings.push(`Consider using models with larger context: ${largerContextModels.join(', ')}`);
    }
  }
  
  // Calculate savings
  const savings = baseCost - optimizedCost;
  const savingsPercentage = (savings / baseCost) * 100;
  
  return {
    baseCost,
    optimizedCost,
    savings,
    savingsPercentage,
    optimizations,
    warnings
  };
}

/**
 * Normalize model name to match registry keys
 */
function normalizeModelName(model: string): string {
  // Direct match
  if (MODEL_REGISTRY[model]) {
    return model;
  }
  
  // Check aliases
  for (const [key, data] of Object.entries(MODEL_REGISTRY)) {
    if (data.alias && data.alias.includes(model)) {
      return key;
    }
  }
  
  // Default to most similar name
  return findClosestModelName(model);
}

/**
 * Find the closest matching model name in registry
 */
function findClosestModelName(model: string): string {
  const modelLower = model.toLowerCase();
  
  // Check for partial matches
  if (modelLower.includes('gpt-4.1') || modelLower.includes('gpt-4-1') || modelLower.includes('gpt4-turbo')) {
    return 'gpt-4-1106-preview';
  }
  
  if (modelLower.includes('nano')) {
    return 'gpt-4-1106-nano';
  }
  
  if (modelLower.includes('gpt-4o') || modelLower.includes('gpt4o')) {
    return 'gpt-4o-mini';
  }
  
  if (modelLower.includes('gpt-3.5') || modelLower.includes('gpt3.5')) {
    return 'gpt-3.5-turbo';
  }
  
  // Claude 3 model matching
  if (modelLower.includes('claude-3-opus') || modelLower.includes('claude-opus')) {
    return 'claude-3-opus';
  }
  
  if (modelLower.includes('claude-3-sonnet') || modelLower.includes('claude-sonnet')) {
    return 'claude-3-sonnet';
  }
  
  if (modelLower.includes('claude-3-haiku') || modelLower.includes('claude-haiku')) {
    return 'claude-3-haiku';
  }
  
  if (modelLower.includes('o-series') || modelLower.includes('anthropic')) {
    return 'o-series-reasoning';
  }
  
  // Default to the most reasonable option
  return 'gpt-4-1106-preview';
}

/**
 * Compare costs across different models for same token usage
 */
export function compareModelCosts(
  inputTokens: number,
  outputTokens: number,
  options?: {
    useCache?: boolean;
    useBatch?: boolean;
  }
): Array<{
  model: string;
  baseCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
}> {
  return Object.keys(MODEL_REGISTRY).map(model => {
    const result = calculateLLMCost(model, inputTokens, outputTokens, options);
    return {
      model,
      baseCost: result.baseCost,
      optimizedCost: result.optimizedCost,
      savings: result.savings,
      savingsPercentage: result.savingsPercentage
    };
  }).sort((a, b) => a.optimizedCost - b.optimizedCost);
}

/**
 * Recommend the most cost-effective model based on token usage
 */
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
  const { requireFeatures = [], minContextSize = 0 } = options || {};
  
  // Filter models based on requirements
  const eligibleModels = Object.entries(MODEL_REGISTRY)
    .filter(([_, data]) => {
      // Check required features
      const hasRequiredFeatures = requireFeatures.every(feature => 
        data.features[feature] === true
      );
      
      // Check context size
      const hasSufficientContext = data.features.maxContextSize >= minContextSize;
      
      return hasRequiredFeatures && hasSufficientContext;
    })
    .map(([key, _]) => key);
  
  if (eligibleModels.length === 0) {
    throw new Error('No models meet the specified requirements');
  }
  
  // Compare costs of eligible models
  const modelComparisons = eligibleModels.map(model => {
    const result = calculateLLMCost(model, inputTokens, outputTokens, options);
    return {
      model,
      cost: result.optimizedCost,
      baseCost: result.baseCost,
      savings: result.savings
    };
  }).sort((a, b) => a.cost - b.cost);
  
  // Get the cheapest option
  const recommended = modelComparisons[0];
  
  // Generate reasoning
  let reasoning = `${recommended.model} offers the lowest cost (${formatCurrency(recommended.cost)}) for your usage pattern of ${inputTokens} input and ${outputTokens} output tokens.`;
  
  if (recommended.savings > 0) {
    reasoning += ` With optimizations, you save ${formatCurrency(recommended.savings)} (${((recommended.savings / recommended.baseCost) * 100).toFixed(1)}%).`;
  }
  
  // Check if a more powerful model is only marginally more expensive
  if (modelComparisons.length > 1) {
    const nextModel = modelComparisons[1];
    const costDifference = nextModel.cost - recommended.cost;
    const percentDifference = (costDifference / recommended.cost) * 100;
    
    if (percentDifference < 25) {
      reasoning += ` Consider ${nextModel.model} for only ${formatCurrency(costDifference)} more (${percentDifference.toFixed(1)}% increase) with potentially better quality.`;
    }
  }
  
  return {
    recommendedModel: recommended.model,
    cost: recommended.cost,
    reasoning
  };
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

/**
 * Budget alert settings
 */
export interface BudgetAlertSettings {
  dailyThreshold?: number;   // Maximum cost per day
  weeklyThreshold?: number;  // Maximum cost per week
  monthlyThreshold?: number; // Maximum cost per month
  alertPercentage?: number;  // Percentage of threshold to trigger warning (e.g., 80%)
  enabled: boolean;          // Whether budget alerts are enabled
}

/**
 * Budget alert status
 */
export interface BudgetAlertStatus {
  dailyStatus: {
    cost: number;
    threshold: number;
    percentUsed: number;
    isWarning: boolean;
    isExceeded: boolean;
  };
  weeklyStatus: {
    cost: number;
    threshold: number;
    percentUsed: number;
    isWarning: boolean;
    isExceeded: boolean;
  };
  monthlyStatus: {
    cost: number;
    threshold: number;
    percentUsed: number;
    isWarning: boolean;
    isExceeded: boolean;
  };
  hasWarning: boolean;
  hasExceeded: boolean;
}

/**
 * Track usage and predict monthly costs based on current patterns
 */
export class LLMUsageTracker {
  private history: Array<{
    timestamp: Date;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }> = [];
  
  private budgetSettings: BudgetAlertSettings = {
    dailyThreshold: 25, // $25 per day
    weeklyThreshold: 100, // $100 per week
    monthlyThreshold: 300, // $300 per month
    alertPercentage: 80, // Alert at 80% of threshold
    enabled: false
  };
  
  /**
   * Record a new API call
   */
  recordUsage(
    model: string,
    inputTokens: number,
    outputTokens: number,
    options?: {
      useCache?: boolean;
      useBatch?: boolean;
    }
  ): { cost: number; budgetStatus?: BudgetAlertStatus } {
    const result = calculateLLMCost(model, inputTokens, outputTokens, options);
    
    const entry = {
      timestamp: new Date(),
      model,
      inputTokens,
      outputTokens,
      cost: result.optimizedCost
    };
    
    this.history.push(entry);
    
    // Check budget status if enabled
    let budgetStatus: BudgetAlertStatus | undefined;
    if (this.budgetSettings.enabled) {
      budgetStatus = this.checkBudgetStatus();
    }
    
    return {
      cost: result.optimizedCost,
      budgetStatus
    };
  }
  
  /**
   * Get usage statistics
   */
  getUsageStats(days: number = 30): {
    totalCost: number;
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    avgCostPerCall: number;
    modelBreakdown: Record<string, {
      calls: number;
      cost: number;
      percentage: number;
    }>;
    dailyAverage: number;
    projectedMonthlyCost: number;
  } {
    const now = new Date();
    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const recentHistory = this.history.filter(entry => entry.timestamp >= cutoff);
    
    if (recentHistory.length === 0) {
      return {
        totalCost: 0,
        totalCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        avgCostPerCall: 0,
        modelBreakdown: {},
        dailyAverage: 0,
        projectedMonthlyCost: 0
      };
    }
    
    // Calculate total metrics
    const totalCost = recentHistory.reduce((sum, entry) => sum + entry.cost, 0);
    const totalCalls = recentHistory.length;
    const totalInputTokens = recentHistory.reduce((sum, entry) => sum + entry.inputTokens, 0);
    const totalOutputTokens = recentHistory.reduce((sum, entry) => sum + entry.outputTokens, 0);
    
    // Calculate model breakdown
    const modelBreakdown: Record<string, { calls: number; cost: number; percentage: number }> = {};
    
    recentHistory.forEach(entry => {
      if (!modelBreakdown[entry.model]) {
        modelBreakdown[entry.model] = { calls: 0, cost: 0, percentage: 0 };
      }
      
      modelBreakdown[entry.model].calls += 1;
      modelBreakdown[entry.model].cost += entry.cost;
    });
    
    // Calculate percentages
    Object.keys(modelBreakdown).forEach(model => {
      modelBreakdown[model].percentage = (modelBreakdown[model].cost / totalCost) * 100;
    });
    
    // Calculate daily average and projected costs
    const oldestTimestamp = Math.min(...recentHistory.map(entry => entry.timestamp.getTime()));
    const daysCovered = Math.max(1, (now.getTime() - oldestTimestamp) / (24 * 60 * 60 * 1000));
    const dailyAverage = totalCost / daysCovered;
    const projectedMonthlyCost = dailyAverage * 30;
    
    return {
      totalCost,
      totalCalls,
      totalInputTokens,
      totalOutputTokens,
      avgCostPerCall: totalCost / totalCalls,
      modelBreakdown,
      dailyAverage,
      projectedMonthlyCost
    };
  }
  
  /**
   * Get optimization recommendations based on usage patterns
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getUsageStats();
    
    if (stats.totalCalls < 10) {
      return ["Not enough usage data to provide recommendations."];
    }
    
    // Check for potential caching opportunities
    const shortTimeframeCalls = this.findRepeatedCallsInTimeframe(3600000); // 1 hour
    if (shortTimeframeCalls > 0.2 * stats.totalCalls) {
      recommendations.push(
        "Consider implementing prompt caching. You have significant repeated calls " +
        "within short timeframes that could benefit from caching (up to 75% savings)."
      );
    }
    
    // Check for batch processing opportunities
    const sequentialSimilarCalls = this.findSequentialSimilarCalls();
    if (sequentialSimilarCalls > 0.1 * stats.totalCalls) {
      recommendations.push(
        "Consider using batch processing for similar sequential calls. " +
        "You could save up to 50% on these requests."
      );
    }
    
    // Check for model mix optimization
    if (Object.keys(stats.modelBreakdown).length > 1) {
      const expensiveModelCalls = Object.entries(stats.modelBreakdown)
        .filter(([model, _]) => model.includes('gpt-4') && !model.includes('nano'))
        .reduce((sum, [_, data]) => sum + data.calls, 0);
      
      if (expensiveModelCalls > 0.5 * stats.totalCalls) {
        recommendations.push(
          "Consider using more cost-effective models like GPT-4.1-nano or GPT-4o-mini " +
          "for simpler tasks. Your usage shows heavy reliance on expensive models."
        );
      }
    }
    
    // Check for very long contexts
    const avgTokensPerCall = (stats.totalInputTokens + stats.totalOutputTokens) / stats.totalCalls;
    if (avgTokensPerCall > 8000) {
      recommendations.push(
        "Your average tokens per call is high. Consider breaking down large requests " +
        "or using GPT-4.1 which has 128K token support for long contexts."
      );
    }
    
    return recommendations.length > 0 ? recommendations : ["No optimization opportunities identified."];
  }
  
  /**
   * Find calls that could benefit from caching (repeated within timeframe)
   */
  private findRepeatedCallsInTimeframe(timeframeMs: number): number {
    let repeatedCalls = 0;
    
    for (let i = 0; i < this.history.length; i++) {
      const call = this.history[i];
      
      // Look for similar calls within timeframe
      const similarCalls = this.history.filter((otherCall, index) => {
        if (index === i) return false;
        
        const timeDiff = Math.abs(otherCall.timestamp.getTime() - call.timestamp.getTime());
        return (
          timeDiff <= timeframeMs &&
          otherCall.model === call.model &&
          Math.abs(otherCall.inputTokens - call.inputTokens) < 100
        );
      });
      
      if (similarCalls.length > 0) {
        repeatedCalls++;
      }
    }
    
    return repeatedCalls;
  }
  
  /**
   * Find sequential similar calls that could be batched
   */
  private findSequentialSimilarCalls(): number {
    let batchableCalls = 0;
    
    // Sort history by timestamp
    const sortedHistory = [...this.history].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    for (let i = 0; i < sortedHistory.length - 1; i++) {
      const currentCall = sortedHistory[i];
      const nextCall = sortedHistory[i + 1];
      
      // Check if calls are within 5 seconds and use same model
      const timeDiff = nextCall.timestamp.getTime() - currentCall.timestamp.getTime();
      if (
        timeDiff <= 5000 && 
        nextCall.model === currentCall.model
      ) {
        batchableCalls++;
      }
    }
    
    return batchableCalls;
  }
  
  /**
   * Clear usage history
   */
  clearHistory(): void {
    this.history = [];
  }
  
  /**
   * Configure budget alert settings
   */
  setBudgetAlertSettings(settings: Partial<BudgetAlertSettings>): void {
    this.budgetSettings = {
      ...this.budgetSettings,
      ...settings
    };
  }
  
  /**
   * Get current budget alert settings
   */
  getBudgetAlertSettings(): BudgetAlertSettings {
    return { ...this.budgetSettings };
  }
  
  /**
   * Check if current usage exceeds budget thresholds
   */
  checkBudgetStatus(): BudgetAlertStatus {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const dailyCost = this.history
      .filter(entry => entry.timestamp >= oneDayAgo)
      .reduce((sum, entry) => sum + entry.cost, 0);
      
    const weeklyCost = this.history
      .filter(entry => entry.timestamp >= oneWeekAgo)
      .reduce((sum, entry) => sum + entry.cost, 0);
      
    const monthlyCost = this.history
      .filter(entry => entry.timestamp >= oneMonthAgo)
      .reduce((sum, entry) => sum + entry.cost, 0);
    
    const { dailyThreshold = 25, weeklyThreshold = 100, monthlyThreshold = 300, alertPercentage = 80 } = this.budgetSettings;
    
    const dailyPercentUsed = (dailyCost / dailyThreshold) * 100;
    const weeklyPercentUsed = (weeklyCost / weeklyThreshold) * 100;
    const monthlyPercentUsed = (monthlyCost / monthlyThreshold) * 100;
    
    const dailyStatus = {
      cost: dailyCost,
      threshold: dailyThreshold,
      percentUsed: dailyPercentUsed,
      isWarning: dailyPercentUsed >= alertPercentage && dailyPercentUsed < 100,
      isExceeded: dailyPercentUsed >= 100
    };
    
    const weeklyStatus = {
      cost: weeklyCost,
      threshold: weeklyThreshold,
      percentUsed: weeklyPercentUsed,
      isWarning: weeklyPercentUsed >= alertPercentage && weeklyPercentUsed < 100,
      isExceeded: weeklyPercentUsed >= 100
    };
    
    const monthlyStatus = {
      cost: monthlyCost,
      threshold: monthlyThreshold,
      percentUsed: monthlyPercentUsed,
      isWarning: monthlyPercentUsed >= alertPercentage && monthlyPercentUsed < 100,
      isExceeded: monthlyPercentUsed >= 100
    };
    
    const hasWarning = dailyStatus.isWarning || weeklyStatus.isWarning || monthlyStatus.isWarning;
    const hasExceeded = dailyStatus.isExceeded || weeklyStatus.isExceeded || monthlyStatus.isExceeded;
    
    return {
      dailyStatus,
      weeklyStatus,
      monthlyStatus,
      hasWarning,
      hasExceeded
    };
  }
}