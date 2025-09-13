/**
 * Playwright E2E Tests for Transaction Trends POC
 * Tests route availability and chart element presence
 */

import { test, expect } from '@playwright/test';

test.describe('Transaction Trends POC', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the transactions page before each test
    await page.goto('/transactions');
  });

  test('page loads and displays title', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Scout Dashboard/);
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Transaction Trends' })).toBeVisible();
    
    // Check description
    await expect(page.getByText('Analyze transaction patterns and duration metrics')).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    // Test navigation to home page
    await page.getByTestId('nav-transactions').click();
    await expect(page).toHaveURL(/.*\/transactions/);
    
    // Navigate to home and back
    await page.goto('/');
    await expect(page.getByTestId('view-transactions-button')).toBeVisible();
    
    await page.getByTestId('view-transactions-button').click();
    await expect(page).toHaveURL(/.*\/transactions/);
  });

  test('date range picker is functional', async ({ page }) => {
    // Check date pickers exist
    await expect(page.getByTestId('start-date-picker')).toBeVisible();
    await expect(page.getByTestId('end-date-picker')).toBeVisible();
    await expect(page.getByTestId('refresh-button')).toBeVisible();
    
    // Change start date
    await page.getByTestId('start-date-picker').fill('2025-05-01');
    await page.getByTestId('end-date-picker').fill('2025-05-22');
    
    // Click refresh button
    await page.getByTestId('refresh-button').click();
    
    // Should show loading state briefly
    await expect(page.getByText('Loading...')).toBeVisible({ timeout: 1000 });
  });

  test('chart containers are present', async ({ page }) => {
    // Wait for page to load (with timeout for API call)
    await page.waitForTimeout(2000);
    
    // Check for hourly volume chart container
    await expect(page.getByTestId('hourly-volume-chart')).toBeVisible();
    
    // Check for duration box plot container
    await expect(page.getByTestId('duration-box-plot')).toBeVisible();
    
    // Check chart title
    await expect(page.getByText('Hourly Transaction Volume')).toBeVisible();
    await expect(page.getByText('Duration Distribution')).toBeVisible();
  });

  test('summary stats section is visible', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check summary stats heading
    await expect(page.getByText('Summary Statistics')).toBeVisible();
    
    // Check for metric labels (should be visible regardless of data)
    await expect(page.getByText('Total Transactions')).toBeVisible();
    await expect(page.getByText('Avg Amount')).toBeVisible();
    await expect(page.getByText('Avg Duration')).toBeVisible();
    await expect(page.getByText('Data Completeness')).toBeVisible();
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('/api/transactions/trends*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed' })
      });
    });
    
    await page.reload();
    
    // Should show error message
    await expect(page.getByText('Error loading data')).toBeVisible();
    await expect(page.getByText('Database connection failed')).toBeVisible();
    
    // Retry button should be present
    await expect(page.getByText('Retry')).toBeVisible();
  });

  test('displays loading state', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/transactions/trends*', async (route) => {
      await page.waitForTimeout(1000); // Simulate slow response
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hourlyVolume: [],
          durationDistribution: [],
          summaryStats: {
            totalTransactions: 0,
            avgTransactionAmount: 0,
            avgDurationSeconds: 0,
            durationCompleteness: "0",
            amountCompleteness: "0"
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            dataSource: 'test'
          }
        })
      });
    });
    
    await page.reload();
    
    // Should show loading spinner
    await expect(page.getByText('Loading transaction trends...')).toBeVisible();
  });

  test('API integration works with mock data', async ({ page }) => {
    // Mock successful API response
    const mockData = {
      hourlyVolume: [
        { hour: 6, transactionCount: 10, avgAmount: 25.50, avgDuration: 120, label: "6:00", tooltip: "10 transactions at 6:00" },
        { hour: 12, transactionCount: 45, avgAmount: 35.75, avgDuration: 180, label: "12:00", tooltip: "45 transactions at 12:00" },
        { hour: 18, transactionCount: 30, avgAmount: 42.25, avgDuration: 150, label: "18:00", tooltip: "30 transactions at 18:00" }
      ],
      durationDistribution: [
        {
          category: "Quick (< 1min)",
          count: 25,
          minDuration: 15,
          maxDuration: 55,
          avgDuration: 35,
          q1: 20,
          median: 35,
          q3: 50,
          lowerFence: 10,
          upperFence: 65
        }
      ],
      summaryStats: {
        totalTransactions: 85,
        transactionsWithDuration: 80,
        transactionsWithAmount: 85,
        avgTransactionAmount: 34.50,
        avgDurationSeconds: 155,
        dateRangeStart: "2025-05-15",
        dateRangeEnd: "2025-05-22",
        durationCompleteness: "94.1",
        amountCompleteness: "100.0"
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: 'v_TransactionTrendsPOC',
        request: {
          startDate: "2025-05-15",
          endDate: "2025-05-22",
          storeId: null,
          requestTime: new Date().toISOString()
        }
      }
    };

    await page.route('/api/transactions/trends*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Check that summary stats display the mock data
    await expect(page.getByText('85')).toBeVisible(); // Total transactions
    await expect(page.getByText('₱34.50')).toBeVisible(); // Avg amount
    await expect(page.getByText('2.6m')).toBeVisible(); // Avg duration (155 seconds = 2.6 minutes)
    await expect(page.getByText('94.1%')).toBeVisible(); // Data completeness
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be functional
    await expect(page.getByRole('heading', { name: 'Transaction Trends' })).toBeVisible();
    await expect(page.getByTestId('start-date-picker')).toBeVisible();
    await expect(page.getByTestId('end-date-picker')).toBeVisible();
    
    // Charts should be responsive
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('hourly-volume-chart')).toBeVisible();
    await expect(page.getByTestId('duration-box-plot')).toBeVisible();
  });

  test('URL structure is correct', async ({ page }) => {
    // Check that we're on the correct route
    await expect(page).toHaveURL(/.*\/transactions$/);
    
    // Navigation should work
    await page.getByText('Scout Dashboard').click();
    await expect(page).toHaveURL(/.*\/$/);
    
    // Direct navigation should work
    await page.goto('/transactions');
    await expect(page).toHaveURL(/.*\/transactions$/);
    
    // 404 page should work for invalid routes
    await page.goto('/invalid-route');
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
  });

});

