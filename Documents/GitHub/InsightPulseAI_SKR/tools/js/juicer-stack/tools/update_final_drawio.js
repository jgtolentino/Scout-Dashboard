#!/usr/bin/env node
/**
 * update_final_drawio.js - Fix layout issues in the final draw.io diagram
 * 
 * This script reads the Updated_project_scout_with_genai.drawio file,
 * fixes any layout issues according to our standards, and writes out
 * an updated version of the file.
 * 
 * Usage: node update_final_drawio.js [input-path] [output-path]
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');

// Default paths
const defaultInputPath = '/Users/tbwa/Downloads/Updated_project_scout_with_genai.drawio';
const defaultOutputPath = '/Users/tbwa/Downloads/Updated_project_scout_with_genai_fixed.drawio';

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
 * Main function to update the diagram
 */
function updateDiagram() {
  log.title('Updating Diagram to Fix Layout Issues');
  
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
    
    // Get all cells
    const cells = xmlDoc.getElementsByTagName('mxCell');
    
    // Store cell IDs and labels for lookup
    const cellMap = {};
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const id = cell.getAttribute('id');
      const value = cell.getAttribute('value') || '';
      
      cellMap[id] = {
        cell,
        value,
        isIcon: id.includes('legend_')
      };
    }
    
    // Fix icon spacing in the legend
    fixLegendSpacing(xmlDoc, cellMap);
    
    // Fix overlapping labels
    fixOverlappingLabels(xmlDoc, cellMap);
    
    // Serialize back to XML
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xmlDoc);
    
    // Write the updated diagram
    log.info(`Writing updated diagram to: ${outputPath}`);
    fs.writeFileSync(outputPath, updatedXml);
    
    log.success('Diagram updated successfully!');
    log.info('1. Open the updated diagram in draw.io');
    log.info('2. Verify the layout changes');
    log.info('3. Save to finalize the updates');
    
  } catch (error) {
    log.error(`Failed to update diagram: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Fix the spacing in the legend
 */
function fixLegendSpacing(xmlDoc, cellMap) {
  log.info('Fixing legend spacing');
  
  // Find legend items by ID pattern
  const legendIds = Object.keys(cellMap).filter(id => id.includes('legend_'));
  
  if (legendIds.length === 0) {
    log.warning('No legend items found');
    return;
  }
  
  // Get legend cells
  const legendCells = legendIds.map(id => cellMap[id].cell);
  
  // Find legend labels
  const legendLabels = [
    'Batch Data Flow',
    'Real-time/Streaming Flow',
    'Supporting Service Connection'
  ];
  
  // Adjust positions
  let yOffset = 0;
  const VERTICAL_SPACING = 50; // 50px between legend items
  
  for (let i = 0; i < legendCells.length; i++) {
    const cell = legendCells[i];
    const geometry = cell.getElementsByTagName('mxGeometry')[0];
    
    if (geometry) {
      // Set new y position with proper spacing
      const currentY = parseFloat(geometry.getAttribute('y'));
      geometry.setAttribute('y', (currentY + yOffset).toString());
      
      // Increment offset for next item
      yOffset += VERTICAL_SPACING;
      
      log.info(`Adjusted position for legend item ${i+1}`);
    }
    
    // Find and adjust corresponding label
    const labelText = legendLabels[i];
    if (labelText) {
      const labelCell = findLabelCell(xmlDoc, labelText);
      
      if (labelCell) {
        const labelGeometry = labelCell.getElementsByTagName('mxGeometry')[0];
        
        if (labelGeometry) {
          // Move label to right of icon with 15px spacing
          const iconGeometry = cell.getElementsByTagName('mxGeometry')[0];
          if (iconGeometry) {
            const iconX = parseFloat(iconGeometry.getAttribute('x'));
            const iconY = parseFloat(iconGeometry.getAttribute('y'));
            const iconWidth = parseFloat(iconGeometry.getAttribute('width'));

            // Set fixed position far from other elements
            const fixedX = 650; // Fixed X position in diagram
            labelGeometry.setAttribute('x', fixedX.toString());
            labelGeometry.setAttribute('y', (iconY + 5).toString()); // Align with icon

            log.info(`Adjusted position for label: ${labelText}`);
          }
        }
      }
    }
  }
}

/**
 * Fix any overlapping labels with connectors
 */
function fixOverlappingLabels(xmlDoc, cellMap) {
  log.info('Checking for overlapping labels');
  
  // Find all connector labels
  const labels = Object.values(cellMap)
    .filter(item => item.value && item.value.trim() !== '')
    .map(item => item.cell);
  
  // Add padding to labels to prevent overlaps
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const style = label.getAttribute('style') || '';
    
    // Skip if already has padding
    if (style.includes('labelBackgroundColor')) {
      continue;
    }
    
    // Add label background and padding
    const newStyle = style + ';labelBackgroundColor=#FFFFFF;labelBorderColor=none;spacingLeft=5;spacingRight=5;spacingTop=2;spacingBottom=2;';
    label.setAttribute('style', newStyle);
    
    log.info(`Added padding to label: ${cellMap[label.getAttribute('id')].value}`);
  }
}

/**
 * Find a cell with the given label text
 */
function findLabelCell(xmlDoc, labelText) {
  const cells = xmlDoc.getElementsByTagName('mxCell');
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const value = cell.getAttribute('value') || '';
    
    if (value.includes(labelText)) {
      return cell;
    }
  }
  
  return null;
}

// Run the main function
updateDiagram();