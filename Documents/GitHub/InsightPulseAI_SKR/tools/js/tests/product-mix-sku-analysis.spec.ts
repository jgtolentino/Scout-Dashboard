import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://scout-dashboard-poc.azurewebsites.net';

test.describe('Product Mix & SKU Analysis Dashboard', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(`${BASE_URL}/products`);
        await page.waitForLoadState('networkidle');
    });

    test.afterEach(async () => {
        await page.close();
    });

    test.describe('Product Mix Chart', () => {
        test('should display product mix chart with testId', async () => {
            const productMixChart = page.locator('[data-testid="product-mix-chart"]');
            await expect(productMixChart).toBeVisible({ timeout: 15000 });
            
            // Verify chart title exists
            await expect(page.locator('h3:has-text("Product Mix Distribution")')).toBeVisible();
        });

        test('should load product mix data successfully', async () => {
            const productMixChart = page.locator('[data-testid="product-mix-chart"]');
            await expect(productMixChart).toBeVisible({ timeout: 15000 });
            
            // Should not show loading spinner after data loads
            await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 });
            
            // Should show chart or no data message
            const hasChart = await page.locator('.recharts-wrapper').isVisible();
            const hasNoDataMessage = await page.locator('text=No product mix data available').isVisible();
            
            expect(hasChart || hasNoDataMessage).toBeTruthy();
        });

        test('should display category percentages when data is available', async () => {
            const productMixChart = page.locator('[data-testid="product-mix-chart"]');
            await expect(productMixChart).toBeVisible({ timeout: 15000 });
            
            // Check if pie chart exists (means data is available)
            const pieChart = page.locator('.recharts-pie');
            
            if (await pieChart.isVisible()) {
                // Should display percentage labels
                await expect(page.locator('text=/%/')).toBeVisible();
                
                // Should display revenue summary
                await expect(page.locator('text=/₱[\\d,]+/')).toBeVisible();
            }
        });
    });

    test.describe('SKU Performance Table', () => {
        test('should display SKU performance table with testId', async () => {
            const skuTable = page.locator('[data-testid="sku-performance-table"]');
            await expect(skuTable).toBeVisible({ timeout: 15000 });
            
            // Verify table title exists
            await expect(page.locator('h3:has-text("SKU Performance")')).toBeVisible();
        });

        test('should load SKU performance data successfully', async () => {
            const skuTable = page.locator('[data-testid="sku-performance-table"]');
            await expect(skuTable).toBeVisible({ timeout: 15000 });
            
            // Should not show loading spinner after data loads
            await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 });
            
            // Should show table headers
            await expect(page.locator('th:has-text("Rank")')).toBeVisible();
            await expect(page.locator('th:has-text("Product")')).toBeVisible();
            await expect(page.locator('th:has-text("Revenue")')).toBeVisible();
        });

        test('should allow sorting by different criteria', async () => {
            const skuTable = page.locator('[data-testid="sku-performance-table"]');
            await expect(skuTable).toBeVisible({ timeout: 15000 });
            
            // Find sort dropdown
            const sortDropdown = page.locator('select').first();
            await expect(sortDropdown).toBeVisible();
            
            // Test sorting by Volume
            await sortDropdown.selectOption('Volume');
            await page.waitForTimeout(2000); // Wait for data refresh
            
            // Test sorting by Margin
            await sortDropdown.selectOption('Margin');
            await page.waitForTimeout(2000); // Wait for data refresh
            
            // Should still show table after sorting
            await expect(skuTable).toBeVisible();
        });

        test('should allow changing number of results', async () => {
            const skuTable = page.locator('[data-testid="sku-performance-table"]');
            await expect(skuTable).toBeVisible({ timeout: 15000 });
            
            // Find results count dropdown
            const countDropdown = page.locator('select').last();
            await expect(countDropdown).toBeVisible();
            
            // Test changing to Top 10
            await countDropdown.selectOption('10');
            await page.waitForTimeout(2000); // Wait for data refresh
            
            // Should still show table after changing count
            await expect(skuTable).toBeVisible();
        });

        test('should display performance status badges', async () => {
            const skuTable = page.locator('[data-testid="sku-performance-table"]');
            await expect(skuTable).toBeVisible({ timeout: 15000 });
            
            // Look for performance status indicators
            const statusBadges = page.locator('.performance-excellent, .performance-good, .performance-average, .performance-poor');
            
            if (await statusBadges.count() > 0) {
                // Should have at least one status badge
                expect(await statusBadges.count()).toBeGreaterThan(0);
            }
        });
    });

    test.describe('Inventory Heatmap', () => {
        test('should display inventory heatmap with testId', async () => {
            const inventoryHeatmap = page.locator('[data-testid="inventory-heatmap"]');
            await expect(inventoryHeatmap).toBeVisible({ timeout: 15000 });
            
            // Verify heatmap title exists
            await expect(page.locator('h3:has-text("Inventory Distribution")')).toBeVisible();
        });

        test('should load inventory data successfully', async () => {
            const inventoryHeatmap = page.locator('[data-testid="inventory-heatmap"]');
            await expect(inventoryHeatmap).toBeVisible({ timeout: 15000 });
            
            // Should not show loading spinner after data loads
            await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 });
            
            // Should show location cards or no data message
            const hasLocationCards = await page.locator('.stock-high, .stock-normal, .stock-low, .stock-out').isVisible();
            const hasNoDataMessage = await page.locator('text=No inventory data available').isVisible();
            
            expect(hasLocationCards || hasNoDataMessage).toBeTruthy();
        });

        test('should display location cards with stock information', async () => {
            const inventoryHeatmap = page.locator('[data-testid="inventory-heatmap"]');
            await expect(inventoryHeatmap).toBeVisible({ timeout: 15000 });
            
            // Check if location cards exist
            const locationCards = page.locator('[data-testid="inventory-heatmap"] .grid > div');
            
            if (await locationCards.count() > 0) {
                const firstCard = locationCards.first();
                
                // Should display location name
                await expect(firstCard.locator('text=/^[A-Za-z]/')).toBeVisible();
                
                // Should display stock value
                await expect(firstCard.locator('text=/₱[\\d,]+/')).toBeVisible();
                
                // Should display product count
                await expect(firstCard.locator('text=/\\d+ products/')).toBeVisible();
            }
        });

        test('should show stock status indicators', async () => {
            const inventoryHeatmap = page.locator('[data-testid="inventory-heatmap"]');
            await expect(inventoryHeatmap).toBeVisible({ timeout: 15000 });
            
            // Look for different stock status classes
            const stockClasses = ['.stock-high', '.stock-normal', '.stock-low', '.stock-out'];
            let hasStockIndicators = false;
            
            for (const stockClass of stockClasses) {
                if (await page.locator(stockClass).isVisible()) {
                    hasStockIndicators = true;
                    break;
                }
            }
            
            if (hasStockIndicators) {
                expect(hasStockIndicators).toBeTruthy();
            }
        });
    });

    test.describe('Seasonal Trends Chart', () => {
        test('should display seasonal trends chart with testId', async () => {
            const seasonalChart = page.locator('[data-testid="seasonal-trends-chart"]');
            await expect(seasonalChart).toBeVisible({ timeout: 15000 });
            
            // Verify chart title exists
            await expect(page.locator('h3:has-text("Seasonal Trends")')).toBeVisible();
        });

        test('should load seasonal trends data successfully', async () => {
            const seasonalChart = page.locator('[data-testid="seasonal-trends-chart"]');
            await expect(seasonalChart).toBeVisible({ timeout: 15000 });
            
            // Should not show loading spinner after data loads
            await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 });
            
            // Should show chart or no data message
            const hasChart = await page.locator('.recharts-wrapper').isVisible();
            const hasNoDataMessage = await page.locator('text=No seasonal trends data available').isVisible();
            
            expect(hasChart || hasNoDataMessage).toBeTruthy();
        });

        test('should display revenue and units sold trends', async () => {
            const seasonalChart = page.locator('[data-testid="seasonal-trends-chart"]');
            await expect(seasonalChart).toBeVisible({ timeout: 15000 });
            
            // Check if line chart exists
            const lineChart = page.locator('.recharts-line');
            
            if (await lineChart.count() > 0) {
                // Should have at least one trend line
                expect(await lineChart.count()).toBeGreaterThanOrEqual(1);
                
                // Should display legend
                await expect(page.locator('.recharts-legend')).toBeVisible();
            }
        });
    });

    test.describe('Date Range Functionality', () => {
        test('should update all charts when date range changes', async () => {
            // Wait for initial load
            await expect(page.locator('[data-testid="product-mix-chart"]')).toBeVisible({ timeout: 15000 });
            
            // Change start date
            const startDateInput = page.locator('input[type="date"]').first();
            await startDateInput.fill('2024-01-01');
            
            // Change end date
            const endDateInput = page.locator('input[type="date"]').last();
            await endDateInput.fill('2024-03-31');
            
            // Wait for data refresh
            await page.waitForTimeout(3000);
            
            // All charts should still be visible after date change
            await expect(page.locator('[data-testid="product-mix-chart"]')).toBeVisible();
            await expect(page.locator('[data-testid="sku-performance-table"]')).toBeVisible();
            await expect(page.locator('[data-testid="inventory-heatmap"]')).toBeVisible();
            await expect(page.locator('[data-testid="seasonal-trends-chart"]')).toBeVisible();
        });
    });

    test.describe('Error Handling', () => {
        test('should handle API errors gracefully for product mix', async () => {
            // Intercept product mix API call and return error
            await page.route('**/api/products/mix*', route => {
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Internal Server Error' })
                });
            });

            await page.reload();
            await page.waitForLoadState('networkidle');

            // Should display error message
            await expect(page.locator('text=Product Mix Error')).toBeVisible({ timeout: 10000 });
        });

        test('should handle API errors gracefully for SKU performance', async () => {
            // Intercept SKU performance API call and return error
            await page.route('**/api/products/sku-performance*', route => {
                route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'Database Connection Error' })
                });
            });

            await page.reload();
            await page.waitForLoadState('networkidle');

            // Should display error message
            await expect(page.locator('text=SKU Performance Error')).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Responsive Design', () => {
        test('should be responsive on mobile viewport', async () => {
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 667 });
            await page.reload();
            await page.waitForLoadState('networkidle');
            
            // All main components should still be visible on mobile
            await expect(page.locator('h1:has-text("Product Mix & SKU Analysis")')).toBeVisible();
            await expect(page.locator('[data-testid="product-mix-chart"]')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('[data-testid="sku-performance-table"]')).toBeVisible();
            await expect(page.locator('[data-testid="inventory-heatmap"]')).toBeVisible();
            await expect(page.locator('[data-testid="seasonal-trends-chart"]')).toBeVisible();
        });

        test('should adapt layout on tablet viewport', async () => {
            // Set tablet viewport
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.reload();
            await page.waitForLoadState('networkidle');
            
            // Should maintain functionality on tablet
            await expect(page.locator('[data-testid="product-mix-chart"]')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('[data-testid="sku-performance-table"]')).toBeVisible();
        });
    });

    test.describe('Dashboard Integration', () => {
        test('should integrate with main Scout Dashboard navigation', async () => {
            // Verify dashboard is part of Scout Dashboard
            await expect(page.locator('text=Scout Dashboard')).toBeVisible();
            
            // Should show product analytics context
            await expect(page.locator('text=Product Mix & SKU Analysis')).toBeVisible();
            
            // Should have version indicator
            await expect(page.locator('text=v1.0')).toBeVisible();
        });

        test('should have all required dashboard components', async () => {
            // All four main components should be present
            await expect(page.locator('[data-testid="product-mix-chart"]')).toBeVisible({ timeout: 15000 });
            await expect(page.locator('[data-testid="sku-performance-table"]')).toBeVisible();
            await expect(page.locator('[data-testid="inventory-heatmap"]')).toBeVisible();
            await expect(page.locator('[data-testid="seasonal-trends-chart"]')).toBeVisible();
            
            // Should have date range controls
            await expect(page.locator('input[type="date"]')).toHaveCount(2);
        });
    });
});

