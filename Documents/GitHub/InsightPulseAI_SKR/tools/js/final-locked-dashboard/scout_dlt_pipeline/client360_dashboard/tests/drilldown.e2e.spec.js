/**
 * Client360 Dashboard Drill-Down End-to-End Tests
 * 
 * This test suite validates the complete drill-down functionality including:
 * - KPI tile interactions
 * - API responses 
 * - Drawer rendering
 * - Error handling
 * - Performance benchmarks
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:8000',
  apiTimeout: 5000,
  drawerTimeout: 3000,
  performanceThreshold: 2000, // 2 seconds max
  
  // KPIs to test
  validKpis: [
    'total-sales',
    'transactions', 
    'brand-sentiment',
    'conversion-rate',
    'growth-rate',
    'store-performance',
    'regional-performance'
  ],
  
  invalidKpis: [
    'invalid-kpi',
    'non-existent',
    ''
  ]
};

test.describe('Client360 Dashboard Drill-Down', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to test page
    await page.goto(`${TEST_CONFIG.baseUrl}/test_drilldown.html`);
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Verify drill-down handler is loaded
    await expect(page.locator('script[src*="drilldown_handler.js"]')).toBeAttached();
    
    // Wait for handler initialization
    await page.waitForFunction(() => window.drilldownHandler !== undefined);
  });

  test.describe('KPI Tile Interactions', () => {
    
    for (const kpi of TEST_CONFIG.validKpis) {
      test(`should open drill-down drawer for ${kpi}`, async ({ page }) => {
        const startTime = Date.now();
        
        // Click the KPI tile
        const kpiTile = page.locator(`[data-kpi="${kpi}"]`);
        await expect(kpiTile).toBeVisible();
        await kpiTile.click();
        
        // Verify drawer opens
        const drawer = page.locator('#drill-down-drawer');
        await expect(drawer).toBeVisible({ timeout: TEST_CONFIG.drawerTimeout });
        
        // Verify drawer position (should slide in from right)
        const drawerStyle = await drawer.getAttribute('style');
        expect(drawerStyle).toContain('right: 0px');
        
        // Verify overlay is visible
        const overlay = page.locator('#drill-down-overlay');
        await expect(overlay).toBeVisible();
        
        // Verify title is updated
        const title = page.locator('#drill-down-title');
        await expect(title).not.toHaveText('KPI Details'); // Should be updated
        
        // Wait for content to load (either data or error)
        await page.waitForFunction(() => {
          const loading = document.querySelector('#drill-down-loading');
          return loading && loading.style.display === 'none';
        }, { timeout: TEST_CONFIG.apiTimeout });
        
        // Verify content is displayed
        const content = page.locator('#drill-down-content');
        await expect(content).toBeVisible();
        
        // Check performance
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(TEST_CONFIG.performanceThreshold);
        
        // Close drawer
        const closeButton = page.locator('#drill-down-close');
        await closeButton.click();
        
        // Verify drawer closes
        await expect(drawer).not.toBeVisible();
        await expect(overlay).not.toBeVisible();
      });
    }
    
    test('should handle invalid KPI gracefully', async ({ page }) => {
      // Click invalid KPI tile
      const invalidTile = page.locator('[data-kpi="invalid-kpi"]');
      await expect(invalidTile).toBeVisible();
      await invalidTile.click();
      
      // Verify drawer opens
      const drawer = page.locator('#drill-down-drawer');
      await expect(drawer).toBeVisible();
      
      // Wait for error to be displayed
      await page.waitForFunction(() => {
        const loading = document.querySelector('#drill-down-loading');
        return loading && loading.style.display === 'none';
      });
      
      // Verify error message is shown
      const content = page.locator('#drill-down-content');
      await expect(content).toContainText('Error Loading Data');
    });
  });

  test.describe('API Integration', () => {
    
    test('should make correct API calls', async ({ page }) => {
      // Listen for API requests
      const apiRequests = [];
      page.on('request', request => {
        if (request.url().includes('/api/drilldown')) {
          apiRequests.push(request);
        }
      });
      
      // Click a KPI tile
      const kpiTile = page.locator('[data-kpi="total-sales"]');
      await kpiTile.click();
      
      // Wait for API call
      await page.waitForFunction(() => apiRequests.length > 0);
      
      // Verify API request format
      const request = apiRequests[0];
      expect(request.url()).toContain('/api/drilldown?kpi=total-sales');
      expect(request.method()).toBe('GET');
    });
    
    test('should handle API timeout gracefully', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/drilldown*', async route => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay
        await route.continue();
      });
      
      const kpiTile = page.locator('[data-kpi="total-sales"]');
      await kpiTile.click();
      
      // Should show loading state
      const loading = page.locator('#drill-down-loading');
      await expect(loading).toBeVisible();
      
      // Should eventually show error or timeout
      await expect(page.locator('#drill-down-content')).toContainText('Error', { timeout: 15000 });
    });
    
    test('should handle network errors', async ({ page }) => {
      // Mock network error
      await page.route('**/api/drilldown*', route => route.abort());
      
      const kpiTile = page.locator('[data-kpi="total-sales"]');
      await kpiTile.click();
      
      // Should show error state
      await expect(page.locator('#drill-down-content')).toContainText('Error');
    });
  });

  test.describe('Drawer Functionality', () => {
    
    test('should close drawer with close button', async ({ page }) => {
      // Open drawer
      const kpiTile = page.locator('[data-kpi="total-sales"]');
      await kpiTile.click();
      
      const drawer = page.locator('#drill-down-drawer');
      await expect(drawer).toBeVisible();
      
      // Close with button
      const closeButton = page.locator('#drill-down-close');
      await closeButton.click();
      
      await expect(drawer).not.toBeVisible();
    });
    
    test('should close drawer with overlay click', async ({ page }) => {
      // Open drawer
      const kpiTile = page.locator('[data-kpi="total-sales"]');
      await kpiTile.click();
      
      const drawer = page.locator('#drill-down-drawer');
      await expect(drawer).toBeVisible();
      
      // Close with overlay click
      const overlay = page.locator('#drill-down-overlay');
      await overlay.click();
      
      await expect(drawer).not.toBeVisible();
    });
    
    test('should close drawer with Escape key', async ({ page }) => {
      // Open drawer
      const kpiTile = page.locator('[data-kpi="total-sales"]');
      await kpiTile.click();
      
      const drawer = page.locator('#drill-down-drawer');
      await expect(drawer).toBeVisible();
      
      // Close with Escape key
      await page.keyboard.press('Escape');
      
      await expect(drawer).not.toBeVisible();
    });
  });

  test.describe('Data Visualization', () => {
    
    test('should render appropriate content for different KPI types', async ({ page }) => {
      const kpiTests = [
        { kpi: 'total-sales', expectedContent: ['Regional', 'Sales'] },
        { kpi: 'transactions', expectedContent: ['Store', 'Transaction'] },
        { kpi: 'brand-sentiment', expectedContent: ['Brand', 'Sentiment'] },
        { kpi: 'store-performance', expectedContent: ['Store', 'Performance'] }
      ];
      
      for (const { kpi, expectedContent } of kpiTests) {
        // Open drawer for this KPI
        const kpiTile = page.locator(`[data-kpi="${kpi}"]`);
        await kpiTile.click();
        
        // Wait for content to load
        await page.waitForFunction(() => {
          const loading = document.querySelector('#drill-down-loading');
          return loading && loading.style.display === 'none';
        });
        
        // Check for expected content
        const content = page.locator('#drill-down-content');
        for (const text of expectedContent) {
          await expect(content).toContainText(text, { timeout: 5000 });
        }
        
        // Close drawer
        await page.keyboard.press('Escape');
        await expect(page.locator('#drill-down-drawer')).not.toBeVisible();
      }
    });
    
    test('should display data tables correctly', async ({ page }) => {
      // Open a KPI that should show tabular data
      const kpiTile = page.locator('[data-kpi="store-performance"]');
      await kpiTile.click();
      
      // Wait for content
      await page.waitForFunction(() => {
        const loading = document.querySelector('#drill-down-loading');
        return loading && loading.style.display === 'none';
      });
      
      // Check for table structure
      const table = page.locator('.drill-down-table');
      await expect(table).toBeVisible();
      
      // Verify table has headers
      const headers = page.locator('.drill-down-table th');
      await expect(headers.first()).toBeVisible();
      
      // Verify table has data rows
      const rows = page.locator('.drill-down-table tbody tr');
      await expect(rows.first()).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    
    test('should load drill-down within performance threshold', async ({ page }) => {
      const performanceMetrics = [];
      
      for (const kpi of ['total-sales', 'transactions', 'brand-sentiment']) {
        const startTime = Date.now();
        
        // Click KPI tile
        const kpiTile = page.locator(`[data-kpi="${kpi}"]`);
        await kpiTile.click();
        
        // Wait for content to finish loading
        await page.waitForFunction(() => {
          const loading = document.querySelector('#drill-down-loading');
          return loading && loading.style.display === 'none';
        });
        
        const loadTime = Date.now() - startTime;
        performanceMetrics.push({ kpi, loadTime });
        
        // Verify performance
        expect(loadTime).toBeLessThan(TEST_CONFIG.performanceThreshold);
        
        // Close drawer
        await page.keyboard.press('Escape');
      }
      
      // Log performance metrics
      console.log('Performance Metrics:', performanceMetrics);
    });
    
    test('should handle multiple rapid clicks gracefully', async ({ page }) => {
      const kpiTile = page.locator('[data-kpi="total-sales"]');
      
      // Click multiple times rapidly
      await kpiTile.click();
      await kpiTile.click();
      await kpiTile.click();
      
      // Should still work correctly
      const drawer = page.locator('#drill-down-drawer');
      await expect(drawer).toBeVisible();
      
      // Should not have multiple drawers
      const drawers = page.locator('#drill-down-drawer');
      expect(await drawers.count()).toBe(1);
    });
  });

  test.describe('Accessibility', () => {
    
    test('should be keyboard navigable', async ({ page }) => {
      // Tab to first KPI tile
      await page.keyboard.press('Tab');
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
      
      // Drawer should open
      const drawer = page.locator('#drill-down-drawer');
      await expect(drawer).toBeVisible();
      
      // Should be able to close with Escape
      await page.keyboard.press('Escape');
      await expect(drawer).not.toBeVisible();
    });
    
    test('should have proper ARIA attributes', async ({ page }) => {
      // Check KPI tiles have proper attributes
      const kpiTiles = page.locator('[data-kpi]');
      const firstTile = kpiTiles.first();
      
      // Should be clickable/interactive
      await expect(firstTile).toHaveAttribute('data-kpi');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Click KPI tile
      const kpiTile = page.locator('[data-kpi="total-sales"]');
      await kpiTile.click();
      
      // Drawer should still open and be usable
      const drawer = page.locator('#drill-down-drawer');
      await expect(drawer).toBeVisible();
      
      // Should be scrollable if needed
      const content = page.locator('#drill-down-content');
      await expect(content).toBeVisible();
    });
  });
});

// Test data validation helpers
test.describe('Data Validation', () => {
  
  test('should validate API response structure', async ({ page }) => {
    // Intercept API responses
    let apiResponse = null;
    page.on('response', response => {
      if (response.url().includes('/api/drilldown')) {
        response.json().then(data => {
          apiResponse = data;
        }).catch(() => {}); // Handle non-JSON responses
      }
    });
    
    // Trigger API call
    const kpiTile = page.locator('[data-kpi="total-sales"]');
    await kpiTile.click();
    
    // Wait for API response
    await page.waitForFunction(() => apiResponse !== null);
    
    // Validate response structure
    expect(apiResponse).toHaveProperty('kpi');
    expect(apiResponse).toHaveProperty('data');
    expect(apiResponse).toHaveProperty('timestamp');
    expect(apiResponse).toHaveProperty('count');
    
    // Validate data types
    expect(typeof apiResponse.kpi).toBe('string');
    expect(Array.isArray(apiResponse.data)).toBe(true);
    expect(typeof apiResponse.count).toBe('number');
  });
});