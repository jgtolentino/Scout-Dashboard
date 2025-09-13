/**
 * Visual regression tests for the Scout Analytics Dashboard
 * These tests capture screenshots and compare them with baseline images
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto('http://localhost:8080/insights_dashboard.html');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more to ensure all animations and renderings are complete
    await page.waitForTimeout(1000);
  });

  test('Dashboard main view matches snapshot', async ({ page }) => {
    // Take a screenshot of the full page
    await expect(page).toHaveScreenshot('dashboard-main-view.png', {
      fullPage: true,
      // Small threshold to account for minor rendering differences
      maxDiffPixelRatio: 0.01
    });
  });

  test('Insights section matches snapshot', async ({ page }) => {
    // Find the insights section and take a screenshot
    const insightsSection = await page.locator('.insights-grid');
    
    // Wait for insights to load
    await page.waitForTimeout(2000);
    
    // Take a screenshot of just the insights section
    await expect(insightsSection).toHaveScreenshot('insights-section.png', {
      // Small threshold to account for minor rendering differences
      maxDiffPixelRatio: 0.01
    });
  });

  test('Charts section matches snapshot', async ({ page }) => {
    // Find the charts section and take a screenshot
    const chartsSection = await page.locator('.chart-container').first();
    
    // Wait for charts to render
    await page.waitForTimeout(2000);
    
    // Take a screenshot of just the charts section
    await expect(chartsSection).toHaveScreenshot('charts-section.png', {
      // Small threshold to account for minor rendering differences
      maxDiffPixelRatio: 0.01
    });
  });

  test('Dark mode matches snapshot', async ({ page }) => {
    // Enable dark mode
    await page.locator('#darkModeToggle').click();
    
    // Wait for dark mode to apply
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the full page in dark mode
    await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
      fullPage: true,
      // Small threshold to account for minor rendering differences
      maxDiffPixelRatio: 0.01
    });
  });

  test('Responsive layout (mobile view) matches snapshot', async ({ page }) => {
    // Resize the viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for responsive layout to adjust
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the full page in mobile view
    await expect(page).toHaveScreenshot('dashboard-mobile-view.png', {
      fullPage: true,
      // Small threshold to account for minor rendering differences
      maxDiffPixelRatio: 0.01
    });
  });
});

// Test filtering functionality
test.describe('Dashboard Filtering Functionality', () => {
  test('Filter dropdown changes insights displayed', async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto('http://localhost:8080/insights_dashboard.html');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for insights to load
    await page.waitForTimeout(2000);
    
    // Take a screenshot before filtering
    await expect(page.locator('.insights-grid')).toHaveScreenshot('insights-before-filter.png');
    
    // Open the filter dropdown
    await page.locator('#insightFilterDropdown').click();
    
    // Select a specific filter (e.g., Brand)
    await page.locator('.dropdown-item:has-text("Brand")').click();
    
    // Wait for filtered insights to load
    await page.waitForTimeout(1000);
    
    // Take a screenshot after filtering
    await expect(page.locator('.insights-grid')).toHaveScreenshot('insights-after-filter.png');
  });
});

// Test refresh functionality
test.describe('Dashboard Refresh Functionality', () => {
  test('Refresh button shows loading indicator', async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto('http://localhost:8080/insights_dashboard.html');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Find the refresh button
    const refreshButton = page.locator('[data-refresh-insights], .header-btn:has(.fa-sync-alt)');
    
    // Click the refresh button
    await refreshButton.click();
    
    // Verify the button shows loading state
    const hasSpinner = await page.locator('.fa-spinner').isVisible();
    expect(hasSpinner).toBeTruthy();
    
    // Wait for refresh to complete
    await page.waitForTimeout(1500);
    
    // Verify the spinner is gone
    const spinnerGone = await page.locator('.fa-spinner').isVisible().then(visible => !visible);
    expect(spinnerGone).toBeTruthy();
  });
});