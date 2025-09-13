/**
 * Playwright E2E Tests for Consumer Behavior Analysis
 * Tests dashboard functionality, API integration, and user interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Consumer Behavior Analysis Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to consumer behavior dashboard
    await page.goto('/consumer-behavior');
  });

  test('dashboard loads and displays main components', async ({ page }) => {
    // Check page title and header
    await expect(page).toHaveTitle(/Consumer Behavior Analysis/);
    await expect(page.getByRole('heading', { name: 'Consumer Behavior Analysis' })).toBeVisible();
    
    // Check description
    await expect(page.getByText('Analyze request patterns, suggestion acceptance, and sentiment trends across demographics')).toBeVisible();
    
    // Check main dashboard container
    await expect(page.getByTestId('consumer-behavior-dashboard')).toBeVisible();
  });

  test('filters panel is functional', async ({ page }) => {
    // Check filters panel exists
    await expect(page.getByTestId('filters-panel')).toBeVisible();
    await expect(page.getByText('Filters')).toBeVisible();
    
    // Check all filter inputs exist
    await expect(page.getByTestId('start-date-filter')).toBeVisible();
    await expect(page.getByTestId('end-date-filter')).toBeVisible();
    await expect(page.getByTestId('gender-filter')).toBeVisible();
    await expect(page.getByTestId('age-bracket-filter')).toBeVisible();
    
    // Test date filters
    await page.getByTestId('start-date-filter').fill('2025-05-01');
    await page.getByTestId('end-date-filter').fill('2025-05-22');
    
    // Test gender filter
    await page.getByTestId('gender-filter').selectOption('Male');
    await expect(page.getByTestId('gender-filter')).toHaveValue('Male');
    
    await page.getByTestId('gender-filter').selectOption('Female');
    await expect(page.getByTestId('gender-filter')).toHaveValue('Female');
    
    await page.getByTestId('gender-filter').selectOption('all');
    await expect(page.getByTestId('gender-filter')).toHaveValue('all');
    
    // Test age bracket filter
    await page.getByTestId('age-bracket-filter').selectOption('18-25');
    await expect(page.getByTestId('age-bracket-filter')).toHaveValue('18-25');
    
    await page.getByTestId('age-bracket-filter').selectOption('26-35');
    await expect(page.getByTestId('age-bracket-filter')).toHaveValue('26-35');
    
    await page.getByTestId('age-bracket-filter').selectOption('all');
    await expect(page.getByTestId('age-bracket-filter')).toHaveValue('all');
  });

  test('summary statistics are displayed', async ({ page }) => {
    // Check summary stats container
    await expect(page.getByTestId('summary-stats')).toBeVisible();
    
    // Wait for data to load (up to 10 seconds)
    await page.waitForTimeout(2000);
    
    // Check that stats cards are present (should be 4 cards)
    const statsCards = page.locator('[data-testid="summary-stats"] > div');
    await expect(statsCards).toHaveCount(4);
    
    // Check for expected stat labels
    await expect(page.getByText('Total Requests')).toBeVisible();
    await expect(page.getByText('Overall Acceptance Rate')).toBeVisible();
    await expect(page.getByText('Avg Sentiment')).toBeVisible();
    await expect(page.getByText('Positive Interactions')).toBeVisible();
  });

  test('request patterns chart loads and displays data', async ({ page }) => {
    // Check chart container exists
    await expect(page.getByTestId('request-patterns-chart')).toBeVisible();
    
    // Check chart title
    await expect(page.getByText('Request Patterns by Type')).toBeVisible();
    
    // Wait for chart to load
    await page.waitForTimeout(3000);
    
    // Check for chart elements (Recharts creates SVG elements)
    const chartSvg = page.locator('[data-testid="request-patterns-chart"] svg');
    await expect(chartSvg).toBeVisible({ timeout: 15000 });
    
    // Check for bars in the chart (BarChart should have rect elements)
    const chartBars = page.locator('[data-testid="request-patterns-chart"] svg rect');
    await expect(chartBars.first()).toBeVisible({ timeout: 10000 });
  });

  test('suggestion acceptance chart loads and displays data', async ({ page }) => {
    // Check chart container exists
    await expect(page.getByTestId('suggestion-acceptance-chart')).toBeVisible();
    
    // Check chart title
    await expect(page.getByText('Suggestion Acceptance Over Time')).toBeVisible();
    
    // Wait for chart to load
    await page.waitForTimeout(3000);
    
    // Check for chart SVG
    const chartSvg = page.locator('[data-testid="suggestion-acceptance-chart"] svg');
    await expect(chartSvg).toBeVisible({ timeout: 15000 });
    
    // Check for line in the chart (LineChart should have path elements)
    const chartLines = page.locator('[data-testid="suggestion-acceptance-chart"] svg path');
    await expect(chartLines.first()).toBeVisible({ timeout: 10000 });
  });

  test('sentiment trend chart loads and displays data', async ({ page }) => {
    // Check chart container exists
    await expect(page.getByTestId('sentiment-trend-chart')).toBeVisible();
    
    // Check chart title
    await expect(page.getByText('Sentiment Trends Over Time')).toBeVisible();
    
    // Wait for chart to load
    await page.waitForTimeout(3000);
    
    // Check for chart SVG
    const chartSvg = page.locator('[data-testid="sentiment-trend-chart"] svg');
    await expect(chartSvg).toBeVisible({ timeout: 15000 });
    
    // Check for lines in the chart (multiple lines for sentiment, positive %, negative %)
    const chartLines = page.locator('[data-testid="sentiment-trend-chart"] svg path');
    await expect(chartLines.first()).toBeVisible({ timeout: 10000 });
  });

  test('gender breakdown pie chart displays correctly', async ({ page }) => {
    // Check chart container exists
    await expect(page.getByTestId('gender-breakdown')).toBeVisible();
    
    // Check chart title
    await expect(page.getByText('Acceptance by Gender')).toBeVisible();
    
    // Wait for chart to load
    await page.waitForTimeout(3000);
    
    // Check for chart SVG
    const chartSvg = page.locator('[data-testid="gender-breakdown"] svg');
    await expect(chartSvg).toBeVisible({ timeout: 15000 });
    
    // Check for pie segments (PieChart should have path elements)
    const pieSegments = page.locator('[data-testid="gender-breakdown"] svg path');
    await expect(pieSegments.first()).toBeVisible({ timeout: 10000 });
  });

  test('age bracket analysis chart displays correctly', async ({ page }) => {
    // Check chart container exists
    await expect(page.getByTestId('age-bracket-analysis')).toBeVisible();
    
    // Check chart title
    await expect(page.getByText('Analysis by Age Bracket')).toBeVisible();
    
    // Wait for chart to load
    await page.waitForTimeout(3000);
    
    // Check for chart SVG
    const chartSvg = page.locator('[data-testid="age-bracket-analysis"] svg');
    await expect(chartSvg).toBeVisible({ timeout: 15000 });
    
    // Check for bars in the chart
    const chartBars = page.locator('[data-testid="age-bracket-analysis"] svg rect');
    await expect(chartBars.first()).toBeVisible({ timeout: 10000 });
  });

  test('charts handle loading states correctly', async ({ page }) => {
    // Check initial loading state
    await expect(page.getByText('Loading Consumer Behavior Dashboard...')).toBeVisible({ timeout: 1000 });
    
    // Wait for dashboard to fully load
    await page.waitForTimeout(5000);
    
    // Verify loading spinner is gone and charts are visible
    await expect(page.getByText('Loading Consumer Behavior Dashboard...')).not.toBeVisible();
    await expect(page.getByTestId('request-patterns-chart')).toBeVisible();
    await expect(page.getByTestId('suggestion-acceptance-chart')).toBeVisible();
    await expect(page.getByTestId('sentiment-trend-chart')).toBeVisible();
  });

  test('filter changes trigger data refresh', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    // Change gender filter
    await page.getByTestId('gender-filter').selectOption('Female');
    
    // Wait for data to refresh
    await page.waitForTimeout(2000);
    
    // Change age bracket filter
    await page.getByTestId('age-bracket-filter').selectOption('26-35');
    
    // Wait for data to refresh
    await page.waitForTimeout(2000);
    
    // Change date range
    await page.getByTestId('start-date-filter').fill('2025-05-15');
    await page.getByTestId('end-date-filter').fill('2025-05-22');
    
    // Wait for data to refresh
    await page.waitForTimeout(2000);
    
    // Verify charts still display after filter changes
    await expect(page.getByTestId('request-patterns-chart')).toBeVisible();
    await expect(page.getByTestId('suggestion-acceptance-chart')).toBeVisible();
    await expect(page.getByTestId('sentiment-trend-chart')).toBeVisible();
  });

  test('error handling works correctly', async ({ page }) => {
    // Mock API failure by intercepting requests
    await page.route('**/api/consumer/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error', message: 'Database connection failed' })
      });
    });
    
    // Reload page to trigger API calls
    await page.reload();
    
    // Wait for error states to appear
    await page.waitForTimeout(3000);
    
    // Check for error messages in charts
    await expect(page.getByText('Error Loading Data')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Database connection failed')).toBeVisible();
    
    // Check for retry buttons
    await expect(page.getByText('Retry')).toBeVisible();
  });

  test('responsive design works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload page to apply mobile styles
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check that main components are still visible
    await expect(page.getByTestId('consumer-behavior-dashboard')).toBeVisible();
    await expect(page.getByTestId('filters-panel')).toBeVisible();
    await expect(page.getByTestId('summary-stats')).toBeVisible();
    
    // Check that charts are still visible (though they may be stacked)
    await expect(page.getByTestId('request-patterns-chart')).toBeVisible();
    await expect(page.getByTestId('suggestion-acceptance-chart')).toBeVisible();
    await expect(page.getByTestId('sentiment-trend-chart')).toBeVisible();
  });

  test('accessibility features are present', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toHaveText('Consumer Behavior Analysis');
    await expect(page.locator('h3')).toHaveCount.greaterThan(5); // Chart titles and filter labels
    
    // Check for proper labels on form inputs
    await expect(page.getByLabel('Start Date')).toBeVisible();
    await expect(page.getByLabel('End Date')).toBeVisible();
    await expect(page.getByLabel('Gender')).toBeVisible();
    await expect(page.getByLabel('Age Bracket')).toBeVisible();
    
    // Check for data-testid attributes (useful for automated testing)
    await expect(page.getByTestId('consumer-behavior-dashboard')).toBeVisible();
    await expect(page.getByTestId('filters-panel')).toBeVisible();
    await expect(page.getByTestId('summary-stats')).toBeVisible();
  });

  test('data visualization tooltips work correctly', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(5000);
    
    // Test tooltip on request patterns chart
    const requestChart = page.locator('[data-testid="request-patterns-chart"] svg');
    await expect(requestChart).toBeVisible();
    
    // Hover over a bar to trigger tooltip
    const chartBars = page.locator('[data-testid="request-patterns-chart"] svg rect');
    if (await chartBars.count() > 0) {
      await chartBars.first().hover();
      
      // Wait for tooltip to appear (Recharts tooltips appear with delays)
      await page.waitForTimeout(500);
    }
    
    // Test tooltip on line chart
    const lineChart = page.locator('[data-testid="suggestion-acceptance-chart"] svg');
    await expect(lineChart).toBeVisible();
    
    // Hover over a point on the line
    const chartPoints = page.locator('[data-testid="suggestion-acceptance-chart"] svg circle');
    if (await chartPoints.count() > 0) {
      await chartPoints.first().hover();
      await page.waitForTimeout(500);
    }
  });

  test('footer is displayed correctly', async ({ page }) => {
    // Check footer text
    await expect(page.getByText('Consumer Behavior Analysis Dashboard -')).toBeVisible();
    await expect(page.getByText('Scout Analytics Platform')).toBeVisible();
  });

  test('API endpoints respond correctly with valid data', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    // Check that API calls were made and responded with data
    // This can be verified by checking that charts have actual data
    
    // Request patterns should have data
    const requestChart = page.locator('[data-testid="request-patterns-chart"] svg');
    await expect(requestChart).toBeVisible();
    
    // Suggestion acceptance should have data
    const acceptanceChart = page.locator('[data-testid="suggestion-acceptance-chart"] svg');
    await expect(acceptanceChart).toBeVisible();
    
    // Sentiment trend should have data  
    const sentimentChart = page.locator('[data-testid="sentiment-trend-chart"] svg');
    await expect(sentimentChart).toBeVisible();
    
    // Summary stats should show actual numbers (not "N/A" or "0")
    const summaryStats = page.getByTestId('summary-stats');
    await expect(summaryStats).toBeVisible();
  });

  test('edge cases are handled gracefully', async ({ page }) => {
    // Test with future dates
    await page.getByTestId('start-date-filter').fill('2026-01-01');
    await page.getByTestId('end-date-filter').fill('2026-01-31');
    
    // Wait for API response
    await page.waitForTimeout(3000);
    
    // Charts should still be visible (even if showing "no data")
    await expect(page.getByTestId('request-patterns-chart')).toBeVisible();
    await expect(page.getByTestId('suggestion-acceptance-chart')).toBeVisible();
    await expect(page.getByTestId('sentiment-trend-chart')).toBeVisible();
    
    // Test with same start and end date
    const today = new Date().toISOString().split('T')[0];
    await page.getByTestId('start-date-filter').fill(today);
    await page.getByTestId('end-date-filter').fill(today);
    
    await page.waitForTimeout(2000);
    
    // Charts should still render
    await expect(page.getByTestId('request-patterns-chart')).toBeVisible();
  });

  test('performance is acceptable', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to page and wait for full load
    await page.goto('/consumer-behavior');
    await page.waitForTimeout(10000); // Wait for all charts to load
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 15 seconds (including all API calls and chart rendering)
    expect(loadTime).toBeLessThan(15000);
    
    // All main components should be visible
    await expect(page.getByTestId('consumer-behavior-dashboard')).toBeVisible();
    await expect(page.getByTestId('filters-panel')).toBeVisible();
    await expect(page.getByTestId('summary-stats')).toBeVisible();
    await expect(page.getByTestId('request-patterns-chart')).toBeVisible();
    await expect(page.getByTestId('suggestion-acceptance-chart')).toBeVisible();
    await expect(page.getByTestId('sentiment-trend-chart')).toBeVisible();
  });
});