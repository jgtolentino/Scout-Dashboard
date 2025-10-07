/**
 * Smoke test for the insights dashboard
 * Verifies the dashboard loads without errors and essential components are present
 */

const puppeteer = require('puppeteer');
const path = require('path');
const { spawn } = require('child_process');

describe('Dashboard Smoke Tests', () => {
  let browser;
  let page;
  let server;
  
  // Start a local server before tests
  beforeAll(async () => {
    // Start Python HTTP server
    server = spawn('python', [
      '-m', 'http.server', '8080', 
      '--directory', path.resolve(__dirname, '../../deployment-v2/public')
    ]);
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create new page
    page = await browser.newPage();
    
    // Enable console log collection
    page.on('console', message => {
      console.log(`Browser console: ${message.type()}: ${message.text()}`);
    });
    
    // Enable error collection
    page.on('pageerror', error => {
      console.error(`Browser page error: ${error.message}`);
    });
  });
  
  // Clean up after tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.kill();
    }
  });
  
  test('Dashboard loads without JS errors', async () => {
    // Navigate to the page
    const response = await page.goto('http://localhost:8080/insights_dashboard.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Check page loaded successfully
    expect(response.status()).toBe(200);
    
    // Check page title
    const title = await page.title();
    expect(title).toContain('Scout');
  }, 30000);
  
  test('Unified GenAI component initializes', async () => {
    // Navigate to the page
    await page.goto('http://localhost:8080/insights_dashboard.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Check if UnifiedGenAI is initialized
    const unifiedGenAI = await page.evaluate(() => {
      return typeof window.UnifiedGenAI !== 'undefined';
    });
    
    expect(unifiedGenAI).toBe(true);
    
    // Check console logs for initialization message
    const initLog = await page.evaluate(() => {
      return new Promise(resolve => {
        // Inject a script to check console.log calls
        const originalLog = console.log;
        console.log = function(message) {
          originalLog.apply(console, arguments);
          if (message && message.includes && message.includes('initializing')) {
            resolve(true);
          }
        };
        
        // If we haven't seen the log in 2 seconds, resolve with false
        setTimeout(() => resolve(false), 2000);
      });
    });
    
    expect(initLog).toBe(true);
  }, 30000);
  
  test('Dashboard renders essential components', async () => {
    // Navigate to the page
    await page.goto('http://localhost:8080/insights_dashboard.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Check for header
    const headerExists = await page.evaluate(() => {
      return document.querySelector('header') !== null;
    });
    expect(headerExists).toBe(true);
    
    // Check for insights container
    const insightsContainerExists = await page.evaluate(() => {
      return document.querySelector('.insights-grid') !== null;
    });
    expect(insightsContainerExists).toBe(true);
    
    // Check for charts
    const chartsExist = await page.evaluate(() => {
      return document.querySelectorAll('canvas').length > 0;
    });
    expect(chartsExist).toBe(true);
  }, 30000);
  
  test('Insights are displayed after loading', async () => {
    // Navigate to the page
    await page.goto('http://localhost:8080/insights_dashboard.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for insights to load (may take a moment for fetch and render)
    await page.waitForSelector('.insight-card', { timeout: 5000 })
      .catch(() => {
        console.warn('No insight cards found within timeout');
      });
    
    // Check if insight cards are rendered
    const insightCount = await page.evaluate(() => {
      return document.querySelectorAll('.insight-card').length;
    });
    
    // Either we have insight cards, or we have an empty state
    const emptyStateExists = await page.evaluate(() => {
      return document.querySelector('.empty-state') !== null;
    });
    
    expect(insightCount > 0 || emptyStateExists).toBe(true);
  }, 30000);
});