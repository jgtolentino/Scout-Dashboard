/**
 * Component Validation Utility for QA Framework
 * 
 * This script validates dashboard components and generates a report
 * of which components can be successfully located in the dashboard.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Dashboard configurations (same as tests)
const dashboards = [
  {
    name: 'drilldown-dashboard',
    path: '/dashboards/drilldown-dashboard.html',
    components: ['header', 'brand-table', 'breadcrumb', 'kpi-cards', 'timeline-chart']
  },
  {
    name: 'retail-performance',
    path: '/dashboards/retail_performance/retail_performance_dashboard.html',
    components: ['header', 'performance-metrics', 'regional-map', 'trend-chart']
  }
];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

async function validateComponents() {
  console.log(`${colors.bright}${colors.blue}==========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}   Dashboard Component Validation${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}==========================================${colors.reset}\n`);

  // Get dashboard URL from environment or use default
  const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:8080';
  console.log(`${colors.yellow}Using dashboard URL: ${DASHBOARD_URL}${colors.reset}\n`);

  // Launch browser
  let browser;
  try {
    console.log(`${colors.yellow}Launching browser...${colors.reset}`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Create results directory if it doesn't exist
    const debugDir = path.join(__dirname, '../debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    // Generate report file
    const reportFile = path.join(debugDir, 'component_validation_report.md');
    let reportContent = `# Dashboard Component Validation Report\n\n`;
    reportContent += `Generated: ${new Date().toISOString()}\n\n`;
    reportContent += `Dashboard URL: ${DASHBOARD_URL}\n\n`;

    // Process each dashboard
    for (const dashboard of dashboards) {
      console.log(`\n${colors.yellow}Validating dashboard: ${dashboard.name}${colors.reset}`);
      reportContent += `## ${dashboard.name}\n\n`;
      
      // Create a new page
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      
      // Navigate to dashboard
      console.log(`  Navigating to ${DASHBOARD_URL}${dashboard.path}`);
      try {
        await page.goto(`${DASHBOARD_URL}${dashboard.path}`, { timeout: 30000 });
        reportContent += `Dashboard URL: ${DASHBOARD_URL}${dashboard.path}\n\n`;
        
        // Take full page screenshot for reference
        const screenshotPath = path.join(debugDir, `${dashboard.name}-full.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  ${colors.green}✓${colors.reset} Captured full page screenshot`);
        reportContent += `![Full Dashboard](${dashboard.name}-full.png)\n\n`;
        
        // Create component table in report
        reportContent += `| Component | Status | Screenshot |\n`;
        reportContent += `|-----------|--------|------------|\n`;
        
        // Check each component
        for (const component of dashboard.components) {
          console.log(`  Checking component: ${component}`);
          
          // Try to find the component
          const elementHandle = await page.$(`.${component}`).catch(() => null);
          
          if (elementHandle) {
            console.log(`  ${colors.green}✓${colors.reset} Found component: ${component}`);
            
            // Take screenshot of the component
            const componentScreenshotPath = path.join(debugDir, `${dashboard.name}-${component}.png`);
            await elementHandle.screenshot({ path: componentScreenshotPath }).catch(e => {
              console.log(`  ${colors.red}✗${colors.reset} Failed to screenshot component: ${e.message}`);
            });
            
            reportContent += `| ${component} | ✅ Found | ![${component}](${dashboard.name}-${component}.png) |\n`;
          } else {
            console.log(`  ${colors.red}✗${colors.reset} Component not found: ${component}`);
            reportContent += `| ${component} | ❌ Not found | N/A |\n`;
          }
        }
        
        reportContent += '\n';
      } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Failed to load dashboard: ${error.message}`);
        reportContent += `**ERROR**: Failed to load dashboard: ${error.message}\n\n`;
      }
      
      // Close the page
      await page.close();
    }
    
    // Write report to file
    fs.writeFileSync(reportFile, reportContent);
    console.log(`\n${colors.green}Report generated: ${reportFile}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error during validation:${colors.reset}`, error);
  } finally {
    // Close the browser
    if (browser) {
      await browser.close();
    }
  }
  
  console.log(`\n${colors.bright}${colors.blue}Component validation complete${colors.reset}`);
}

// Run validation
validateComponents().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});