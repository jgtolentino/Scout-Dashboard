/**
 * verify_dashboards.js
 * 
 * A utility to verify that all dashboard URLs are accessible and correctly rendered.
 * This script runs as part of the QA process to ensure all dashboard components are working.
 */

const axios = require('axios');
const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Dashboard configurations to test
const DASHBOARDS = [
  {
    id: 'insights-dashboard',
    url: 'http://localhost:9090/dashboards/insights_dashboard.html',
    components: ['#insightsContainer', '#brandChart', '#sentimentChart', '#tagCloud'],
    title: 'Juicer Insights Dashboard'
  },
  {
    id: 'brand-heatmap',
    url: 'http://localhost:9090/dashboards/agent_brand_heatmap.dbviz',
    components: ['.heatmap-container', '.sentiment-legend', '.brand-filter'],
    title: 'Brand Mentions Heatmap'
  }
];

/**
 * Verify dashboard accessibility and components
 * @returns {Promise<Object>} Verification results
 */
async function verifyDashboards(baseUrl = null) {
  console.log('🔍 Verifying dashboard accessibility...');
  
  const results = {
    timestamp: new Date().toISOString(),
    dashboards: [],
    overallStatus: 'PASS'
  };
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  try {
    // Test each dashboard
    for (const dashboard of DASHBOARDS) {
      const url = baseUrl ? `${baseUrl}${new URL(dashboard.url).pathname}` : dashboard.url;
      console.log(`Testing dashboard: ${dashboard.id} (${url})`);
      
      const dashboardResult = {
        id: dashboard.id,
        url,
        status: 'PASS',
        errors: [],
        components: []
      };
      
      // Check if URL is accessible
      let accessible = false;
      try {
        const response = await axios.get(url);
        accessible = response.status === 200;
      } catch (error) {
        accessible = false;
        dashboardResult.errors.push(`URL not accessible: ${error.message}`);
      }
      
      if (!accessible) {
        dashboardResult.status = 'FAIL';
        results.overallStatus = 'FAIL';
        results.dashboards.push(dashboardResult);
        continue;
      }
      
      // Visit page with browser
      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Check page title
        const title = await page.title();
        if (dashboard.title && !title.includes(dashboard.title)) {
          dashboardResult.status = 'WARN';
          dashboardResult.errors.push(`Page title mismatch. Expected: ${dashboard.title}, Actual: ${title}`);
          if (results.overallStatus === 'PASS') results.overallStatus = 'WARN';
        }
        
        // Check each component
        for (const selector of dashboard.components) {
          const componentResult = {
            selector,
            status: 'PASS',
            visible: false,
            error: null
          };
          
          try {
            // Wait for selector and check visibility
            await page.waitForSelector(selector, { timeout: 10000 });
            const element = await page.$(selector);
            
            if (element) {
              const isVisible = await element.isVisible();
              componentResult.visible = isVisible;
              
              if (!isVisible) {
                componentResult.status = 'FAIL';
                componentResult.error = 'Component exists but is not visible';
                dashboardResult.status = 'FAIL';
                results.overallStatus = 'FAIL';
              }
            } else {
              componentResult.status = 'FAIL';
              componentResult.error = 'Component not found';
              dashboardResult.status = 'FAIL';
              results.overallStatus = 'FAIL';
            }
          } catch (error) {
            componentResult.status = 'FAIL';
            componentResult.error = `Error finding component: ${error.message}`;
            dashboardResult.status = 'FAIL';
            results.overallStatus = 'FAIL';
          }
          
          dashboardResult.components.push(componentResult);
        }
      } catch (error) {
        dashboardResult.status = 'FAIL';
        dashboardResult.errors.push(`Failed to load page: ${error.message}`);
        results.overallStatus = 'FAIL';
      } finally {
        await page.close();
      }
      
      results.dashboards.push(dashboardResult);
    }
  } finally {
    await browser.close();
  }
  
  return results;
}

/**
 * Generate HTML report for verification results
 * @param {Object} results - Verification results
 * @param {string} outputPath - Path to save report
 */
