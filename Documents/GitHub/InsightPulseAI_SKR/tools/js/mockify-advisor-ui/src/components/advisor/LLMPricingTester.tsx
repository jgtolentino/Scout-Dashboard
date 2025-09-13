import React, { useState } from 'react';
import { useLLMPricing } from '@/hooks/useLLMPricing';
import { calculateLLMCost, MODEL_REGISTRY } from '@/utils/llm-pricing-calculator';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  FlaskConicalIcon, 
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  DownloadIcon,
  GithubIcon,
  CodeIcon,
  BookOpenIcon
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface LLMPricingTesterProps {
  className?: string;
}

// Test case structure
interface TestCase {
  id: string;
  description: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  options?: {
    useCache?: boolean;
    useBatch?: boolean;
    sessionTokens?: number;
  };
  expectedResults: {
    baseCost: number;
    optimizedCost: number;
    savingsPercentage: number;
    hasWarnings?: boolean;
  };
}

// Test suite structure
interface TestSuite {
  name: string;
  description: string;
  testCases: TestCase[];
}

/**
 * Test suites for validating LLM pricing calculator
 */
const TEST_SUITES: TestSuite[] = [
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
      {
        id: 'basic-gpt41-nano',
        description: 'GPT-4.1 nano with 1000 input and 2000 output tokens',
        model: 'gpt-4.1-nano',
        inputTokens: 1000,
        outputTokens: 2000,
        expectedResults: {
          baseCost: 0.9,
          optimizedCost: 0.9,
          savingsPercentage: 0
        }
      },
      {
        id: 'basic-gpt4o-mini',
        description: 'GPT-4o mini with 500 input and 1500 output tokens',
        model: 'gpt-4o-mini',
        inputTokens: 500,
        outputTokens: 1500,
        expectedResults: {
          baseCost: 0.975,
          optimizedCost: 0.975,
          savingsPercentage: 0
        }
      }
    ]
  },
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
      {
        id: 'opt-batching',
        description: 'GPT-4.1 with batch processing enabled',
        model: 'gpt-4.1',
        inputTokens: 1000,
        outputTokens: 2000,
        options: {
          useBatch: true
        },
        expectedResults: {
          baseCost: 18.0,
          optimizedCost: 9.0,  // 50% discount
          savingsPercentage: 50
        }
      },
      {
        id: 'opt-combined',
        description: 'GPT-4.1 with both caching and batching enabled',
        model: 'gpt-4.1',
        inputTokens: 1000,
        outputTokens: 2000,
        options: {
          useCache: true,
          useBatch: true
        },
        expectedResults: {
          baseCost: 18.0,
          optimizedCost: 2.25,  // 87.5% combined discount
          savingsPercentage: 87.5
        }
      }
    ]
  },
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
      {
        id: 'edge-large-tokens',
        description: 'Very large token count (1M tokens)',
        model: 'gpt-4.1',
        inputTokens: 500000,
        outputTokens: 500000,
        expectedResults: {
          baseCost: 5000,  // (500k * $2 + 500k * $8) / 1000
          optimizedCost: 5000,
          savingsPercentage: 0
        }
      },
      {
        id: 'edge-context-limit',
        description: 'Context size exceeding model limits should show warnings',
        model: 'gpt-4.1',
        inputTokens: 1000,
        outputTokens: 1000,
        options: {
          sessionTokens: 200000  // Exceeds 128K limit
        },
        expectedResults: {
          baseCost: 10,
          optimizedCost: 10,
          savingsPercentage: 0,
          hasWarnings: true
        }
      }
    ]
  },
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
      {
        id: 'alias-gpt4o',
        description: 'gpt4o should match gpt-4o-mini',
        model: 'gpt4o',
        inputTokens: 1000,
        outputTokens: 1000,
        expectedResults: {
          baseCost: 0.75,  // Same as gpt-4o-mini
          optimizedCost: 0.75,
          savingsPercentage: 0
        }
      }
    ]
  }
];

/**
 * Custom test runner for the LLM pricing calculator
 */
