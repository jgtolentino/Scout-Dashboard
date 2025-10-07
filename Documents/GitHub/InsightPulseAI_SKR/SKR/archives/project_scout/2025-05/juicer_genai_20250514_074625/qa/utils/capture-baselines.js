/**
 * Utility to capture baseline screenshots for visual regression testing
 *
 * Usage:
 * node capture-baselines.js
 *
 * This script will:
 * 1. Launch each dashboard
 * 2. Capture screenshots of key components
 * 3. Save them as baseline images for comparison
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Dashboard component configuration
const dashboards = [
  {
    name: 'drilldown-dashboard',
    url: '${DASHBOARD_URL || "http://localhost:8080"}/dashboards/drilldown-dashboard.html',
    components: [
      { name: 'header', selector: '.dashboard-header' },
      { name: 'brand-table', selector: '.brand-table-container' },
      { name: 'breadcrumb', selector: '.breadcrumb-container' },
      { name: 'kpi-cards', selector: '.kpi-container' },
      { name: 'timeline-chart', selector: '.timeline-chart-container' }
    ]
  },
  {
    name: 'retail-performance',
    url: '${DASHBOARD_URL || "http://localhost:8080"}/dashboards/retail_performance/retail_performance_dashboard.html',
    components: [
      { name: 'header', selector: '.dashboard-header' },
      { name: 'performance-metrics', selector: '.performance-metrics-container' },
      { name: 'regional-map', selector: '.map-container' },
      { name: 'trend-chart', selector: '.trend-chart-container' }
    ]
  }
];

// Create baseline directory if it doesn't exist
const baselineDir = path.join(__dirname, '../baselines');
if (!fs.existsSync(baselineDir)) {
  fs.mkdirSync(baselineDir, { recursive: true });
}

// Function to capture baseline screenshots
async function captureBaselines() {
  console.log('Starting baseline screenshot capture...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    // Capture each dashboard's components
    for (const dashboard of dashboards) {
      console.log(`\nProcessing ${dashboard.name}...`);
      
      // Create new page
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      
      // Navigate to the dashboard
      console.log(`  Navigating to ${dashboard.url}`);
      try {
        await page.goto(dashboard.url, { waitUntil: 'networkidle0', timeout: 30000 });
      } catch (e) {
        console.error(`  ❌ Error navigating to ${dashboard.url}: ${e.message}`);
        console.log('  ⚠️ Creating placeholder baseline images instead...');
        
        await createPlaceholderBaselines(dashboard);
        await page.close();
        continue; // Skip to next dashboard
      }
      
      // Capture each component
      for (const component of dashboard.components) {
        console.log(`  Capturing ${component.name}...`);
        
        try {
          // Wait for the component to be available
          await page.waitForSelector(component.selector, { timeout: 5000 });
          
          // Capture the component
          const elementHandle = await page.$(component.selector);
          
          if (elementHandle) {
            const screenshot = await elementHandle.screenshot();
            
            // Save the screenshot as baseline
            const baselinePath = path.join(baselineDir, `${dashboard.name}-${component.name}.png`);
            fs.writeFileSync(baselinePath, screenshot);
            console.log(`  ✓ Saved baseline for ${component.name}`);
          } else {
            throw new Error('Element not found');
          }
        } catch (e) {
          console.error(`  ❌ Error capturing ${component.name}: ${e.message}`);
          console.log('  ⚠️ Creating placeholder baseline image...');
          
          await createPlaceholderBaseline(dashboard.name, component.name);
        }
      }
      
      // Capture full dashboard for reference
      try {
        const fullScreenshot = await page.screenshot();
        const fullPath = path.join(baselineDir, `${dashboard.name}-full.png`);
        fs.writeFileSync(fullPath, fullScreenshot);
        console.log(`  ✓ Saved full dashboard screenshot`);
      } catch (e) {
        console.error(`  ❌ Error capturing full dashboard: ${e.message}`);
      }
      
      await page.close();
    }
  } finally {
    // Close browser
    await browser.close();
  }
  
  console.log('\nBaseline screenshot capture complete!');
}

// Function to create placeholder baselines for an entire dashboard
async function createPlaceholderBaselines(dashboard) {
  for (const component of dashboard.components) {
    await createPlaceholderBaseline(dashboard.name, component.name);
  }
}

// Function to create a placeholder baseline image
async function createPlaceholderBaseline(dashboardName, componentName) {
  // Create a simple placeholder image using puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 500, height: 300 });
    
    // Set up a simple HTML page with the component name
    await page.setContent(`
      <html>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f0f0f0;">
          <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #aaa; border-radius: 8px;">
            <h2 style="margin: 0; color: #555;">Placeholder: ${componentName}</h2>
            <p style="margin: 10px 0 0; color: #777;">Dashboard: ${dashboardName}</p>
          </div>
        </body>
      </html>
    `);
    
    // Take screenshot
    const screenshot = await page.screenshot();
    
    // Save the screenshot as baseline
    const baselinePath = path.join(baselineDir, `${dashboardName}-${componentName}.png`);
    fs.writeFileSync(baselinePath, screenshot);
    console.log(`  ✓ Created placeholder baseline for ${componentName}`);
    
    await page.close();
  } finally {
    await browser.close();
  }
}

// Run the capture process
captureBaselines().catch(error => {
  console.error('Error capturing baselines:', error);
  process.exit(1);
});