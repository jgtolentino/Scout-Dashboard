/**
 * compare_prd.js - PRD Comparison Tool for Scout Advisor Dashboard
 * 
 * This script:
 * 1. Loads the PRD definition from README_PRD_ADVISOR.md
 * 2. Loads the current HTML structure of the deployed dashboard
 * 3. Verifies that HTML structure matches PRD requirements
 * 4. Reports on compliance or issues found
 * 
 * Used by Caca QA Agent for independent verification.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const yaml = require('js-yaml');

// Parse command line arguments
const args = process.argv.slice(2);
let url = 'https://white-island-0c3f00f00.6.azurestaticapps.net/advisor';
let version = 'v1.0.0';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && i + 1 < args.length) {
    url = args[i + 1];
    i++;
  } else if (args[i] === '--version' && i + 1 < args.length) {
    version = args[i + 1];
    i++;
  }
}

// Configuration
const config = {
  outputDir: path.resolve(__dirname, `../../qa/snapshots/advisor-${version}`),
  tmpDir: path.resolve(__dirname, `../../qa/tmp`),
  prdPath: path.resolve(__dirname, `../../docs/README_PRD_ADVISOR.md`),
  fallbackPrdPath: path.resolve(__dirname, `../../docs/README_SCOUT_ADVISOR.md`),
  // Required components from PRD
  requiredComponents: [
    { name: 'header', selector: 'header, .header' },
    { name: 'navbar', selector: 'nav, .navbar' },
    { name: 'data-toggle', selector: '.data-source-toggle, #data-source-toggle' },
    { name: 'insights-grid', selector: '.insights-grid, .insights-container' },
    { name: 'kpi-cards', selector: '.kpi-row, .kpi-cards' },
    { name: 'chart-container', selector: '.chart-container, .visualization-container' }
  ]
};

// Ensure tmp directory exists
if (!fs.existsSync(config.tmpDir)) {
  fs.mkdirSync(config.tmpDir, { recursive: true });
}

/**
 * Extract YAML sections from markdown PRD file
 */
function extractYamlFromPrd(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`PRD file not found at ${filePath}`);
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const yamlBlocks = [];
    
    // Match all yaml blocks
    const regex = /```yaml([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      try {
        const yamlContent = match[1].trim();
        const parsed = yaml.load(yamlContent);
        yamlBlocks.push(parsed);
      } catch (err) {
        console.warn(`Error parsing YAML block: ${err.message}`);
      }
    }
    
    return yamlBlocks;
  } catch (err) {
    console.error(`Error reading PRD file: ${err.message}`);
    return null;
  }
}

/**
 * Analyze HTML structure against PRD requirements
 */
async function analyzeDashboard() {
  console.log(`Analyzing dashboard at ${url}`);
  
  // Try to load PRD definitions
  let prdBlocks = extractYamlFromPrd(config.prdPath);
  
  // If PRD file not found, try fallback
  if (!prdBlocks || prdBlocks.length === 0) {
    console.log(`Using fallback PRD path: ${config.fallbackPrdPath}`);
    prdBlocks = extractYamlFromPrd(config.fallbackPrdPath);
  }
  
  // If still no PRD blocks, create a basic structure
  if (!prdBlocks || prdBlocks.length === 0) {
    console.warn('No PRD YAML blocks found. Using default requirements.');
    prdBlocks = [{
      components: config.requiredComponents.map(c => ({
        name: c.name,
        required: true,
        description: `${c.name} component`
      }))
    }];
  }
  
  // Extract components from PRD blocks
  const prdComponents = [];
  for (const block of prdBlocks) {
    if (block.components) {
      prdComponents.push(...block.components);
    }
  }
  
  console.log(`Found ${prdComponents.length} components in PRD definition`);
  
  // Launch browser to analyze deployed dashboard
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    url,
    version,
    prd_components_count: prdComponents.length,
    html_validation: [],
    validation_results: [],
    missing_components: [],
    unexpected_components: []
  };
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the page
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for important elements to be visible
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Allow time for any animations or dynamic content to load
    await page.waitForTimeout(2000);
    
    // Capture HTML structure
    const htmlContent = await page.content();
    const htmlPath = path.join(config.tmpDir, `page_structure_${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Check required components
    for (const component of config.requiredComponents) {
      const found = await page.$(component.selector);
      
      results.html_validation.push({
        component: component.name,
        selector: component.selector,
        found: !!found,
        required: true
      });
      
      // Find matching PRD component
      const prdComponent = prdComponents.find(c => c.name === component.name || c.name.toLowerCase() === component.name.toLowerCase());
      
      if (found) {
        results.validation_results.push({
          component: component.name,
          status: 'PASS',
          message: `${component.name} component found as required`
        });
      } else {
        results.missing_components.push(component.name);
        const isRequired = prdComponent ? (prdComponent.required !== false) : true;
        
        if (isRequired) {
          results.validation_results.push({
            component: component.name,
            status: 'FAIL',
            message: `Required ${component.name} component not found`
          });
        } else {
          results.validation_results.push({
            component: component.name,
            status: 'WARN',
            message: `Optional ${component.name} component not found`
          });
        }
      }
    }
    
    // Look for unexpected components or structures
    // For example, check if there are any unused or undefined structures
    const unexpectedElements = await page.evaluate(() => {
      const results = [];
      
      // Check for alert/error messages
      const alerts = document.querySelectorAll('.alert, .error-message, [role="alert"]');
      if (alerts.length > 0) {
        results.push({
          element: 'alert',
          count: alerts.length,
          text: Array.from(alerts).map(a => a.textContent.trim()).join(' | ')
        });
      }
      
      // Check for empty containers
      const emptyContainers = Array.from(document.querySelectorAll('.container, .row, .col, section, main'))
        .filter(el => !el.children.length && !el.textContent.trim());
      
      if (emptyContainers.length > 0) {
        results.push({
          element: 'empty_container',
          count: emptyContainers.length,
          classes: Array.from(emptyContainers).map(c => c.className).join(', ')
        });
      }
      
      return results;
    });
    
    unexpectedElements.forEach(unexpected => {
      results.unexpected_components.push(unexpected);
      
      if (unexpected.element === 'alert') {
        results.validation_results.push({
          component: `unexpected_${unexpected.element}`,
          status: 'WARN',
          message: `Found ${unexpected.count} alert/error messages: "${unexpected.text.substring(0, 50)}..."`
        });
      } else if (unexpected.element === 'empty_container') {
        results.validation_results.push({
          component: `unexpected_${unexpected.element}`,
          status: 'WARN',
          message: `Found ${unexpected.count} empty containers with classes: ${unexpected.classes}`
        });
      }
    });
    
    // Generate summary
    const passCount = results.validation_results.filter(r => r.status === 'PASS').length;
    const failCount = results.validation_results.filter(r => r.status === 'FAIL').length;
    const warnCount = results.validation_results.filter(r => r.status === 'WARN').length;
    
    const summary = {
      total_checks: results.validation_results.length,
      pass: passCount,
      fail: failCount,
      warn: warnCount,
      overall_status: failCount > 0 ? 'FAIL' : (warnCount > 0 ? 'WARN' : 'PASS'),
      compliance_percentage: Math.round((passCount / results.validation_results.length) * 100)
    };
    
    results.summary = summary;
    
    // Save results
    fs.writeFileSync(
      path.join(config.tmpDir, `prd_comparison_results.json`),
      JSON.stringify(results, null, 2)
    );
    
    // Generate markdown report
    generateMarkdownReport(results);
    
    console.log(`PRD comparison complete. Status: ${summary.overall_status}`);
    console.log(`Compliance: ${summary.compliance_percentage}% (Pass: ${passCount}, Fail: ${failCount}, Warn: ${warnCount})`);
    console.log(`Results saved to ${path.join(config.tmpDir, 'prd_comparison_results.json')}`);
    
  } catch (err) {
    console.error('Error during PRD comparison:', err);
    results.validation_results.push({
      component: 'overall',
      status: 'ERROR',
      message: `Comparison error: ${err.message}`
    });
    
    // Save error results
    fs.writeFileSync(
      path.join(config.tmpDir, `prd_comparison_results.json`),
      JSON.stringify(results, null, 2)
    );
    
    // Exit with error code
    process.exit(1);
  } finally {
    await browser.close();
  }
}

