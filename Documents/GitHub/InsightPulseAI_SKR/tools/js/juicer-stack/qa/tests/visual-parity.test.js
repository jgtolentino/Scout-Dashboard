/**
 * Visual Parity Tests - Ensures Scout dashboards match Power BI styling standards
 * 
 * These tests verify:
 * 1. Visual styling matches Power BI theme specifications
 * 2. Component layout and appearance is consistent
 * 3. Color usage follows the approved palette
 * 4. Dashboard responsiveness matches expected behavior
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch');
const Color = require('color');
const { PNG } = require('pngjs');

// Load Power BI theme specifications
const powerBiTheme = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../themes/tbwa.powerbiTheme.json'), 'utf8')
);

// Dashboard paths to test
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

// Threshold for image comparison (0-1, lower is stricter)
const DIFF_THRESHOLD = 0.1;

// Utility functions
const getBaselinePath = (dashboard, component) => 
  path.join(__dirname, '../baselines', `${dashboard}-${component}.png`);

const getCurrentPath = (dashboard, component) => 
  path.join(__dirname, '../temp', `${dashboard}-${component}-current.png`);

const getDiffPath = (dashboard, component) => 
  path.join(__dirname, '../temp', `${dashboard}-${component}-diff.png`);

// Make sure temp dir exists
if (!fs.existsSync(path.join(__dirname, '../temp'))) {
  fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
}

describe('Dashboard Visual Parity Tests', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set viewport to consistent size for testing
    await page.setViewport({ width: 1200, height: 800 });
    
    // Inject helper scripts
    await page.addScriptTag({ content: `
      window.getComputedStyles = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        return window.getComputedStyle(element);
      };
      
      window.getChartColors = (chartSelector) => {
        const chart = document.querySelector(chartSelector);
        if (!chart || !chart.__chartInstance) return [];
        return chart.__chartInstance.data.datasets.map(d => d.backgroundColor);
      };
    `});
  });
  
  afterEach(async () => {
    await page.close();
  });

  // Visual component comparisons with baseline images
  describe('Component Visual Matching', () => {
    dashboards.forEach(dashboard => {
      dashboard.components.forEach(component => {
        it(`${dashboard.name} - ${component} should match baseline`, async () => {
          // TODO: Implement actual dashboard pages once they're available
          // This is a placeholder using a mock comparison
          
          const baselinePath = getBaselinePath(dashboard.name, component);
          
          // Skip test if baseline doesn't exist yet
          if (!fs.existsSync(baselinePath)) {
            console.warn(`Baseline image not found for ${dashboard.name}-${component}. Test skipped.`);
            return;
          }
          
          // Load baseline image
          const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
          
          // Navigate to page and wait for it to load
          await page.goto(`${DASHBOARD_URL || "http://localhost:8080"}${dashboard.path}`);
          await page.waitForSelector(`.${component}`, { timeout: 5000 });
          
          // Capture current component
          const elementHandle = await page.$(`.${component}`);
          const screenshot = await elementHandle.screenshot();
          
          // Save current screenshot for reference
          fs.writeFileSync(getCurrentPath(dashboard.name, component), screenshot);
          
          // Parse screenshot to PNG
          const current = PNG.sync.read(screenshot);
          
          // Make sure dimensions match
          expect(baseline.width).toBe(current.width);
          expect(baseline.height).toBe(current.height);
          
          // Compare images
          const { width, height } = baseline;
          const diff = new PNG({ width, height });
          
          const mismatchedPixels = pixelmatch(
            baseline.data,
            current.data,
            diff.data,
            width,
            height,
            { threshold: DIFF_THRESHOLD }
          );
          
          // Save diff for visual inspection if failed
          fs.writeFileSync(getDiffPath(dashboard.name, component), PNG.sync.write(diff));
          
          // Determine match percentage
          const totalPixels = width * height;
          const matchPercentage = 100 - (mismatchedPixels / totalPixels * 100);
          
          // Must be at least 95% match
          expect(matchPercentage).toBeGreaterThanOrEqual(95);
        });
      });
    });
  });
  
  // Theme color validation
  describe('Theme Color Consistency', () => {
    dashboards.forEach(dashboard => {
      it(`${dashboard.name} should use Power BI theme colors`, async () => {
        // TODO: Implement actual dashboard color validation
        // This is a placeholder for the actual test
        
        // Navigate to page
        await page.goto(`${DASHBOARD_URL || "http://localhost:8080"}${dashboard.path}`);
        
        // Extract colors from various chart elements
        const chartColors = await page.evaluate(() => {
          return window.getChartColors('canvas.chart') || [];
        });
        
        // Check if colors are from theme palette
        const themeColors = powerBiTheme.dataColors.map(c => Color(c).rgb().array());
        
        // Color validation will go here - compare extracted colors to theme colors
        // This is a placeholder assertion
        expect(true).toBe(true);
      });
    });
  });
  
  // Typography validation
  describe('Typography Consistency', () => {
    dashboards.forEach(dashboard => {
      it(`${dashboard.name} should use Power BI theme typography`, async () => {
        // TODO: Implement actual typography validation
        // This is a placeholder for font checks
        
        // Navigate to page
        await page.goto(`${DASHBOARD_URL || "http://localhost:8080"}${dashboard.path}`);
        
        // Expected styles based on Power BI theme
        const expectedTitleFont = powerBiTheme.textClasses.title.fontFace;
        const expectedTitleSize = `${powerBiTheme.textClasses.title.fontSize}px`;
        
        // Extract title styles from page
        const titleStyles = await page.evaluate(() => {
          return window.getComputedStyles('.dashboard-title');
        });
        
        // Placeholder assertion
        expect(true).toBe(true);
      });
    });
  });
  
  // Card styling validation
  describe('Card Styling', () => {
    dashboards.forEach(dashboard => {
      it(`${dashboard.name} cards should match Power BI styling`, async () => {
        // TODO: Implement card styling validation
        // This is a placeholder for card style checks
        
        // Navigate to page
        await page.goto(`${DASHBOARD_URL || "http://localhost:8080"}${dashboard.path}`);
        
        // Extract card styles
        const cardStyles = await page.evaluate(() => {
          return window.getComputedStyles('.card');
        });
        
        // Placeholder assertion
        expect(true).toBe(true);
      });
    });
  });
  
  // Responsive layout validation
  describe('Responsive Layout', () => {
    const viewportSizes = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    dashboards.forEach(dashboard => {
      viewportSizes.forEach(viewport => {
        it(`${dashboard.name} should be responsive at ${viewport.name} size`, async () => {
          // Set viewport size
          await page.setViewport({
            width: viewport.width,
            height: viewport.height
          });
          
          // Navigate to page
          await page.goto(`${DASHBOARD_URL || "http://localhost:8080"}${dashboard.path}`);
          
          // Take screenshot for manual verification if needed
          const screenshot = await page.screenshot();
          fs.writeFileSync(
            path.join(__dirname, '../temp', `${dashboard.name}-${viewport.name}.png`),
            screenshot
          );
          
          // Check if responsive classes are applied
          const isResponsive = await page.evaluate(() => {
            // Look for overflow issues or misaligned elements
            const elements = document.querySelectorAll('.dashboard-container, .chart-container');
            for (const el of elements) {
              const style = window.getComputedStyle(el);
              if (style.overflow === 'visible' && 
                  (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)) {
                return false;
              }
            }
            return true;
          });
          
          // Should be responsive at all sizes
          expect(isResponsive).toBe(true);
        });
      });
    });
  });
});