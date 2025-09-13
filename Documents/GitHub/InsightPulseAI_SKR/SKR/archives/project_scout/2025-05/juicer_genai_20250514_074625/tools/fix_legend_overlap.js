#!/usr/bin/env node
/**
 * fix_legend_overlap.js - Fix legend label overlaps in draw.io diagrams
 * 
 * This script specifically addresses the issue with legend items overlapping
 * with the "Legend" text label.
 * 
 * Usage: node fix_legend_overlap.js [input-path] [output-path]
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');

// Default paths
const defaultInputPath = '/Users/tbwa/Downloads/Project_Scout_Final_Sanitized.drawio';
const defaultOutputPath = '/Users/tbwa/Downloads/Project_Scout_Final_QA_Passed.drawio';

// Parse command line arguments
const inputPath = process.argv[2] || defaultInputPath;
const outputPath = process.argv[3] || defaultOutputPath;

// Define spacing constant
const VERTICAL_SPACING = 30; // 30px between legend items

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
 * Main function to fix legend overlaps
 */
function fixLegendOverlaps() {
  log.title('Fixing Legend Overlaps in draw.io diagram');
  
  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      log.error(`Input file not found: ${inputPath}`);
      process.exit(1);
    }
    
    log.info(`Reading diagram from: ${inputPath}`);
    const xmlContent = fs.readFileSync(inputPath, 'utf-8');
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Find the legend label
    log.info('Finding Legend label');
    const cells = xmlDoc.getElementsByTagName('mxCell');
    let legendLabelCell = null;
    
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const value = cell.getAttribute('value') || '';
      
      if (value.trim() === 'Legend') {
        legendLabelCell = cell;
        break;
      }
    }
    
    if (!legendLabelCell) {
      log.warning('Legend label not found');
    } else {
      log.info('Found Legend label');
      
      // Adjust the position of the Legend label
      const geometry = legendLabelCell.getElementsByTagName('mxGeometry')[0];
      if (geometry) {
        // Move the label up by 15 pixels and make it more prominent
        const y = parseFloat(geometry.getAttribute('y'));
        geometry.setAttribute('y', (y - 15).toString());
        
        // Update style to make more prominent
        const style = legendLabelCell.getAttribute('style') || '';
        if (!style.includes('fontSize=14')) {
          const newStyle = style.replace(/fontSize=\d+;/, '') + 'fontSize=14;fontStyle=1;';
          legendLabelCell.setAttribute('style', newStyle);
        }
        
        log.success('Adjusted Legend label position and style');
      }
    }
    
    // Find and adjust legend items
    log.info('Adjusting legend items');
    const legendItems = [];
    
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const id = cell.getAttribute('id') || '';
      
      if (id.includes('legend_')) {
        legendItems.push(cell);
      }
    }
    
    if (legendItems.length === 0) {
      log.warning('No legend items found');
    } else {
      log.info(`Found ${legendItems.length} legend items`);
      
      // Adjust each legend item to have more vertical spacing
      for (let i = 0; i < legendItems.length; i++) {
        const item = legendItems[i];
        const geometry = item.getElementsByTagName('mxGeometry')[0];
        
        if (geometry) {
          // Calculate new Y position with proper spacing
          // First item should be 30px below the legend label
          // Subsequent items should be VERTICAL_SPACING apart
          const y = 40 + (i * VERTICAL_SPACING); // 40px for first item from top of legend box
          geometry.setAttribute('y', y.toString());
          
          log.info(`Adjusted position for legend item ${i+1}`);
        }
      }
    }
    
    // Also fix legend text labels
    log.info('Adjusting legend text labels');
    const legendTextLabels = [
      'Batch Data Flow',
      'Real-time/Streaming Flow',
      'Supporting Service Connection'
    ];
    
    for (let i = 0; i < legendTextLabels.length; i++) {
      const label = legendTextLabels[i];
      let labelCell = null;
      
      // Find the label cell
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j];
        const value = cell.getAttribute('value') || '';
        
        if (value.includes(label)) {
          labelCell = cell;
          break;
        }
      }
      
      if (labelCell) {
        const geometry = labelCell.getElementsByTagName('mxGeometry')[0];
        
        if (geometry) {
          // Position the label to match its icon
          // X position should be to the right of icons (fixed position)
          // Y position should match the corresponding icon
          const x = 120; // Fixed position to the right of icons
          const y = 40 + (i * VERTICAL_SPACING) + 5; // Same as icon Y + 5px offset
          
          geometry.setAttribute('x', x.toString());
          geometry.setAttribute('y', y.toString());
          
          // Add background for better readability
          const style = labelCell.getAttribute('style') || '';
          if (!style.includes('labelBackgroundColor')) {
            const newStyle = style + 'labelBackgroundColor=#FFFFFF;spacingLeft=4;spacingRight=4;';
            labelCell.setAttribute('style', newStyle);
          }
          
          log.info(`Adjusted position for legend text: ${label}`);
        }
      } else {
        log.warning(`Legend text not found: ${label}`);
      }
    }
    
    // Find legend container and resize it if needed
    log.info('Checking legend container size');
    let legendContainer = null;
    
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const style = cell.getAttribute('style') || '';
      
      // Look for swimlane or container that might be the legend box
      if (style.includes('swimlane')) {
        // Check if any legend items are children of this cell
        const parent = cell.getAttribute('id');
        let isLegendContainer = false;
        
        for (const item of legendItems) {
          if (item.getAttribute('parent') === parent) {
            isLegendContainer = true;
            break;
          }
        }
        
        if (isLegendContainer) {
          legendContainer = cell;
          break;
        }
      }
    }
    
    if (legendContainer) {
      log.info('Found legend container');
      
      // Calculate required height based on number of legend items
      const requiredHeight = 60 + (legendItems.length * VERTICAL_SPACING); // 60px for padding + item height
      
      // Resize the container if needed
      const geometry = legendContainer.getElementsByTagName('mxGeometry')[0];
      if (geometry) {
        const currentHeight = parseFloat(geometry.getAttribute('height'));
        
        if (requiredHeight > currentHeight) {
          geometry.setAttribute('height', requiredHeight.toString());
          log.info(`Resized legend container to height: ${requiredHeight}`);
        }
      }
    } else {
      log.warning('Legend container not found');
    }
    
    // Serialize back to XML
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xmlDoc);
    
    // Write the updated XML
    log.info(`Writing updated diagram to: ${outputPath}`);
    fs.writeFileSync(outputPath, updatedXml);
    
    log.success('Legend overlaps fixed successfully!');
    log.info('Next steps:');
    log.info('1. Open the updated diagram in draw.io');
    log.info('2. Verify the legend items are properly spaced');
    log.info('3. Export as PNG with scale 2x');
    log.info('4. Export as SVG');
    
  } catch (error) {
    log.error(`Failed to fix legend overlaps: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
fixLegendOverlaps();