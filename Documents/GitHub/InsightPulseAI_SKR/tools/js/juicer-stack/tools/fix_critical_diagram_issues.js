#!/usr/bin/env node
/**
 * fix_critical_diagram_issues.js - Correct critical issues in the Project Scout diagram
 * 
 * This script addresses specific critical issues:
 * 1. Replace placeholder icons with proper fallbacks (Raspberry Pi, Streamlit, etc.)
 * 2. Fix icon-to-text spacing issues
 * 3. Normalize font sizes
 * 4. Correct icon alignment
 * 5. Ensure all components are properly labeled
 * 
 * Usage: node fix_critical_diagram_issues.js [input-path] [output-path]
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');

// Default paths
const defaultInputPath = '/Users/tbwa/Downloads/Project_Scout_Final.drawio';
const defaultOutputPath = '/Users/tbwa/Downloads/Project_Scout_Final_Corrected.drawio';

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
 * Main function to fix critical issues
 */
function fixCriticalIssues() {
  log.title('Fixing Critical Issues in Project Scout Diagram');
  
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
    
    // Apply all critical fixes
    log.info('Applying critical fixes');
    
    // 1. Replace the placeholder icons with proper fallbacks
    fixRaspberryPiIcon(xmlDoc);
    fixDashboardIcon(xmlDoc);
    
    // 2. Fix icon-to-text spacing issues
    fixIconTextSpacing(xmlDoc);
    
    // 3. Normalize font sizes
    normalizeFontSizes(xmlDoc);
    
    // 4. Correct icon alignment
    alignIcons(xmlDoc);
    
    // 5. Ensure all components are properly labeled
    ensureProperLabels(xmlDoc);
    
    // Serialize back to XML
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xmlDoc);
    
    // Write the corrected diagram
    log.info(`Writing corrected diagram to: ${outputPath}`);
    fs.writeFileSync(outputPath, updatedXml);
    
    log.success('Critical issues fixed successfully!');
    log.info('Next steps:');
    log.info('1. Open the corrected diagram in draw.io');
    log.info('2. Verify all fixes have been properly applied');
    log.info('3. Export as PNG with scale 2x');
    log.info('4. Export as SVG');
    log.info('5. Run the QA validation script to confirm all issues are resolved');
    
  } catch (error) {
    log.error(`Failed to fix critical issues: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Fix the Raspberry Pi icon
 */
function fixRaspberryPiIcon(xmlDoc) {
  log.info('Fixing Raspberry Pi icon');
  
  // Find the edge device in the Bronze layer
  const cells = xmlDoc.getElementsByTagName('mxCell');
  const raspberryPiCell = findRaspberryPiCell(cells);
  
  if (!raspberryPiCell) {
    log.warning('Raspberry Pi cell not found');
    return;
  }
  
  // Fix the style to use red color and proper shape
  const style = raspberryPiCell.getAttribute('style') || '';
  const newStyle = style
    .replace(/fillColor=.*?;/, 'fillColor=#E6194B;') // Raspberry Pi red color
    .replace(/strokeColor=.*?;/, 'strokeColor=#C9082A;')
    .replace(/rounded=.*?;/, 'rounded=1;')
    .replace(/shadow=.*?;/, 'shadow=1;')
    .replace(/fontColor=.*?;/, 'fontColor=#FFFFFF;'); // White text for contrast
  
  raspberryPiCell.setAttribute('style', newStyle);
  
  // Make sure it has proper value/label
  if (!raspberryPiCell.hasAttribute('value') || raspberryPiCell.getAttribute('value').trim() === '') {
    raspberryPiCell.setAttribute('value', 'Raspberry Pi\nEdge Device');
  }
  
  // Tag with custom icon attribute
  raspberryPiCell.setAttribute('qa:custom-icon', 'true');
  
  log.success('Raspberry Pi icon fixed');
}

/**
 * Fix the Dashboard icon
 */
function fixDashboardIcon(xmlDoc) {
  log.info('Fixing Dashboard icon');
  
  // Find the dashboard in the Gold layer
  const cells = xmlDoc.getElementsByTagName('mxCell');
  const dashboardCell = findDashboardCell(cells);
  
  if (!dashboardCell) {
    log.warning('Dashboard cell not found');
    return;
  }
  
  // Fix the style to use Streamlit-like appearance
  const style = dashboardCell.getAttribute('style') || '';
  const newStyle = style
    .replace(/fillColor=.*?;/, 'fillColor=#FF4B4B;') // Streamlit-like red color
    .replace(/strokeColor=.*?;/, 'strokeColor=#CC3C3C;')
    .replace(/rounded=.*?;/, 'rounded=1;')
    .replace(/shadow=.*?;/, 'shadow=1;')
    .replace(/fontColor=.*?;/, 'fontColor=#FFFFFF;'); // White text for contrast
  
  dashboardCell.setAttribute('style', newStyle);
  
  // Make sure it has proper value/label
  if (!dashboardCell.hasAttribute('value') || dashboardCell.getAttribute('value').trim() === '') {
    dashboardCell.setAttribute('value', 'Streamlit\nDashboard');
  } else if (!dashboardCell.getAttribute('value').includes('Streamlit')) {
    dashboardCell.setAttribute('value', 'Streamlit\n' + dashboardCell.getAttribute('value'));
  }
  
  // Tag with custom icon attribute
  dashboardCell.setAttribute('qa:custom-icon', 'true');
  
  log.success('Dashboard icon fixed');
}

/**
 * Fix icon-to-text spacing issues
 */
function fixIconTextSpacing(xmlDoc) {
  log.info('Fixing icon-to-text spacing issues');
  
  const cells = xmlDoc.getElementsByTagName('mxCell');
  const MIN_SPACING = 30; // 30px minimum spacing
  
  // Find all icon cells (nodes with no labels)
  const iconCells = [];
  const textCells = [];
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const id = cell.getAttribute('id');
    const vertex = cell.getAttribute('vertex') === '1';
    const value = cell.getAttribute('value') || '';
    
    // Skip root and default parent cells
    if (id === '0' || id === '1') continue;
    
    if (vertex) {
      if (value.trim() === '') {
        iconCells.push(cell);
      } else {
        textCells.push(cell);
      }
    }
  }
  
  // For each text cell, check distance to all icon cells
  for (const textCell of textCells) {
    const textGeometry = textCell.getElementsByTagName('mxGeometry')[0];
    if (!textGeometry) continue;
    
    const textX = parseFloat(textGeometry.getAttribute('x'));
    const textY = parseFloat(textGeometry.getAttribute('y'));
    const textWidth = parseFloat(textGeometry.getAttribute('width')) || 0;
    const textHeight = parseFloat(textGeometry.getAttribute('height')) || 0;
    
    for (const iconCell of iconCells) {
      const iconGeometry = iconCell.getElementsByTagName('mxGeometry')[0];
      if (!iconGeometry) continue;
      
      const iconX = parseFloat(iconGeometry.getAttribute('x'));
      const iconY = parseFloat(iconGeometry.getAttribute('y'));
      const iconWidth = parseFloat(iconGeometry.getAttribute('width')) || 0;
      const iconHeight = parseFloat(iconGeometry.getAttribute('height')) || 0;
      
      // Calculate horizontal and vertical distance between centers
      const horizontalDistance = Math.abs((iconX + iconWidth/2) - (textX + textWidth/2));
      const verticalDistance = Math.abs((iconY + iconHeight/2) - (textY + textHeight/2));
      
      // If they're close to each other, they might be related but too close
      if (horizontalDistance < 100 && verticalDistance < 50) {
        // Check if vertical spacing is too tight
        if (verticalDistance < MIN_SPACING) {
          // If text is below icon, move it down more
          if (textY > iconY) {
            textGeometry.setAttribute('y', (iconY + iconHeight + MIN_SPACING).toString());
            log.info(`Adjusted vertical spacing between text and icon`);
          }
          // If text is above icon, move it up more
          else if (textY < iconY) {
            textGeometry.setAttribute('y', (iconY - textHeight - MIN_SPACING).toString());
            log.info(`Adjusted vertical spacing between text and icon`);
          }
        }
      }
    }
  }
}

/**
 * Normalize font sizes across labels
 */
function normalizeFontSizes(xmlDoc) {
  log.info('Normalizing font sizes');
  
  const cells = xmlDoc.getElementsByTagName('mxCell');
  const STANDARD_FONT_SIZE = 12;
  
  // Process all cells with text
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const value = cell.getAttribute('value') || '';
    
    if (value.trim() === '') continue;
    
    const style = cell.getAttribute('style') || '';
    
    // Layer titles should be larger
    if (value.includes('Layer') || value.includes('Services')) {
      if (!style.includes('fontSize=14')) {
        const newStyle = style.replace(/fontSize=\d+;/, '') + 'fontSize=14;';
        cell.setAttribute('style', newStyle);
        log.info(`Set layer title font size: ${value}`);
      }
    }
    // Regular labels should be standardized
    else if (!style.includes('fontSize=')) {
      const newStyle = style + `fontSize=${STANDARD_FONT_SIZE};`;
      cell.setAttribute('style', newStyle);
      log.info(`Standardized font size for: ${value}`);
    }
  }
}

/**
 * Align icons to a grid for consistency
 */
function alignIcons(xmlDoc) {
  log.info('Aligning icons to grid');
  
  const cells = xmlDoc.getElementsByTagName('mxCell');
  const GRID_SIZE = 10; // 10px grid
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const id = cell.getAttribute('id');
    const vertex = cell.getAttribute('vertex') === '1';
    
    // Skip root, default parent, or non-vertex cells
    if (id === '0' || id === '1' || !vertex) continue;
    
    const geometry = cell.getElementsByTagName('mxGeometry')[0];
    if (!geometry) continue;
    
    // Round position to nearest grid point
    const x = parseFloat(geometry.getAttribute('x'));
    const y = parseFloat(geometry.getAttribute('y'));
    
    const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;
    
    // Only update if different
    if (x !== snappedX || y !== snappedY) {
      geometry.setAttribute('x', snappedX.toString());
      geometry.setAttribute('y', snappedY.toString());
      log.info(`Aligned element to grid: ${cell.getAttribute('value') || id}`);
    }
  }
}

/**
 * Ensure all components have proper labels
 */
function ensureProperLabels(xmlDoc) {
  log.info('Ensuring proper component labels');
  
  const cells = xmlDoc.getElementsByTagName('mxCell');
  
  // Find components that should have labels
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const id = cell.getAttribute('id');
    const vertex = cell.getAttribute('vertex') === '1';
    const style = cell.getAttribute('style') || '';
    const value = cell.getAttribute('value') || '';
    
    // Skip non-vertices and legend/layer elements
    if (!vertex || id === '0' || id === '1' || style.includes('swimlane')) continue;
    
    // Only process elements that look like components (not labels or connectors)
    if (style.includes('shape=') || style.includes('rounded=1')) {
      // Check if it has a label
      if (value.trim() === '') {
        // If it looks like the Raspberry Pi component
        if (style.includes('fillColor=#E6194B') || findNearbyText(xmlDoc, cell, 'Raspberry Pi')) {
          cell.setAttribute('value', 'Raspberry Pi\nEdge Device');
          log.info('Added label to Raspberry Pi component');
        }
        // If it looks like the dashboard component
        else if (style.includes('fillColor=#FF4B4B') || findNearbyText(xmlDoc, cell, 'Dashboard')) {
          cell.setAttribute('value', 'Streamlit\nDashboard');
          log.info('Added label to Dashboard component');
        }
        // For other unlabeled components, at least add a generic label
        else {
          cell.setAttribute('value', 'Component');
          log.warning(`Added generic label to component ${id}`);
        }
      }
    }
  }
}

/**
 * Find the cell that represents the Raspberry Pi device
 */
function findRaspberryPiCell(cells) {
  // First look for cells with "Raspberry Pi" in their value
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const value = cell.getAttribute('value') || '';
    
    if (value.includes('Raspberry Pi') || value.includes('Edge Device')) {
      return cell;
    }
  }
  
  // If not found, look for a placeholder in the Bronze layer
  // This is a heuristic - it tries to find a vertex in the Bronze layer that might be the Raspberry Pi
  const bronzeLayerCell = findCellByValue(cells, 'Bronze Layer');
  
  if (bronzeLayerCell) {
    // Get the parent ID of the Bronze layer
    const bronzeParentId = bronzeLayerCell.getAttribute('parent');
    
    // Find all vertices in the Bronze layer (with no text/with green fill or a specific position)
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const id = cell.getAttribute('id');
      const parent = cell.getAttribute('parent');
      const vertex = cell.getAttribute('vertex') === '1';
      const value = cell.getAttribute('value') || '';
      const style = cell.getAttribute('style') || '';
      
      // Skip root, default parent, or non-vertex cells
      if (id === '0' || id === '1' || !vertex) continue;
      
      // Check if it's a child of the Bronze layer
      if (parent === bronzeParentId) {
        // Check if it looks like a placeholder (no text or specifically in top-left of Bronze layer)
        if (value.trim() === '' || style.includes('fillColor=#00CC00')) {
          const geometry = cell.getElementsByTagName('mxGeometry')[0];
          
          if (geometry) {
            // If it's positioned in the left side of the diagram, it's likely the edge device
            const x = parseFloat(geometry.getAttribute('x'));
            if (x < 200) {
              return cell;
            }
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Find the cell that represents the Dashboard
 */
function findDashboardCell(cells) {
  // First look for cells with "Dashboard" in their value
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const value = cell.getAttribute('value') || '';
    
    if (value.includes('Dashboard') || value.includes('Streamlit')) {
      return cell;
    }
  }
  
  // If not found, look for a placeholder in the Gold layer or at the end of the flow
  const goldLayerCell = findCellByValue(cells, 'Gold Layer');
  
  if (goldLayerCell) {
    // Get the parent ID of the Gold layer
    const goldParentId = goldLayerCell.getAttribute('parent');
    
    // Find all vertices in the Gold layer (with no text/with specific color or position)
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const id = cell.getAttribute('id');
      const parent = cell.getAttribute('parent');
      const vertex = cell.getAttribute('vertex') === '1';
      const value = cell.getAttribute('value') || '';
      const style = cell.getAttribute('style') || '';
      
      // Skip root, default parent, or non-vertex cells
      if (id === '0' || id === '1' || !vertex) continue;
      
      // Check if it's a child of the Gold layer
      if (parent === goldParentId) {
        // Check if it looks like a dashboard placeholder
        if (value.trim() === '' || style.includes('fillColor=#FFA500')) {
          const geometry = cell.getElementsByTagName('mxGeometry')[0];
          
          if (geometry) {
            // If it's positioned in the right side of the diagram, it's likely the dashboard
            const x = parseFloat(geometry.getAttribute('x'));
            if (x > 600) {
              return cell;
            }
          }
        }
      }
    }
  }
  
  return null;
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

/**
 * Find text nearby a cell that contains the given text
 */
function findNearbyText(xmlDoc, targetCell, text) {
  const MAX_DISTANCE = 100; // Maximum distance to consider "nearby"
  
  const targetGeometry = targetCell.getElementsByTagName('mxGeometry')[0];
  if (!targetGeometry) return false;
  
  const targetX = parseFloat(targetGeometry.getAttribute('x'));
  const targetY = parseFloat(targetGeometry.getAttribute('y'));
  const targetWidth = parseFloat(targetGeometry.getAttribute('width'));
  const targetHeight = parseFloat(targetGeometry.getAttribute('height'));
  
  const cells = xmlDoc.getElementsByTagName('mxCell');
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const value = cell.getAttribute('value') || '';
    
    if (value.includes(text)) {
      const geometry = cell.getElementsByTagName('mxGeometry')[0];
      if (!geometry) continue;
      
      const x = parseFloat(geometry.getAttribute('x'));
      const y = parseFloat(geometry.getAttribute('y'));
      
      // Calculate distance between centers
      const distance = Math.sqrt(
        Math.pow((targetX + targetWidth/2) - (x + parseFloat(geometry.getAttribute('width') || 0)/2), 2) + 
        Math.pow((targetY + targetHeight/2) - (y + parseFloat(geometry.getAttribute('height') || 0)/2), 2)
      );
      
      if (distance < MAX_DISTANCE) {
        return true;
      }
    }
  }
  
  return false;
}

// Run the main function
fixCriticalIssues();