export function LLMPricingTester({ className }: LLMPricingTesterProps) {
  const [currentSuite, setCurrentSuite] = useState<TestSuite>(TEST_SUITES[0]);
  const [testResults, setTestResults] = useState<Record<string, {
    passed: boolean;
    actual: {
      baseCost: number;
      optimizedCost: number;
      savingsPercentage: number;
      hasWarnings: boolean;
    };
    expected: {
      baseCost: number;
      optimizedCost: number;
      savingsPercentage: number;
      hasWarnings?: boolean;
    };
  }>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [customTestInput, setCustomTestInput] = useState({
    model: 'gpt-4.1',
    inputTokens: 1000,
    outputTokens: 2000,
    useCache: false,
    useBatch: false
  });
  const [customTestResult, setCustomTestResult] = useState<any>(null);

  // Format currency values
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(4)}`;
  };

  // Run all tests in the current suite
  const runTestSuite = () => {
    setIsRunning(true);
    const results: Record<string, any> = {};

    // Run each test case
    currentSuite.testCases.forEach(testCase => {
      const result = calculateLLMCost(
        testCase.model,
        testCase.inputTokens,
        testCase.outputTokens,
        testCase.options
      );

      // Check if results match expectations
      const passed = 
        Math.abs(result.baseCost - testCase.expectedResults.baseCost) < 0.001 &&
        Math.abs(result.optimizedCost - testCase.expectedResults.optimizedCost) < 0.001 &&
        Math.abs(result.savingsPercentage - testCase.expectedResults.savingsPercentage) < 0.1 &&
        (testCase.expectedResults.hasWarnings === undefined || 
         (result.warnings.length > 0) === testCase.expectedResults.hasWarnings);

      results[testCase.id] = {
        passed,
        actual: {
          baseCost: result.baseCost,
          optimizedCost: result.optimizedCost,
          savingsPercentage: result.savingsPercentage,
          hasWarnings: result.warnings.length > 0
        },
        expected: testCase.expectedResults
      };
    });

    setTestResults(results);
    setIsRunning(false);
  };

  // Run a custom test with user-provided inputs
  const runCustomTest = () => {
    try {
      const result = calculateLLMCost(
        customTestInput.model,
        customTestInput.inputTokens,
        customTestInput.outputTokens,
        {
          useCache: customTestInput.useCache,
          useBatch: customTestInput.useBatch
        }
      );
      setCustomTestResult(result);
    } catch (error) {
      setCustomTestResult({
        error: (error as Error).message
      });
    }
  };

  // Generate a test report for download
  const generateTestReport = () => {
    const passedTests = Object.values(testResults).filter(r => r.passed).length;
    const totalTests = Object.keys(testResults).length;
    
    let report = `# LLM Pricing Calculator Test Report\n\n`;
    report += `Test Suite: ${currentSuite.name}\n`;
    report += `Description: ${currentSuite.description}\n`;
    report += `Date: ${new Date().toLocaleString()}\n`;
    report += `Result: ${passedTests}/${totalTests} tests passed\n\n`;
    
    report += `## Test Results\n\n`;
    
    currentSuite.testCases.forEach(testCase => {
      const result = testResults[testCase.id];
      if (!result) return;
      
      report += `### ${testCase.description}\n`;
      report += `Status: ${result.passed ? 'PASSED' : 'FAILED'}\n`;
      report += `Model: ${testCase.model}\n`;
      report += `Input Tokens: ${testCase.inputTokens}\n`;
      report += `Output Tokens: ${testCase.outputTokens}\n`;
      
      if (testCase.options) {
        report += `Options: ${JSON.stringify(testCase.options)}\n`;
      }
      
      report += `\nExpected:\n`;
      report += `- Base Cost: $${result.expected.baseCost.toFixed(4)}\n`;
      report += `- Optimized Cost: $${result.expected.optimizedCost.toFixed(4)}\n`;
      report += `- Savings: ${result.expected.savingsPercentage.toFixed(1)}%\n`;
      
      report += `\nActual:\n`;
      report += `- Base Cost: $${result.actual.baseCost.toFixed(4)}\n`;
      report += `- Optimized Cost: $${result.actual.optimizedCost.toFixed(4)}\n`;
      report += `- Savings: ${result.actual.savingsPercentage.toFixed(1)}%\n`;
      report += `- Has Warnings: ${result.actual.hasWarnings}\n\n`;
      report += `---\n\n`;
    });
    
    // Create a downloadable blob
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-pricing-test-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Count test results
  const countResults = () => {
    const total = Object.keys(testResults).length;
    const passed = Object.values(testResults).filter(r => r.passed).length;
    return { total, passed };
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConicalIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          LLM Pricing Calculator Tester
        </CardTitle>
        <CardDescription>
          Test and validate pricing calculations across different models and scenarios
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue="predefined-tests">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predefined-tests">
            <CodeIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Test Suites
          </TabsTrigger>
          <TabsTrigger value="custom-test">
            <BookOpenIcon className="h-4 w-4 mr-2" aria-hidden="true" />
            Custom Test
          </TabsTrigger>
        </TabsList>

        {/* Predefined Test Suites Tab */}
        <TabsContent value="predefined-tests" className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Label htmlFor="test-suite" className="mb-2 block">Select Test Suite</Label>
              <select
                id="test-suite"
                className="w-full p-2 border rounded"
                value={TEST_SUITES.indexOf(currentSuite)}
                onChange={(e) => setCurrentSuite(TEST_SUITES[parseInt(e.target.value)])}
              >
                {TEST_SUITES.map((suite, index) => (
                  <option key={index} value={index}>
                    {suite.name}
                  </option>
                ))}
              </select>
              
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium">{currentSuite.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentSuite.testCases.length} test cases
                </p>
              </div>
              
              <div className="mt-4 flex flex-col gap-2">
                <Button 
                  onClick={runTestSuite}
                  disabled={isRunning}
                  className="w-full"
                >
                  <RefreshCwIcon className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} aria-hidden="true" />
                  Run Test Suite
                </Button>
                
                {Object.keys(testResults).length > 0 && (
                  <Button 
                    variant="outline"
                    onClick={generateTestReport}
                    className="w-full"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                    Export Test Report
                  </Button>
                )}
              </div>
              
              {Object.keys(testResults).length > 0 && (
                <div className="mt-4 p-3 border rounded-lg">
                  <div className="text-sm font-medium flex justify-between items-center">
                    Test Results Summary:
                    <Badge variant={countResults().passed === countResults().total ? "success" : "destructive"}>
                      {countResults().passed}/{countResults().total} Passed
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-full md:w-2/3">
              <h3 className="font-medium mb-2">Test Cases</h3>
              
              {currentSuite.testCases.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No test cases in this suite.</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {currentSuite.testCases.map((testCase) => (
                    <AccordionItem key={testCase.id} value={testCase.id}>
                      <AccordionTrigger className="py-3 px-4 hover:no-underline hover:bg-muted/30 group">
                        <div className="flex items-center gap-3 w-full">
                          {testResults[testCase.id] ? (
                            testResults[testCase.id].passed ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                            )
                          ) : (
                            <div className="h-5 w-5 rounded-full border border-muted-foreground" />
                          )}
                          <div className="text-left">
                            <div>{testCase.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {testCase.model}, {testCase.inputTokens} input, {testCase.outputTokens} output tokens
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-2 border-t bg-muted/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Test Configuration</h4>
                            <div className="space-y-1 text-sm">
                              <div><span className="font-medium">Model:</span> {testCase.model}</div>
                              <div><span className="font-medium">Input Tokens:</span> {testCase.inputTokens.toLocaleString()}</div>
                              <div><span className="font-medium">Output Tokens:</span> {testCase.outputTokens.toLocaleString()}</div>
                              {testCase.options && (
                                <>
                                  {testCase.options.useCache !== undefined && (
                                    <div><span className="font-medium">Caching:</span> {testCase.options.useCache ? 'Enabled' : 'Disabled'}</div>
                                  )}
                                  {testCase.options.useBatch !== undefined && (
                                    <div><span className="font-medium">Batching:</span> {testCase.options.useBatch ? 'Enabled' : 'Disabled'}</div>
                                  )}
                                  {testCase.options.sessionTokens !== undefined && (
                                    <div><span className="font-medium">Session Tokens:</span> {testCase.options.sessionTokens.toLocaleString()}</div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Expected Results</h4>
                            <div className="space-y-1 text-sm">
                              <div><span className="font-medium">Base Cost:</span> {formatCurrency(testCase.expectedResults.baseCost)}</div>
                              <div><span className="font-medium">Optimized Cost:</span> {formatCurrency(testCase.expectedResults.optimizedCost)}</div>
                              <div><span className="font-medium">Savings:</span> {testCase.expectedResults.savingsPercentage.toFixed(1)}%</div>
                              {testCase.expectedResults.hasWarnings !== undefined && (
                                <div><span className="font-medium">Should Have Warnings:</span> {testCase.expectedResults.hasWarnings ? 'Yes' : 'No'}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {testResults[testCase.id] && (
                          <>
                            <Separator className="my-3" />
                            
                            <h4 className="text-sm font-medium mb-2">Test Results</h4>
                            
                            {testResults[testCase.id].passed ? (
                              <div className="bg-green-50 text-green-700 p-2 rounded-md text-sm">
                                <div className="flex items-center">
                                  <CheckCircleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                                  <span className="font-medium">All checks passed!</span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-red-50 text-red-700 p-2 rounded-md text-sm">
                                <div className="flex items-start">
                                  <XCircleIcon className="h-4 w-4 mr-2 mt-0.5" aria-hidden="true" />
                                  <div>
                                    <span className="font-medium">Test failed!</span>
                                    <div className="mt-1 space-y-1">
                                      {Math.abs(testResults[testCase.id].actual.baseCost - testResults[testCase.id].expected.baseCost) >= 0.001 && (
                                        <div>Base cost: expected {formatCurrency(testResults[testCase.id].expected.baseCost)}, got {formatCurrency(testResults[testCase.id].actual.baseCost)}</div>
                                      )}
                                      {Math.abs(testResults[testCase.id].actual.optimizedCost - testResults[testCase.id].expected.optimizedCost) >= 0.001 && (
                                        <div>Optimized cost: expected {formatCurrency(testResults[testCase.id].expected.optimizedCost)}, got {formatCurrency(testResults[testCase.id].actual.optimizedCost)}</div>
                                      )}
                                      {Math.abs(testResults[testCase.id].actual.savingsPercentage - testResults[testCase.id].expected.savingsPercentage) >= 0.1 && (
                                        <div>Savings: expected {testResults[testCase.id].expected.savingsPercentage.toFixed(1)}%, got {testResults[testCase.id].actual.savingsPercentage.toFixed(1)}%</div>
                                      )}
                                      {testResults[testCase.id].expected.hasWarnings !== undefined && 
                                       testResults[testCase.id].actual.hasWarnings !== testResults[testCase.id].expected.hasWarnings && (
                                        <div>Warnings: expected {testResults[testCase.id].expected.hasWarnings ? 'yes' : 'no'}, got {testResults[testCase.id].actual.hasWarnings ? 'yes' : 'no'}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Custom Test Tab */}
        <TabsContent value="custom-test" className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Test Parameters</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-model">Model</Label>
                  <select
                    id="custom-model"
                    className="w-full p-2 border rounded mt-1"
                    value={customTestInput.model}
                    onChange={(e) => setCustomTestInput({
                      ...customTestInput,
                      model: e.target.value
                    })}
                  >
                    {Object.keys(MODEL_REGISTRY).map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                    <option value="gpt-4.1">gpt-4.1 (alias)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo (alias)</option>
                    <option value="gpt4o">gpt4o (alias)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="custom-input-tokens">Input Tokens</Label>
                    <Input
                      id="custom-input-tokens"
                      type="number"
                      min="0"
                      value={customTestInput.inputTokens}
                      onChange={(e) => setCustomTestInput({
                        ...customTestInput,
                        inputTokens: parseInt(e.target.value) || 0
                      })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-output-tokens">Output Tokens</Label>
                    <Input
                      id="custom-output-tokens"
                      type="number"
                      min="0"
                      value={customTestInput.outputTokens}
                      onChange={(e) => setCustomTestInput({
                        ...customTestInput,
                        outputTokens: parseInt(e.target.value) || 0
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Switch
                        id="custom-use-cache"
                        checked={customTestInput.useCache}
                        onCheckedChange={(checked) => setCustomTestInput({
                          ...customTestInput,
                          useCache: checked
                        })}
                      />
                      <Label htmlFor="custom-use-cache" className="ml-2">
                        Enable Prompt Caching
                      </Label>
                    </div>
                    <Badge variant="outline">Up to 75% OFF</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Switch
                        id="custom-use-batch"
                        checked={customTestInput.useBatch}
                        onCheckedChange={(checked) => setCustomTestInput({
                          ...customTestInput,
                          useBatch: checked
                        })}
                      />
                      <Label htmlFor="custom-use-batch" className="ml-2">
                        Enable Batch Processing
                      </Label>
                    </div>
                    <Badge variant="outline">Up to 50% OFF</Badge>
                  </div>
                </div>
                
                <Button 
                  onClick={runCustomTest}
                  className="w-full"
                >
                  Calculate Cost
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Test Results</h3>
              
              {!customTestResult ? (
                <div className="h-[300px] flex items-center justify-center border border-dashed rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <AlertCircleIcon className="h-12 w-12 mx-auto mb-2 opacity-20" aria-hidden="true" />
                    <p>Configure parameters and run calculation to see results</p>
                  </div>
                </div>
              ) : customTestResult.error ? (
                <div className="h-[300px] flex items-center justify-center bg-red-50 text-red-700 border border-red-200 rounded-lg">
                  <div className="text-center p-6">
                    <XCircleIcon className="h-12 w-12 mx-auto mb-2" aria-hidden="true" />
                    <p className="font-medium">Error</p>
                    <p className="mt-1">{customTestResult.error}</p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Cost Breakdown</h4>
                      
                      <div className="grid grid-cols-2 gap-y-3">
                        <div className="text-sm">Base Cost:</div>
                        <div className="text-sm font-medium text-right">{formatCurrency(customTestResult.baseCost)}</div>
                        
                        <div className="text-sm">Optimized Cost:</div>
                        <div className="text-sm font-medium text-right">
                          {formatCurrency(customTestResult.optimizedCost)}
                          {customTestResult.savings > 0 && (
                            <Badge className="ml-2 bg-green-500">
                              -{customTestResult.savingsPercentage.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm">Savings:</div>
                        <div className="text-sm font-medium text-right">
                          {formatCurrency(customTestResult.savings)}
                        </div>
                      </div>
                    </div>
                    
                    {customTestResult.optimizations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Applied Optimizations</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {customTestResult.optimizations.map((optimization: string, i: number) => (
                            <li key={i}>{optimization}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {customTestResult.warnings.length > 0 && (
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                        <h4 className="text-sm font-medium mb-1 text-amber-800">Warnings</h4>
                        <ul className="list-disc list-inside text-sm space-y-1 text-amber-700">
                          {customTestResult.warnings.map((warning: string, i: number) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Token Math</h4>
                      <div className="bg-muted/30 p-3 rounded text-sm">
                        <div className="font-mono">
                          [(Input tokens × rate) + (Output tokens × rate)] ÷ 1,000
                        </div>
                        <div className="mt-2 font-mono">
                          [({customTestInput.inputTokens} × ${getModelRate(customTestInput.model, 'input')}) + 
                          ({customTestInput.outputTokens} × ${getModelRate(customTestInput.model, 'output')})] ÷ 1,000 = 
                          ${customTestResult.baseCost.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          LLM Pricing Test Suite v1.0
        </div>
        <a 
          href="#" 
          className="text-sm text-muted-foreground hover:text-foreground flex items-center"
          onClick={(e) => { e.preventDefault(); /* Link to documentation */ }}
        >
          <GithubIcon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          View Source
        </a>
      </CardFooter>
    </Card>
  );
}

// Helper function to get the rate for a given model and token type
function getModelRate(modelName: string, tokenType: 'input' | 'output'): string {
  // Normalize model name
  let resolvedModel = modelName;
  
  // Find model in registry or via alias
  for (const [key, data] of Object.entries(MODEL_REGISTRY)) {
    if (key === modelName) {
      resolvedModel = key;
      break;
    }
    
    if (data.alias && data.alias.includes(modelName)) {
      resolvedModel = key;
      break;
    }
  }
  
  // Find closest model if not exact match
  if (!MODEL_REGISTRY[resolvedModel]) {
    if (modelName.includes('gpt-4.1') || modelName.includes('gpt4-turbo')) {
      resolvedModel = 'gpt-4-1106-preview';
    } else if (modelName.includes('gpt-4o') || modelName.includes('gpt4o')) {
      resolvedModel = 'gpt-4o-mini';
    } else if (modelName.includes('gpt-3.5') || modelName.includes('gpt3.5')) {
      resolvedModel = 'gpt-3.5-turbo';
    } else {
      resolvedModel = 'gpt-4-1106-preview'; // default
    }
  }
  
  // Get the rate
  const model = MODEL_REGISTRY[resolvedModel];
  return model.rates[tokenType].toFixed(2);
}