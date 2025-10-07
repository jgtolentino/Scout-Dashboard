/**
 * Zoho Mail Vacation Reply Browser Automation Script
 * Prerequisites: Node.js, Playwright
 * 
 * This script automates setting up a vacation reply in Zoho Mail
 * through browser automation when API access is not available.
 * 
 * Install dependencies:
 * npm install playwright
 * npx playwright install
 */

const { chromium } = require('playwright');

// Configuration - UPDATE THESE VALUES
const config = {
  email: '',       // Your Zoho Mail email address
  password: '',    // Your Zoho Mail password (consider using env vars for security)
  subject: 'Out of Office - InsightPulseAI',
  message: 'Thank you for your message. I am currently out of the office with limited access to email. I will respond to your message as soon as possible upon my return. For urgent matters, please contact support@insightpulseai.com.',
  startDate: '2025-05-03',
  endDate: '2025-05-10',
  replyToAll: true // true for all senders, false for contacts only
};

// Load credentials from environment variables if available
config.email = process.env.ZOHO_EMAIL || config.email;
config.password = process.env.ZOHO_PASSWORD || config.password;

// Main automation function
async function setupVacationReply() {
  console.log('Starting browser automation for Zoho vacation reply setup...');
  
  // Check for credentials
  if (!config.email || !config.password) {
    console.error('Error: Email and password must be provided.');
    console.error('Set them in the script or use environment variables:');
    console.error('ZOHO_EMAIL=your-email ZOHO_PASSWORD=your-password node zoho_browser_automation.js');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false }); // Set to true for production
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login to Zoho Mail
    console.log('Navigating to Zoho Mail login...');
    await page.goto('https://accounts.zoho.com/signin');
    
    // Fill login form
    await page.fill('#login_id', config.email);
    await page.click('#nextbtn');
    
    // Wait for password field to appear
    await page.waitForSelector('#password', { timeout: 10000 });
    await page.fill('#password', config.password);
    await page.click('#nextbtn');
    
    // Wait for login to complete
    console.log('Logging in...');
    await page.waitForNavigation({ timeout: 30000 });
    
    // Navigate to vacation reply settings
    console.log('Navigating to vacation reply settings...');
    await page.goto('https://mail.zoho.com/zm/#settings/vacationreply');
    
    // Wait for settings page to load
    await page.waitForSelector('#zmVacationReplyCheckbox', { timeout: 30000 });
    
    // Enable vacation reply
    console.log('Configuring vacation reply...');
    await page.check('#zmVacationReplyCheckbox');
    
    // Fill in subject
    await page.fill('#zmVacationReplySubject', config.subject);
    
    // Fill in message (needs to target the rich text editor)
    const frameSelector = '#zmComposeVacationReplyEditor_parent iframe';
    await page.waitForSelector(frameSelector);
    const frame = page.frameLocator(frameSelector).first();
    await frame.locator('body').fill(config.message);
    
    // Set date range
    await page.fill('#zmVacationReplyFromDate', config.startDate);
    await page.fill('#zmVacationReplyToDate', config.endDate);
    
    // Select who to reply to
    if (config.replyToAll) {
      await page.check('#zmVacationReplyAll');
    } else {
      await page.check('#zmVacationReplyContacts');
    }
    
    // Save settings
    console.log('Saving vacation reply settings...');
    await page.click('#zmSaveVacationReply');
    
    // Wait for confirmation
    await page.waitForSelector('.globalSuccessMsg', { timeout: 10000 });
    console.log('✅ Vacation reply configured successfully!');

  } catch (error) {
    console.error('Error during automation:', error);
  } finally {
    // Close browser
    await browser.close();
  }
}

// Run the automation
setupVacationReply().catch(console.error);