/**
 * Script to create real baseline images from current dashboard state
 * 
 * This utility captures current dashboard components to use as baselines
 * for visual regression testing. Run this when dashboards are stable.
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

async function captureBaselines() {
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}   Creating Real Baseline Images${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}\n`);

  // Get dashboard URL from environment or use default
  const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:8080';
  console.log(`${colors.yellow}Using dashboard URL: ${DASHBOARD_URL}${colors.reset}\n`);

  // Ensure baselines directory exists
  const baselineDir = path.join(__dirname, '../baselines');
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
  }

  // Create the placeholders directory if not exists (for backups)
  const placeholdersDir = path.join(baselineDir, 'placeholders');
  if (!fs.existsSync(placeholdersDir)) {
    fs.mkdirSync(placeholdersDir, { recursive: true });
  }

  // Launch browser
  console.log(`${colors.yellow}Launching browser...${colors.reset}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // Process each dashboard
    for (const dashboard of dashboards) {
      console.log(`\n${colors.yellow}Processing dashboard: ${dashboard.name}${colors.reset}`);
      
      // Create a new page
      const page = await browser.newPage();
      
      // Set viewport to consistent size for testing
      await page.setViewport({ width: 1200, height: 800 });
      
      try {
        // Navigate to dashboard
        console.log(`  Loading ${DASHBOARD_URL}${dashboard.path}`);
        await page.goto(`${DASHBOARD_URL}${dashboard.path}`, { timeout: 30000 });
        await page.waitForTimeout(2000); // Allow time for rendering
        
        // Process each component
        for (const component of dashboard.components) {
          console.log(`  Capturing component: ${component}`);
          
          try {
            // Try to find the component
            await page.waitForSelector(`.${component}`, { timeout: 5000 });
            const elementHandle = await page.$(`.${component}`);
            
            if (elementHandle) {
              // Backup any existing baseline image first
              const baselinePath = path.join(baselineDir, `${dashboard.name}-${component}.png`);
              if (fs.existsSync(baselinePath)) {
                const backupPath = path.join(placeholdersDir, `${dashboard.name}-${component}.png`);
                fs.copyFileSync(baselinePath, backupPath);
                console.log(`  ${colors.green}✓${colors.reset} Backed up existing baseline`);
              }
              
              // Take screenshot and save as baseline
              const screenshot = await elementHandle.screenshot();
              fs.writeFileSync(baselinePath, screenshot);
              console.log(`  ${colors.green}✓${colors.reset} Created baseline: ${dashboard.name}-${component}.png`);
            } else {
              console.log(`  ${colors.red}✗${colors.reset} Component not found: ${component}`);
            }
          } catch (error) {
            console.log(`  ${colors.red}✗${colors.reset} Error capturing ${component}: ${error.message}`);
          }
        }
      } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Failed to load dashboard: ${error.message}`);
      }
      
      // Close the page
      await page.close();
    }

    console.log(`\n${colors.green}${colors.bright}Baseline capture complete!${colors.reset}`);
    console.log(`\n${colors.yellow}Baselines created in: ${baselineDir}${colors.reset}`);
    console.log(`${colors.yellow}Original placeholder backups saved in: ${placeholdersDir}${colors.reset}`);
  } finally {
    // Close the browser
    await browser.close();
  }
  
  console.log(`\n${colors.bright}${colors.blue}========================================${colors.reset}`);
}

// Run the baseline capture
captureBaselines().catch(error => {
  console.error('Baseline capture failed:', error);
  process.exit(1);
});