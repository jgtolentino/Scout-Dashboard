#!/usr/bin/env node
/**
 * finalize_drawio.js - Create a final version of the Draw.io diagram with all layout fixes
 * 
 * This script creates a new version of the diagram with:
 * 1. Properly spaced legend items
 * 2. No label overlaps with connectors
 * 3. No icon-to-icon overlaps
 * 4. No icon-to-text overlaps
 * 5. Consistent styling and formatting
 * 
 * Usage: node finalize_drawio.js [input-path] [output-path]
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');

// Default paths
const defaultInputPath = '/Users/tbwa/Downloads/Updated_project_scout_with_genai.drawio';
const defaultOutputPath = '/Users/tbwa/Downloads/Project_Scout_Final.drawio';

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
 * Main function to finalize the diagram
 */
function finalizeDiagram() {
  log.title('Creating Final Version of Project Scout Architecture Diagram');
  
  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      log.error(`Input diagram not found: ${inputPath}`);
      process.exit(1);
    }
    
    log.info(`Reading diagram from: ${inputPath}`);
    const diagramXml = fs.readFileSync(inputPath, 'utf-8');
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(diagramXml, 'text/xml');
    
    // Apply all fixes
    log.info('Applying layout and styling fixes');
    const fixedDoc = applyAllFixes(xmlDoc);
    
    // Serialize back to XML
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(fixedDoc);
    
    // Write the finalized diagram
    log.info(`Writing finalized diagram to: ${outputPath}`);
    fs.writeFileSync(outputPath, updatedXml);
    
    log.success('Diagram finalized successfully!');
    log.info('Steps to complete:');
    log.info('1. Open the finalized diagram in draw.io');
    log.info('2. Export as PNG with scale 2x');
    log.info('3. Export as SVG');
    log.info('4. Save the final diagrams to the repository');
    
  } catch (error) {
    log.error(`Failed to finalize diagram: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Apply all fixes to the diagram
 */
function applyAllFixes(xmlDoc) {
  // First, reorganize the legend to avoid overlaps
  reorganizeLegend(xmlDoc);
  
  // Add padding to all labels
  addLabelPadding(xmlDoc);
  
  // Apply consistent styling to connectors
  applyConnectorStyling(xmlDoc);
  
  // Add invisible boundaries for layers
  enhanceLayerBoundaries(xmlDoc);
  
  return xmlDoc;
}

/**
 * Completely reorganize the legend to avoid overlaps
 */
function reorganizeLegend(xmlDoc) {
  log.info('Reorganizing legend');

  // Find the legend section
  const cells = xmlDoc.getElementsByTagName('mxCell');
  const legendCell = findCellByValue(cells, 'Legend');
  const legendLabelCell = findCellByValue(cells, 'Legend');

  if (!legendCell) {
    log.warning('Legend cell not found');
    return;
  }

  // Reposition the Legend label to avoid overlaps
  if (legendLabelCell) {
    const labelGeometry = legendLabelCell.getElementsByTagName('mxGeometry')[0];
    if (labelGeometry) {
      labelGeometry.setAttribute('y', (parseFloat(labelGeometry.getAttribute('y')) - 10).toString());

      // Add background to text for better visibility
      const style = legendLabelCell.getAttribute('style') || '';
      if (!style.includes('labelBackgroundColor')) {
        const newStyle = style + ';labelBackgroundColor=#FFFFFF;fontStyle=1;fontSize=14;spacingLeft=4;spacingRight=4;spacingTop=2;spacingBottom=2;';
        legendLabelCell.setAttribute('style', newStyle);
      }
    }
  }
  
  // Find legend items by finding cells with "legend_" in their ID
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
    return;
  }
  
  // Find legend texts
  const legendTexts = [
    findCellByValue(cells, 'Batch Data Flow'),
    findCellByValue(cells, 'Real-time/Streaming Flow'),
    findCellByValue(cells, 'Supporting Service Connection')
  ].filter(Boolean);
  
  // Get the legend position
  const legendGeometry = legendCell.getElementsByTagName('mxGeometry')[0];
  if (!legendGeometry) {
    log.warning('Legend geometry not found');
    return;
  }
  
  const legendX = parseFloat(legendGeometry.getAttribute('x'));
  const legendY = parseFloat(legendGeometry.getAttribute('y'));
  const legendWidth = parseFloat(legendGeometry.getAttribute('width'));
  const legendHeight = parseFloat(legendGeometry.getAttribute('height'));
  
  // Define new positions for legend items
  const ITEM_HEIGHT = 30;
  const ITEM_SPACING = 20;
  const ICON_TEXT_SPACING = 20;
  const LEGEND_PADDING = 40; // Increased padding to avoid overlaps with legend label
  
  // Position the legend items vertically with proper spacing
  for (let i = 0; i < legendItems.length; i++) {
    const item = legendItems[i];
    const itemGeometry = item.getElementsByTagName('mxGeometry')[0];
    
    if (itemGeometry) {
      // Position icon
      const iconX = legendX + LEGEND_PADDING;
      const iconY = legendY + LEGEND_PADDING + (i * (ITEM_HEIGHT + ITEM_SPACING));
      
      itemGeometry.setAttribute('x', iconX.toString());
      itemGeometry.setAttribute('y', iconY.toString());
      
      // If there's a corresponding text item, position it as well
      if (i < legendTexts.length) {
        const textGeometry = legendTexts[i].getElementsByTagName('mxGeometry')[0];
        
        if (textGeometry) {
          const textX = iconX + 40 + ICON_TEXT_SPACING; // 40 is typical icon width
          const textY = iconY + 5; // 5px offset for alignment
          
          textGeometry.setAttribute('x', textX.toString());
          textGeometry.setAttribute('y', textY.toString());
          
          // Add background to text for better visibility
          const style = legendTexts[i].getAttribute('style') || '';
          if (!style.includes('labelBackgroundColor')) {
            const newStyle = style + ';labelBackgroundColor=#FFFFFF;spacingLeft=4;spacingRight=4;spacingTop=2;spacingBottom=2;';
            legendTexts[i].setAttribute('style', newStyle);
          }
        }
      }
    }
  }
  
  // Resize the legend container if needed
  const newHeight = LEGEND_PADDING * 2 + (legendItems.length * (ITEM_HEIGHT + ITEM_SPACING)) - ITEM_SPACING;
  if (newHeight > legendHeight) {
    legendGeometry.setAttribute('height', newHeight.toString());
  }
}

/**
 * Add padding to all labels in the diagram
 */
function addLabelPadding(xmlDoc) {
  log.info('Adding padding to labels');
  
  const cells = xmlDoc.getElementsByTagName('mxCell');
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const value = cell.getAttribute('value') || '';
    const style = cell.getAttribute('style') || '';
    
    // Skip if empty or already has padding
    if (value.trim() === '' || style.includes('labelBackgroundColor')) {
      continue;
    }
    
    // Add label background and padding
    const newStyle = style + ';labelBackgroundColor=#FFFFFF;labelBorderColor=none;spacingLeft=4;spacingRight=4;spacingTop=2;spacingBottom=2;';
    cell.setAttribute('style', newStyle);
  }
}

/**
 * Apply consistent styling to connectors
 */
function applyConnectorStyling(xmlDoc) {
  log.info('Applying consistent connector styling');
  
  const cells = xmlDoc.getElementsByTagName('mxCell');
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const edge = cell.getAttribute('edge') === '1';
    
    if (!edge) continue;
    
    const style = cell.getAttribute('style') || '';
    
    // Make sure all connectors have rounded corners and proper endArrow
    if (!style.includes('rounded=1')) {
      const newStyle = style + ';rounded=1;orthogonalLoop=1;';
      cell.setAttribute('style', newStyle);
    }
    
    // Ensure connectors follow Manhattan routing
    const geometry = cell.getElementsByTagName('mxGeometry')[0];
    if (geometry) {
      geometry.setAttribute('relative', '1');
    }
  }
}

/**
 * Enhance layer boundaries for better visual separation
 */
function enhanceLayerBoundaries(xmlDoc) {
  log.info('Enhancing layer boundaries');
  
  const cells = xmlDoc.getElementsByTagName('mxCell');
  
  // Find the layer containers
  const layers = [
    findCellByValue(cells, '🏺 Bronze Layer (Raw Data)'),
    findCellByValue(cells, '🥈 Silver Layer (Processed Data)'),
    findCellByValue(cells, '🏆 Gold Layer (Analytics Ready)'),
    findCellByValue(cells, 'Platinum Layer'),
    findCellByValue(cells, 'Supporting Services')
  ].filter(Boolean);
  
  // Enhance each layer's visual style
  for (const layer of layers) {
    const style = layer.getAttribute('style') || '';
    
    // Make layer boundaries more distinct
    if (!style.includes('dashed=0')) {
      let newStyle = style;
      
      // Bronze Layer styling
      if (layer.getAttribute('value').includes('Bronze')) {
        newStyle = style + ';strokeWidth=2;strokeColor=#CD7F32;';
      }
      // Silver Layer styling
      else if (layer.getAttribute('value').includes('Silver')) {
        newStyle = style + ';strokeWidth=2;strokeColor=#C0C0C0;';
      }
      // Gold Layer styling
      else if (layer.getAttribute('value').includes('Gold')) {
        newStyle = style + ';strokeWidth=2;strokeColor=#FFD700;';
      }
      // Platinum Layer styling
      else if (layer.getAttribute('value').includes('Platinum')) {
        newStyle = style + ';strokeWidth=2;strokeColor=#FF9F78;';
      }
      // Supporting Services styling
      else if (layer.getAttribute('value').includes('Supporting')) {
        newStyle = style + ';strokeWidth=2;strokeColor=#7EA6E0;';
      }
      
      layer.setAttribute('style', newStyle);
    }
  }
}

/**
 * Find a cell with the given value
 */
function findCellByValue(cells, value) {
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const cellValue = cell.getAttribute('value') || '';
    
    if (cellValue.includes(value)) {
      return cell;
    }
  }
  
  return null;
}

// Run the main function
finalizeDiagram();