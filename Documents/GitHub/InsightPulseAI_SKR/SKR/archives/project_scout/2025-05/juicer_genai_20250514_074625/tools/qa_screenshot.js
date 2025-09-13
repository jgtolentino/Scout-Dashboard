/**
 * Headless dashboard screenshot capture for QA
 * Usage: node qa_screenshot.js [url] [output-path]
 * Default: http://localhost:3000 -> qa_dashboard.png
 */

const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2] || 'http://localhost:3000';
  const outputPath = process.argv[3] || 'qa_dashboard.png';
  
  console.log(`Capturing screenshot of ${url} to ${outputPath}...`);
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });
    
    // Special handling for missing CSS paths
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('prompt-lab-icon.svg')) {
        request.respond({
          status: 200,
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#002b49"/></svg>'
        });
      } else {
        request.continue();
      }
    });
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for charts to render
    console.log('Page loaded, waiting for visualizations...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Inject Chart.js if needed
    await page.evaluate(() => {
      if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(script);
        return new Promise(resolve => {
          script.onload = resolve;
        });
      }
    });
    
    // Wait for charts to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Capturing screenshot...');
    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(`Screenshot saved to ${outputPath}`);
    return 0;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();