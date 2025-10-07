/**
 * Visual regression testing for dashboard styles
 * Establishes baseline images and compares new versions against the baseline
 */

const { expect } = require('@playwright/test');
const { test } = require('@playwright/test');

// Chart IDs to validate
const CHART_IDS = [
  'brandInsightsChart',
  'sentimentTrendsChart'
];

test.describe('Dashboard Visual Parity Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to match Power BI canvas size
    await page.setViewportSize({ width: 1366, height: 768 });
  });

  test('dashboard matches Power BI design baseline', async ({ page }) => {
    await page.goto('/dashboards/deploy/insights_dashboard.html');
    
    // Wait for charts to render
    for (const chartId of CHART_IDS) {
      await page.waitForSelector(`#${chartId}`);
    }
    
    // Allow time for animations to complete
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the full page
    const screenshot = await page.screenshot({ fullPage: true });
    
    // Compare with baseline using visual comparison
    expect(screenshot).toMatchSnapshot('retail_dashboard_baseline.png');
  });

  test('KPI cards match Figma style spec', async ({ page }) => {
    await page.goto('/dashboards/deploy/insights_dashboard.html');
    
    // Select all KPI cards and compare with baseline
    const kpiSection = await page.$('.row.mb-4:first-of-type');
    const kpiScreenshot = await kpiSection.screenshot();
    
    expect(kpiScreenshot).toMatchSnapshot('kpi_cards_baseline.png');
  });

  test('tag cloud chips match Power BI slicer style', async ({ page }) => {
    await page.goto('/dashboards/deploy/insights_dashboard.html');
    
    // Get tag cloud container
    const tagCloud = await page.$('#tagCloud');
    const tagCloudScreenshot = await tagCloud.screenshot();
    
    expect(tagCloudScreenshot).toMatchSnapshot('tag_cloud_baseline.png');
  });

  test('insight cards match Power BI card style', async ({ page }) => {
    await page.goto('/dashboards/deploy/insights_dashboard.html');
    
    // Compare insight cards with baseline
    const insightCard = await page.$('.card-insight-general');
    const insightCardScreenshot = await insightCard.screenshot();
    
    expect(insightCardScreenshot).toMatchSnapshot('insight_card_baseline.png');
  });

  test('chart styling follows Power BI conventions', async ({ page }) => {
    await page.goto('/dashboards/deploy/insights_dashboard.html');
    
    // Wait for all charts to render
    await page.waitForTimeout(1000);
    
    // Take screenshots of each chart
    for (const chartId of CHART_IDS) {
      const chart = await page.$(`#${chartId}`);
      const chartScreenshot = await chart.screenshot();
      
      expect(chartScreenshot).toMatchSnapshot(`${chartId}_baseline.png`);
    }
  });

  test('dark mode toggle works correctly', async ({ page }) => {
    await page.goto('/dashboards/deploy/insights_dashboard.html');
    
    // Capture before dark mode
    const beforeScreenshot = await page.screenshot({ fullPage: false, clip: { x: 0, y: 0, width: 1366, height: 500 } });
    
    // Toggle dark mode
    await page.click('#darkModeToggle');
    await page.waitForTimeout(500); // Wait for transition
    
    // Capture after dark mode
    const afterScreenshot = await page.screenshot({ fullPage: false, clip: { x: 0, y: 0, width: 1366, height: 500 } });
    
    // Verify the screenshots are different
    expect(beforeScreenshot).not.toEqual(afterScreenshot);
    
    // Compare with dark mode baseline
    expect(afterScreenshot).toMatchSnapshot('dark_mode_baseline.png');
  });
});