/**
 * Generate a markdown report from results
 */
function generateMarkdownReport(results) {
  let markdown = `# Advisor Dashboard PRD Compliance Report\n\n`;
  
  markdown += `## Overview\n\n`;
  markdown += `- **URL:** ${results.url}\n`;
  markdown += `- **Version:** ${results.version}\n`;
  markdown += `- **Timestamp:** ${results.timestamp}\n`;
  markdown += `- **Status:** ${results.summary.overall_status}\n`;
  markdown += `- **Compliance:** ${results.summary.compliance_percentage}%\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- Total checks: ${results.summary.total_checks}\n`;
  markdown += `- Passed: ${results.summary.pass}\n`;
  markdown += `- Failed: ${results.summary.fail}\n`;
  markdown += `- Warnings: ${results.summary.warn}\n\n`;
  
  // Validation results
  markdown += `## Component Validation\n\n`;
  markdown += `| Component | Status | Message |\n`;
  markdown += `|-----------|--------|--------|\n`;
  
  results.validation_results.forEach(result => {
    const statusIcon = result.status === 'PASS' ? '✅' : 
                       result.status === 'FAIL' ? '❌' : 
                       result.status === 'WARN' ? '⚠️' : '🔥';
    markdown += `| ${result.component} | ${statusIcon} ${result.status} | ${result.message} |\n`;
  });
  
  // Missing components
  if (results.missing_components.length > 0) {
    markdown += `\n## Missing Components\n\n`;
    results.missing_components.forEach(component => {
      markdown += `- ${component}\n`;
    });
  }
  
  // Unexpected components
  if (results.unexpected_components.length > 0) {
    markdown += `\n## Unexpected Components\n\n`;
    results.unexpected_components.forEach(component => {
      markdown += `- **${component.element}**: Found ${component.count} instance(s)\n`;
      if (component.text) {
        markdown += `  - Text: "${component.text.substring(0, 100)}..."\n`;
      }
      if (component.classes) {
        markdown += `  - Classes: ${component.classes}\n`;
      }
    });
  }
  
  // Write the report
  fs.writeFileSync(
    path.join(config.tmpDir, `prd_comparison_report.md`),
    markdown
  );
}

// Run the analysis
analyzeDashboard().catch(err => {
  console.error('Fatal error during PRD comparison:', err);
  process.exit(1);
});