const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const url = 'file://' + process.argv[2] + '/index.html';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);
  await page.screenshot({ path: 'qa/snapshots/screenshot.png' });

  console.log('✅ UI screenshot saved: qa/snapshots/screenshot.png');
  await browser.close();
})();