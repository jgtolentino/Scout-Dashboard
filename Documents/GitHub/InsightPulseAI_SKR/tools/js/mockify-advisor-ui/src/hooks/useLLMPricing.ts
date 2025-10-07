import { useState, useEffect, useCallback } from 'react';
import { 
  calculateLLMCost, 
  compareModelCosts,
  recommendCostEffectiveModel,
  LLMUsageTracker,
  BudgetAlertSettings,
  BudgetAlertStatus
} from '@/utils/llm-pricing-calculator';
import { countTokens, estimateMessageTokens } from '@/utils/token-counter';

// Shared instance of the usage tracker
const globalUsageTracker = new LLMUsageTracker();

// Interface for LLM pricing hook
interface UseLLMPricingProps {
  defaultModel?: string;
  trackUsage?: boolean;
  autoOptimize?: boolean;
  budgetAlerts?: boolean;
  budgetSettings?: Partial<BudgetAlertSettings>;
}

// Result interface
interface LLMPricingResult {
  // Cost calculation functions
  calculateCost: (inputTokens: number, outputTokens: number, options?: any) => {
    baseCost: number;
    optimizedCost: number;
    savings: number;
    savingsPercentage: number;
    optimizations: string[];
    warnings: string[];
  };
  
  // Model comparison
  compareModels: (inputTokens: number, outputTokens: number, options?: any) => Array<{
    model: string;
    baseCost: number;
    optimizedCost: number;
    savings: number;
    savingsPercentage: number;
  }>;
  
  // Model recommendation
  getRecommendedModel: (inputTokens: number, outputTokens: number, options?: any) => {
    recommendedModel: string;
    cost: number;
    reasoning: string;
  };
  
  // Token count estimation
  estimateTokenCount: (text: string) => number;

  // Message exchange token estimation
  estimateMessageExchange: (systemMessage: string, userMessage: string) => {
    inputTokens: number;
    estimatedOutputTokens: number;
    total: number;
  };
  
  // Usage tracking
  recordUsage: (model: string, inputTokens: number, outputTokens: number, options?: any) => { cost: number; budgetStatus?: BudgetAlertStatus };
  getUsageStats: (days?: number) => {
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
  };
  
  // Optimization recommendations
  getOptimizationTips: () => string[];
  
  // Budget alerts
  getBudgetAlertSettings: () => BudgetAlertSettings;
  setBudgetAlertSettings: (settings: Partial<BudgetAlertSettings>) => void;
  checkBudgetStatus: () => BudgetAlertStatus | undefined;
  
  // Current model and settings
  currentModel: string;
  setCurrentModel: (model: string) => void;
  useCaching: boolean;
  setUseCaching: (value: boolean) => void;
  useBatchProcessing: boolean;
  setUseBatchProcessing: (value: boolean) => void;
}

/**
 * React hook for LLM pricing calculations and optimizations
 */
export function useLLMPricing({
  defaultModel = 'gpt-4-1106-preview',
  trackUsage = true,
  autoOptimize = true,
  budgetAlerts = false,
  budgetSettings = {}
}: UseLLMPricingProps = {}): LLMPricingResult {
  // State
  const [currentModel, setCurrentModel] = useState(defaultModel);
  const [useCaching, setUseCaching] = useState(autoOptimize);
  const [useBatchProcessing, setUseBatchProcessing] = useState(autoOptimize);
  
  // Calculate cost with current settings
  const calculateCost = useCallback((
    inputTokens: number, 
    outputTokens: number,
    options?: any
  ) => {
    const mergedOptions = {
      useCache: useCaching,
      useBatch: useBatchProcessing,
      ...options
    };
    
    return calculateLLMCost(currentModel, inputTokens, outputTokens, mergedOptions);
  }, [currentModel, useCaching, useBatchProcessing]);
  
  // Compare models
  const compareModels = useCallback((
    inputTokens: number, 
    outputTokens: number,
    options?: any
  ) => {
    const mergedOptions = {
      useCache: useCaching,
      useBatch: useBatchProcessing,
      ...options
    };
    
    return compareModelCosts(inputTokens, outputTokens, mergedOptions);
  }, [useCaching, useBatchProcessing]);
  
  // Get recommended model
  const getRecommendedModel = useCallback((
    inputTokens: number, 
    outputTokens: number,
    options?: any
  ) => {
    const mergedOptions = {
      useCache: useCaching,
      useBatch: useBatchProcessing,
      ...options
    };
    
    return recommendCostEffectiveModel(inputTokens, outputTokens, mergedOptions);
  }, [useCaching, useBatchProcessing]);
  
  // Enhanced token counting
  const estimateTokenCount = useCallback((text: string): number => {
    return countTokens(text, { model: currentModel, countMode: 'accurate' });
  }, [currentModel]);

  // Estimate tokens for a complete message exchange
  const estimateMessageExchange = useCallback((systemMessage: string, userMessage: string) => {
    return estimateMessageTokens(systemMessage, userMessage, { model: currentModel });
  }, [currentModel]);
  
  // Initialize budget alerts if enabled
  useEffect(() => {
    if (budgetAlerts) {
      globalUsageTracker.setBudgetAlertSettings({
        ...budgetSettings,
        enabled: true
      });
    }
  }, [budgetAlerts, budgetSettings]);
  
  // Record usage
  const recordUsage = useCallback((
    model: string,
    inputTokens: number,
    outputTokens: number,
    options?: any
  ) => {
    if (!trackUsage) return;
    
    const mergedOptions = {
      useCache: useCaching,
      useBatch: useBatchProcessing,
      ...options
    };
    
    return globalUsageTracker.recordUsage(model, inputTokens, outputTokens, mergedOptions);
  }, [trackUsage, useCaching, useBatchProcessing]);
  
  // Get usage stats
  const getUsageStats = useCallback((days: number = 30) => {
    return globalUsageTracker.getUsageStats(days);
  }, []);
  
  // Get optimization tips
  const getOptimizationTips = useCallback(() => {
    return globalUsageTracker.getOptimizationRecommendations();
  }, []);
  
  // Budget alert functions
  const getBudgetAlertSettings = useCallback(() => {
    return globalUsageTracker.getBudgetAlertSettings();
  }, []);
  
  const setBudgetAlertSettings = useCallback((settings: Partial<BudgetAlertSettings>) => {
    globalUsageTracker.setBudgetAlertSettings(settings);
  }, []);
  
  const checkBudgetStatus = useCallback(() => {
    if (globalUsageTracker.getBudgetAlertSettings().enabled) {
      return globalUsageTracker.checkBudgetStatus();
    }
    return undefined;
  }, []);
  
  return {
    calculateCost,
    compareModels,
    getRecommendedModel,
    estimateTokenCount,
    estimateMessageExchange,
    recordUsage,
    getUsageStats,
    getOptimizationTips,
    getBudgetAlertSettings,
    setBudgetAlertSettings,
    checkBudgetStatus,
    currentModel,
    setCurrentModel,
    useCaching,
    setUseCaching,
    useBatchProcessing,
    setUseBatchProcessing
  };
}