/**
 * validate_ui.js - UI Screenshot Validation for Scout Advisor Dashboard
 * 
 * This script:
 * 1. Takes screenshots of the deployed dashboard
 * 2. Compares with baseline screenshots
 * 3. Validates visual elements match PRD requirements
 * 
 * Used by Caca QA Agent for independent verification.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);
let url = 'https://white-island-0c3f00f00.6.azurestaticapps.net/advisor';
let version = 'v1.0.0';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && i + 1 < args.length) {
    url = args[i + 1];
    i++;
  } else if (args[i] === '--version' && i + 1 < args.length) {
    version = args[i + 1];
    i++;
  }
}

// Configuration
const config = {
  outputDir: path.resolve(__dirname, `../../qa/snapshots/advisor-${version}`),
  tmpDir: path.resolve(__dirname, `../../qa/tmp`),
  baselineDir: path.resolve(__dirname, `../../qa/baselines`),
  viewports: [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 414, height: 896, name: 'mobile' }
  ],
  elements: [
    { name: 'header', selector: 'header', description: 'Dashboard header' },
    { name: 'navbar', selector: 'nav', description: 'Navigation bar' },
    { name: 'data-toggle', selector: '.data-source-toggle', description: 'Data source toggle' },
    { name: 'insights-grid', selector: '.insights-grid', description: 'Insights grid' },
    { name: 'kpi-cards', selector: '.kpi-row', description: 'KPI cards' }
  ]
};

// Ensure directories exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}
if (!fs.existsSync(config.tmpDir)) {
  fs.mkdirSync(config.tmpDir, { recursive: true });
}

/**
 * Take screenshots of the dashboard at different viewports
 */
