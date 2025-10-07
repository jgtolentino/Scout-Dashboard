/**
 * Dashboard Freshness Probe
 * 
 * Verifies that Gold layer data is fresh and regularly updated
 * Integrates with Puppeteer for automated dashboard verification
 */

const { DefaultAzureCredential } = require('@azure/identity');
const { BlobServiceClient } = require('@azure/storage-blob');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');

// Configuration
const STORAGE_ACCOUNT = 'tbwadata';
const CONTAINER = 'gold';
const HEARTBEAT_PATH = 'heartbeat.json';
const MAX_AGE_MINUTES = 60; // Maximum age of data in minutes
const DASHBOARD_URL = 'https://tbwa-analytics-dashboard.azurewebsites.net';

/**
 * Fetch the heartbeat file directly from ADLS Gen2
 * @returns {Promise<Object>} Heartbeat data
 */
async function fetchHeartbeatDirect() {
  try {
    // Use DefaultAzureCredential for authentication (managed identity)
    const credential = new DefaultAzureCredential();
    
    // Create the blob service client
    const blobServiceClient = new BlobServiceClient(
      `https://${STORAGE_ACCOUNT}.dfs.core.windows.net`,
      credential
    );
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER);
    
    // Get blob client for heartbeat file
    const blobClient = containerClient.getBlobClient(HEARTBEAT_PATH);
    
    // Download the heartbeat file
    const downloadResponse = await blobClient.download();
    const heartbeatData = await streamToString(downloadResponse.readableStreamBody);
    
    return JSON.parse(heartbeatData);
  } catch (error) {
    console.error(`Failed to fetch heartbeat file directly: ${error.message}`);
    throw error;
  }
}

/**
 * Helper function to convert a readable stream to a string
 * @param {ReadableStream} readableStream - The stream to convert
 * @returns {Promise<string>} The stream content as a string
 */
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

/**
 * Fetch the heartbeat file via the API
 * @returns {Promise<Object>} Heartbeat data
 */
async function fetchHeartbeatViaApi() {
  try {
    const response = await fetch(`${DASHBOARD_URL}/api/data?table=${HEARTBEAT_PATH}`);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Failed to fetch heartbeat via API: ${error.message}`);
    throw error;
  }
}

/**
 * Check if the data is fresh based on the heartbeat
 * @param {Object} heartbeat - The heartbeat data
 * @returns {Object} Freshness status
 */
function checkFreshness(heartbeat) {
  const updated = new Date(heartbeat.updated);
  const now = new Date();
  const ageInMs = now - updated;
  const ageInMinutes = Math.floor(ageInMs / (60 * 1000));
  
  return {
    lastUpdated: updated.toISOString(),
    ageInMinutes,
    isFresh: ageInMinutes < MAX_AGE_MINUTES,
    status: ageInMinutes < MAX_AGE_MINUTES ? 'fresh' : 'stale'
  };
}

/**
 * Run visual verification of the dashboard
 * @returns {Promise<Object>} Test results
 */
async function runVisualVerification() {
  let browser;
  
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Navigate to dashboard
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Wait for dashboard to load
    await page.waitForSelector('.kpi-container', { timeout: 30000 });
    
    // Check for error messages
    const errorElements = await page.$$('.error-message');
    if (errorElements.length > 0) {
      const errorText = await page.evaluate(el => el.textContent, errorElements[0]);
      throw new Error(`Dashboard error: ${errorText}`);
    }
    
    // Check data freshness indicator
    const freshnessElement = await page.$('.data-freshness');
    const freshnessStatus = await page.evaluate(el => el.classList.contains('fresh'), freshnessElement);
    
    // Take screenshot for visual verification
    const screenshotPath = `dashboard-${new Date().toISOString().replace(/:/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    return {
      visualVerification: 'success',
      freshnessIndicator: freshnessStatus ? 'fresh' : 'stale',
      screenshot: screenshotPath
    };
  } catch (error) {
    console.error(`Visual verification failed: ${error.message}`);
    return {
      visualVerification: 'failed',
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Main function to verify data freshness
 */
async function verifyDataFreshness() {
  try {
    // Try both methods to fetch heartbeat
    let heartbeat;
    let method;
    
    try {
      heartbeat = await fetchHeartbeatDirect();
      method = 'direct';
    } catch (directError) {
      console.warn(`Direct fetch failed, trying API: ${directError.message}`);
      heartbeat = await fetchHeartbeatViaApi();
      method = 'api';
    }
    
    // Check data freshness
    const freshness = checkFreshness(heartbeat);
    
    // Run visual verification if data is fresh
    let visualResults = {};
    if (freshness.isFresh) {
      visualResults = await runVisualVerification();
    }
    
    // Combine results
    const results = {
      timestamp: new Date().toISOString(),
      method,
      freshness,
      visualVerification: freshness.isFresh ? visualResults : { skipped: 'Data not fresh' }
    };
    
    console.log(JSON.stringify(results, null, 2));
    
    // Exit with error if data is stale
    if (!freshness.isFresh) {
      throw new Error(`Gold layer data is stale: ${freshness.ageInMinutes} minutes old (max: ${MAX_AGE_MINUTES})`);
    }
    
    return results;
  } catch (error) {
    console.error(`Data freshness verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyDataFreshness();
}

module.exports = {
  verifyDataFreshness,
  fetchHeartbeatDirect,
  fetchHeartbeatViaApi,
  checkFreshness,
  runVisualVerification
};