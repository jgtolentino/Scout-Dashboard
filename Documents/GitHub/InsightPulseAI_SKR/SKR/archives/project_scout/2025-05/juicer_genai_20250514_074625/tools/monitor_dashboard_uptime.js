/**
 * Simple dashboard uptime monitor script
 * Checks dashboard availability and captures visual state
 * 
 * Usage: node monitor_dashboard_uptime.js [url] [interval-minutes]
 * Example: node monitor_dashboard_uptime.js https://gentle-rock-04e54f40f.6.azurestaticapps.net 60
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DASHBOARD_URL = process.argv[2] || 'https://gentle-rock-04e54f40f.6.azurestaticapps.net/insights_dashboard.html';
const CHECK_INTERVAL_MINUTES = parseInt(process.argv[3] || '60', 10);
const LOGS_DIR = path.join(__dirname, '../logs');
const SCREENSHOTS_DIR = path.join(LOGS_DIR, 'uptime_screenshots');
const LOG_FILE = path.join(LOGS_DIR, 'dashboard_uptime.log');

// Ensure directories exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Log helper function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
  
  // For errors, also send notification (if configured)
  if (level === 'ERROR') {
    sendNotification(message);
  }
}

// Simple notification function (customize as needed)
function sendNotification(message) {
  // This is a placeholder - implement your own notification method
  // Examples:
  // - Send email alert
  // - Post to Slack or Teams
  // - Trigger Azure alert
  console.log(`⚠️ ALERT: ${message}`);
  
  // Log alert to a separate file for easier tracking
  const alertsFile = path.join(LOGS_DIR, 'dashboard_alerts.log');
  fs.appendFileSync(alertsFile, `[${new Date().toISOString()}] ${message}\n`);
}

// Check dashboard availability
async function checkDashboard() {
  log(`Starting uptime check for ${DASHBOARD_URL}`);
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Open new page
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });
    
    // Record performance metrics
    const startTime = Date.now();
    
    // Navigate to dashboard
    const response = await page.goto(DASHBOARD_URL, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Check response status
    const status = response.status();
    const loadTime = Date.now() - startTime;
    
    if (status !== 200) {
      throw new Error(`Dashboard returned status code ${status}`);
    }
    
    // Wait for dashboard visualization to load
    await page.waitForTimeout(5000);
    
    // Count chart elements to verify rendering
    const chartCount = await page.evaluate(() => {
      return document.querySelectorAll('canvas').length;
    });
    
    if (chartCount < 1) {
      throw new Error('No chart elements found on dashboard');
    }
    
    // Capture screenshot
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const screenshotPath = path.join(SCREENSHOTS_DIR, `uptime_check_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Log success
    log(`Dashboard check successful. Status: ${status}, Load time: ${loadTime}ms, Charts: ${chartCount}`);
    
    // Check for JavaScript errors
    const jsErrors = await page.evaluate(() => {
      return window.dashboardErrors || [];
    });
    
    if (jsErrors.length > 0) {
      log(`JavaScript errors detected: ${JSON.stringify(jsErrors)}`, 'WARNING');
    }
    
    // Compare with previous screenshot for visual regression
    const files = fs.readdirSync(SCREENSHOTS_DIR)
      .filter(f => f.startsWith('uptime_check_') && f.endsWith('.png'))
      .sort();
    
    if (files.length > 1) {
      const previousScreenshot = path.join(SCREENSHOTS_DIR, files[files.length - 2]);
      const currentScreenshot = screenshotPath;
      
      try {
        // Simple visual comparison (requires ImageMagick)
        const command = `compare -metric MSE "${previousScreenshot}" "${currentScreenshot}" null: 2>&1`;
        const output = execSync(command).toString();
        
        // Parse difference percentage
        const diff = parseFloat(output);
        
        if (diff > 0.1) {
          log(`Visual regression detected! Difference: ${diff}`, 'WARNING');
        }
      } catch (error) {
        // ImageMagick not available or comparison failed
        log('Visual comparison skipped: ' + error.message, 'WARNING');
      }
    }
    
  } catch (error) {
    // Log failure
    log(`Dashboard check failed: ${error.message}`, 'ERROR');
  } finally {
    // Close browser
    if (browser) {
      await browser.close();
    }
  }
  
  // Schedule next check
  log(`Next check in ${CHECK_INTERVAL_MINUTES} minutes`);
  setTimeout(checkDashboard, CHECK_INTERVAL_MINUTES * 60 * 1000);
}

// Start monitoring
log(`Starting dashboard uptime monitor for ${DASHBOARD_URL}`);
log(`Check interval: ${CHECK_INTERVAL_MINUTES} minutes`);
log(`Logs directory: ${LOGS_DIR}`);
log(`Screenshots directory: ${SCREENSHOTS_DIR}`);

// Run first check
checkDashboard();