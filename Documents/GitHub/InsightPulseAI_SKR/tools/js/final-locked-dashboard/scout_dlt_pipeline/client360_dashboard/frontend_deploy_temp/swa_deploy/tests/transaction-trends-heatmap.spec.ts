import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://scout-dashboard-poc.azurewebsites.net';

test.describe('Transaction Trends Heatmap', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('should display heatmap component with testId', async () => {
        // Wait for heatmap component to be visible
        const heatmap = page.locator('[data-testid="location-heatmap"]');
        await expect(heatmap).toBeVisible({ timeout: 15000 });
        
        // Verify heatmap title exists
        await expect(page.locator('h3:has-text("Geographic Heatmap")')).toBeVisible();
    });

    test('should load heatmap data successfully', async () => {
        // Wait for heatmap to finish loading
        const heatmap = page.locator('[data-testid="location-heatmap"]');
        await expect(heatmap).toBeVisible({ timeout: 15000 });
        
        // Should not show loading spinner after data loads
        await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 });
        
        // Should show location data or no data message
        const hasData = await page.locator('[data-testid="location-heatmap"] .grid').isVisible();
        const hasNoDataMessage = await page.locator('text=No geographic data available').isVisible();
        
        expect(hasData || hasNoDataMessage).toBeTruthy();
    });

    test('should display location cards when data is available', async () => {
        const heatmap = page.locator('[data-testid="location-heatmap"]');
        await expect(heatmap).toBeVisible({ timeout: 15000 });
        
        // Check if location grid exists (means data is available)
        const locationGrid = page.locator('[data-testid="location-heatmap"] .grid');
        
        if (await locationGrid.isVisible()) {
            // Should have at least one location card
            const locationCards = locationGrid.locator('div').first();
            await expect(locationCards).toBeVisible();
            
            // Should display transaction count and amount
            await expect(page.locator('text=/\\d+ txn/')).toBeVisible();
            await expect(page.locator('text=/₱[\\d,]+/')).toBeVisible();
        }
    });

    test('should handle API errors gracefully', async () => {
        // Intercept heatmap API call and return error
        await page.route('**/api/transactions/heatmap*', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' })
            });
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should display error message
        await expect(page.locator('text=Heatmap Error')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Internal Server Error')).toBeVisible();
        
        // Should have retry button
        await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });

    test('should update heatmap when date range changes', async () => {
        // Wait for initial load
        const heatmap = page.locator('[data-testid="location-heatmap"]');
        await expect(heatmap).toBeVisible({ timeout: 15000 });
        
        // Change start date
        const startDateInput = page.locator('input[type="date"]').first();
        await startDateInput.fill('2024-01-01');
        
        // Change end date
        const endDateInput = page.locator('input[type="date"]').last();
        await endDateInput.fill('2024-01-31');
        
        // Click refresh button
        await page.locator('button:has-text("Refresh")').click();
        
        // Should show loading spinner briefly
        await expect(page.locator('.loading-spinner')).toBeVisible({ timeout: 5000 });
        
        // Should finish loading and show updated data
        await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 10000 });
        await expect(heatmap).toBeVisible();
    });

    test('should display summary information', async () => {
        const heatmap = page.locator('[data-testid="location-heatmap"]');
        await expect(heatmap).toBeVisible({ timeout: 15000 });
        
        // Should show summary text about locations or no data message
        const hasSummary = await page.locator('text=/\\d+ locations with transaction data/').isVisible();
        const hasNoData = await page.locator('text=No geographic data available').isVisible();
        
        expect(hasSummary || hasNoData).toBeTruthy();
    });

    test('should be responsive on mobile viewport', async () => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        const heatmap = page.locator('[data-testid="location-heatmap"]');
        await expect(heatmap).toBeVisible({ timeout: 15000 });
        
        // Heatmap should still be visible and functional on mobile
        await expect(page.locator('h3:has-text("Geographic Heatmap")')).toBeVisible();
        
        // Grid should adapt to mobile (single column)
        const locationGrid = page.locator('[data-testid="location-heatmap"] .grid');
        if (await locationGrid.isVisible()) {
            // On mobile, grid should use single column layout
            const gridClasses = await locationGrid.getAttribute('class');
            expect(gridClasses).toContain('grid-cols-1');
        }
    });

    test('should integrate with main transaction trends dashboard', async () => {
        // Verify heatmap is part of the transaction trends page
        await expect(page.locator('h1:has-text("Transaction Trends POC")')).toBeVisible();
        
        // Heatmap should be in the same page as other charts
        const heatmap = page.locator('[data-testid="location-heatmap"]');
        await expect(heatmap).toBeVisible({ timeout: 15000 });
        
        // Should also have other chart components
        await expect(page.locator('h3:has-text("Hourly Transaction Volume")')).toBeVisible();
        await expect(page.locator('h3:has-text("Duration Distribution")')).toBeVisible();
    });

    test('should handle network timeout gracefully', async () => {
        // Intercept heatmap API and delay response significantly
        await page.route('**/api/transactions/heatmap*', route => {
            setTimeout(() => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ 
                        success: true, 
                        data: [],
                        metadata: { totalPoints: 0 }
                    })
                });
            }, 30000); // 30 second delay
        });

        await page.reload();
        
        // Should show loading state initially
        await expect(page.locator('text=Loading heatmap...')).toBeVisible({ timeout: 5000 });
        
        // After reasonable time, should handle timeout scenario
        // (The actual timeout behavior depends on the fetch implementation)
    });
});

test.describe('Heatmap API Integration', () => {
    test('should call heatmap API with correct parameters', async ({ page }) => {
        let apiCallMade = false;
        let apiParams: URLSearchParams | null = null;

        // Intercept heatmap API calls
        await page.route('**/api/transactions/heatmap*', route => {
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
                            barangay: 'Test Barangay',
                            municipality: 'Test City',
                            province: 'Test Province',
                            latitude: 14.5995,
                            longitude: 120.9842,
                            transactionCount: 10,
                            totalAmount: 5000,
                            avgAmount: 500,
                            density: 0.75
                        }
                    ],
                    metadata: {
                        startDate: '2024-01-01',
                        endDate: '2024-01-31',
                        minDensity: 0,
                        totalPoints: 1,
                        generatedAt: new Date().toISOString()
                    }
                })
            });
        });

        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        
        // Wait for heatmap to load
        await expect(page.locator('[data-testid="location-heatmap"]')).toBeVisible({ timeout: 15000 });
        
        // Verify API was called
        expect(apiCallMade).toBeTruthy();
        
        // Verify API parameters
        expect(apiParams?.get('startDate')).toBeTruthy();
        expect(apiParams?.get('endDate')).toBeTruthy();
        expect(apiParams?.get('minDensity')).toBe('0');
    });
});