const { test, expect } = require('@playwright/test');

test.describe('Customer Profiling Module', () => {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';
    
    test.beforeEach(async ({ page }) => {
        // Navigate to customer profiling page
        await page.goto(`${baseURL}/customer-profiling`);
        await page.waitForLoadState('networkidle');
    });
    
    test('should load customer profiling page', async ({ page }) => {
        // Check page title
        await expect(page).toHaveTitle(/Customer Profiling/);
        
        // Check main heading
        const heading = await page.locator('h2:text("Customer Profiling")');
        await expect(heading).toBeVisible();
    });
    
    test('should display summary cards', async ({ page }) => {
        // Check all summary cards are visible
        const summaryCards = [
            'Total Customers',
            'Avg Lifetime Value',
            'At-Risk Customers',
            'VIP Customers'
        ];
        
        for (const cardTitle of summaryCards) {
            const card = await page.locator(`h3:text("${cardTitle}")`);
            await expect(card).toBeVisible();
            
            // Check that metric value is displayed
            const metric = await card.locator('..').locator('.metric');
            await expect(metric).toBeVisible();
            const text = await metric.textContent();
            expect(text).not.toBe('-');
        }
    });
    
    test('should have working filters', async ({ page }) => {
        // Check segment filter
        const segmentFilter = await page.locator('#segment-filter');
        await expect(segmentFilter).toBeVisible();
        await segmentFilter.selectOption('VIP');
        
        // Check lifetime value filter
        const ltvFilter = await page.locator('#ltv-filter');
        await expect(ltvFilter).toBeVisible();
        await ltvFilter.fill('1000');
        
        // Check churn risk filter
        const churnFilter = await page.locator('#churn-filter');
        await expect(churnFilter).toBeVisible();
        await churnFilter.selectOption('0.3');
        
        // Check location filter
        const locationFilter = await page.locator('#location-filter');
        await expect(locationFilter).toBeVisible();
        await locationFilter.fill('Manila');
        
        // Apply filters
        const applyButton = await page.locator('#apply-filters');
        await expect(applyButton).toBeVisible();
        await applyButton.click();
        
        // Wait for data to reload
        await page.waitForLoadState('networkidle');
    });
    
    test('should display visualizations', async ({ page }) => {
        // Check all charts are rendered
        const charts = [
            'segment-distribution-chart',
            'ltv-analysis-chart',
            'churn-prediction-chart',
            'demographic-breakdown-chart'
        ];
        
        for (const chartId of charts) {
            const chart = await page.locator(`#${chartId}`);
            await expect(chart).toBeVisible();
            
            // Check that Plotly has rendered the chart
            const plotlyContainer = await chart.locator('.plotly');
            await expect(plotlyContainer).toBeVisible();
        }
    });
    
    test('should display customer table', async ({ page }) => {
        // Check table is visible
        const table = await page.locator('#customer-table');
        await expect(table).toBeVisible();
        
        // Check table headers
        const headers = [
            'Customer ID',
            'Segment',
            'Lifetime Value',
            'Churn Risk',
            'Total Spent',
            'Transactions',
            'Last Purchase',
            'Actions'
        ];
        
        for (const header of headers) {
            const th = await table.locator(`th:text("${header}")`);
            await expect(th).toBeVisible();
        }
        
        // Check that table has rows
        const rows = await table.locator('tbody tr');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);
    });
    
    test('should have working pagination', async ({ page }) => {
        // Check pagination controls
        const prevButton = await page.locator('#prev-page');
        const nextButton = await page.locator('#next-page');
        const pageInfo = await page.locator('#page-info');
        
        await expect(prevButton).toBeVisible();
        await expect(nextButton).toBeVisible();
        await expect(pageInfo).toBeVisible();
        
        // Previous button should be disabled on first page
        await expect(prevButton).toBeDisabled();
        
        // Click next page
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        
        // Check page info updated
        const pageText = await pageInfo.textContent();
        expect(pageText).toContain('Page 2');
        
        // Previous button should now be enabled
        await expect(prevButton).not.toBeDisabled();
    });
    
    test('should handle segment badges correctly', async ({ page }) => {
        // Check that segment badges have correct styling
        const segmentBadge = await page.locator('.segment-badge').first();
        await expect(segmentBadge).toBeVisible();
        
        const segmentClass = await segmentBadge.getAttribute('class');
        expect(segmentClass).toMatch(/segment-(vip|high-value|regular|new|at-risk|dormant)/);
    });
    
    test('should handle risk badges correctly', async ({ page }) => {
        // Check that risk badges have correct styling
        const riskBadge = await page.locator('.risk-badge').first();
        await expect(riskBadge).toBeVisible();
        
        const riskClass = await riskBadge.getAttribute('class');
        expect(riskClass).toMatch(/risk-(low|medium|high)/);
    });
    
    test('should handle view customer details', async ({ page }) => {
        // Click view button for first customer
        const viewButton = await page.locator('.btn-view').first();
        await expect(viewButton).toBeVisible();
        
        // Set up alert handler
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('View details for customer');
            await dialog.accept();
        });
        
        await viewButton.click();
    });
    
    test('should handle API errors gracefully', async ({ page }) => {
        // Intercept API call and return error
        await page.route('**/api/customer/profiles*', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Database connection failed',
                    timestamp: new Date().toISOString()
                })
            });
        });
        
        // Reload page to trigger error
        await page.reload();
        
        // Should show error message (implementation pending)
        // const errorMessage = await page.locator('.error-message');
        // await expect(errorMessage).toBeVisible();
    });
    
    test('should be responsive', async ({ page }) => {
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Check that filters stack vertically
        const filtersSection = await page.locator('.filters-section');
        await expect(filtersSection).toBeVisible();
        
        // Check that charts stack vertically
        const visualizations = await page.locator('.visualizations');
        await expect(visualizations).toBeVisible();
        
        // Check that summary cards stack vertically
        const summaryCards = await page.locator('.summary-cards');
        await expect(summaryCards).toBeVisible();
    });
});

// Performance tests
test.describe('Customer Profiling Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto(`${baseURL}/customer-profiling`);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Page should load within 3 seconds
        expect(loadTime).toBeLessThan(3000);
        
        // Check that main content is visible
        const content = await page.locator('.dashboard-content');
        await expect(content).toBeVisible();
    });
});