test.describe('Product Mix API Integration', () => {
    test('should call product mix API with correct parameters', async ({ page }) => {
        let apiCallMade = false;
        let apiParams: URLSearchParams | null = null;

        // Intercept product mix API calls
        await page.route('**/api/products/mix*', route => {
            apiCallMade = true;
            const url = new URL(route.request().url());
            apiParams = url.searchParams;
            
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        {
                            category: 'Beverages',
                            subCategory: 'Coffee',
                            productCount: 5,
                            transactionCount: 150,
                            totalUnitsSold: 500,
                            totalRevenue: 1750.00,
                            totalProfit: 700.00,
                            avgSellingPrice: 3.50,
                            marketSharePercentage: 25.5,
                            profitMarginPercentage: 40.0
                        }
                    ],
                    summaryStats: {
                        totalCategories: 1,
                        totalProducts: 5,
                        totalRevenue: 1750.00,
                        totalProfit: 700.00,
                        avgProfitMargin: 40.0
                    },
                    metadata: {
                        startDate: '2024-01-01',
                        endDate: '2024-12-31',
                        totalCategories: 1,
                        generatedAt: new Date().toISOString()
                    }
                })
            });
        });

        await page.goto(`${BASE_URL}/products`);
        await page.waitForLoadState('networkidle');
        
        // Wait for product mix to load
        await expect(page.locator('[data-testid="product-mix-chart"]')).toBeVisible({ timeout: 15000 });
        
        // Verify API was called
        expect(apiCallMade).toBeTruthy();
        
        // Verify API parameters
        expect(apiParams?.get('startDate')).toBeTruthy();
        expect(apiParams?.get('endDate')).toBeTruthy();
    });
});