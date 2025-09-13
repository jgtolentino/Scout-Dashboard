# Troubleshooting Guide

This document provides solutions for common issues encountered when using the Scout Dashboard QA Framework.

## Table of Contents
- [Visual Test Issues](#visual-test-issues)
- [Behavior Test Issues](#behavior-test-issues)
- [Accessibility Test Issues](#accessibility-test-issues)
- [Performance Test Issues](#performance-test-issues)
- [CI/CD Issues](#cicd-issues)
- [Environment Setup Issues](#environment-setup-issues)
- [Browser Automation Issues](#browser-automation-issues)

## Visual Test Issues

### Unexpected Visual Differences

**Problem**: Tests show pixel differences when there should be none.

**Solutions**:
1. **Check Font Rendering**
   - Ensure fonts are loaded correctly
   - Pre-load fonts before screenshot: `await page.evaluate(() => document.fonts.ready)`

2. **Check Browser Versions**
   - Use the same Puppeteer/Chromium version everywhere
   - Check `package.json` for version specifications

3. **Check Device Pixel Ratio**
   - Ensure consistent device pixel ratio: 
     ```javascript
     await page.evaluateOnNewDocument(() => {
       Object.defineProperty(window, 'devicePixelRatio', { get: () => 1 });
     });
     ```

4. **Adjust Threshold**
   - Increase pixel match threshold in `config.js`:
     ```javascript
     pixelMatchThreshold: 0.15, // More tolerant of small differences
     ```
   
5. **Check for Dynamic Content**
   - Mock API responses for consistent data
   - Fix timestamps for date-based content
   - Use a test account with consistent data

### Missing Baselines

**Problem**: Tests fail because baseline images are missing.

**Solutions**:
1. **Generate Baselines**
   ```bash
   npm run capture-baselines
   ```

2. **Check Path Configuration**
   - Verify dashboard and component names in `config.js`
   - Ensure baseline directory structure matches test expectations

3. **Check for SVG vs PNG Issues**
   - Convert SVG placeholders to PNG:
     ```bash
     node utils/convert_svg_to_png.js
     ```

4. **Verify Git LFS**
   - Check if large PNG files are being tracked properly
   - Run `git lfs pull` to fetch missing files

## Behavior Test Issues

### Selectors Not Found

**Problem**: Tests fail with "Timeout waiting for selector".

**Solutions**:
1. **Check Selectors**
   - Verify selectors in the dashboard HTML
   - Use more robust selectors with data attributes: `[data-testid="chart-container"]`

2. **Increase Timeouts**
   ```javascript
   await page.waitForSelector('.chart', { timeout: 10000 });
   ```

3. **Check Component Rendering**
   - Add logging to see when components render
   - Ensure data is loaded before testing interactions

4. **Use waitForFunction**
   ```javascript
   await page.waitForFunction(() => 
     document.querySelector('.chart') && 
     document.querySelector('.chart').getBoundingClientRect().height > 0
   );
   ```

### Interaction Failures

**Problem**: Simulated interactions don't produce expected results.

**Solutions**:
1. **Check Element Visibility**
   ```javascript
   const isVisible = await page.evaluate(el => {
     const style = window.getComputedStyle(el);
     return style.display !== 'none' && 
            style.visibility !== 'hidden' && 
            style.opacity !== '0';
   }, element);
   ```

2. **Ensure Element is Clickable**
   - Check for overlays or modals blocking interaction
   - Verify z-index values

3. **Use Proper Events**
   - Some components need specific events:
     ```javascript
     await page.evaluate(el => {
       const event = new MouseEvent('mousedown', {
         bubbles: true,
         cancelable: true,
         view: window
       });
       el.dispatchEvent(event);
     }, element);
     ```

4. **Add Delays Between Actions**
   ```javascript
   await page.click('.filter-option');
   await page.waitForTimeout(500); // Give time for state to update
   await page.click('.apply-button');
   ```

## Accessibility Test Issues

### False Positives

**Problem**: Accessibility tests report issues that don't affect actual usage.

**Solutions**:
1. **Configure Axe Rules**
   ```javascript
   const results = await axe.run(page, {
     rules: {
       'color-contrast': { enabled: false },
       'document-title': { enabled: false }
     }
   });
   ```

2. **Add Context-Specific Exceptions**
   ```javascript
   // In jest.setup.js or test file
   const axeExceptions = [
     {
       id: 'aria-required-children',
       selector: '.visualization-container'
     }
   ];
   
   // Filter violations based on exceptions
   const filteredViolations = results.violations.filter(violation => {
     const exception = axeExceptions.find(ex => ex.id === violation.id);
     if (!exception) return true;
     
     // Remove nodes that match exception selector
     violation.nodes = violation.nodes.filter(node => 
       !node.target.some(target => 
         target.match(exception.selector)
       )
     );
     
     return violation.nodes.length > 0;
   });
   ```

3. **Update Dashboard Code**
   - Preferred solution: Fix accessibility issues in the dashboard
   - Add proper ARIA attributes
   - Fix color contrast issues
   - Add proper labels and descriptions

### Inconsistent Results

**Problem**: Accessibility tests give different results across runs.

**Solutions**:
1. **Wait for Full Render**
   ```javascript
   // Ensure page is fully loaded
   await page.waitForFunction(() => 
     document.readyState === 'complete'
   );
   
   // Wait for any loading indicators to disappear
   await page.waitForFunction(() => 
     !document.querySelector('.loading-indicator')
   );
   ```

2. **Test in Consistent State**
   - Reset filters and selections before testing
   - Ensure consistent data load

3. **Run Multiple Times**
   ```javascript
   // In CI workflow
   strategy:
     matrix:
       run: [1, 2, 3]
   // Then only fail if all runs fail
   ```

## Performance Test Issues

### Lighthouse Integration

**Problem**: Lighthouse tests fail to run in Jest.

**Solutions**:
1. **Use Mock Implementation in CI**
   ```javascript
   // In jest.setup.js
   jest.mock('lighthouse', () => ({
     __esModule: true,
     default: jest.fn().mockResolvedValue({
       lhr: {
         categories: {
           performance: { score: 0.95 },
           accessibility: { score: 0.98 },
           'best-practices': { score: 0.97 },
           seo: { score: 0.92 }
         }
       }
     })
   }));
   ```

2. **Run Lighthouse Separately**
   ```bash
   # Create a separate script for Lighthouse
   node utils/run-lighthouse.js
   ```

3. **Use Chrome Flags**
   ```javascript
   const chromeLauncher = require('chrome-launcher');
   const chrome = await chromeLauncher.launch({
     chromeFlags: [
       '--headless',
       '--disable-gpu',
       '--no-sandbox',
       '--disable-dev-shm-usage'
     ]
   });
   ```

### Inconsistent Performance Metrics

**Problem**: Performance scores vary significantly between runs.

**Solutions**:
1. **Run Multiple Measurements**
   ```javascript
   const runs = 3;
   let totalScore = 0;
   
   for (let i = 0; i < runs; i++) {
     const result = await lighthouse(url);
     totalScore += result.lhr.categories.performance.score;
   }
   
   const averageScore = totalScore / runs;
   ```

2. **Test with Fixed CPU/Network Throttling**
   ```javascript
   const result = await lighthouse(url, {
     port: chrome.port,
     output: 'json',
     throttling: {
       cpuSlowdownMultiplier: 4,
       downloadThroughputKbps: 1000,
       uploadThroughputKbps: 500,
       rttMs: 80
     }
   });
   ```

3. **Set Appropriate Thresholds**
   ```javascript
   // Allow for variance in CI environments
   const threshold = process.env.CI ? 0.75 : 0.85;
   expect(performanceScore).toBeGreaterThanOrEqual(threshold);
   ```

## CI/CD Issues

### Browser Launch Failures

**Problem**: Tests fail in CI with "Failed to launch browser" errors.

**Solutions**:
1. **Install Dependencies**
   ```yaml
   # In GitHub Actions workflow
   - name: Install system dependencies
     run: |
       apt-get update
       apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
   ```

2. **Configure Puppeteer**
   ```javascript
   // In jest.setup.js
   const browser = await puppeteer.launch({
     headless: true,
     args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage',
       '--disable-accelerated-2d-canvas',
       '--no-first-run',
       '--no-zygote',
       '--disable-gpu'
     ]
   });
   ```

3. **Use Docker with Puppeteer Included**
   ```yaml
   # In GitHub Actions workflow
   - name: Run tests
     uses: docker://ghcr.io/puppeteer/puppeteer:latest
     with:
       args: npm test
   ```

### Path Resolution Issues

**Problem**: Tests can't find files due to path differences in CI.

**Solutions**:
1. **Use Absolute Paths**
   ```javascript
   const path = require('path');
   const baselinePath = path.resolve(__dirname, '../baselines');
   ```

2. **Verify Directory Structure**
   ```javascript
   // In setup script
   const fs = require('fs');
   const dirs = ['baselines', 'reports', 'temp'];
   
   dirs.forEach(dir => {
     const dirPath = path.resolve(__dirname, `../${dir}`);
     if (!fs.existsSync(dirPath)) {
       fs.mkdirSync(dirPath, { recursive: true });
     }
   });
   ```

3. **Log File Existence**
   ```javascript
   // Debug file issues
   test('Baseline files exist', () => {
     const baselinePath = path.resolve(__dirname, '../baselines');
     const files = fs.readdirSync(baselinePath);
     console.log('Available baselines:', files);
     expect(files.length).toBeGreaterThan(0);
   });
   ```

## Environment Setup Issues

### Node.js Version Conflicts

**Problem**: Tests fail with syntax errors or package incompatibilities.

**Solutions**:
1. **Specify Node Version**
   ```yaml
   # In GitHub Actions workflow
   - name: Set up Node.js
     uses: actions/setup-node@v3
     with:
       node-version: 16
   ```

2. **Use .nvmrc**
   ```
   # .nvmrc
   16.14.0
   ```

3. **Lock Dependencies**
   - Use exact versions in package.json
   - Include package-lock.json in repository
   - Consider using npm ci instead of npm install

### Missing Configuration

**Problem**: Tests fail because configuration is missing or incorrect.

**Solutions**:
1. **Use Environment-Specific Config**
   ```javascript
   // config.js
   const baseConfig = {
     // Common settings
   };
   
   const envConfigs = {
     development: {
       dashboardBaseUrl: 'http://localhost:8080'
     },
     ci: {
       dashboardBaseUrl: 'http://mock-server',
       useMocks: true
     }
   };
   
   const env = process.env.NODE_ENV || 'development';
   module.exports = { ...baseConfig, ...envConfigs[env] };
   ```

2. **Log Configuration**
   ```javascript
   // At start of tests
   console.log('Using configuration:', JSON.stringify(config, null, 2));
   ```

3. **Provide Default Config**
   ```javascript
   function getConfig() {
     try {
       return require('../config.js');
     } catch (error) {
       console.warn('Could not load config, using defaults');
       return {
         // Default configuration
       };
     }
   }
   ```

## Browser Automation Issues

### Timing Problems

**Problem**: Tests fail inconsistently due to timing issues.

**Solutions**:
1. **Use waitForFunction Instead of setTimeout**
   ```javascript
   // Instead of:
   await page.waitForTimeout(2000);
   
   // Use:
   await page.waitForFunction(() => {
     return document.querySelector('.chart-container canvas') !== null;
   }, { timeout: 5000 });
   ```

2. **Add Retry Logic**
   ```javascript
   async function clickWithRetry(page, selector, maxAttempts = 3) {
     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
       try {
         await page.waitForSelector(selector, { visible: true, timeout: 1000 });
         await page.click(selector);
         return true;
       } catch (error) {
         if (attempt === maxAttempts) throw error;
         await page.waitForTimeout(500);
       }
     }
   }
   ```

3. **Check Component State**
   ```javascript
   await page.waitForFunction(() => {
     const chart = document.querySelector('.chart');
     return chart && 
            chart.__chartInstance && 
            chart.__chartInstance.data.datasets[0].data.length > 0;
   });
   ```

### Headless Mode Issues

**Problem**: Tests work in headed mode but fail in headless mode.

**Solutions**:
1. **Check Viewport Size**
   ```javascript
   await page.setViewport({ width: 1920, height: 1080 });
   ```

2. **Emulate User Agent**
   ```javascript
   await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
   ```

3. **Disable Animations**
   ```javascript
   await page.addStyleTag({
     content: `
       * {
         animation-duration: 0s !important;
         transition-duration: 0s !important;
       }
     `
   });
   ```

4. **Use screenshots to debug**
   ```javascript
   // When a test fails in headless mode, take a screenshot
   try {
     await page.click('.some-button');
   } catch (error) {
     await page.screenshot({ path: 'debug-screenshot.png' });
     throw error;
   }
   ```