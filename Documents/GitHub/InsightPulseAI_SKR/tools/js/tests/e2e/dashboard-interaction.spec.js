/**
 * E2E tests for dashboard interaction
 * Tests real user journeys through the dashboard UI
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load environment config
const environment = process.env.TEST_ENV || 'staging';
const configPath = path.join(__dirname, '..', 'config', `${environment}.config.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Base URL from config
const baseUrl = config.baseUrl;

// Dashboard tests
test.describe('Dashboard Interaction', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto(`${baseUrl}/index.html`);
    
    // Wait for dashboard to be fully loaded
    await page.waitForSelector('.dashboard-container', { state: 'visible' });
    await page.waitForLoadState('networkidle');
  });
  
  test('main navigation works correctly', async ({ page }) => {
    // Verify main dashboard loaded
    await expect(page).toHaveTitle(/Dashboard|Scout/);
    
    // Test navigation to Advisor dashboard
    const advisorLink = page.getByRole('link', { name: /advisor/i });
    if (await advisorLink.isVisible()) {
      await advisorLink.click();
      await page.waitForURL(/.*\/advisor/);
      await expect(page).toHaveURL(/.*\/advisor/);
      
      // Verify Advisor dashboard content
      const advisorHeading = page.getByRole('heading', { name: /advisor/i });
      await expect(advisorHeading).toBeVisible();
      
      // Go back to main dashboard
      const homeLink = page.getByRole('link', { name: /home|dashboard/i });
      await homeLink.click();
      await page.waitForNavigation();
    }
    
    // Test navigation to Edge dashboard
    const edgeLink = page.getByRole('link', { name: /edge/i });
    if (await edgeLink.isVisible()) {
      await edgeLink.click();
      await page.waitForURL(/.*\/edge/);
      await expect(page).toHaveURL(/.*\/edge/);
      
      // Verify Edge dashboard content
      const edgeHeading = page.getByRole('heading', { name: /edge/i });
      await expect(edgeHeading).toBeVisible();
      
      // Go back to main dashboard
      const homeLink = page.getByRole('link', { name: /home|dashboard/i });
      await homeLink.click();
      await page.waitForNavigation();
    }
    
    // Test navigation to Ops dashboard
    const opsLink = page.getByRole('link', { name: /ops/i });
    if (await opsLink.isVisible()) {
      await opsLink.click();
      await page.waitForURL(/.*\/ops/);
      await expect(page).toHaveURL(/.*\/ops/);
      
      // Verify Ops dashboard content
      const opsHeading = page.getByRole('heading', { name: /ops/i });
      await expect(opsHeading).toBeVisible();
    }
  });
  
  test('insight cards render and can be interacted with', async ({ page }) => {
    // Wait for insight cards to load
    const insightCards = page.locator('.insight-card');
    await insightCards.first().waitFor({ state: 'visible' });
    
    // Check that we have more than one insight
    const cardCount = await insightCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // Test expanding an insight card (if that's a feature)
    const firstCard = insightCards.first();
    const expandButton = firstCard.locator('.expand-insight, .insight-expand');
    
    if (await expandButton.isVisible()) {
      await expandButton.click();
      
      // Verify expanded state
      await expect(firstCard).toHaveClass(/expanded/);
      
      // Collapse card
      await expandButton.click();
      await expect(firstCard).not.toHaveClass(/expanded/);
    }
    
    // Test insight card highlight on hover
    await firstCard.hover();
    await expect(firstCard).toHaveClass(/hover|highlight/);
  });
  
  test('filters modify visible insights', async ({ page }) => {
    // Wait for insights to load
    const insightCards = page.locator('.insight-card');
    await insightCards.first().waitFor({ state: 'visible' });
    
    // Get initial card count
    const initialCardCount = await insightCards.count();
    expect(initialCardCount).toBeGreaterThan(0);
    
    // Find filter dropdown (each dashboard might have different filters)
    const filterDropdown = page.locator('select[id*="filter"], .filter-dropdown').first();
    
    // If we found a filter, test it
    if (await filterDropdown.isVisible()) {
      // Get all filter options
      const options = await filterDropdown.locator('option').all();
      
      // Skip the first option (usually "All")
      if (options.length > 1) {
        // Select second option
        await filterDropdown.selectOption({ index: 1 });
        
        // Wait for filter to take effect
        await page.waitForTimeout(500);
        
        // Get new card count
        const filteredCardCount = await page.locator('.insight-card:visible').count();
        
        // Filtering should affect the number of visible cards
        // Either filtering reduces cards or marks some with an active class
        if (filteredCardCount !== initialCardCount) {
          expect(filteredCardCount).toBeLessThanOrEqual(initialCardCount);
        } else {
          // If card count didn't change, at least some cards should be highlighted
          const highlightedCount = await page.locator('.insight-card.active, .insight-card.filtered').count();
          expect(highlightedCount).toBeGreaterThan(0);
        }
        
        // Reset filter to "All"
        await filterDropdown.selectOption({ index: 0 });
        
        // Wait for filter reset to take effect
        await page.waitForTimeout(500);
        
        // Verify cards are restored
        const resetCardCount = await page.locator('.insight-card:visible').count();
        expect(resetCardCount).toBe(initialCardCount);
      }
    }
  });
  
  test('dark mode toggle works', async ({ page }) => {
    // Find dark mode toggle
    const darkModeToggle = page.locator('button[id*="dark"], button[id*="theme"], .theme-toggle').first();
    
    // If dark mode toggle exists, test it
    if (await darkModeToggle.isVisible()) {
      // Get initial body class
      const initialHasDarkMode = await page.evaluate(() => 
        document.body.classList.contains('dark-mode') || 
        document.body.classList.contains('theme-dark')
      );
      
      // Click toggle
      await darkModeToggle.click();
      
      // Wait for toggle effect
      await page.waitForTimeout(500);
      
      // Check that dark mode class was toggled
      const newHasDarkMode = await page.evaluate(() => 
        document.body.classList.contains('dark-mode') || 
        document.body.classList.contains('theme-dark')
      );
      
      expect(newHasDarkMode).not.toBe(initialHasDarkMode);
      
      // Toggle back
      await darkModeToggle.click();
      
      // Wait for toggle effect
      await page.waitForTimeout(500);
      
      // Verify we're back to initial state
      const finalHasDarkMode = await page.evaluate(() => 
        document.body.classList.contains('dark-mode') || 
        document.body.classList.contains('theme-dark')
      );
      
      expect(finalHasDarkMode).toBe(initialHasDarkMode);
    }
  });
  
  test('refresh button loads new data', async ({ page }) => {
    // Find refresh button
    const refreshButton = page.locator('button[id*="refresh"], .refresh-data, .reload-insights').first();
    
    // If refresh button exists, test it
    if (await refreshButton.isVisible()) {
      // Get the timestamp of the last update before refresh
      const timestampElem = page.locator('[id*="timestamp"], [id*="last-updated"], .update-time').first();
      let initialTimestamp = '';
      
      if (await timestampElem.isVisible()) {
        initialTimestamp = await timestampElem.textContent();
      }
      
      // Click refresh
      await refreshButton.click();
      
      // Look for loading indicator
      const loadingIndicator = page.locator('.loading, .spinner, .refreshing');
      
      if (await loadingIndicator.isVisible()) {
        // Wait for loading to finish
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
      } else {
        // If no loading indicator, just wait a bit
        await page.waitForTimeout(2000);
      }
      
      // If we had a timestamp, verify it changed
      if (initialTimestamp) {
        const newTimestamp = await timestampElem.textContent();
        expect(newTimestamp).not.toBe(initialTimestamp);
      }
      
      // Verify data is still loaded
      const insightCards = page.locator('.insight-card');
      const cardCount = await insightCards.count();
      expect(cardCount).toBeGreaterThan(0);
    }
  });
  
  test('charts are interactive', async ({ page }) => {
    // Wait for charts to load
    const charts = page.locator('canvas').filter({ has: page.locator('.chart-container canvas, [id*="chart"]') });
    
    // If we have charts, test interaction
    if (await charts.count() > 0) {
      const firstChart = charts.first();
      await firstChart.waitFor({ state: 'visible' });
      
      // Hover over chart
      await firstChart.hover();
      
      // Wait for tooltip
      await page.waitForTimeout(500);
      
      // Check for tooltip (might be in various elements)
      const tooltip = page.locator('.chartjs-tooltip, .chart-tooltip, [role="tooltip"]').first();
      
      // Some charts show tooltips in existing elements, others create new ones
      // So we don't always expect tooltip to exist
      if (await tooltip.isVisible()) {
        // If tooltip is visible, it should have content
        const tooltipText = await tooltip.textContent();
        expect(tooltipText).not.toBe('');
      }
      
      // Check for chart controls
      const chartControls = page.locator('.chart-controls, .chart-actions').first();
      
      if (await chartControls.isVisible()) {
        // Find controls like download, zoom, etc.
        const controlButtons = await chartControls.locator('button').all();
        
        if (controlButtons.length > 0) {
          // Try clicking the first control button
          await controlButtons[0].click();
          
          // Just verify no errors/crashes
          await page.waitForTimeout(500);
        }
      }
    }
  });
  
  test('dashboard metrics are displayed', async ({ page }) => {
    // Check for KPI cards or metric widgets
    const kpiElements = page.locator('.kpi-card, .metric-card, .dashboard-metric').first();
    
    if (await kpiElements.isVisible()) {
      // Verify KPI has numeric value
      const kpiValue = await kpiElements.locator('.metric-value, .kpi-value, .value').textContent();
      expect(kpiValue).toMatch(/\d/);
      
      // Check for trend indicators
      const trendIndicator = kpiElements.locator('.trend-up, .trend-down, .trend-neutral, [class*="trend"]').first();
      
      if (await trendIndicator.isVisible()) {
        // Trend should have a direction class
        const trendClass = await trendIndicator.getAttribute('class');
        expect(trendClass).toMatch(/up|down|neutral|positive|negative/);
      }
    }
  });
});

// ETL Dashboard specific tests
test.describe('ETL Quality Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Try to navigate to ETL dashboard, skip tests if not available
    try {
      await page.goto(`${baseUrl}/dashboards/etl_quality/index.html`);
      await page.waitForSelector('#pipelineSuccessRate', { state: 'visible', timeout: 5000 });
    } catch (e) {
      // Try alternate path
      try {
        await page.goto(`${baseUrl}/etl_quality/index.html`);
        await page.waitForSelector('#pipelineSuccessRate', { state: 'visible', timeout: 5000 });
      } catch (altError) {
        test.skip();
      }
    }
  });
  
  test('ETL dashboard shows key metrics', async ({ page }) => {
    // Verify key elements are visible
    await expect(page.locator('#pipelineSuccessRate')).toBeVisible();
    await expect(page.locator('#overallStatusBadge')).toBeVisible();
    
    // Verify charts are rendered
    const charts = page.locator('canvas');
    expect(await charts.count()).toBeGreaterThan(0);
    
    // Check for tables
    const tables = page.locator('table');
    expect(await tables.count()).toBeGreaterThan(0);
  });
  
  test('ETL dashboard tables can be sorted', async ({ page }) => {
    // Find data tables
    const tables = page.locator('table');
    const tableHeaders = page.locator('table th');
    
    // If we have tables with headers, test sorting
    if (await tables.count() > 0 && await tableHeaders.count() > 0) {
      // Click on first sortable header
      await tableHeaders.first().click();
      
      // Wait for sort to take effect
      await page.waitForTimeout(500);
      
      // Check for sort indicators
      const sortIndicator = page.locator('th.sorting_asc, th.sorting_desc, th[aria-sort]').first();
      
      if (await sortIndicator.isVisible()) {
        // Should have sort direction
        const sortClass = await sortIndicator.getAttribute('class');
        expect(sortClass).toMatch(/asc|desc|sorted/);
        
        // Click again to reverse sort order
        await sortIndicator.click();
        await page.waitForTimeout(500);
        
        // Sort direction should change
        const newSortClass = await sortIndicator.getAttribute('class');
        expect(newSortClass).not.toBe(sortClass);
      }
    }
  });
});

// Mobile responsiveness tests
test.describe('Mobile Responsiveness', () => {
  test('dashboard is responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to main dashboard
    await page.goto(`${baseUrl}/index.html`);
    await page.waitForLoadState('networkidle');
    
    // Check for mobile menu button
    const mobileMenu = page.locator('button[id*="mobile-menu"], .navbar-toggler, .hamburger-menu').first();
    
    if (await mobileMenu.isVisible()) {
      // Click menu button
      await mobileMenu.click();
      
      // Wait for menu to expand
      await page.waitForTimeout(500);
      
      // Find navigation links in mobile menu
      const navLinks = page.locator('.navbar-collapse a, .mobile-menu a, .nav-menu-mobile a').first();
      
      // Mobile menu should show navigation links
      await expect(navLinks).toBeVisible();
      
      // Close menu
      await mobileMenu.click();
    }
    
    // Verify insight cards stack vertically on mobile
    const insightCards = page.locator('.insight-card');
    
    if (await insightCards.count() > 1) {
      const firstCard = insightCards.first();
      const secondCard = insightCards.nth(1);
      
      // Get positions
      const firstCardBox = await firstCard.boundingBox();
      const secondCardBox = await secondCard.boundingBox();
      
      // On mobile, cards should stack (second card should be below first)
      if (firstCardBox && secondCardBox) {
        expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y);
      }
    }
  });
});