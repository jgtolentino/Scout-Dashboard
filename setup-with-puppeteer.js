const puppeteer = require('puppeteer');
const fs = require('fs');

// Configuration
const PROJECT_REF = 'cxzllzyxwpyptfretryc';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI';

async function automateSupabaseSetup() {
  console.log('🚀 Starting automated Supabase setup...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for background execution
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to SQL Editor
    console.log('📊 Navigating to SQL Editor...');
    await page.goto(`https://app.supabase.com/project/${PROJECT_REF}/sql/new`, {
      waitUntil: 'networkidle0'
    });
    
    // Wait for SQL editor to load
    await page.waitForSelector('textarea', { timeout: 30000 });
    
    // Read SQL file
    const sql = fs.readFileSync('setup-database.sql', 'utf8');
    
    // Input SQL
    console.log('✍️ Entering SQL...');
    await page.type('textarea', sql);
    
    // Find and click Run button
    console.log('▶️ Running SQL...');
    await page.click('button:has-text("Run")');
    
    // Wait for execution
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'sql-execution-result.png', fullPage: true });
    console.log('📸 Screenshot saved: sql-execution-result.png');
    
    console.log('✅ SQL execution complete!');
    
    // Navigate to Edge Functions
    console.log('📦 Navigating to Edge Functions...');
    await page.goto(`https://app.supabase.com/project/${PROJECT_REF}/functions`, {
      waitUntil: 'networkidle0'
    });
    
    await page.screenshot({ path: 'edge-functions-status.png', fullPage: true });
    console.log('📸 Screenshot saved: edge-functions-status.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run automation
automateSupabaseSetup().catch(console.error);