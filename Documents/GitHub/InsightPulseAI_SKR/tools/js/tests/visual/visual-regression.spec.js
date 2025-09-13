const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load environment config
const environment = process.env.TEST_ENV || 'staging';
const configPath = path.join(__dirname, '..', 'config', `${environment}.config.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Base URL from config
const baseUrl = config.baseUrl;

// Define pages for visual testing
const pagesToTest = [
  { name: 'Home', path: '/' },
  { name: 'Advisor', path: '/advisor' },
  { name: 'Edge', path: '/edge' },
  { name: 'Ops', path: '/ops' },
  { name: 'ETL Quality', path: '/dashboards/etl_quality/index.html' }
];

// Define screen sizes to test
const screenSizes = config.screenSizes || [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 }
];

test.describe('Visual Regression Tests', () => {
  for (const page of pagesToTest) {
    for (const size of screenSizes) {
      test(`${page.name} page looks correct at ${size.name} resolution`, async ({ page: pageObject }) => {
        // Set viewport size
        await pageObject.setViewportSize({ width: size.width, height: size.height });
        
        // Navigate to the page
        await pageObject.goto(`${baseUrl}${page.path}`);
        await pageObject.waitForLoadState('networkidle');
        
        // Allow dynamic content to settle (e.g., charts, animations)
        await pageObject.waitForTimeout(2000);
        
        // Take a screenshot and compare with baseline
        // The uniqueName creates a file like: 'home-desktop.png' or 'advisor-mobile.png'
        const uniqueName = `${page.name.toLowerCase().replace(/\s+/g, '-')}-${size.name}`;
        
        // Compare with baseline
        await expect(pageObject).toHaveScreenshot(`${uniqueName}.png`, {
          timeout: 10000,
          maxDiffPixelRatio: 0.05, // Allow 5% of pixels to be different
          threshold: 0.2 // Pixel difference threshold
        });
      });
    }
  }
  
  // Additional tests for specific UI components
  test('Charts render correctly', async ({ page }) => {
    // Navigate to ETL quality dashboard
    await page.goto(`${baseUrl}/dashboards/etl_quality/index.html`);
    await page.waitForLoadState('networkidle');
    
    // Allow charts to render
    await page.waitForTimeout(3000);
    
    // Take screenshot of layer health chart
    const layerHealthChart = page.locator('#layerHealthChart').first();
    await expect(layerHealthChart).toBeVisible();
    await expect(layerHealthChart).toHaveScreenshot('layer-health-chart.png', {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2
    });
    
    // Take screenshot of schema stability chart
    const schemaStabilityChart = page.locator('#schemaStabilityChart').first();
    await expect(schemaStabilityChart).toBeVisible();
    await expect(schemaStabilityChart).toHaveScreenshot('schema-stability-chart.png', {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2
    });
    
    // Take screenshot of row count trends chart
    const rowCountTrendsChart = page.locator('#rowCountTrendsChart').first();
    await expect(rowCountTrendsChart).toBeVisible();
    await expect(rowCountTrendsChart).toHaveScreenshot('row-count-trends-chart.png', {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2
    });
  });
  
  test('Data tables render correctly', async ({ page }) => {
    // Navigate to ETL quality dashboard
    await page.goto(`${baseUrl}/dashboards/etl_quality/index.html`);
    await page.waitForLoadState('networkidle');
    
    // Allow tables to render
    await page.waitForTimeout(2000);
    
    // Take screenshot of recent issues table
    const recentIssuesTable = page.locator('#recentIssuesTable').first();
    await expect(recentIssuesTable).toBeVisible();
    await expect(recentIssuesTable).toHaveScreenshot('recent-issues-table.png', {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2
    });
    
    // Take screenshot of quality scores table
    const qualityScoresTable = page.locator('#qualityScoresTable').first();
    await expect(qualityScoresTable).toBeVisible();
    await expect(qualityScoresTable).toHaveScreenshot('quality-scores-table.png', {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2
    });
  });
});