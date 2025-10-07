/**
 * Headless dashboard chart section screenshot capture
 * Usage: node qa_screenshot_chart.js [url] [output-path]
 * Default: http://localhost:3000 -> qa_chart.png
 */

const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2] || 'http://localhost:3000/insights_dashboard.html';
  const outputPath = process.argv[3] || 'qa_chart.png';
  
  console.log(`Capturing chart screenshot of ${url} to ${outputPath}...`);
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });
    
    // Handle missing resources
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
    
    // Capture just the charts row
    const chartsRow = await page.$('.row.mb-4:nth-of-type(3)');
    if (!chartsRow) {
      throw new Error('Charts row not found');
    }
    
    console.log('Capturing charts screenshot...');
    await chartsRow.screenshot({ path: outputPath });
    console.log(`Charts screenshot saved to ${outputPath}`);
    return 0;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();