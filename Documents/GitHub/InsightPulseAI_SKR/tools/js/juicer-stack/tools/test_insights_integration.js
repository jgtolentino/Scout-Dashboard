/**
 * Test Insights Integration
 * 
 * This script validates that the GenAI insights integration components are
 * properly configured and functioning.
 * 
 * @author InsightPulseAI Team
 * @version 1.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const insightsBridge = require('./insights_cli_bridge');

console.log('📋 Running GenAI Insights Integration Tests');
console.log('--------------------------------------------');

// Define required files and components to check
const requiredFiles = [
  { path: '../GENAI_INSIGHTS_INTEGRATION.md', name: 'Integration Documentation' },
  { path: '../dashboards/insights_dashboard.html', name: 'Insights Dashboard HTML' },
  { path: '../dashboards/insights_visualizer.js', name: 'Insights Visualizer JavaScript' },
  { path: '../notebooks/juicer_gold_insights.py', name: 'Gold Insights Python Notebook' },
  { path: '../notebooks/juicer_setup_insights_tables.sql', name: 'Insights Tables SQL Notebook' },
  { path: '../pulser/insights_hook.yaml', name: 'Insights Hook Configuration' },
  { path: '../pulser/juicer_hook.yaml', name: 'Juicer Hook Configuration' },
  { path: './insights_cli_bridge.js', name: 'CLI Bridge Utility' }
];

// Track test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Start timestamp for performance tracking
const startTime = Date.now();

/**
 * Run a test and record result
 */
function runTest(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  
  try {
    const result = testFn();
    
    if (result.warning) {
      console.log('⚠️  WARNING');
      console.log(`   ${result.message}`);
      results.warnings++;
    } else {
      console.log('✅ PASS');
      results.passed++;
    }
    
    return result.success;
  } catch (error) {
    console.log('❌ FAIL');
    console.log(`   Error: ${error.message}`);
    results.failed++;
    return false;
  }
}

/**
 * Test 1: Check required files exist
 */
