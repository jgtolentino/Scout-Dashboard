/**
 * QA Framework Test Debugging Utility
 * 
 * This utility helps diagnose and fix issues with the QA tests.
 * It runs tests in debug mode, captures detailed logs, and provides
 * troubleshooting guidance.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create debug logs directory
const debugDir = path.join(__dirname, '../debug');
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
}

// Log file
const logFile = path.join(debugDir, `debug-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Logger
const log = (message) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  console.log(formattedMessage);
  logStream.write(formattedMessage + '\n');
};

// Dashboard URLs to debug
const dashboards = [
  {
    name: 'drilldown-dashboard',
    url: '${DASHBOARD_URL || "http://localhost:8080"}/dashboards/drilldown-dashboard.html',
    selectors: ['.dashboard-header', '.brand-table-container', '.breadcrumb-container']
  },
  {
    name: 'retail-performance',
    url: '${DASHBOARD_URL || "http://localhost:8080"}/dashboards/retail_performance/retail_performance_dashboard.html',
    selectors: ['.dashboard-header', '.performance-metrics-container', '.map-container']
  }
];

// Check test environment
async function checkEnvironment() {
  log('Checking test environment...');
  
  // Check if Node.js version is compatible
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`);
  
  // Check for required files
  const requiredFiles = [
    '../tests/visual-parity.test.js',
    '../tests/behavior-parity.test.js',
    '../tests/accessibility.test.js',
    '../tests/performance.test.js',
    '../themes/tbwa.powerbiTheme.json'
  ];
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    log(`Checking ${file}: ${exists ? 'exists' : 'missing'}`);
    if (!exists) allFilesExist = false;
  }
  
  // Check if servers are running
  log('Checking if dashboard server is running...');
  try {
    execSync('curl -s -o /dev/null -w "%{http_code}" ${DASHBOARD_URL || "http://localhost:8080"}/');
    log('Dashboard server is running');
  } catch (e) {
    log('ERROR: Dashboard server is not running. Please start it with: npm run start:dashboards');
    return false;
  }
  
  return allFilesExist;
}

// Check for browser issues
async function checkBrowser() {
  log('Launching browser in debug mode...');
  const browser = await puppeteer.launch({
    headless: false, // Use headed mode for debugging
    slowMo: 100, // Slow down operations for visual debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    log('Browser launched successfully');
    
    // Create new page
    const page = await browser.newPage();
    
    // Enable verbose logging
    page.on('console', msg => log(`Browser console: ${msg.text()}`));
    page.on('pageerror', error => log(`Browser page error: ${error.message}`));
    page.on('requestfailed', request => log(`Browser request failed: ${request.url()}`));
    
    // Try loading each dashboard
    for (const dashboard of dashboards) {
      log(`Testing dashboard: ${dashboard.name} at ${dashboard.url}`);
      
      try {
        // Navigate to dashboard
        await page.goto(dashboard.url, { waitUntil: 'networkidle0', timeout: 30000 });
        log(`Successfully loaded ${dashboard.name}`);
        
        // Take screenshot for reference
        const screenshotPath = path.join(debugDir, `${dashboard.name}-debug.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        log(`Saved screenshot to ${screenshotPath}`);
        
        // Check for key elements
        for (const selector of dashboard.selectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              log(`✓ Found element: ${selector}`);
              
              // Highlight element for screenshot
              await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                if (el) {
                  el.style.border = '3px solid red';
                  el.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                }
              }, selector);
              
              // Take element screenshot
              const elementScreenshotPath = path.join(debugDir, `${dashboard.name}-${selector.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
              await element.screenshot({ path: elementScreenshotPath });
              log(`Saved element screenshot to ${elementScreenshotPath}`);
            } else {
              log(`✗ Element not found: ${selector}`);
            }
          } catch (e) {
            log(`ERROR checking element ${selector}: ${e.message}`);
          }
        }
        
        // Check page errors
        const pageErrors = await page.evaluate(() => {
          return {
            errorElements: document.querySelectorAll('.error-message, .error, .exception').length,
            hasConsoleErrors: window.hasConsoleErrors || false,
            missingScripts: Array.from(document.querySelectorAll('script')).filter(s => s.src && !s.loaded).length
          };
        });
        
        if (pageErrors.errorElements > 0) {
          log(`WARNING: Found ${pageErrors.errorElements} error elements on page`);
        }
        
        if (pageErrors.hasConsoleErrors) {
          log(`WARNING: Console errors detected`);
        }
        
        if (pageErrors.missingScripts > 0) {
          log(`WARNING: ${pageErrors.missingScripts} scripts failed to load`);
        }
        
      } catch (e) {
        log(`ERROR loading dashboard ${dashboard.name}: ${e.message}`);
      }
    }
    
    return true;
  } catch (e) {
    log(`Browser error: ${e.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

// Run Jest in debug mode
async function debugTests(testPattern) {
  log(`Running tests in debug mode: ${testPattern}`);
  
  try {
    const cmd = `cd ${path.join(__dirname, '..')} && npx jest ${testPattern} --verbose --detectOpenHandles --runInBand`;
    log(`Executing: ${cmd}`);
    
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    log(`Test output: ${output}`);
    
    return output.includes('PASS');
  } catch (e) {
    log(`Test error: ${e.message}`);
    if (e.stdout) log(`Test output: ${e.stdout}`);
    if (e.stderr) log(`Test error output: ${e.stderr}`);
    
    return false;
  }
}

// Generate diagnostic report
function generateReport() {
  log('Generating diagnostic report...');
  
  const reportPath = path.join(debugDir, 'diagnostic-report.html');
  
  // Get list of screenshots
  const screenshots = fs.readdirSync(debugDir)
    .filter(file => file.endsWith('.png'))
    .map(file => path.join('debug', file));
  
  // Read log file
  const logContent = fs.readFileSync(logFile, 'utf-8');
  
  // Generate HTML report
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>QA Framework Debug Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #333; }
          .screenshots { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
          .screenshot { max-width: 400px; border: 1px solid #ddd; }
          .screenshot img { max-width: 100%; }
          .screenshot p { margin: 5px; font-size: 12px; }
          pre { background-color: #f5f5f5; padding: 10px; overflow: auto; max-height: 500px; }
          .recommendations { background-color: #fff8e1; padding: 10px; border-left: 5px solid #ffc107; }
        </style>
      </head>
      <body>
        <h1>QA Framework Debug Report</h1>
        <p>Generated at: ${new Date().toISOString()}</p>
        
        <h2>Screenshots</h2>
        <div class="screenshots">
          ${screenshots.map(screenshot => `
            <div class="screenshot">
              <img src="../${screenshot}" alt="${path.basename(screenshot)}" />
              <p>${path.basename(screenshot)}</p>
            </div>
          `).join('')}
        </div>
        
        <h2>Log Output</h2>
        <pre>${logContent}</pre>
        
        <h2>Recommendations</h2>
        <div class="recommendations">
          <p>Based on the debug information, here are some recommendations:</p>
          <ul>
            <li>Check that all dashboard components have proper class names for test selectors</li>
            <li>Ensure the dashboard server is running when tests are executed</li>
            <li>Verify that all dashboard URLs are correct in the test files</li>
            <li>Make sure all puppeteer selectors match actual elements in the dashboards</li>
            <li>Add client-side error logging to catch JS exceptions in the dashboards</li>
          </ul>
        </div>
      </body>
    </html>
  `;
  
  fs.writeFileSync(reportPath, html);
  log(`Report generated at ${reportPath}`);
}

// Main debug function
async function main() {
  log('Starting QA test debugging...');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const testPattern = args[0] || '';
  
  // Run checks
  const envOk = await checkEnvironment();
  if (!envOk) {
    log('ERROR: Environment check failed');
    generateReport();
    return;
  }
  
  const browserOk = await checkBrowser();
  if (!browserOk) {
    log('ERROR: Browser check failed');
    generateReport();
    return;
  }
  
  if (testPattern) {
    const testsOk = await debugTests(testPattern);
    if (!testsOk) {
      log(`ERROR: Tests failed: ${testPattern}`);
    } else {
      log(`Tests passed: ${testPattern}`);
    }
  }
  
  generateReport();
  log('Debug session completed.');
  logStream.end();
}

main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  logStream.end();
});