/**
 * Generate mock PNG files for testing
 * 
 * This utility creates mock PNG files that can be used in CI environments
 * where real baseline images aren't available.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Dashboard configurations
const dashboards = [
  {
    name: 'drilldown-dashboard',
    components: ['header', 'brand-table', 'breadcrumb', 'kpi-cards', 'timeline-chart']
  },
  {
    name: 'retail-performance',
    components: ['header', 'performance-metrics', 'regional-map', 'trend-chart']
  }
];

// Create baseline directory if it doesn't exist
const baselineDir = path.join(__dirname, '../baselines');
if (!fs.existsSync(baselineDir)) {
  fs.mkdirSync(baselineDir, { recursive: true });
}

// Generate mock PNG files for all components
async function generateMockPNGs() {
  console.log('Generating mock PNG files for testing...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 500, height: 300 });
    
    // Generate mock PNG for each component
    for (const dashboard of dashboards) {
      for (const component of dashboard.components) {
        const baselinePath = path.join(baselineDir, `${dashboard.name}-${component}.png`);
        
        // Check if PNG already exists
        if (fs.existsSync(baselinePath)) {
          console.log(`PNG file already exists for ${dashboard.name}-${component}`);
          continue;
        }
        
        console.log(`Generating mock PNG for ${dashboard.name}-${component}...`);
        
        // Create a simple HTML page for the component
        await page.setContent(`
          <html>
            <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f0f0f0;">
              <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #aaa; border-radius: 8px;">
                <h2 style="margin: 0; color: #555;">Mock: ${component}</h2>
                <p style="margin: 10px 0 0; color: #777;">Dashboard: ${dashboard.name}</p>
              </div>
            </body>
          </html>
        `);
        
        // Take screenshot
        const screenshot = await page.screenshot();
        
        // Save the screenshot as baseline PNG
        fs.writeFileSync(baselinePath, screenshot);
        console.log(`  ✓ Created ${dashboard.name}-${component}.png`);
      }
    }
  } finally {
    await browser.close();
  }
  
  console.log('Mock PNG generation complete!');
}

// Run the generation process
generateMockPNGs().catch(error => {
  console.error('Error generating mock PNGs:', error);
  process.exit(1);
});