#!/usr/bin/env node
/**
 * sanitize_drawio_xml.js - Remove invalid XML namespaces from draw.io files
 * 
 * This script specifically removes any invalid namespace prefixes (like qa:, ci:, etc.)
 * from draw.io XML files, while maintaining all other attributes and structure.
 * 
 * Usage: node sanitize_drawio_xml.js [input-path] [output-path]
 */

const fs = require('fs');
const path = require('path');

// Default paths
const defaultInputPath = '/Users/tbwa/Downloads/Project_Scout_Final_Corrected.drawio';
const defaultOutputPath = '/Users/tbwa/Downloads/Project_Scout_Final_Sanitized.drawio';

// Parse command line arguments
const inputPath = process.argv[2] || defaultInputPath;
const outputPath = process.argv[3] || defaultOutputPath;

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Simple logger
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO] ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING] ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}[ERROR] ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS] ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}`)
};

/**
 * Main function to sanitize draw.io XML
 */
function sanitizeDrawioXml() {
  log.title('Sanitizing draw.io XML file');
  
  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      log.error(`Input file not found: ${inputPath}`);
      process.exit(1);
    }
    
    log.info(`Reading file from: ${inputPath}`);
    const xmlContent = fs.readFileSync(inputPath, 'utf-8');
    
    // Find and remove invalid namespace attributes
    log.info('Removing invalid namespace declarations');
    const sanitizedXml1 = xmlContent.replace(/xmlns:qa=["'][^"']*["']/g, '');
    const sanitizedXml2 = sanitizedXml1.replace(/xmlns:ci=["'][^"']*["']/g, '');
    
    // Find and remove namespace prefixes from attributes
    log.info('Removing namespace prefixes from attributes');
    const sanitizedXml3 = sanitizedXml2.replace(/\s(qa|ci):([a-zA-Z0-9_-]+)=/g, ' $2=');
    
    // Count replacements
    const namespaceDeclarationCount = (xmlContent.match(/xmlns:(qa|ci)=/g) || []).length;
    const prefixedAttributeCount = (xmlContent.match(/\s(qa|ci):[a-zA-Z0-9_-]+=/g) || []).length;
    
    log.info(`Removed ${namespaceDeclarationCount} invalid namespace declarations`);
    log.info(`Removed ${prefixedAttributeCount} namespace prefixes from attributes`);
    
    // Write the sanitized XML
    log.info(`Writing sanitized file to: ${outputPath}`);
    fs.writeFileSync(outputPath, sanitizedXml3);
    
    log.success('File sanitized successfully!');
    log.info('Next steps:');
    log.info('1. Open the sanitized diagram in draw.io');
    log.info('2. Verify that all elements are displayed correctly');
    log.info('3. Export as PNG with scale 2x');
    log.info('4. Export as SVG');
    
  } catch (error) {
    log.error(`Failed to sanitize file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Process the diagram to ensure all rectangles for icons are properly labeled
 */
function ensureIconLabels() {
  log.info('Ensuring all icon rectangles have proper labels');
  
  try {
    // Read the sanitized file
    const xmlContent = fs.readFileSync(outputPath, 'utf-8');
    
    // Define icon labels to ensure are present
    const iconLabels = [
      { pattern: /fillColor="#E6194B"/, label: 'Raspberry Pi\\nEdge Device' },
      { pattern: /fillColor="#FF4B4B"/, label: 'Streamlit\\nDashboard' }
    ];
    
    // For each pattern, ensure the label is present
    let modifiedXml = xmlContent;
    for (const iconLabel of iconLabels) {
      // Find cells with the specific color but no value
      const regex = new RegExp(`<mxCell[^>]*${iconLabel.pattern.source}[^>]*value="\\s*"[^>]*>`, 'g');
      modifiedXml = modifiedXml.replace(regex, (match) => {
        return match.replace('value=""', `value="${iconLabel.label}"`);
      });
      
      // Also find cells with the specific color but with a value that doesn't match
      const regex2 = new RegExp(`<mxCell[^>]*${iconLabel.pattern.source}[^>]*value="[^"]*"[^>]*>`, 'g');
      modifiedXml = modifiedXml.replace(regex2, (match) => {
        if (!match.includes(iconLabel.label.replace('\\n', ''))) {
          return match.replace(/value="[^"]*"/, `value="${iconLabel.label}"`);
        }
        return match;
      });
    }
    
    // Write the modified XML back
    fs.writeFileSync(outputPath, modifiedXml);
    
  } catch (error) {
    log.error(`Failed to ensure icon labels: ${error.message}`);
  }
}

// Run the main functions
sanitizeDrawioXml();
ensureIconLabels();