/**
 * Convert SVG baseline images to PNG format
 * 
 * This utility converts SVG baseline files to PNG format
 * to make them compatible with the visual parity tests.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Directory paths
const baselineDir = path.join(__dirname, '../baselines');
const placeholdersDir = path.join(baselineDir, 'placeholders');

// Get SVG files in baselines directory
const svgFiles = fs.readdirSync(baselineDir)
  .filter(file => file.endsWith('.svg'));

// Make sure placeholders directory exists
if (!fs.existsSync(placeholdersDir)) {
  fs.mkdirSync(placeholdersDir, { recursive: true });
}

// Convert SVG files to PNG
async function convertSvgToPng() {
  // Log start
  console.log('Converting SVG baselines to PNG format...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    
    // Process each SVG file
    for (const svgFile of svgFiles) {
      console.log(`Converting ${svgFile}...`);
      
      // Read SVG content
      const svgPath = path.join(baselineDir, svgFile);
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      
      // Generate PNG filename (same name but with .png extension)
      const pngFile = svgFile.replace('.svg', '.png');
      const pngPath = path.join(baselineDir, pngFile);
      
      // Move original SVG to placeholders directory
      const placeholderPath = path.join(placeholdersDir, svgFile);
      fs.copyFileSync(svgPath, placeholderPath);
      
      // Set up HTML page with SVG
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <body style="margin: 0; padding: 0;">
            ${svgContent}
          </body>
        </html>
      `);
      
      // Take screenshot
      const screenshot = await page.screenshot({ type: 'png' });
      
      // Save screenshot as PNG
      fs.writeFileSync(pngPath, screenshot);
      console.log(`  ✓ Created ${pngFile}`);
      
      // Remove the original SVG file (since we've backed it up)
      fs.unlinkSync(svgPath);
    }
  } finally {
    await browser.close();
  }
  
  console.log(`\nConversion complete! ${svgFiles.length} SVG files converted to PNG.`);
}

// Run conversion
convertSvgToPng().catch(error => {
  console.error('Error converting SVG to PNG:', error);
  process.exit(1);
});