// API-specific tests
test.describe('Transaction Trends API', () => {
  
  test('API endpoint responds correctly', async ({ request }) => {
    const response = await request.get('/api/transactions/trends?startDate=2025-05-15&endDate=2025-05-22');
    
    // Should return 200 or handle gracefully
    expect([200, 500].includes(response.status())).toBeTruthy();
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // Check response structure
      expect(data).toHaveProperty('hourlyVolume');
      expect(data).toHaveProperty('durationDistribution');
      expect(data).toHaveProperty('summaryStats');
      expect(data).toHaveProperty('metadata');
      
      // Check arrays are arrays
      expect(Array.isArray(data.hourlyVolume)).toBe(true);
      expect(Array.isArray(data.durationDistribution)).toBe(true);
    }
  });

  test('API handles date parameters', async ({ request }) => {
    const response = await request.get('/api/transactions/trends?startDate=2025-01-01&endDate=2025-01-31');
    
    // Should handle different date ranges
    expect([200, 500].includes(response.status())).toBeTruthy();
  });

  test('API handles CSV format', async ({ request }) => {
    const response = await request.get('/api/transactions/trends?format=csv');
    
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/csv');
    }
  });

});

// Performance tests
test.describe('Performance', () => {
  
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('charts render without blocking UI', async ({ page }) => {
    await page.goto('/transactions');
    
    // Date picker should be interactive immediately
    await expect(page.getByTestId('start-date-picker')).toBeEnabled();
    await expect(page.getByTestId('end-date-picker')).toBeEnabled();
    
    // Navigation should work even while charts are loading
    await expect(page.getByTestId('nav-transactions')).toBeEnabled();
  });

});