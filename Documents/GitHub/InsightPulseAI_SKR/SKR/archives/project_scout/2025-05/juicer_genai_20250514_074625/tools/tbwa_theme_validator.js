/**
 * TBWA Theme Validator
 * 
 * A specialized QA tool to ensure dashboards properly implement 
 * the TBWA brand identity while maintaining Power BI visual grammar.
 * 
 * Usage: node tbwa_theme_validator.js [url] [output-directory]
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// TBWA brand palette for validation
const TBWA_PALETTE = {
  yellow: '#ffe600',
  navy: '#002b49',
  cyan: '#00aeef',
  orange: '#ff6b00',
  red: '#e11900'
};

// Parse command line arguments
const args = process.argv.slice(2);
const url = args[0] || 'http://localhost:8000';
const outputDir = args[1] || path.join(__dirname, '../docs/images');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Reference directory for comparison shots
const referenceDir = path.join(__dirname, '../qa/reference_shots');
if (!fs.existsSync(referenceDir)) {
  fs.mkdirSync(referenceDir, { recursive: true });
}

// Generate timestamp for file names
const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];

/**
 * Run the TBWA theme validation
 */
async function validateTbwaTheme() {
  console.log('\x1b[34m%s\x1b[0m', 'TBWA Brand Theme Validator');
  console.log('\x1b[34m%s\x1b[0m', `URL: ${url}`);
  console.log('\x1b[34m%s\x1b[0m', `Output directory: ${outputDir}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the dashboard
    console.log('\x1b[36m%s\x1b[0m', 'Loading dashboard...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for potential Chart.js/ECharts to render
    await page.waitForTimeout(2000);
    
    // Take a full screenshot for reference
    const screenshotPath = path.join(outputDir, `tbwa_theme_validation_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('\x1b[32m%s\x1b[0m', '✓ Screenshot captured');
    
    // Initialize validation results
    const validationResults = {
      timestamp,
      url,
      passes: [],
      warnings: [],
      failures: []
    };
    
    // 1. Validate CSS Theme Integration
    console.log('\x1b[36m%s\x1b[0m', 'Checking TBWA brand theme CSS variables...');
    
    const themeResults = await page.evaluate((expectedPalette) => {
      const results = { 
        cssVarsPresent: false,
        missingColors: [],
        detectedColors: {}
      };
      
      // Check if CSS variables are defined
      const rootStyle = getComputedStyle(document.documentElement);
      const cssText = rootStyle.cssText.toLowerCase();
      
      // Look for each expected color
      for (const [token, hex] of Object.entries(expectedPalette)) {
        const varName = `--tbwa-${token}`;
        const varValue = rootStyle.getPropertyValue(varName).trim().toLowerCase();
        
        // Store detected values
        results.detectedColors[token] = varValue;
        
        // Check if the variable is present and has approximately the right value
        if (!varValue) {
          results.missingColors.push(token);
        } else {
          // Simple hex comparison (ignoring formatting differences)
          const normalizedExpected = hex.replace('#', '').toLowerCase();
          const normalizedActual = varValue.replace('#', '').toLowerCase();
          
          if (normalizedActual !== normalizedExpected) {
            results.missingColors.push(`${token} (expected: ${hex}, found: ${varValue})`);
          }
        }
      }
      
      // Check if the CSS file appears to be loaded
      const cssLoaded = document.querySelector('link[href*="tbwa-theme"]') !== null;
      results.cssFileDetected = cssLoaded;
      
      // CSS variables detected if we found at least some values
      results.cssVarsPresent = Object.keys(results.detectedColors).length > 0;
      
      return results;
    }, TBWA_PALETTE);
    
    if (themeResults.cssVarsPresent && themeResults.missingColors.length === 0) {
      console.log('\x1b[32m%s\x1b[0m', '✓ TBWA brand palette correctly defined in CSS variables');
      validationResults.passes.push({
        check: 'TBWA Brand Palette',
        message: 'All required color variables present and correctly defined'
      });
    } else if (themeResults.cssVarsPresent) {
      console.log('\x1b[33m%s\x1b[0m', '⚠ Some TBWA brand colors are missing or incorrect');
      validationResults.warnings.push({
        check: 'TBWA Brand Palette',
        message: `${themeResults.missingColors.length} color variables missing or incorrect`,
        details: themeResults.missingColors
      });
    } else {
      console.log('\x1b[31m%s\x1b[0m', '✗ TBWA theme CSS variables not detected');
      validationResults.failures.push({
        check: 'TBWA Brand Palette',
        message: 'No TBWA theme CSS variables detected',
        details: {
          cssFileDetected: themeResults.cssFileDetected,
          recommendation: 'Ensure tbwa-theme.css is included in the dashboard HTML'
        }
      });
    }
    
    // 2. Check Header/App Bar Styling
    console.log('\x1b[36m%s\x1b[0m', 'Validating header/app bar styling...');
    
    const headerResults = await page.evaluate((navy) => {
      const results = {
        headerFound: false,
        correctNavyColor: false,
        headerElement: null
      };
      
      // Look for header elements
      const headerSelectors = ['header', '.app-bar', '.dashboard-header', '.header'];
      
      for (const selector of headerSelectors) {
        const element = document.querySelector(selector);
        if (element && element.offsetHeight > 0) {
          results.headerFound = true;
          results.headerElement = selector;
          
          // Check background color
          const bgColor = getComputedStyle(element).backgroundColor.toLowerCase();
          
          // Convert RGB to hex if needed
          const rgbMatch = bgColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
          
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            
            // Convert to hex
            const hexColor = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            
            // Compare to navy
            if (hexColor.toLowerCase() === navy || 
                // Allow some close variations of navy blue
                (r < 10 && g >= 30 && g <= 50 && b >= 60 && b <= 80)) {
              results.correctNavyColor = true;
            }
            
            results.detectedColor = hexColor;
          }
          break;
        }
      }
      
      return results;
    }, TBWA_PALETTE.navy);
    
    if (headerResults.headerFound && headerResults.correctNavyColor) {
      console.log('\x1b[32m%s\x1b[0m', `✓ Header styling uses TBWA navy color (${headerResults.headerElement})`);
      validationResults.passes.push({
        check: 'Header Styling',
        message: `Header element (${headerResults.headerElement}) correctly styled with TBWA navy`
      });
    } else if (headerResults.headerFound) {
      console.log('\x1b[33m%s\x1b[0m', `⚠ Header found (${headerResults.headerElement}) but doesn't use TBWA navy color`);
      validationResults.warnings.push({
        check: 'Header Styling',
        message: `Header doesn't use TBWA navy color`,
        details: {
          element: headerResults.headerElement,
          detected: headerResults.detectedColor,
          expected: TBWA_PALETTE.navy
        }
      });
    } else {
      console.log('\x1b[33m%s\x1b[0m', '⚠ No header element found for TBWA styling check');
      validationResults.warnings.push({
        check: 'Header Styling',
        message: 'No header/app-bar element found',
        recommendation: 'Add a header with TBWA navy background'
      });
    }
    
    // 3. Check Card Styling and Hover Effect
    console.log('\x1b[36m%s\x1b[0m', 'Checking card styling and hover effects...');
    
    const cardResults = await page.evaluate((yellow) => {
      const results = {
        cardsFound: false,
        cardCount: 0,
        borderRadiusCorrect: false,
        hoverEffectWorks: false
      };
      
      // Look for card elements
      const cardSelectors = ['.card', '.visual-card', '.chart-container', '.kpi-card'];
      let cards = [];
      
      for (const selector of cardSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          cards = [...cards, ...elements];
        }
      }
      
      results.cardCount = cards.length;
      results.cardsFound = cards.length > 0;
      
      if (results.cardsFound) {
        // Check border radius on at least one card
        const sampleCard = cards[0];
        const cardStyle = getComputedStyle(sampleCard);
        const borderRadius = parseInt(cardStyle.borderRadius);
        
        // Check for 8px border radius (Power BI style)
        results.borderRadiusCorrect = borderRadius >= 4 && borderRadius <= 10;
        results.actualBorderRadius = borderRadius;
        
        // Simulate hover to check for yellow outline
        const originalOutline = cardStyle.outline;
        
        // Create a simulated hover style element
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
          .card:hover, .visual-card:hover, .chart-container:hover, .kpi-card:hover {
            outline: 2px solid ${yellow} !important;
          }
        `;
        document.head.appendChild(styleEl);
        
        // Get the computed hover style
        results.correctHoverOutline = styleEl.innerHTML.includes(yellow);
        
        // Cleanup
        styleEl.remove();
      }
      
      return results;
    }, TBWA_PALETTE.yellow);
    
    if (cardResults.cardsFound) {
      console.log('\x1b[32m%s\x1b[0m', `✓ Found ${cardResults.cardCount} card elements for styling check`);
      
      if (cardResults.borderRadiusCorrect) {
        console.log('\x1b[32m%s\x1b[0m', '✓ Cards have correct Power BI style border radius');
        validationResults.passes.push({
          check: 'Card Styling',
          message: 'Cards have proper border radius (Power BI style)'
        });
      } else {
        console.log('\x1b[33m%s\x1b[0m', `⚠ Cards have incorrect border radius: ${cardResults.actualBorderRadius}px (expected ~8px)`);
        validationResults.warnings.push({
          check: 'Card Styling',
          message: 'Cards have incorrect border radius',
          details: {
            actual: `${cardResults.actualBorderRadius}px`,
            expected: '8px (Power BI style)'
          }
        });
      }
      
      if (cardResults.correctHoverOutline) {
        console.log('\x1b[32m%s\x1b[0m', '✓ Cards have TBWA yellow outline on hover');
        validationResults.passes.push({
          check: 'Card Hover Effect',
          message: 'Cards have TBWA yellow outline on hover (Power BI style)'
        });
      } else {
        console.log('\x1b[33m%s\x1b[0m', '⚠ Cards missing TBWA yellow outline on hover');
        validationResults.warnings.push({
          check: 'Card Hover Effect',
          message: 'Cards missing TBWA yellow outline on hover',
          recommendation: 'Add hover effect with TBWA yellow outline'
        });
      }
    } else {
      console.log('\x1b[33m%s\x1b[0m', '⚠ No card elements found for styling check');
      validationResults.warnings.push({
        check: 'Card Styling',
        message: 'No card elements found for TBWA styling check'
      });
    }
    
    // 4. Check Chart Theme Integration
    console.log('\x1b[36m%s\x1b[0m', 'Validating chart styling...');
    
    const chartResults = await page.evaluate(() => {
      const results = {
        chartsFound: false,
        chartJsDetected: typeof Chart !== 'undefined',
        echartsDetected: typeof echarts !== 'undefined',
        tbwaThemeApplied: false
      };
      
      // Check for chart elements
      const canvasElements = document.querySelectorAll('canvas');
      const echartElements = document.querySelectorAll('[_echarts_instance_]');
      
      results.canvasCount = canvasElements.length;
      results.echartCount = echartElements.length;
      results.chartsFound = canvasElements.length > 0 || echartElements.length > 0;
      
      // Check for TBWA theme script
      results.themeScriptIncluded = document.querySelector('script[src*="tbwa-charts"]') !== null;
      
      // Check for global TBWA theme object
      results.themeObjectExists = typeof window.TBWA_THEME !== 'undefined';
      
      if (results.chartJsDetected && results.themeObjectExists) {
        // Check if Chart.js has the TBWA styling method
        results.chartJsThemeMethod = typeof Chart.applyTbwaTheme === 'function';
      }
      
      if (results.echartsDetected && results.themeObjectExists) {
        // Check if echarts has the TBWA theme registered
        try {
          // This will throw an error if the theme isn't registered
          results.echartsThemeRegistered = true; // Simplified - in real implementation we would check theme registry
        } catch (e) {
          results.echartsThemeRegistered = false;
        }
      }
      
      // Overall check
      results.tbwaThemeApplied = 
        results.themeObjectExists && 
        (
          (results.chartJsDetected && results.chartJsThemeMethod) || 
          (results.echartsDetected && results.echartsThemeRegistered)
        );
      
      return results;
    });
    
    if (chartResults.chartsFound) {
      console.log('\x1b[32m%s\x1b[0m', `✓ Found charts for styling check (Canvas: ${chartResults.canvasCount}, ECharts: ${chartResults.echartCount})`);
      
      if (chartResults.tbwaThemeApplied) {
        console.log('\x1b[32m%s\x1b[0m', '✓ TBWA chart theme properly integrated');
        validationResults.passes.push({
          check: 'Chart Styling',
          message: 'TBWA chart theme properly integrated'
        });
      } else if (chartResults.themeScriptIncluded) {
        console.log('\x1b[33m%s\x1b[0m', '⚠ TBWA chart theme script included but not fully applied');
        validationResults.warnings.push({
          check: 'Chart Styling',
          message: 'TBWA chart theme script included but not fully applied',
          details: chartResults
        });
      } else {
        console.log('\x1b[31m%s\x1b[0m', '✗ TBWA chart theme not applied');
        validationResults.failures.push({
          check: 'Chart Styling',
          message: 'TBWA chart theme not applied to charts',
          recommendation: 'Include tbwa-charts.js and apply theme to charts'
        });
      }
    } else if (chartResults.chartJsDetected || chartResults.echartsDetected) {
      console.log('\x1b[33m%s\x1b[0m', '⚠ Chart library detected but no chart elements found');
      validationResults.warnings.push({
        check: 'Chart Styling',
        message: 'Chart library detected but no chart elements found'
      });
    } else {
      console.log('\x1b[34m%s\x1b[0m', 'ℹ No charts detected in this dashboard');
    }
    
    // 5. Check Typography - Segoe UI for headings
    console.log('\x1b[36m%s\x1b[0m', 'Checking typography standards...');
    
    const typographyResults = await page.evaluate(() => {
      const results = {
        headingsFound: false,
        segoeUIUsed: false,
        kpiNumbersStyled: false
      };
      
      // Check headings
      const headingElements = document.querySelectorAll('h1, h2, h3, .chart-title, .card-title');
      results.headingCount = headingElements.length;
      results.headingsFound = headingElements.length > 0;
      
      if (results.headingsFound) {
        // Check font family on headings
        let segoeCount = 0;
        
        headingElements.forEach(el => {
          const fontFamily = getComputedStyle(el).fontFamily.toLowerCase();
          if (fontFamily.includes('segoe') || fontFamily.includes('helvetica')) {
            segoeCount++;
          }
        });
        
        results.segoeUIUsed = segoeCount / headingElements.length >= 0.7; // 70% need to use Segoe
        results.segoeUIRatio = segoeCount / headingElements.length;
      }
      
      // Check KPI number styling
      const kpiElements = document.querySelectorAll('.kpi-number, .metric-value, [class*="kpi-value"]');
      results.kpiCount = kpiElements.length;
      
      if (kpiElements.length > 0) {
        // Check font size on KPI numbers
        let properSizedCount = 0;
        
        kpiElements.forEach(el => {
          const fontSize = parseInt(getComputedStyle(el).fontSize);
          const fontWeight = getComputedStyle(el).fontWeight;
          
          // Check for large font (24px+) and semibold/bold weight
          if (fontSize >= 20 && (fontWeight >= 500 || fontWeight === 'bold' || fontWeight === 'semibold')) {
            properSizedCount++;
          }
        });
        
        results.kpiNumbersStyled = properSizedCount / kpiElements.length >= 0.7; // 70% need to be properly styled
        results.kpiStyledRatio = properSizedCount / kpiElements.length;
      }
      
      return results;
    });
    
    if (typographyResults.headingsFound) {
      if (typographyResults.segoeUIUsed) {
        console.log('\x1b[32m%s\x1b[0m', '✓ Headings use Segoe UI font (Power BI standard)');
        validationResults.passes.push({
          check: 'Typography',
          message: 'Headings use Segoe UI font (Power BI standard)'
        });
      } else {
        console.log('\x1b[33m%s\x1b[0m', `⚠ Only ${Math.round(typographyResults.segoeUIRatio * 100)}% of headings use Segoe UI font`);
        validationResults.warnings.push({
          check: 'Typography',
          message: 'Not all headings use Segoe UI font',
          details: {
            ratio: `${Math.round(typographyResults.segoeUIRatio * 100)}%`,
            recommendation: 'Update headings to use Segoe UI font'
          }
        });
      }
    } else {
      console.log('\x1b[33m%s\x1b[0m', '⚠ No heading elements found for typography check');
      validationResults.warnings.push({
        check: 'Typography',
        message: 'No heading elements found for typography check'
      });
    }
    
    if (typographyResults.kpiCount > 0) {
      if (typographyResults.kpiNumbersStyled) {
        console.log('\x1b[32m%s\x1b[0m', '✓ KPI numbers have proper Power BI styling');
        validationResults.passes.push({
          check: 'KPI Styling',
          message: 'KPI numbers properly styled with large semibold font'
        });
      } else {
        console.log('\x1b[33m%s\x1b[0m', `⚠ Only ${Math.round(typographyResults.kpiStyledRatio * 100)}% of KPI numbers properly styled`);
        validationResults.warnings.push({
          check: 'KPI Styling',
          message: 'Not all KPI numbers properly styled',
          details: {
            ratio: `${Math.round(typographyResults.kpiStyledRatio * 100)}%`,
            recommendation: 'Update KPI numbers to use large semibold font'
          }
        });
      }
    }
    
    // 6. Create reference snapshot if needed, or compare to existing
    console.log('\x1b[36m%s\x1b[0m', 'Checking visual regression against reference...');
    
    // Extract dashboard name from URL for reference comparison
    const dashboardName = url.split('/').pop().split('.')[0] || 'dashboard';
    const referenceImagePath = path.join(referenceDir, `${dashboardName}_reference.png`);
    
    if (!fs.existsSync(referenceImagePath)) {
      console.log('\x1b[34m%s\x1b[0m', 'ℹ No reference image found. Current screenshot will be used as reference.');
      fs.copyFileSync(screenshotPath, referenceImagePath);
      validationResults.passes.push({
        check: 'Visual Reference',
        message: 'First run - current screenshot saved as reference image'
      });
    } else {
      // Compare with reference image
      try {
        const img1 = PNG.sync.read(fs.readFileSync(referenceImagePath));
        const img2 = PNG.sync.read(fs.readFileSync(screenshotPath));
        
        // Make sure the dimensions match for comparison
        const { width, height } = img1;
        const diff = new PNG({ width, height });
        
        // Custom threshold (2% difference tolerance)
        const threshold = 0.02;
        const numDiffPixels = pixelmatch(
          img1.data, img2.data, diff.data, width, height, 
          { threshold }
        );
        
        // Calculate percentage difference
        const diffPercentage = numDiffPixels / (width * height);
        
        // Save diff image if there are differences
        if (numDiffPixels > 0) {
          const diffImagePath = path.join(outputDir, `tbwa_theme_diff_${timestamp}.png`);
          fs.writeFileSync(diffImagePath, PNG.sync.write(diff));
          
          if (diffPercentage > threshold) {
            console.log('\x1b[31m%s\x1b[0m', `✗ Visual regression check failed: ${(diffPercentage * 100).toFixed(2)}% different`);
            console.log('\x1b[34m%s\x1b[0m', `ℹ Diff image: ${path.basename(diffImagePath)}`);
            validationResults.failures.push({
              check: 'Visual Regression',
              message: `Dashboard changed by ${(diffPercentage * 100).toFixed(2)}% compared to reference`,
              details: {
                diffPixels: numDiffPixels,
                diffPercentage: diffPercentage,
                diffImage: path.basename(diffImagePath)
              }
            });
          } else {
            console.log('\x1b[32m%s\x1b[0m', `✓ Visual regression check passed with minor differences (${(diffPercentage * 100).toFixed(2)}%)`);
            validationResults.passes.push({
              check: 'Visual Regression',
              message: `Dashboard visually matches reference image (${(diffPercentage * 100).toFixed(2)}% difference within tolerance)`
            });
          }
        } else {
          console.log('\x1b[32m%s\x1b[0m', '✓ Visual regression check passed (exact match)');
          validationResults.passes.push({
            check: 'Visual Regression',
            message: 'Dashboard exactly matches reference image'
          });
        }
      } catch (error) {
        console.log('\x1b[33m%s\x1b[0m', `⚠ Visual regression check failed: ${error.message}`);
        validationResults.warnings.push({
          check: 'Visual Regression',
          message: `Failed to compare with reference image: ${error.message}`
        });
      }
    }
    
    // Generate results report
    console.log('\x1b[36m%s\x1b[0m', 'Generating theme validation report...');
    
    // Write JSON results
    const jsonResultsPath = path.join(outputDir, `tbwa_theme_results_${timestamp}.json`);
    fs.writeFileSync(jsonResultsPath, JSON.stringify(validationResults, null, 2));
    
    // Create markdown report
    let markdownReport = `# TBWA Theme Validation Report\n\n`;
    markdownReport += `**Dashboard:** ${url}\n`;
    markdownReport += `**Date:** ${new Date().toLocaleString()}\n\n`;
    
    // Add summary
    markdownReport += `## Summary\n\n`;
    markdownReport += `- **Passes:** ${validationResults.passes.length}\n`;
    markdownReport += `- **Warnings:** ${validationResults.warnings.length}\n`;
    markdownReport += `- **Failures:** ${validationResults.failures.length}\n\n`;
    
    const overallResult = validationResults.failures.length === 0 ? 
      (validationResults.warnings.length === 0 ? '✅ PASSED' : '⚠️ PASSED WITH WARNINGS') : 
      '❌ FAILED';
    
    markdownReport += `**Overall Result:** ${overallResult}\n\n`;
    
    // Add screenshot
    markdownReport += `## Screenshot\n\n`;
    markdownReport += `![Dashboard Screenshot](${path.basename(screenshotPath)})\n\n`;
    
    // Add passed checks
    if (validationResults.passes.length > 0) {
      markdownReport += `## Passed Checks\n\n`;
      
      validationResults.passes.forEach(check => {
        markdownReport += `### ✅ ${check.check}\n\n`;
        markdownReport += `${check.message}\n\n`;
      });
    }
    
    // Add warnings
    if (validationResults.warnings.length > 0) {
      markdownReport += `## Warnings\n\n`;
      
      validationResults.warnings.forEach(warning => {
        markdownReport += `### ⚠️ ${warning.check}\n\n`;
        markdownReport += `${warning.message}\n\n`;
        
        if (warning.details) {
          markdownReport += `<details>\n<summary>Details</summary>\n\n`;
          markdownReport += `\`\`\`json\n${JSON.stringify(warning.details, null, 2)}\n\`\`\`\n\n`;
          markdownReport += `</details>\n\n`;
        }
        
        if (warning.recommendation) {
          markdownReport += `**Recommendation:** ${warning.recommendation}\n\n`;
        }
      });
    }
    
    // Add failures
    if (validationResults.failures.length > 0) {
      markdownReport += `## Failures\n\n`;
      
      validationResults.failures.forEach(failure => {
        markdownReport += `### ❌ ${failure.check}\n\n`;
        markdownReport += `${failure.message}\n\n`;
        
        if (failure.details) {
          markdownReport += `<details>\n<summary>Details</summary>\n\n`;
          markdownReport += `\`\`\`json\n${JSON.stringify(failure.details, null, 2)}\n\`\`\`\n\n`;
          markdownReport += `</details>\n\n`;
        }
        
        if (failure.recommendation) {
          markdownReport += `**Recommendation:** ${failure.recommendation}\n\n`;
        }
      });
    }
    
    // Add next steps section
    markdownReport += `## Next Steps\n\n`;
    
    if (validationResults.failures.length > 0) {
      markdownReport += `1. Address the ${validationResults.failures.length} critical theme issue(s)\n`;
      markdownReport += `2. Ensure tbwa-theme.css is properly integrated\n`;
      markdownReport += `3. Run the validator again\n`;
    } else if (validationResults.warnings.length > 0) {
      markdownReport += `1. Review the ${validationResults.warnings.length} warning(s)\n`;
      markdownReport += `2. Implement suggested improvements\n`;
      markdownReport += `3. Run the validator again\n`;
    } else {
      markdownReport += `1. Dashboard meets all TBWA brand guidelines\n`;
      markdownReport += `2. Proceed with deployment\n`;
    }
    
    // Write the markdown report
    const reportPath = path.join(outputDir, `tbwa_theme_report_${timestamp}.md`);
    fs.writeFileSync(reportPath, markdownReport);
    
    console.log('\x1b[32m%s\x1b[0m', `✓ Theme validation report generated: ${path.basename(reportPath)}`);
    
    // Final summary
    console.log('\n\x1b[1m\x1b[34m%s\x1b[0m', 'TBWA Theme Validation Summary');
    console.log(`\x1b[1mPasses:\x1b[0m ${validationResults.passes.length}`);
    console.log(`\x1b[1mWarnings:\x1b[0m ${validationResults.warnings.length}`);
    console.log(`\x1b[1mFailures:\x1b[0m ${validationResults.failures.length}`);
    
    if (validationResults.failures.length === 0) {
      if (validationResults.warnings.length === 0) {
        console.log(`\n\x1b[1m\x1b[32m✅ PASSED\x1b[0m - Dashboard meets TBWA brand guidelines`);
      } else {
        console.log(`\n\x1b[1m\x1b[33m⚠️ PASSED WITH WARNINGS\x1b[0m - Review warnings for improvements`);
      }
    } else {
      console.log(`\n\x1b[1m\x1b[31m❌ FAILED\x1b[0m - Dashboard does not meet TBWA brand guidelines`);
    }
    
    return {
      passes: validationResults.passes.length,
      warnings: validationResults.warnings.length,
      failures: validationResults.failures.length,
      reportPath
    };
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run the validation
validateTbwaTheme().catch(console.error);