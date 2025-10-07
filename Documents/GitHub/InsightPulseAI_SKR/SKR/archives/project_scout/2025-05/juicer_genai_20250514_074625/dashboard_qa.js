/**
 * dashboard_qa.js - Automated visual testing for Juicer dashboards
 * 
 * This script integrates the Snappy visual QA system with Juicer dashboards.
 * It captures screenshots of dashboard components, compares them against baselines,
 * and reports any visual regressions.
 */

const snappyCapture = require('../utils/snappy_capture');
const snappyDiff = require('../utils/snappy_diff');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Configuration
const CONFIG = {
  // Dashboard URLs to test
  dashboards: [
    { id: 'insights-overview', url: 'http://localhost:9090/dashboards/insights_dashboard.html' },
    { id: 'brand-heatmap', url: 'http://localhost:9090/dashboards/brand_heatmap.html' },
    { id: 'sentiment-trends', url: 'http://localhost:9090/dashboards/sentiment_trends.html' }
  ],
  
  // Dashboard components to test
  components: [
    { 
      id: 'insights-cards', 
      selector: '#insightsContainer',
      description: 'Insights cards section'
    },
    { 
      id: 'brand-chart', 
      selector: '#brandChart',
      description: 'Brand insights chart'
    },
    { 
      id: 'sentiment-chart', 
      selector: '#sentimentChart',
      description: 'Sentiment trends chart'
    },
    { 
      id: 'trending-tags', 
      selector: '#tagCloud',
      description: 'Trending tags cloud'
    }
  ],
  
  // Breakpoints to test
  breakpoints: [
    { id: 'mobile', width: 375, height: 667 },
    { id: 'tablet', width: 768, height: 1024 },
    { id: 'desktop', width: 1280, height: 800 }
  ],
  
  // Threshold for visual difference
  threshold: 0.05,
  
  // Output directory for reports
  reportDir: path.join(__dirname, 'qa', 'reports'),
  
  // Server configuration
  server: {
    command: 'node ../server.js',
    port: 9090,
    startupDelay: 3000 // Delay in ms to wait for server to start
  }
};

/**
 * Main function to run dashboard visual QA
 */
async function runDashboardQA(options = {}) {
  const { dashboardIds, componentIds, breakpointIds, threshold, startServer } = options;
  
  console.log('🔍 Starting visual QA for Juicer dashboards...');
  
  // Filter dashboards, components, and breakpoints based on options
  const dashboards = dashboardIds 
    ? CONFIG.dashboards.filter(d => dashboardIds.includes(d.id)) 
    : CONFIG.dashboards;
    
  const components = componentIds 
    ? CONFIG.components.filter(c => componentIds.includes(c.id)) 
    : CONFIG.components;
    
  const breakpoints = breakpointIds 
    ? CONFIG.breakpoints.filter(b => breakpointIds.includes(b.id)) 
    : CONFIG.breakpoints;
  
  const testThreshold = threshold || CONFIG.threshold;
  
  // Create report directory
  await fs.mkdir(CONFIG.reportDir, { recursive: true });
  
  // Start server if requested
  let serverProcess;
  if (startServer) {
    console.log('🚀 Starting dashboard server...');
    serverProcess = await startDashboardServer();
    await new Promise(resolve => setTimeout(resolve, CONFIG.server.startupDelay));
  }
  
  try {
    // Initialize results
    const results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        new: 0
      },
      details: []
    };
    
    // Test each dashboard
    for (const dashboard of dashboards) {
      console.log(`\n📊 Testing dashboard: ${dashboard.id}`);
      
      // Check if dashboard is accessible
      try {
        await axios.get(dashboard.url);
      } catch (error) {
        console.error(`❌ Dashboard ${dashboard.id} is not accessible at ${dashboard.url}`);
        results.details.push({
          dashboard: dashboard.id,
          url: dashboard.url,
          status: 'ERROR',
          error: `Dashboard not accessible: ${error.message}`
        });
        continue;
      }
      
      // Capture and test each component at each breakpoint
      for (const component of components) {
        for (const breakpoint of breakpoints) {
          results.summary.total++;
          
          // Create a unique ID for this test
          const testId = `${dashboard.id}-${component.id}-${breakpoint.id}`;
          console.log(`  🔍 Testing component: ${component.id} at ${breakpoint.id} breakpoint`);
          
          try {
            // Capture component
            const capture = await snappyCapture.captureElement({
              url: dashboard.url,
              selector: component.selector,
              viewport: { width: breakpoint.width, height: breakpoint.height },
              fullPage: false
            });
            
            // Compare with baseline
            const comparison = await snappyDiff.compareWithBaseline(
              capture.path, 
              testId, 
              { threshold: testThreshold }
            );
            
            // Process result
            const testResult = {
              dashboard: dashboard.id,
              component: component.id,
              componentDescription: component.description,
              breakpoint: breakpoint.id,
              testId,
              status: comparison.status,
              diffPercentage: comparison.diffPercentage,
              currentImage: capture.path,
              baselineImage: comparison.baselineFile || null,
              diffImage: comparison.diffFile || null
            };
            
            // Update summary based on status
            if (comparison.status === 'PASS') {
              results.summary.passed++;
              console.log(`    ✅ Passed (${(comparison.diffPercentage * 100).toFixed(2)}% difference)`);
            } else if (comparison.status === 'FAIL') {
              results.summary.failed++;
              console.log(`    ❌ Failed (${(comparison.diffPercentage * 100).toFixed(2)}% difference)`);
            } else if (comparison.status === 'BASELINE_CREATED') {
              results.summary.new++;
              console.log(`    🆕 New baseline created`);
            }
            
            results.details.push(testResult);
          } catch (error) {
            console.error(`    ❌ Error: ${error.message}`);
            results.details.push({
              dashboard: dashboard.id,
              component: component.id,
              componentDescription: component.description,
              breakpoint: breakpoint.id,
              testId,
              status: 'ERROR',
              error: error.message
            });
          }
        }
      }
    }
    
    // Generate summary report
    await generateReport(results);
    
    // Print final summary
    console.log('\n📋 Test Summary:');
    console.log(`  Total tests: ${results.summary.total}`);
    console.log(`  ✅ Passed: ${results.summary.passed}`);
    console.log(`  ❌ Failed: ${results.summary.failed}`);
    console.log(`  🆕 New baselines: ${results.summary.new}`);
    
    return results;
  } finally {
    // Stop server if we started it
    if (serverProcess) {
      console.log('\n🛑 Stopping dashboard server...');
      serverProcess.kill();
    }
  }
}