async function generateReport(results, outputPath) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Verification Report</title>
  <style>
    :root {
      --primary: #ff3300;
      --secondary: #002b49;
      --success: #28a745;
      --danger: #dc3545;
      --warning: #ffc107;
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
    
    .summary-box.pass {
      background-color: var(--success);
      color: white;
    }
    
    .summary-box.fail {
      background-color: var(--danger);
      color: white;
    }
    
    .summary-box.warn {
      background-color: var(--warning);
      color: black;
    }
    
    .dashboard-card {
      margin-bottom: 15px;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .dashboard-card.pass {
      border-left: 5px solid var(--success);
    }
    
    .dashboard-card.fail {
      border-left: 5px solid var(--danger);
    }
    
    .dashboard-card.warn {
      border-left: 5px solid var(--warning);
    }
    
    .dashboard-card h3 {
      margin-top: 0;
      display: flex;
      justify-content: space-between;
    }
    
    .status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
    }
    
    .status.pass {
      background-color: var(--success);
      color: white;
    }
    
    .status.fail {
      background-color: var(--danger);
      color: white;
    }
    
    .status.warn {
      background-color: var(--warning);
      color: black;
    }
    
    .error-list {
      background-color: #fff3cd;
      color: #856404;
      padding: 10px;
      border-radius: 3px;
      margin-top: 10px;
    }
    
    .component-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .component-table th, .component-table td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    .component-table th {
      background-color: #f2f2f2;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Dashboard Verification Report</h1>
    <p>Generated on ${new Date(results.timestamp).toLocaleString()}</p>
  </div>
  
  <div class="summary">
    <div class="summary-box ${results.overallStatus.toLowerCase()}">
      <h3>Overall Status</h3>
      <h2>${results.overallStatus}</h2>
    </div>
  </div>
  
  <h2>Dashboard Results</h2>
  
  ${results.dashboards.map(dashboard => `
    <div class="dashboard-card ${dashboard.status.toLowerCase()}">
      <h3>
        ${dashboard.id}
        <span class="status ${dashboard.status.toLowerCase()}">${dashboard.status}</span>
      </h3>
      <p>URL: <a href="${dashboard.url}" target="_blank">${dashboard.url}</a></p>
      
      ${dashboard.errors.length > 0 ? `
        <div class="error-list">
          <h4>Errors:</h4>
          <ul>
            ${dashboard.errors.map(error => `<li>${error}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <h4>Components:</h4>
      <table class="component-table">
        <thead>
          <tr>
            <th>Selector</th>
            <th>Status</th>
            <th>Visible</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          ${dashboard.components.map(component => `
            <tr>
              <td><code>${component.selector}</code></td>
              <td><span class="status ${component.status.toLowerCase()}">${component.status}</span></td>
              <td>${component.visible ? '✅' : '❌'}</td>
              <td>${component.error || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}
</body>
</html>
  `;
  
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, htmlContent);
  
  console.log(`Report generated: ${outputPath}`);
}

// Command line interface
if (require.main === module) {
  // Parse arguments
  const args = process.argv.slice(2);
  let baseUrl = null;
  let outputPath = 'qa/reports/dashboard-verification.html';
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--base-url' && i + 1 < args.length) {
      baseUrl = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      outputPath = args[++i];
    } else if (arg === '--help') {
      console.log(`
Dashboard Verification Tool
--------------------------

Verify dashboard accessibility and component rendering.

Usage:
  node verify_dashboards.js [options]

Options:
  --base-url URL     Base URL for dashboards (default: http://localhost:9090)
  --output PATH      Output path for report (default: qa/reports/dashboard-verification.html)
  --help             Show this help
      `);
      process.exit(0);
    }
  }
  
  // Run verification
  verifyDashboards(baseUrl)
    .then(async results => {
      console.log('Verification complete');
      
      // Print summary
      console.log(`Overall status: ${results.overallStatus}`);
      for (const dashboard of results.dashboards) {
        console.log(`- ${dashboard.id}: ${dashboard.status}`);
      }
      
      // Generate report
      await generateReport(results, outputPath);
      
      // Exit with error code if verification failed
      if (results.overallStatus !== 'PASS') {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = {
  verifyDashboards,
  generateReport
};