async function captureScreenshots() {
  console.log(`Capturing screenshots of ${url}`);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    url,
    version,
    viewport_screenshots: [],
    element_screenshots: [],
    validation_results: []
  };
  
  try {
    const page = await browser.newPage();
    
    // Add custom handler for console messages from the page
    page.on('console', message => {
      console.log(`Browser console ${message.type()}: ${message.text()}`);
    });
    
    // Navigate to the page
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for important elements to be visible
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Allow time for any animations or dynamic content to load
    await page.waitForTimeout(2000);
    
    // Take full-page screenshots at different viewport sizes
    for (const viewport of config.viewports) {
      console.log(`Taking screenshot at ${viewport.name} size: ${viewport.width}x${viewport.height}`);
      await page.setViewport({ width: viewport.width, height: viewport.height });
      
      // Wait for layout to adjust
      await page.waitForTimeout(1000);
      
      const screenshotPath = path.join(config.outputDir, `full_${viewport.name}_${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      results.viewport_screenshots.push({
        viewport: viewport.name,
        path: screenshotPath,
        dimensions: `${viewport.width}x${viewport.height}`
      });
    }
    
    // Set to desktop viewport for element screenshots
    await page.setViewport({ width: config.viewports[0].width, height: config.viewports[0].height });
    
    // Take screenshots of specific elements
    for (const element of config.elements) {
      try {
        console.log(`Looking for element: ${element.name} (${element.selector})`);
        if (await page.$(element.selector)) {
          console.log(`Found ${element.name}, taking screenshot`);
          const elementHandle = await page.$(element.selector);
          const screenshotPath = path.join(config.outputDir, `element_${element.name}_${Date.now()}.png`);
          
          await elementHandle.screenshot({ path: screenshotPath });
          
          results.element_screenshots.push({
            element: element.name,
            path: screenshotPath,
            selector: element.selector,
            found: true
          });
          
          // Add to validation results
          results.validation_results.push({
            element: element.name,
            status: 'PASS',
            message: `${element.description} found and captured`
          });
        } else {
          console.log(`Element ${element.name} not found!`);
          results.element_screenshots.push({
            element: element.name,
            path: null,
            selector: element.selector,
            found: false
          });
          
          // Add to validation results
          results.validation_results.push({
            element: element.name,
            status: 'FAIL',
            message: `${element.description} not found on page`
          });
        }
      } catch (err) {
        console.error(`Error capturing ${element.name}:`, err);
        results.validation_results.push({
          element: element.name,
          status: 'ERROR',
          message: `Error capturing ${element.description}: ${err.message}`
        });
      }
    }
    
    // Capture HTML content for text analysis
    const htmlContent = await page.content();
    const htmlPath = path.join(config.outputDir, `page_content_${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Basic HTML validation
    const htmlValidation = validateHtml(htmlContent);
    results.validation_results.push(...htmlValidation);
    
    // Generate page hash to check for empty content
    const hash = createHash('md5').update(htmlContent).digest('hex');
    results.page_hash = hash;
    results.content_byte_length = htmlContent.length;
    
    if (htmlContent.length < 1000) {
      results.validation_results.push({
        element: 'page_content',
        status: 'WARN',
        message: 'Page content seems very small, possibly empty or error page'
      });
    }
    
    // Save results
    fs.writeFileSync(
      path.join(config.tmpDir, `ui_validation_results.json`),
      JSON.stringify(results, null, 2)
    );
    
    // Create summary
    const passCount = results.validation_results.filter(r => r.status === 'PASS').length;
    const failCount = results.validation_results.filter(r => r.status === 'FAIL').length;
    const warnCount = results.validation_results.filter(r => r.status === 'WARN').length;
    const errorCount = results.validation_results.filter(r => r.status === 'ERROR').length;
    
    const summary = {
      total_checks: results.validation_results.length,
      pass: passCount,
      fail: failCount,
      warn: warnCount,
      error: errorCount,
      overall_status: failCount > 0 || errorCount > 0 ? 'FAIL' : (warnCount > 0 ? 'WARN' : 'PASS'),
      screenshot_count: results.viewport_screenshots.length + results.element_screenshots.filter(e => e.found).length
    };
    
    results.summary = summary;
    
    // Update the results file with summary
    fs.writeFileSync(
      path.join(config.tmpDir, `ui_validation_results.json`),
      JSON.stringify(results, null, 2)
    );
    
    // Generate markdown report
    generateMarkdownReport(results);
    
    console.log(`UI validation complete. Status: ${summary.overall_status}`);
    console.log(`Pass: ${passCount}, Fail: ${failCount}, Warn: ${warnCount}, Error: ${errorCount}`);
    console.log(`Screenshots saved to ${config.outputDir}`);
    console.log(`Results saved to ${path.join(config.tmpDir, 'ui_validation_results.json')}`);
    
  } catch (err) {
    console.error('Error during UI validation:', err);
    results.validation_results.push({
      element: 'overall',
      status: 'ERROR',
      message: `Validation error: ${err.message}`
    });
    
    // Save error results
    fs.writeFileSync(
      path.join(config.tmpDir, `ui_validation_results.json`),
      JSON.stringify(results, null, 2)
    );
    
    // Exit with error code
    process.exit(1);
  } finally {
    await browser.close();
  }
}

/**
 * Basic HTML validation checks
 */
function validateHtml(html) {
  const results = [];
  
  // Check for doctype
  if (!html.toLowerCase().includes('<!doctype html>')) {
    results.push({
      element: 'doctype',
      status: 'WARN',
      message: 'Missing DOCTYPE declaration'
    });
  }
  
  // Check for <head> and <body> tags
  if (!html.toLowerCase().includes('<head>')) {
    results.push({
      element: 'head',
      status: 'WARN',
      message: 'Missing <head> tag'
    });
  }
  
  if (!html.toLowerCase().includes('<body>')) {
    results.push({
      element: 'body',
      status: 'WARN',
      message: 'Missing <body> tag'
    });
  }
  
  // Check for the main content elements expected in a dashboard
  const contentChecks = [
    { pattern: /<header|class="header"|id="header"/, element: 'header', message: 'Header section found' },
    { pattern: /<nav|class="navbar"|id="navbar"/, element: 'navigation', message: 'Navigation section found' },
    { pattern: /class="container"|class="main"|<main/, element: 'main_content', message: 'Main content section found' },
    { pattern: /class="data-source-toggle"|id="data-source-toggle"/, element: 'data_toggle', message: 'Data source toggle found' },
    { pattern: /class="dashboard"|id="dashboard"/, element: 'dashboard', message: 'Dashboard container found' }
  ];
  
  contentChecks.forEach(check => {
    if (check.pattern.test(html)) {
      results.push({
        element: check.element,
        status: 'PASS',
        message: check.message
      });
    } else {
      results.push({
        element: check.element,
        status: 'WARN',
        message: `Could not find ${check.element} in HTML`
      });
    }
  });
  
  return results;
}

/**
 * Generate a markdown report from results
 */
function generateMarkdownReport(results) {
  let markdown = `# Advisor Dashboard UI Validation Report\n\n`;
  
  markdown += `## Overview\n\n`;
  markdown += `- **URL:** ${results.url}\n`;
  markdown += `- **Version:** ${results.version}\n`;
  markdown += `- **Timestamp:** ${results.timestamp}\n`;
  markdown += `- **Status:** ${results.summary.overall_status}\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- Total checks: ${results.summary.total_checks}\n`;
  markdown += `- Passed: ${results.summary.pass}\n`;
  markdown += `- Failed: ${results.summary.fail}\n`;
  markdown += `- Warnings: ${results.summary.warn}\n`;
  markdown += `- Errors: ${results.summary.error}\n`;
  markdown += `- Screenshots captured: ${results.summary.screenshot_count}\n\n`;
  
  // Validation results
  markdown += `## Validation Results\n\n`;
  markdown += `| Element | Status | Message |\n`;
  markdown += `|---------|--------|--------|\n`;
  
  results.validation_results.forEach(result => {
    const statusIcon = result.status === 'PASS' ? '✅' : 
                       result.status === 'FAIL' ? '❌' : 
                       result.status === 'WARN' ? '⚠️' : '🔥';
    markdown += `| ${result.element} | ${statusIcon} ${result.status} | ${result.message} |\n`;
  });
  
  markdown += `\n## Screenshots\n\n`;
  markdown += `### Viewport Screenshots\n\n`;
  
  results.viewport_screenshots.forEach(screenshot => {
    markdown += `- **${screenshot.viewport}** (${screenshot.dimensions}): \`${path.basename(screenshot.path)}\`\n`;
  });
  
  markdown += `\n### Element Screenshots\n\n`;
  
  results.element_screenshots.forEach(screenshot => {
    if (screenshot.found) {
      markdown += `- **${screenshot.element}** (\`${screenshot.selector}\`): \`${path.basename(screenshot.path)}\`\n`;
    } else {
      markdown += `- **${screenshot.element}** (\`${screenshot.selector}\`): Not found ❌\n`;
    }
  });
  
  // Write the report
  fs.writeFileSync(
    path.join(config.tmpDir, `ui_validation_report.md`),
    markdown
  );
}

// Run the validation
captureScreenshots().catch(err => {
  console.error('Fatal error during validation:', err);
  process.exit(1);
});