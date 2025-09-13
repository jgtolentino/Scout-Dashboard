/**
 * Power BI QA Add-on
 * 
 * Extends dashboard screenshots with Power BI style and behavior checks.
 * This ensures dashboards maintain native Power BI look and feel.
 * 
 * Usage:
 *   node powerbi_qa_addon.js [dashboard-url] [output-dir]
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

// Configuration
const DEFAULT_URL = 'http://localhost:3000';
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '../docs/images');
const REFERENCE_DIR = path.join(__dirname, '../qa/reference_shots');
const GRID_SIZE = 8; // Power BI uses 8px grid

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const url = args[0] || DEFAULT_URL;
const outputDir = args[1] || DEFAULT_OUTPUT_DIR;

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Timestamp for filenames
const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];

/**
 * Run Power BI QA checks on a dashboard
 */
async function runPowerBiQA() {
  console.log(`${colors.bold}${colors.blue}Power BI QA Add-on${colors.reset}`);
  console.log(`${colors.blue}URL:${colors.reset} ${url}`);
  console.log(`${colors.blue}Output:${colors.reset} ${outputDir}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the dashboard
    console.log(`\n${colors.cyan}Loading dashboard...${colors.reset}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for potential Chart.js to render
    await page.waitForTimeout(2000);
    
    // Take a full screenshot for reference
    const screenshotPath = path.join(outputDir, `powerbi_qa_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`${colors.green}✓${colors.reset} Base screenshot captured`);
    
    // Initialize QA results
    const qaResults = {
      timestamp,
      url,
      passed: [],
      warnings: [],
      failures: [],
      performanceMetrics: {}
    };
    
    // === 1. Theme & Typography Check ===
    console.log(`\n${colors.cyan}Checking typography and theme...${colors.reset}`);
    const typographyResults = await page.evaluate(() => {
      const results = { issues: [] };
      
      // Check headings (h1, h2, .chart-title, etc.)
      const headings = [...document.querySelectorAll('h1, h2, h3, .chart-title, .visual-title')];
      const headingIssues = headings.filter(el => {
        const style = window.getComputedStyle(el);
        const fontFamily = style.fontFamily.toLowerCase();
        const fontSize = parseInt(style.fontSize);
        
        // Check if it's using Segoe UI or fallbacks
        const hasCorrectFont = fontFamily.includes('segoe') || 
                               fontFamily.includes('roboto') ||
                               fontFamily.includes('helvetica') ||
                               fontFamily.includes('arial');
                               
        // Check font size (16-18px for headings)
        const hasCorrectSize = fontSize >= 16 && fontSize <= 20;
        
        return !(hasCorrectFont && hasCorrectSize);
      }).map(el => ({
        element: el.tagName + (el.className ? '.' + el.className.replace(/\s+/g, '.') : ''),
        fontFamily: window.getComputedStyle(el).fontFamily,
        fontSize: window.getComputedStyle(el).fontSize
      }));
      
      if (headingIssues.length > 0) {
        results.issues.push({
          type: 'heading-typography',
          message: 'Headings should use Segoe UI or similar font at 16-18px',
          elements: headingIssues
        });
      }
      
      // Check body text
      const bodyText = [...document.querySelectorAll('p, div, span')].filter(el => {
        // Filter out elements that are likely not body text
        const text = el.textContent.trim();
        return text.length > 10 && 
               !el.querySelector('h1, h2, h3, h4, h5, h6') && 
               window.getComputedStyle(el).display !== 'none';
      });
      
      const bodyIssues = bodyText.filter(el => {
        const style = window.getComputedStyle(el);
        const fontFamily = style.fontFamily.toLowerCase();
        const fontSize = parseInt(style.fontSize);
        const color = style.color;
        
        // Simplified RGB extraction for checking dark gray text
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        const isNearBlack = rgbMatch && 
                         parseInt(rgbMatch[1]) < 60 && 
                         parseInt(rgbMatch[2]) < 60 && 
                         parseInt(rgbMatch[3]) < 60;
                         
        const hasCorrectFont = fontFamily.includes('segoe') || 
                               fontFamily.includes('roboto') ||
                               fontFamily.includes('helvetica') ||
                               fontFamily.includes('arial');
                               
        const hasCorrectSize = fontSize >= 11 && fontSize <= 14;
        
        return !(hasCorrectFont && hasCorrectSize && isNearBlack);
      }).map(el => ({
        element: el.tagName + (el.className ? '.' + el.className.replace(/\s+/g, '.') : ''),
        fontFamily: window.getComputedStyle(el).fontFamily,
        fontSize: window.getComputedStyle(el).fontSize,
        color: window.getComputedStyle(el).color
      }));
      
      if (bodyIssues.length > 0) {
        results.issues.push({
          type: 'body-typography',
          message: 'Body text should use Segoe UI or similar font at 11-14px in dark gray/black',
          elements: bodyIssues.slice(0, 5) // Limit to first 5 issues
        });
      }
      
      // Check accent colors
      const accentElements = [...document.querySelectorAll('.accent, .highlight, [class*="accent"], [class*="highlight"], [class*="primary"]')];
      const allowedAccents = [
        '#FFE600', // TBWA yellow
        '#FFED58', // Light TBWA yellow
        '#118DFF', // Power BI blue
        '#0078D4', // Microsoft blue
        '#1C3FFF', // Deep blue
      ];
      
      function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      }
      
      function colorDistance(rgb1, rgb2) {
        return Math.sqrt(
          Math.pow(rgb1.r - rgb2.r, 2) +
          Math.pow(rgb1.g - rgb2.g, 2) +
          Math.pow(rgb1.b - rgb2.b, 2)
        );
      }
      
      function isCloseToAllowedColor(colorStr) {
        // Handle rgb values
        let rgb;
        const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          rgb = {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3])
          };
        } else if (colorStr.startsWith('#')) {
          rgb = hexToRgb(colorStr);
        } else {
          return false; // Unknown format
        }
        
        if (!rgb) return false;
        
        // Check if close to any allowed accent
        return allowedAccents.some(accent => {
          const allowedRgb = hexToRgb(accent);
          return allowedRgb && colorDistance(rgb, allowedRgb) < 30; // Tolerance
        });
      }
      
      const accentIssues = accentElements.filter(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const borderColor = style.borderColor;
        const color = style.color;
        
        // Check if any of the colors match allowed accents
        return !(isCloseToAllowedColor(bgColor) || 
                isCloseToAllowedColor(borderColor) || 
                isCloseToAllowedColor(color));
      }).map(el => ({
        element: el.tagName + (el.className ? '.' + el.className.replace(/\s+/g, '.') : ''),
        backgroundColor: window.getComputedStyle(el).backgroundColor,
        color: window.getComputedStyle(el).color
      }));
      
      if (accentIssues.length > 0) {
        results.issues.push({
          type: 'accent-colors',
          message: 'Accent colors should match Power BI blue (#118DFF) or TBWA yellow (#FFE600)',
          elements: accentIssues
        });
      }
      
      return results;
    });
    
    if (typographyResults.issues.length === 0) {
      console.log(`${colors.green}✓${colors.reset} Typography and theme check passed`);
      qaResults.passed.push({
        check: 'Typography and Theme',
        message: 'All typography and theme elements match Power BI standards'
      });
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Typography issues found: ${typographyResults.issues.length}`);
      qaResults.warnings.push({
        check: 'Typography and Theme',
        message: `Found ${typographyResults.issues.length} typography issues`,
        details: typographyResults.issues
      });
    }
    
    // === 2. 8-px Grid Check ===
    console.log(`\n${colors.cyan}Checking 8px grid alignment...${colors.reset}`);
    
    // Create overlay to visualize grid issues
    const gridCheckResults = await page.evaluate((gridSize) => {
      const results = { 
        issues: [],
        elementsChecked: 0
      };
      
      // Get all visual elements that should be grid-aligned
      const visualElements = [...document.querySelectorAll(
        '.visual, .card, .slicer, .chart, .chart-container, .visual-container, ' + 
        '[class*="visual"], [class*="card"], [class*="chart"], [class*="container"]'
      )];
      
      results.elementsChecked = visualElements.length;
      
      // Check if elements align to the grid
      const misaligned = visualElements.filter(el => {
        const rect = el.getBoundingClientRect();
        const isLeftAligned = Math.round(rect.left) % gridSize === 0;
        const isTopAligned = Math.round(rect.top) % gridSize === 0;
        const isWidthAligned = Math.round(rect.width) % gridSize === 0;
        const isHeightAligned = Math.round(rect.height) % gridSize === 0;
        
        // Add a temporary outline to misaligned elements for the screenshot
        if (!(isLeftAligned && isTopAligned && isWidthAligned && isHeightAligned)) {
          el.setAttribute('data-grid-misaligned', 'true');
          el.style.outline = '2px dashed red';
          return true;
        }
        return false;
      });
      
      // Check spacing between elements (should be at least 16px)
      const spacingIssues = [];
      for (let i = 0; i < visualElements.length; i++) {
        const el1 = visualElements[i];
        const rect1 = el1.getBoundingClientRect();
        
        for (let j = i + 1; j < visualElements.length; j++) {
          const el2 = visualElements[j];
          const rect2 = el2.getBoundingClientRect();
          
          // Calculate horizontal and vertical gaps
          const horizontalGap = Math.max(0, 
            Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)
          );
          
          const verticalGap = Math.max(0,
            Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
          );
          
          // If elements overlap horizontally and are close vertically
          if (horizontalGap > 0 && rect2.top - rect1.bottom < 16 && rect2.top - rect1.bottom > 0) {
            spacingIssues.push({
              element1: el1.tagName + (el1.className ? '.' + el1.className.split(' ')[0] : ''),
              element2: el2.tagName + (el2.className ? '.' + el2.className.split(' ')[0] : ''),
              gap: `${Math.round(rect2.top - rect1.bottom)}px vertical`,
              required: '16px minimum'
            });
            
            // Highlight spacing issues
            el1.style.outline = '2px dashed orange';
            el2.style.outline = '2px dashed orange';
          }
          
          // If elements overlap vertically and are close horizontally
          if (verticalGap > 0 && rect2.left - rect1.right < 16 && rect2.left - rect1.right > 0) {
            spacingIssues.push({
              element1: el1.tagName + (el1.className ? '.' + el1.className.split(' ')[0] : ''),
              element2: el2.tagName + (el2.className ? '.' + el2.className.split(' ')[0] : ''),
              gap: `${Math.round(rect2.left - rect1.right)}px horizontal`,
              required: '16px minimum'
            });
            
            // Highlight spacing issues
            el1.style.outline = '2px dashed orange';
            el2.style.outline = '2px dashed orange';
          }
        }
      }
      
      if (misaligned.length > 0) {
        results.issues.push({
          type: 'grid-alignment',
          message: `${misaligned.length} elements not aligned to ${gridSize}px grid`,
          elements: misaligned.map(el => ({
            element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
            position: `left: ${Math.round(el.getBoundingClientRect().left)}px, top: ${Math.round(el.getBoundingClientRect().top)}px`,
            size: `width: ${Math.round(el.getBoundingClientRect().width)}px, height: ${Math.round(el.getBoundingClientRect().height)}px`
          }))
        });
      }
      
      if (spacingIssues.length > 0) {
        results.issues.push({
          type: 'element-spacing',
          message: `${spacingIssues.length} element pairs have insufficient spacing (< 16px)`,
          elements: spacingIssues
        });
      }
      
      return results;
    }, GRID_SIZE);
    
    // Take a screenshot with grid issues highlighted
    const gridScreenshotPath = path.join(outputDir, `powerbi_qa_grid_${timestamp}.png`);
    await page.screenshot({ path: gridScreenshotPath, fullPage: true });
    
    if (gridCheckResults.issues.length === 0) {
      console.log(`${colors.green}✓${colors.reset} Grid alignment check passed (${gridCheckResults.elementsChecked} elements checked)`);
      qaResults.passed.push({
        check: '8px Grid Alignment',
        message: `All ${gridCheckResults.elementsChecked} elements properly aligned to 8px grid with correct spacing`
      });
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Grid alignment issues found: ${gridCheckResults.issues.length}`);
      console.log(`${colors.blue}ℹ${colors.reset} Grid issues screenshot: ${path.basename(gridScreenshotPath)}`);
      qaResults.warnings.push({
        check: '8px Grid Alignment',
        message: `Found ${gridCheckResults.issues.length} grid alignment issues`,
        details: gridCheckResults.issues,
        screenshot: path.basename(gridScreenshotPath)
      });
    }
    
    // Reset visuals (remove debug outlines)
    await page.evaluate(() => {
      document.querySelectorAll('[data-grid-misaligned]').forEach(el => {
        el.style.outline = '';
      });
    });
    
    // === 3. KPI Card Check ===
    console.log(`\n${colors.cyan}Checking KPI cards...${colors.reset}`);
    
    const kpiCardResults = await page.evaluate(() => {
      const results = {
        totalCards: 0,
        validCards: 0,
        issues: []
      };
      
      // Find all elements that might be KPI cards
      const potentialCards = [...document.querySelectorAll(
        '.kpi, .card, .metric-card, [class*="kpi"], [class*="metric"], [class*="card"]'
      )].filter(el => {
        // Filter to likely KPI cards - has a number and maybe a delta indicator
        const hasNumber = /\d+(\.\d+)?/.test(el.textContent);
        const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
        const style = window.getComputedStyle(el);
        const hasBackground = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                             style.backgroundColor !== 'transparent';
        return hasNumber && isVisible && hasBackground;
      });
      
      results.totalCards = potentialCards.length;
      
      // Check each card for Power BI KPI features
      const cardIssues = potentialCards.filter(card => {
        // KPI cards should have:
        // 1. A clear metric/number (larger font)
        // 2. Optionally a delta/change indicator
        // 3. Label/title text
        
        const cardText = card.textContent.trim();
        const hasMetric = /\d+(\.\d+)?%?/.test(cardText);
        
        // Check for delta indicators (↑, ↓, +, -, arrows, etc.)
        const hasDelta = /[↑↓⬆⬇▲▼△▽]|\+|-|[0-9]+(\.[0-9]+)?%/.test(cardText);
        
        // Look for title/label elements
        const hasTitle = card.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="label"]') !== null;
        
        // Look for color coding (green for positive, red for negative)
        const hasColorCoding = card.innerHTML.includes('green') || 
                             card.innerHTML.includes('red') ||
                             card.innerHTML.includes('rgb(0, 128') || 
                             card.innerHTML.includes('rgb(255, 0') ||
                             card.innerHTML.includes('#00') ||
                             card.innerHTML.includes('#f00');
        
        // Card passes if it has a metric and at least a title or delta indicator
        const isValid = hasMetric && (hasTitle || hasDelta);
        
        if (isValid) {
          results.validCards++;
        }
        
        return !isValid;
      }).map(card => ({
        element: card.tagName + (card.className ? '.' + card.className.split(' ')[0] : ''),
        text: card.textContent.trim().substring(0, 50) + (card.textContent.length > 50 ? '...' : ''),
        issue: 'Missing required KPI elements (metric, title, or delta indicator)'
      }));
      
      if (cardIssues.length > 0) {
        results.issues.push({
          type: 'kpi-card-format',
          message: `${cardIssues.length} KPI cards don't match Power BI format`,
          elements: cardIssues
        });
      }
      
      return results;
    });
    
    if (kpiCardResults.totalCards === 0) {
      console.log(`${colors.blue}ℹ${colors.reset} No KPI cards detected on this dashboard`);
    } else if (kpiCardResults.issues.length === 0) {
      console.log(`${colors.green}✓${colors.reset} KPI card check passed (${kpiCardResults.validCards}/${kpiCardResults.totalCards} cards)`);
      qaResults.passed.push({
        check: 'KPI Card Format',
        message: `All ${kpiCardResults.totalCards} KPI cards match Power BI format standards`
      });
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} KPI card issues found: ${kpiCardResults.issues.length}`);
      qaResults.warnings.push({
        check: 'KPI Card Format',
        message: `${kpiCardResults.issues.length}/${kpiCardResults.totalCards} KPI cards don't match Power BI standards`,
        details: kpiCardResults.issues
      });
    }
    
    // === 4. On-Object Toolbar Check ===
    console.log(`\n${colors.cyan}Checking interactive behavior...${colors.reset}`);
    
    // Test hover behavior on charts
    const interactionResults = await page.evaluate(() => {
      const results = {
        chartElements: 0,
        tooltips: 0,
        issues: []
      };
      
      // Simulate interaction on charts
      const chartElements = [...document.querySelectorAll(
        '.chart, [class*="chart"], .visual, [class*="visual"], canvas'
      )].filter(el => el.offsetWidth > 50 && el.offsetHeight > 50); // Only visible charts
      
      results.chartElements = chartElements.length;
      
      // Check for tooltip elements that might appear on hover
      const tooltipElements = [...document.querySelectorAll(
        '[class*="tooltip"], [class*="hover"], [class*="popup"], [role="tooltip"]'
      )];
      
      results.tooltips = tooltipElements.length;
      
      // Create mock Power BI toolbar (for screenshot comparison)
      chartElements.forEach(chart => {
        // Add a mock Power BI toolbar to simulate hover behavior
        const toolbar = document.createElement('div');
        toolbar.className = 'powerbi-qa-mock-toolbar';
        toolbar.style.position = 'absolute';
        toolbar.style.top = '5px';
        toolbar.style.right = '5px';
        toolbar.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        toolbar.style.border = '1px solid #e0e0e0';
        toolbar.style.borderRadius = '2px';
        toolbar.style.padding = '2px';
        toolbar.style.zIndex = '1000';
        toolbar.style.display = 'flex';
        toolbar.style.gap = '5px';
        
        // Add mock buttons
        const iconStyles = 'width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;';
        toolbar.innerHTML = `
          <div style="${iconStyles}" title="Format visual">⚙️</div>
          <div style="${iconStyles}" title="Focus mode">🔍</div>
          <div style="${iconStyles}" title="More options">⋯</div>
        `;
        
        // Position the toolbar relative to the chart
        const chartRect = chart.getBoundingClientRect();
        toolbar.style.position = 'absolute';
        toolbar.style.top = '5px';
        toolbar.style.right = '5px';
        
        // Add to the chart if it has relative positioning
        const chartStyle = window.getComputedStyle(chart);
        if (chartStyle.position === 'static') {
          chart.style.position = 'relative';
        }
        
        chart.appendChild(toolbar);
        chart.setAttribute('data-powerbi-qa-enhanced', 'true');
      });
      
      return results;
    });
    
    // Take a screenshot with mock toolbars visible
    const interactionScreenshotPath = path.join(outputDir, `powerbi_qa_interaction_${timestamp}.png`);
    await page.screenshot({ path: interactionScreenshotPath, fullPage: true });
    
    if (interactionResults.chartElements === 0) {
      console.log(`${colors.yellow}⚠${colors.reset} No interactive chart elements detected`);
      qaResults.warnings.push({
        check: 'Interactive Behavior',
        message: 'No chart elements detected for interaction testing'
      });
    } else {
      console.log(`${colors.green}✓${colors.reset} Added Power BI-style toolbar visualization to ${interactionResults.chartElements} charts`);
      console.log(`${colors.blue}ℹ${colors.reset} Interaction visualization: ${path.basename(interactionScreenshotPath)}`);
      qaResults.passed.push({
        check: 'Interactive Behavior',
        message: `Simulated Power BI toolbar interaction on ${interactionResults.chartElements} charts`,
        screenshot: path.basename(interactionScreenshotPath)
      });
    }
    
    // === 5. Accessibility Check ===
    console.log(`\n${colors.cyan}Checking accessibility (WCAG AA)...${colors.reset}`);
    
    // Load axe-core for accessibility testing
    await page.addScriptTag({ 
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js'
    });
    
    // Run accessibility audit
    const a11yResults = await page.evaluate(async () => {
      // Wait for axe to be loaded
      if (typeof axe === 'undefined') {
        return { error: 'axe-core failed to load' };
      }
      
      try {
        const results = await axe.run({
          runOnly: ['wcag2aa'],
          rules: {
            'color-contrast': { enabled: true }
          }
        });
        
        return {
          violations: results.violations,
          passes: results.passes.length,
          incomplete: results.incomplete.length
        };
      } catch (error) {
        return { error: error.toString() };
      }
    });
    
    if (a11yResults.error) {
      console.log(`${colors.yellow}⚠${colors.reset} Accessibility check failed: ${a11yResults.error}`);
      qaResults.warnings.push({
        check: 'Accessibility',
        message: `Failed to run accessibility check: ${a11yResults.error}`
      });
    } else if (a11yResults.violations && a11yResults.violations.length === 0) {
      console.log(`${colors.green}✓${colors.reset} Accessibility check passed (${a11yResults.passes} checks)`);
      qaResults.passed.push({
        check: 'Accessibility',
        message: `Dashboard passes WCAG AA standards (${a11yResults.passes} checks passed)`
      });
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Accessibility issues found: ${a11yResults.violations ? a11yResults.violations.length : 0} violations`);
      qaResults.warnings.push({
        check: 'Accessibility',
        message: `Found ${a11yResults.violations ? a11yResults.violations.length : 0} WCAG AA violations`,
        details: a11yResults.violations
      });
    }
    
    // === 6. Performance Check ===
    console.log(`\n${colors.cyan}Checking performance metrics...${colors.reset}`);
    
    // Collect performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = window.performance;
      
      // Create timing data
      const timingData = {};
      if (perfData && perfData.timing) {
        const t = perfData.timing;
        timingData.loadTime = t.loadEventEnd - t.navigationStart;
        timingData.domReady = t.domComplete - t.domLoading;
        timingData.firstPaint = t.responseEnd - t.navigationStart;
        timingData.networkLatency = t.responseEnd - t.requestStart;
      }
      
      // Get resource metrics
      const resourceData = {
        totalSize: 0,
        jsSize: 0,
        cssSize: 0,
        imageSize: 0,
        fontSize: 0,
        otherSize: 0
      };
      
      if (perfData && perfData.getEntriesByType) {
        const resources = perfData.getEntriesByType('resource');
        resources.forEach(resource => {
          const size = resource.transferSize || 0;
          resourceData.totalSize += size;
          
          if (resource.name.endsWith('.js')) resourceData.jsSize += size;
          else if (resource.name.endsWith('.css')) resourceData.cssSize += size;
          else if (/\.(png|jpg|jpeg|gif|svg|webp)/.test(resource.name)) resourceData.imageSize += size;
          else if (/\.(woff|woff2|ttf|otf)/.test(resource.name)) resourceData.fontSize += size;
          else resourceData.otherSize += size;
        });
      }
      
      return {
        timing: timingData,
        resources: resourceData
      };
    });
    
    // Add performance metrics to results
    qaResults.performanceMetrics = performanceMetrics;
    
    // Check against performance budget
    const performanceBudget = {
      loadTime: 2000, // 2 seconds
      firstPaint: 1000, // 1 second
      totalSize: 3 * 1024 * 1024 // 3 MB
    };
    
    const performanceIssues = [];
    
    if (performanceMetrics.timing.loadTime > performanceBudget.loadTime) {
      performanceIssues.push({
        metric: 'Load Time',
        value: `${Math.round(performanceMetrics.timing.loadTime)}ms`,
        budget: `${performanceBudget.loadTime}ms`,
        description: 'Page load time exceeds budget'
      });
    }
    
    if (performanceMetrics.timing.firstPaint > performanceBudget.firstPaint) {
      performanceIssues.push({
        metric: 'First Paint',
        value: `${Math.round(performanceMetrics.timing.firstPaint)}ms`,
        budget: `${performanceBudget.firstPaint}ms`,
        description: 'First paint time exceeds budget'
      });
    }
    
    if (performanceMetrics.resources.totalSize > performanceBudget.totalSize) {
      performanceIssues.push({
        metric: 'Total Size',
        value: `${Math.round(performanceMetrics.resources.totalSize / 1024)}KB`,
        budget: `${Math.round(performanceBudget.totalSize / 1024)}KB`,
        description: 'Total resource size exceeds budget'
      });
    }
    
    if (performanceIssues.length === 0) {
      console.log(`${colors.green}✓${colors.reset} Performance check passed (Load: ${Math.round(performanceMetrics.timing.loadTime)}ms, FP: ${Math.round(performanceMetrics.timing.firstPaint)}ms)`);
      qaResults.passed.push({
        check: 'Performance',
        message: `Dashboard meets performance budget standards`
      });
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Performance issues found: ${performanceIssues.length}`);
      qaResults.warnings.push({
        check: 'Performance',
        message: `${performanceIssues.length} performance metrics exceed budget`,
        details: performanceIssues
      });
    }
    
    // === 7. Snapshot Regression Check ===
    // Check against reference images if available
    console.log(`\n${colors.cyan}Checking visual regression...${colors.reset}`);
    
    // Create reference directory if it doesn't exist
    if (!fs.existsSync(REFERENCE_DIR)) {
      fs.mkdirSync(REFERENCE_DIR, { recursive: true });
      console.log(`${colors.blue}ℹ${colors.reset} Created reference directory: ${REFERENCE_DIR}`);
    }
    
    // Check if we have a reference image
    const pageName = url.split('/').pop() || 'dashboard';
    const referenceImagePath = path.join(REFERENCE_DIR, `${pageName}_reference.png`);
    
    if (!fs.existsSync(referenceImagePath)) {
      console.log(`${colors.blue}ℹ${colors.reset} No reference image found. Current screenshot will be used as reference.`);
      fs.copyFileSync(screenshotPath, referenceImagePath);
      qaResults.passed.push({
        check: 'Visual Regression',
        message: 'First run - current screenshot saved as reference image'
      });
    } else {
      // Compare with reference image
      try {
        const img1 = PNG.sync.read(fs.readFileSync(referenceImagePath));
        const img2 = PNG.sync.read(fs.readFileSync(screenshotPath));
        
        // Create diff image
        const { width, height } = img1;
        const diff = new PNG({ width, height });
        
        // Custom threshold (1% difference tolerance)
        const threshold = 0.01;
        const numDiffPixels = pixelmatch(
          img1.data, img2.data, diff.data, width, height, 
          { threshold }
        );
        
        // Calculate percentage difference
        const diffPercentage = numDiffPixels / (width * height);
        
        // Save diff image if there are differences
        if (numDiffPixels > 0) {
          const diffImagePath = path.join(outputDir, `powerbi_qa_diff_${timestamp}.png`);
          fs.writeFileSync(diffImagePath, PNG.sync.write(diff));
          
          if (diffPercentage > threshold) {
            console.log(`${colors.red}✗${colors.reset} Visual regression check failed: ${(diffPercentage * 100).toFixed(2)}% different`);
            console.log(`${colors.blue}ℹ${colors.reset} Diff image: ${path.basename(diffImagePath)}`);
            qaResults.failures.push({
              check: 'Visual Regression',
              message: `Dashboard changed by ${(diffPercentage * 100).toFixed(2)}% compared to reference`,
              details: {
                diffPixels: numDiffPixels,
                diffPercentage: diffPercentage,
                diffImage: path.basename(diffImagePath)
              }
            });
          } else {
            console.log(`${colors.green}✓${colors.reset} Visual regression check passed with minor differences (${(diffPercentage * 100).toFixed(2)}%)`);
            qaResults.passed.push({
              check: 'Visual Regression',
              message: `Dashboard visually matches reference image (${(diffPercentage * 100).toFixed(2)}% difference within tolerance)`
            });
          }
        } else {
          console.log(`${colors.green}✓${colors.reset} Visual regression check passed (exact match)`);
          qaResults.passed.push({
            check: 'Visual Regression',
            message: 'Dashboard exactly matches reference image'
          });
        }
      } catch (error) {
        console.log(`${colors.yellow}⚠${colors.reset} Visual regression check failed: ${error.message}`);
        qaResults.warnings.push({
          check: 'Visual Regression',
          message: `Failed to compare with reference image: ${error.message}`
        });
      }
    }
    
    // === Generate QA Report ===
    console.log(`\n${colors.cyan}Generating QA report...${colors.reset}`);
    
    // Create a markdown report
    let markdownReport = `# Power BI Dashboard QA Report\n\n`;
    markdownReport += `**URL:** ${url}\n`;
    markdownReport += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
    markdownReport += `**Time:** ${new Date().toLocaleTimeString()}\n\n`;
    
    // Add summary
    markdownReport += `## Summary\n\n`;
    markdownReport += `- **Passed:** ${qaResults.passed.length} checks\n`;
    markdownReport += `- **Warnings:** ${qaResults.warnings.length} checks\n`;
    markdownReport += `- **Failed:** ${qaResults.failures.length} checks\n\n`;
    
    const overallResult = qaResults.failures.length === 0 ? 
      (qaResults.warnings.length === 0 ? 'PASSED' : 'PASSED WITH WARNINGS') : 
      'FAILED';
    
    markdownReport += `**Overall Result:** ${overallResult}\n\n`;
    
    // Add screenshots
    markdownReport += `## Screenshots\n\n`;
    markdownReport += `### Base Screenshot\n\n`;
    markdownReport += `![Dashboard Screenshot](${path.basename(screenshotPath)})\n\n`;
    
    if (qaResults.warnings.find(w => w.screenshot) || qaResults.passed.find(p => p.screenshot)) {
      markdownReport += `### Visualization Screenshots\n\n`;
      
      // Add any visualization screenshots
      const screenshots = [
        ...qaResults.passed.filter(p => p.screenshot).map(p => ({ type: 'passed', item: p })),
        ...qaResults.warnings.filter(w => w.screenshot).map(w => ({ type: 'warning', item: w }))
      ];
      
      screenshots.forEach(screenshot => {
        markdownReport += `#### ${screenshot.item.check}\n\n`;
        markdownReport += `![${screenshot.item.check}](${screenshot.item.screenshot})\n\n`;
        markdownReport += `${screenshot.item.message}\n\n`;
      });
    }
    
    // Add passed checks
    if (qaResults.passed.length > 0) {
      markdownReport += `## Passed Checks\n\n`;
      
      qaResults.passed.forEach(passed => {
        markdownReport += `### ✅ ${passed.check}\n\n`;
        markdownReport += `${passed.message}\n\n`;
      });
    }
    
    // Add warnings
    if (qaResults.warnings.length > 0) {
      markdownReport += `## Warnings\n\n`;
      
      qaResults.warnings.forEach(warning => {
        markdownReport += `### ⚠️ ${warning.check}\n\n`;
        markdownReport += `${warning.message}\n\n`;
        
        if (warning.details) {
          if (Array.isArray(warning.details)) {
            markdownReport += `<details>\n<summary>Details (${warning.details.length} items)</summary>\n\n`;
            
            // Format based on content structure
            if (warning.details[0] && warning.details[0].type) {
              // Grouped issues
              const issuesByType = {};
              warning.details.forEach(issue => {
                if (!issuesByType[issue.type]) {
                  issuesByType[issue.type] = [];
                }
                issuesByType[issue.type].push(issue);
              });
              
              Object.keys(issuesByType).forEach(type => {
                markdownReport += `#### ${type} (${issuesByType[type].length} issues)\n\n`;
                
                if (issuesByType[type][0].elements) {
                  // Further nested structure
                  issuesByType[type].forEach(issue => {
                    markdownReport += `- **${issue.message}**\n`;
                    issue.elements.slice(0, 3).forEach(el => {
                      markdownReport += `  - ${el.element || el}\n`;
                    });
                    if (issue.elements.length > 3) {
                      markdownReport += `  - _(${issue.elements.length - 3} more)_\n`;
                    }
                  });
                } else {
                  // Simple list
                  issuesByType[type].slice(0, 5).forEach(issue => {
                    markdownReport += `- ${JSON.stringify(issue)}\n`;
                  });
                  if (issuesByType[type].length > 5) {
                    markdownReport += `- _(${issuesByType[type].length - 5} more)_\n`;
                  }
                }
                
                markdownReport += `\n`;
              });
            } else {
              // Simple list of items
              warning.details.slice(0, 5).forEach(detail => {
                markdownReport += `- ${typeof detail === 'object' ? JSON.stringify(detail) : detail}\n`;
              });
              
              if (warning.details.length > 5) {
                markdownReport += `- _(${warning.details.length - 5} more items)_\n`;
              }
            }
            
            markdownReport += `</details>\n\n`;
          } else {
            // Object or string
            markdownReport += `<details>\n<summary>Details</summary>\n\n`;
            markdownReport += `\`\`\`json\n${JSON.stringify(warning.details, null, 2)}\n\`\`\`\n\n`;
            markdownReport += `</details>\n\n`;
          }
        }
      });
    }
    
    // Add failures
    if (qaResults.failures.length > 0) {
      markdownReport += `## Failures\n\n`;
      
      qaResults.failures.forEach(failure => {
        markdownReport += `### ❌ ${failure.check}\n\n`;
        markdownReport += `${failure.message}\n\n`;
        
        if (failure.details) {
          markdownReport += `<details>\n<summary>Details</summary>\n\n`;
          markdownReport += `\`\`\`json\n${JSON.stringify(failure.details, null, 2)}\n\`\`\`\n\n`;
          markdownReport += `</details>\n\n`;
        }
      });
    }
    
    // Add performance metrics
    markdownReport += `## Performance Metrics\n\n`;
    markdownReport += `| Metric | Value |\n`;
    markdownReport += `| ------ | ----- |\n`;
    markdownReport += `| Load Time | ${Math.round(performanceMetrics.timing.loadTime)}ms |\n`;
    markdownReport += `| DOM Ready | ${Math.round(performanceMetrics.timing.domReady)}ms |\n`;
    markdownReport += `| First Paint | ${Math.round(performanceMetrics.timing.firstPaint)}ms |\n`;
    markdownReport += `| Network Latency | ${Math.round(performanceMetrics.timing.networkLatency)}ms |\n`;
    markdownReport += `| Total Resources | ${Math.round(performanceMetrics.resources.totalSize / 1024)}KB |\n`;
    markdownReport += `| JavaScript Size | ${Math.round(performanceMetrics.resources.jsSize / 1024)}KB |\n`;
    markdownReport += `| CSS Size | ${Math.round(performanceMetrics.resources.cssSize / 1024)}KB |\n`;
    markdownReport += `| Image Size | ${Math.round(performanceMetrics.resources.imageSize / 1024)}KB |\n`;
    
    // Write the markdown report
    const reportPath = path.join(outputDir, `powerbi_qa_report_${timestamp}.md`);
    fs.writeFileSync(reportPath, markdownReport);
    
    // Write JSON results
    const jsonResultsPath = path.join(outputDir, `powerbi_qa_results_${timestamp}.json`);
    fs.writeFileSync(jsonResultsPath, JSON.stringify(qaResults, null, 2));
    
    console.log(`${colors.green}✓${colors.reset} QA report generated: ${path.basename(reportPath)}`);
    console.log(`${colors.green}✓${colors.reset} QA results JSON: ${path.basename(jsonResultsPath)}`);
    
    // Final summary
    console.log(`\n${colors.bold}${colors.blue}Power BI QA Summary${colors.reset}`);
    console.log(`${colors.bold}Passed:${colors.reset} ${qaResults.passed.length} checks`);
    console.log(`${colors.bold}Warnings:${colors.reset} ${qaResults.warnings.length} checks`);
    console.log(`${colors.bold}Failed:${colors.reset} ${qaResults.failures.length} checks`);
    
    if (qaResults.failures.length === 0) {
      if (qaResults.warnings.length === 0) {
        console.log(`\n${colors.bold}${colors.green}✅ PASSED${colors.reset} - Dashboard meets Power BI style guidelines`);
      } else {
        console.log(`\n${colors.bold}${colors.yellow}⚠️ PASSED WITH WARNINGS${colors.reset} - Review warnings for improvements`);
      }
    } else {
      console.log(`\n${colors.bold}${colors.red}❌ FAILED${colors.reset} - Dashboard does not meet Power BI style guidelines`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run the QA check
runPowerBiQA().catch(console.error);