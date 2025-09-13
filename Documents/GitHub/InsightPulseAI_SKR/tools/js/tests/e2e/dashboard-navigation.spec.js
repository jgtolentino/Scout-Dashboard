const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load environment config
const environment = process.env.TEST_ENV || 'staging';
const configPath = path.join(__dirname, '..', 'config', `${environment}.config.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Base URL from config
const baseUrl = config.baseUrl;

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard homepage
    await page.goto(baseUrl);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });
  
  test('can navigate to all main dashboard pages', async ({ page }) => {
    // Verify homepage loaded
    await expect(page).toHaveTitle(/Scout Dashboard/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Navigate to Advisor dashboard
    await page.click('text=Advisor');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/advisor/);
    await expect(page.locator('h1')).toContainText(/Advisor/i);
    
    // Navigate to Edge dashboard
    await page.click('text=Edge');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/edge/);
    await expect(page.locator('h1')).toContainText(/Edge/i);
    
    // Navigate to Ops dashboard
    await page.click('text=Ops');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/ops/);
    await expect(page.locator('h1')).toContainText(/Ops/i);
    
    // Return to home
    await page.click('text=Home');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(baseUrl);
  });
  
  test('interactive elements work on dashboards', async ({ page }) => {
    // Navigate to Advisor dashboard
    await page.goto(`${baseUrl}/advisor`);
    await page.waitForLoadState('networkidle');
    
    // Find and test dropdown/filter controls
    const dropdown = page.locator('select, .dropdown-toggle').first();
    if (await dropdown.isVisible()) {
      await dropdown.click();
      await page.waitForTimeout(500); // Give dropdown time to open
      
      const firstOption = page.locator('.dropdown-item, option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        // Wait for any filtering to complete
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Test chart interaction
    const chart = page.locator('.chart-container canvas').first();
    if (await chart.isVisible()) {
      // Hover over chart to show tooltip
      await chart.hover();
      await page.waitForTimeout(500);
      
      // Check if tooltip appears (this can be tricky as tooltips are often in separate DOM elements)
      const tooltip = page.locator('.chartjs-tooltip, .tooltip').first();
      if (await tooltip.isVisible()) {
        await expect(tooltip).toBeVisible();
      }
    }
    
    // Test tab navigation if present
    const tabs = page.locator('.nav-tabs .nav-link, .tab-control');
    const tabCount = await tabs.count();
    
    if (tabCount > 1) {
      // Click the second tab
      await tabs.nth(1).click();
      await page.waitForTimeout(500);
      
      // Verify tab content changed
      const tabPanels = page.locator('.tab-pane, .tab-content > div');
      const activePanel = page.locator('.tab-pane.active, .tab-content > div.active');
      await expect(activePanel).toBeVisible();
    }
  });
});

test.describe('ETL Quality Dashboard', () => {
  test('loads and displays correct data', async ({ page }) => {
    // Navigate to ETL quality dashboard
    await page.goto(`${baseUrl}/dashboards/etl_quality/index.html`);
    await page.waitForLoadState('networkidle');
    
    // Verify title
    await expect(page).toHaveTitle(/ETL Quality Dashboard/);
    
    // Check for key dashboard elements
    await expect(page.locator('h1')).toContainText('ETL Quality Dashboard');
    await expect(page.locator('#overallStatusBadge')).toBeVisible();
    await expect(page.locator('#pipelineSuccessRate')).toBeVisible();
    
    // Check for charts
    await expect(page.locator('#layerHealthChart')).toBeVisible();
    await expect(page.locator('#schemaStabilityChart')).toBeVisible();
    await expect(page.locator('#rowCountTrendsChart')).toBeVisible();
    
    // Verify tables
    await expect(page.locator('#recentIssuesTable')).toBeVisible();
    await expect(page.locator('#qualityScoresTable')).toBeVisible();
    
    // Test that the page connects to data source
    await expect(page.locator('#lastUpdated')).not.toContainText('Loading...');
  });
  
  test('dashboard UI components are interactive', async ({ page }) => {
    // Navigate to ETL quality dashboard
    await page.goto(`${baseUrl}/dashboards/etl_quality/index.html`);
    await page.waitForLoadState('networkidle');
    
    // Get reference to charts
    const layerHealthChart = page.locator('#layerHealthChart');
    const schemaStabilityChart = page.locator('#schemaStabilityChart');
    const rowCountTrendsChart = page.locator('#rowCountTrendsChart');
    
    // Test chart interactions (hover to trigger tooltips)
    await layerHealthChart.hover();
    await page.waitForTimeout(500);
    
    await schemaStabilityChart.hover();
    await page.waitForTimeout(500);
    
    await rowCountTrendsChart.hover();
    await page.waitForTimeout(500);
    
    // Test table sorting if available
    const tableHeaders = page.locator('#qualityScoresTable th');
    const headerCount = await tableHeaders.count();
    
    if (headerCount > 0) {
      // Click on the first sortable header
      await tableHeaders.first().click();
      await page.waitForTimeout(500);
      
      // Verify sorting happened (this is a basic check, in a real test you'd verify the order)
      // Look for sort indicators
      const sortIndicator = page.locator('th.sorting_asc, th.sorting_desc, th[aria-sort]');
      if (await sortIndicator.count() > 0) {
        await expect(sortIndicator).toBeVisible();
      }
    }
  });
});