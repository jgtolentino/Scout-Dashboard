/**
 * Global setup for Client360 Dashboard E2E tests
 * 
 * This runs once before all tests to:
 * - Verify API connectivity
 * - Set up test data if needed
 * - Configure environment
 */

const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🚀 Setting up Client360 Dashboard E2E tests...');
  
  const baseURL = process.env.TEST_BASE_URL || config.use.baseURL || 'http://localhost:8000';
  
  // Launch browser for setup checks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Check if test page is accessible
    console.log(`📍 Checking test page accessibility at ${baseURL}`);
    await page.goto(`${baseURL}/test_drilldown.html`, { timeout: 30000 });
    console.log('✅ Test page is accessible');
    
    // Verify JavaScript files load
    const drilldownScript = page.locator('script[src*="drilldown_handler.js"]');
    if (await drilldownScript.count() > 0) {
      console.log('✅ Drill-down handler script found');
    } else {
      console.warn('⚠️  Drill-down handler script not found');
    }
    
    // Wait for handler initialization
    try {
      await page.waitForFunction(() => window.drilldownHandler !== undefined, { timeout: 10000 });
      console.log('✅ Drill-down handler initialized successfully');
    } catch (error) {
      console.warn('⚠️  Drill-down handler failed to initialize:', error.message);
    }
    
    // Check API connectivity (optional - may not be available in all environments)
    try {
      const response = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/drilldown?kpi=total-sales');
          return { status: res.status, ok: res.ok };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (response.ok) {
        console.log('✅ API is responding successfully');
      } else if (response.status) {
        console.log(`⚠️  API returned status: ${response.status}`);
      } else {
        console.log('⚠️  API not accessible (this is expected in local testing)');
      }
    } catch (error) {
      console.log('⚠️  API connectivity check failed (this is expected in local testing)');
    }
    
    // Verify KPI tiles are present
    const kpiTiles = await page.locator('[data-kpi]').count();
    console.log(`✅ Found ${kpiTiles} KPI tiles on test page`);
    
    if (kpiTiles === 0) {
      throw new Error('No KPI tiles found on test page');
    }
    
    // Store test metadata for later use
    const testMetadata = {
      setupTime: new Date().toISOString(),
      baseURL,
      kpiTilesCount: kpiTiles,
      browserVersion: await browser.version(),
    };
    
    // You could store this in a file if needed for test reporting
    console.log('📊 Test metadata:', testMetadata);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('🎉 Global setup completed successfully!');
}

module.exports = globalSetup;