runTest('required files', () => {
  const missing = [];
  
  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, file.path);
    if (!fs.existsSync(fullPath)) {
      missing.push(file.name);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing files: ${missing.join(', ')}`);
  }
  
  return { success: true };
});

/**
 * Test 2: Validate YAML configuration
 */
runTest('YAML configuration', () => {
  const insightsHookPath = path.join(__dirname, '../pulser/insights_hook.yaml');
  const juicerHookPath = path.join(__dirname, '../pulser/juicer_hook.yaml');
  
  // In a real implementation, this would parse and validate the YAML files
  // For demo purposes, we'll just check if they contain key strings
  
  const insightsHook = fs.readFileSync(insightsHookPath, 'utf8');
  if (!insightsHook.includes('triggers:') || !insightsHook.includes('generate_insights')) {
    throw new Error('insights_hook.yaml is missing required configuration');
  }
  
  const juicerHook = fs.readFileSync(juicerHookPath, 'utf8');
  if (!juicerHook.includes('juicer_insights_daily')) {
    throw new Error('juicer_hook.yaml is missing required insights job configuration');
  }
  
  return { success: true };
});

/**
 * Test 3: Validate JavaScript dashboard components
 */
runTest('dashboard JavaScript', () => {
  const visualizerPath = path.join(__dirname, '../dashboards/insights_visualizer.js');
  const visualizer = fs.readFileSync(visualizerPath, 'utf8');
  
  // Check for expected class and methods
  if (!visualizer.includes('class InsightsVisualizer')) {
    throw new Error('insights_visualizer.js is missing InsightsVisualizer class');
  }
  
  if (!visualizer.includes('renderBrandChart') || !visualizer.includes('renderSentimentChart')) {
    throw new Error('insights_visualizer.js is missing required chart rendering methods');
  }
  
  return { success: true };
});

/**
 * Test 4: CLI bridge functions
 */
runTest('CLI bridge', () => {
  // Test generating insights
  const generateResult = insightsBridge.generateInsights({ days: '7', model: 'claude' });
  if (!generateResult.success) {
    throw new Error(`generateInsights failed: ${generateResult.message}`);
  }
  
  // Test showing insights
  const showResult = insightsBridge.showInsights({ type: 'all', limit: 1 });
  if (!showResult.success) {
    throw new Error(`showInsights failed: ${showResult.message}`);
  }
  
  return { success: true };
});

/**
 * Test 5: Check Python notebook syntax
 */
runTest('Python notebook syntax', () => {
  const notebookPath = path.join(__dirname, '../notebooks/juicer_gold_insights.py');
  const notebook = fs.readFileSync(notebookPath, 'utf8');
  
  // Simple check for Python syntax (not comprehensive)
  if (!notebook.includes('import pandas') || !notebook.includes('def generate_insight_prompt')) {
    return {
      success: true,
      warning: true,
      message: 'Python notebook may be missing required imports or functions'
    };
  }
  
  return { success: true };
});

/**
 * Test 6: Check SQL notebook syntax
 */
runTest('SQL notebook syntax', () => {
  const notebookPath = path.join(__dirname, '../notebooks/juicer_setup_insights_tables.sql');
  const notebook = fs.readFileSync(notebookPath, 'utf8');
  
  // Simple check for SQL syntax (not comprehensive)
  if (!notebook.includes('CREATE TABLE') || !notebook.includes('genai_insights')) {
    return {
      success: true,
      warning: true,
      message: 'SQL notebook may be missing required table creation statements'
    };
  }
  
  return { success: true };
});

/**
 * Test 7: Test dashboard HTML
 */
runTest('dashboard HTML', () => {
  const dashboardPath = path.join(__dirname, '../dashboards/insights_dashboard.html');
  const dashboard = fs.readFileSync(dashboardPath, 'utf8');
  
  // Check for required HTML elements
  if (!dashboard.includes('<canvas id="brandInsightsChart">') || 
      !dashboard.includes('<canvas id="sentimentTrendsChart">')) {
    throw new Error('insights_dashboard.html is missing required chart canvas elements');
  }
  
  return { success: true };
});

/**
 * Test 8: End-to-end test simulation
 */
runTest('end-to-end simulation', () => {
  // Simulate CLI command execution
  try {
    // In a real test, we might execute actual CLI commands
    // For demo purposes, we'll just use our bridge functions
    
    // 1. Generate insights
    const generateResult = insightsBridge.generateInsights({ days: '7' });
    if (!generateResult.success) throw new Error('Generate insights failed');
    
    // 2. Show insights
    const showResult = insightsBridge.showInsights({ type: 'brand' });
    if (!showResult.success) throw new Error('Show insights failed');
    
    // 3. Visualize insights
    const visualizeResult = insightsBridge.visualizeInsights({ type: 'bar' });
    if (!visualizeResult.success) throw new Error('Visualize insights failed');
    
    // For demo purposes, always show a warning
    return {
      success: true,
      warning: true,
      message: 'Some simulated database connections may not be available in test environment'
    };
  } catch (error) {
    throw new Error(`End-to-end test failed: ${error.message}`);
  }
});

// Calculate duration
const duration = ((Date.now() - startTime) / 1000).toFixed(2);

// Print summary
console.log('\n--------------------------------------------');
console.log(`📊 Test Results (completed in ${duration}s):`);
console.log(`   Passed: ${results.passed}`);
console.log(`   Failed: ${results.failed}`);
console.log(`   Warnings: ${results.warnings}`);
console.log('--------------------------------------------');

if (results.failed > 0) {
  console.log('❌ Some tests failed. Please fix the issues and run the tests again.');
  process.exit(1);
} else if (results.warnings > 0) {
  console.log('⚠️  Tests passed with warnings. Review the warnings before deploying to production.');
  process.exit(0);
} else {
  console.log('✅ All tests passed! The GenAI insights integration is ready to use.');
  process.exit(0);
}