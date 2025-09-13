import React, { useState, useEffect } from 'react';
import { useLLMPricing } from '@/hooks/useLLMPricing';
import { MODEL_REGISTRY } from '@/utils/llm-pricing-calculator';
import { formatTokenCount } from '@/utils/token-counter';
import { BudgetAlertSettings } from './BudgetAlertSettings';
import { downloadCSV } from '@/utils/export-helpers';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  CalculatorIcon, 
  BarChart3Icon, 
  LightbulbIcon, 
  CoinsIcon, 
  BarChartIcon, 
  ListFilterIcon, 
  RefreshCcwIcon, 
  DollarSignIcon,
  DownloadIcon
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface LLMPricingPanelProps {
  className?: string;
}

export function LLMPricingPanel({ className }: LLMPricingPanelProps) {
  const [inputTokens, setInputTokens] = useState(800);
  const [outputTokens, setOutputTokens] = useState(1200);
  const [sampleText, setSampleText] = useState('');
  const [systemMessage, setSystemMessage] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [budgetStatus, setBudgetStatus] = useState<any>(undefined);
  
  const {
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
  } = useLLMPricing({
    defaultModel: 'gpt-4-1106-preview',
    trackUsage: true,
    autoOptimize: true,
    budgetAlerts: true
  });
  
  // Cost calculation
  const costResult = calculateCost(inputTokens, outputTokens);
  const modelComparison = compareModels(inputTokens, outputTokens);
  const recommendation = getRecommendedModel(inputTokens, outputTokens);
  const optimizationTips = getOptimizationTips();
  const usageStats = getUsageStats();
  
  // Sample text token estimate
  useEffect(() => {
    if (sampleText) {
      setInputTokens(estimateTokenCount(sampleText));
    }
  }, [sampleText, estimateTokenCount]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(4)}`;
  };
  
  // Export usage data to CSV
  const exportUsageDataToCSV = () => {
    const stats = getUsageStats();
    
    if (stats.totalCalls === 0) {
      return; // No data to export
    }
    
    // Prepare model breakdown data
    const modelBreakdownData = Object.entries(stats.modelBreakdown).map(([model, data]) => ({
      Model: model,
      Calls: data.calls,
      Cost: data.cost.toFixed(4),
      Percentage: `${data.percentage.toFixed(1)}%`
    }));
    
    // Prepare usage summary data
    const usageSummaryData = [
      {
        Metric: 'Total Cost',
        Value: `$${stats.totalCost.toFixed(4)}`
      },
      {
        Metric: 'Total API Calls',
        Value: stats.totalCalls.toString()
      },
      {
        Metric: 'Total Input Tokens',
        Value: stats.totalInputTokens.toLocaleString()
      },
      {
        Metric: 'Total Output Tokens',
        Value: stats.totalOutputTokens.toLocaleString()
      },
      {
        Metric: 'Average Cost Per Call',
        Value: `$${stats.avgCostPerCall.toFixed(4)}`
      },
      {
        Metric: 'Daily Average Cost',
        Value: `$${stats.dailyAverage.toFixed(4)}`
      },
      {
        Metric: 'Projected Monthly Cost',
        Value: `$${stats.projectedMonthlyCost.toFixed(4)}`
      }
    ];
    
    // Download both datasets
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadCSV(modelBreakdownData, `llm-usage-models-${timestamp}.csv`);
    downloadCSV(usageSummaryData, `llm-usage-summary-${timestamp}.csv`);
  };
  
  // Check budget status whenever usage is updated
  useEffect(() => {
    setBudgetStatus(checkBudgetStatus());
  }, [checkBudgetStatus]);
  
  // Generate random sample usage
  const generateSampleUsage = () => {
    // Generate random input/output token counts
    const randInputTokens = Math.floor(Math.random() * 2000) + 100;
    const randOutputTokens = Math.floor(Math.random() * 2000) + 100;
    
    // Pick a random model
    const models = Object.keys(MODEL_REGISTRY);
    const randModel = models[Math.floor(Math.random() * models.length)];
    
    // Record the usage
    const result = recordUsage(randModel, randInputTokens, randOutputTokens);
    if (result.budgetStatus) {
      setBudgetStatus(result.budgetStatus);
    }
  };
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          LLM Pricing Calculator
        </CardTitle>
        <CardDescription>
          Calculate and optimize LLM costs based on token usage
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="calculator">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calculator">
            <CoinsIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <BarChart3Icon className="h-4 w-4 mr-2" aria-hidden="true" />
            Comparison
          </TabsTrigger>
          <TabsTrigger value="usage">
            <BarChartIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="budget">
            <DollarSignIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="tips">
            <LightbulbIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Optimization
          </TabsTrigger>
        </TabsList>
        
        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model-select">Model</Label>
              <select
                id="model-select"
                className="w-full p-2 border rounded mb-4"
                value={currentModel}
                onChange={(e) => setCurrentModel(e.target.value)}
              >
                {Object.keys(MODEL_REGISTRY).map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="input-tokens">Input Tokens</Label>
                  <Input
                    id="input-tokens"
                    type="number"
                    min="0"
                    value={inputTokens}
                    onChange={(e) => setInputTokens(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="output-tokens">Output Tokens</Label>
                  <Input
                    id="output-tokens"
                    type="number"
                    min="0"
                    value={outputTokens}
                    onChange={(e) => setOutputTokens(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="mb-2 block">Sample Text (to estimate tokens)</Label>
                  <textarea
                    className="w-full p-2 border rounded resize-none h-[100px]"
                    placeholder="Paste sample text here to estimate token count..."
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                  />
                  {sampleText && (
                    <div className="mt-1 text-sm text-right text-muted-foreground">
                      Estimated tokens: {formatTokenCount(estimateTokenCount(sampleText))}
                    </div>
                  )}
                </div>
                
                <div className="p-3 border rounded-lg bg-muted/20">
                  <h4 className="text-sm font-medium mb-2">Message Exchange Token Estimator</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">System Message</Label>
                      <textarea
                        className="w-full p-2 border rounded resize-none h-[60px] text-sm"
                        placeholder="You are a helpful assistant..."
                        value={systemMessage}
                        onChange={(e) => setSystemMessage(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">User Message</Label>
                      <textarea
                        className="w-full p-2 border rounded resize-none h-[60px] text-sm"
                        placeholder="User question or prompt..."
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                      />
                    </div>
                    
                    {(systemMessage || userMessage) && (
                      <div className="text-xs p-2 bg-muted rounded">
                        {(() => {
                          const estimate = estimateMessageExchange(systemMessage, userMessage);
                          return (
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <span className="font-medium">Input:</span><br />
                                {formatTokenCount(estimate.inputTokens)}
                              </div>
                              <div>
                                <span className="font-medium">Output (est):</span><br />
                                {formatTokenCount(estimate.estimatedOutputTokens)}
                              </div>
                              <div>
                                <span className="font-medium">Total:</span><br />
                                {formatTokenCount(estimate.total)}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Cost Calculation</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Base Cost:</span>
                  <span className="font-semibold">{formatCurrency(costResult.baseCost)}</span>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Switch
                        id="use-caching"
                        checked={useCaching}
                        onCheckedChange={setUseCaching}
                      />
                      <Label htmlFor="use-caching" className="ml-2">
                        Enable Prompt Caching
                      </Label>
                    </div>
                    <Badge variant="outline">Up to 75% OFF</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Switch
                        id="use-batch"
                        checked={useBatchProcessing}
                        onCheckedChange={setUseBatchProcessing}
                      />
                      <Label htmlFor="use-batch" className="ml-2">
                        Enable Batch Processing
                      </Label>
                    </div>
                    <Badge variant="outline">Up to 50% OFF</Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Final Cost:</span>
                  <span className={costResult.savings > 0 ? "text-green-600" : ""}>
                    {formatCurrency(costResult.optimizedCost)}
                  </span>
                </div>
                
                {costResult.savings > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-700">
                    <span className="font-semibold">Savings: </span>
                    {formatCurrency(costResult.savings)} ({costResult.savingsPercentage.toFixed(1)}%)
                  </div>
                )}
                
                {costResult.optimizations.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Applied optimizations:</span>
                    <ul className="text-sm list-disc list-inside">
                      {costResult.optimizations.map((opt, i) => (
                        <li key={i}>{opt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Comparison Tab */}
        <TabsContent value="comparison" className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">
              Model Cost Comparison
              <span className="text-sm font-normal ml-2 text-muted-foreground">
                (for {inputTokens} input and {outputTokens} output tokens)
              </span>
            </h3>
            <div className="space-y-3">
              {modelComparison.map((model, index) => (
                <div 
                  key={model.model}
                  className={`border p-3 rounded-lg ${
                    model.model === recommendation.recommendedModel 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {model.model}
                        {model.model === recommendation.recommendedModel && (
                          <Badge className="ml-2 bg-green-500">Recommended</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {model.savings > 0
                          ? `Optimized: ${formatCurrency(model.optimizedCost)} (${model.savingsPercentage.toFixed(1)}% saved)`
                          : `Cost: ${formatCurrency(model.baseCost)}`
                        }
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentModel(model.model)}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Recommendation</h3>
            <div className="border-l-4 border-primary pl-3 py-2">
              <p>{recommendation.reasoning}</p>
            </div>
          </div>
        </TabsContent>
        
        {/* Usage Tab */}
        <TabsContent value="usage" className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Usage Statistics</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateSampleUsage}
              >
                <RefreshCcwIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                Generate Sample
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportUsageDataToCSV}
                disabled={usageStats.totalCalls === 0}
              >
                <DownloadIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
          </div>
          
          {usageStats.totalCalls === 0 ? (
            <div className="text-center p-6 border border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No usage data available.</p>
              <Button onClick={generateSampleUsage}>Generate Sample Data</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{formatCurrency(usageStats.totalCost)}</div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{usageStats.totalCalls}</div>
                    <p className="text-sm text-muted-foreground">Total API Calls</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{formatCurrency(usageStats.avgCostPerCall)}</div>
                    <p className="text-sm text-muted-foreground">Avg. Cost Per Call</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{formatCurrency(usageStats.projectedMonthlyCost)}</div>
                    <p className="text-sm text-muted-foreground">Projected Monthly</p>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h4 className="text-md font-semibold mb-2">Model Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(usageStats.modelBreakdown).map(([model, data]) => (
                    <div key={model} className="flex items-center">
                      <div 
                        className="w-full bg-muted rounded-full h-4 mr-2 overflow-hidden"
                        title={`${data.percentage.toFixed(1)}% of total cost`}
                      >
                        <div 
                          className="bg-primary h-full"
                          style={{ width: `${data.percentage}%` }}
                        />
                      </div>
                      <div className="text-sm min-w-[50%] md:min-w-[30%] flex justify-between">
                        <span>{model}</span>
                        <span>{data.calls} calls</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-semibold mb-2">Token Usage</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Input Tokens</div>
                    <div className="text-lg font-medium">{usageStats.totalInputTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Output Tokens</div>
                    <div className="text-lg font-medium">{usageStats.totalOutputTokens.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Optimization Tips Tab */}
        <TabsContent value="tips" className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Cost-Saving Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Prompt Caching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">GPT-4.1 supports caching → up to 75% off on repeat calls</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Batch API Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Submit jobs in bulk for 50% OFF</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Long Context Handling</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">GPT-4.1 supports 128K tokens — no extra charge</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Optimization Recommendations</h3>
            {optimizationTips.length > 0 ? (
              <div className="space-y-2">
                {optimizationTips.map((tip, index) => (
                  <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                    <div className="flex items-start">
                      <LightbulbIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" aria-hidden="true" />
                      <p className="text-sm">{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  Not enough usage data to provide personalized recommendations.
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Token Math Example</h3>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="font-medium mb-2">Cost Formula:</p>
              <pre className="bg-muted p-2 rounded text-sm">
                [(Input tokens × rate) + (Output tokens × rate)] ÷ 1,000
              </pre>
              
              <p className="font-medium mt-4 mb-2">Example:</p>
              <p className="text-sm">
                200 input + 900 output with GPT-4o mini =<br />
                (200 × $0.15 + 900 × $0.60) ÷ 1000 = approx $0.59
              </p>
            </div>
          </div>
        </TabsContent>
        
        {/* Budget Tab */}
        <TabsContent value="budget" className="p-4">
          <BudgetAlertSettings
            settings={getBudgetAlertSettings()}
            onUpdateSettings={setBudgetAlertSettings}
            budgetStatus={checkBudgetStatus()}
          />
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Pulser Runtime Profiler v2.0.0
        </div>
        <DollarSignIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardFooter>
    </Card>
  );
}