/**
 * Start dashboard server for testing
 * @returns {Object} Server process
 */
async function startDashboardServer() {
  try {
    const { command } = CONFIG.server;
    
    // Start server process
    const child = require('child_process').spawn(command.split(' ')[0], command.split(' ').slice(1), {
      stdio: 'pipe',
      detached: true
    });
    
    child.stdout.on('data', (data) => {
      console.log(`Server: ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`Server error: ${data.toString().trim()}`);
    });
    
    // Return server process
    return child;
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    throw error;
  }
}

/**
 * Generate HTML report for test results
 * @param {Object} results - Test results
 */
async function generateReport(results) {
  const reportPath = path.join(CONFIG.reportDir, `report-${new Date().toISOString().replace(/:/g, '-')}.html`);
  
  // Generate HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Juicer Dashboard QA Report</title>
  <style>
    :root {
      --primary: #ff3300;
      --secondary: #002b49;
      --success: #28a745;
      --danger: #dc3545;
      --warning: #ffc107;
      --info: #17a2b8;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    
    .header {
      background-color: var(--secondary);
      color: white;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    
    .summary {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .summary-box {
      flex: 1;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .summary-box h3 {
      margin-top: 0;
    }
    
    .summary-box.total {
      background-color: var(--secondary);
      color: white;
    }
    
    .summary-box.passed {
      background-color: var(--success);
      color: white;
    }
    
    .summary-box.failed {
      background-color: var(--danger);
      color: white;
    }
    
    .summary-box.new {
      background-color: var(--info);
      color: white;
    }
    
    .result-card {
      margin-bottom: 15px;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .result-card.pass {
      border-left: 5px solid var(--success);
    }
    
    .result-card.fail {
      border-left: 5px solid var(--danger);
    }
    
    .result-card.new {
      border-left: 5px solid var(--info);
    }
    
    .result-card.error {
      border-left: 5px solid var(--warning);
    }
    
    .result-card h3 {
      margin-top: 0;
      display: flex;
      justify-content: space-between;
    }
    
    .result-card .status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
    }
    
    .result-card .status.pass {
      background-color: var(--success);
      color: white;
    }
    
    .result-card .status.fail {
      background-color: var(--danger);
      color: white;
    }
    
    .result-card .status.new {
      background-color: var(--info);
      color: white;
    }
    
    .result-card .status.error {
      background-color: var(--warning);
      color: black;
    }
    
    .image-row {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    
    .image-container {
      flex: 1;
      min-width: 300px;
    }
    
    .image-container h4 {
      margin: 5px 0;
    }
    
    .image-container img {
      max-width: 100%;
      border: 1px solid #ddd;
    }
    
    .error-message {
      background-color: #fff3cd;
      color: #856404;
      padding: 10px;
      border-radius: 3px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Juicer Dashboard QA Report</h1>
    <p>Generated on ${new Date(results.timestamp).toLocaleString()}</p>
  </div>
  
  <div class="summary">
    <div class="summary-box total">
      <h3>Total Tests</h3>
      <h2>${results.summary.total}</h2>
    </div>
    <div class="summary-box passed">
      <h3>Passed</h3>
      <h2>${results.summary.passed}</h2>
    </div>
    <div class="summary-box failed">
      <h3>Failed</h3>
      <h2>${results.summary.failed}</h2>
    </div>
    <div class="summary-box new">
      <h3>New Baselines</h3>
      <h2>${results.summary.new}</h2>
    </div>
  </div>
  
  <h2>Test Results</h2>
  
  ${results.details.map(result => {
    let statusClass = '';
    let statusLabel = '';
    
    switch (result.status) {
      case 'PASS':
        statusClass = 'pass';
        statusLabel = 'PASS';
        break;
      case 'FAIL':
        statusClass = 'fail';
        statusLabel = 'FAIL';
        break;
      case 'BASELINE_CREATED':
        statusClass = 'new';
        statusLabel = 'NEW BASELINE';
        break;
      default:
        statusClass = 'error';
        statusLabel = 'ERROR';
    }
    
    return `
    <div class="result-card ${statusClass}">
      <h3>
        ${result.dashboard} / ${result.component} / ${result.breakpoint}
        <span class="status ${statusClass}">${statusLabel}</span>
      </h3>
      <p>${result.componentDescription || ''}</p>
      
      ${result.status === 'ERROR' 
        ? `<div class="error-message">${result.error}</div>` 
        : ''}
      
      ${result.status !== 'ERROR' 
        ? `<p>Difference: ${result.diffPercentage !== undefined 
            ? `${(result.diffPercentage * 100).toFixed(2)}%` 
            : 'N/A'}</p>` 
        : ''}
      
      ${result.status !== 'ERROR' 
        ? `<div class="image-row">
            <div class="image-container">
              <h4>Current</h4>
              <img src="file://${result.currentImage}" alt="Current image">
            </div>
            
            ${result.baselineImage 
              ? `<div class="image-container">
                  <h4>Baseline</h4>
                  <img src="file://${result.baselineImage}" alt="Baseline image">
                </div>` 
              : ''}
            
            ${result.diffImage 
              ? `<div class="image-container">
                  <h4>Diff</h4>
                  <img src="file://${result.diffImage}" alt="Diff image">
                </div>` 
              : ''}
          </div>` 
        : ''}
    </div>
    `;
  }).join('')}
</body>
</html>
  `;
  
  // Write report to file
  await fs.writeFile(reportPath, htmlContent);
  
  console.log(`\n📊 Report generated: ${reportPath}`);
  return reportPath;
}

// Command line interface
if (require.main === module) {
  // Parse arguments
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dashboard' && i + 1 < args.length) {
      options.dashboardIds = args[++i].split(',');
    } else if (arg === '--component' && i + 1 < args.length) {
      options.componentIds = args[++i].split(',');
    } else if (arg === '--breakpoint' && i + 1 < args.length) {
      options.breakpointIds = args[++i].split(',');
    } else if (arg === '--threshold' && i + 1 < args.length) {
      options.threshold = parseFloat(args[++i]);
    } else if (arg === '--start-server') {
      options.startServer = true;
    } else if (arg === '--help') {
      console.log(`
Dashboard QA Tool
----------------

Test Juicer dashboards for visual regressions.

Usage:
  node dashboard_qa.js [options]

Options:
  --dashboard ID     Dashboard IDs to test (comma-separated)
  --component ID     Component IDs to test (comma-separated)
  --breakpoint ID    Breakpoint IDs to test (comma-separated)
  --threshold NUM    Difference threshold (0-1)
  --start-server     Start dashboard server for testing
  --help             Show this help
      `);
      process.exit(0);
    }
  }
  
  // Run tests
  runDashboardQA(options)
    .then(results => {
      // Exit with error code if any tests failed
      if (results.summary.failed > 0) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error running dashboard QA:', error);
      process.exit(1);
    });
}

module.exports = {
  runDashboardQA
};