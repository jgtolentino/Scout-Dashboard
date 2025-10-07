#!/usr/bin/env node
/**
 * check_diagram_overlaps.js - Check for overlapping elements in draw.io diagrams
 * 
 * This script analyzes draw.io diagrams for common layout issues such as:
 * - Overlapping labels with connectors
 * - Non-standard connector routing (non-Manhattan style)
 * - Component spacing inconsistencies
 * 
 * Usage: node check_diagram_overlaps.js [diagram-path]
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');

// Constants for geometry analysis
const PROXIMITY_THRESHOLD = 10; // pixels
const CONNECTOR_ANGLE_THRESHOLD = 5; // degrees deviation from 0, 90, 180, 270

// Parse command line arguments
const args = process.argv.slice(2);
const diagramPath = args[0] || path.join(__dirname, '../docs/images/AZURE_ARCHITECTURE_PRO.png').replace('.png', '.drawio');

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
 * Parse a mxCell's geometry attribute
 */
function parseGeometry(geometryAttr) {
  if (!geometryAttr) return null;
  
  // Extract coordinates and dimensions with regex
  const x = parseFloat(geometryAttr.match(/x="([^"]+)"/) ? geometryAttr.match(/x="([^"]+)"/)[1] : 0);
  const y = parseFloat(geometryAttr.match(/y="([^"]+)"/) ? geometryAttr.match(/y="([^"]+)"/)[1] : 0);
  const width = parseFloat(geometryAttr.match(/width="([^"]+)"/) ? geometryAttr.match(/width="([^"]+)"/)[1] : 0);
  const height = parseFloat(geometryAttr.match(/height="([^"]+)"/) ? geometryAttr.match(/height="([^"]+)"/)[1] : 0);
  
  return { x, y, width, height };
}

/**
 * Check if two elements overlap
 */
function checkOverlap(geom1, geom2) {
  if (!geom1 || !geom2) return false;
  
  // Check if rectangles overlap
  return !(
    geom1.x + geom1.width + PROXIMITY_THRESHOLD < geom2.x ||
    geom2.x + geom2.width + PROXIMITY_THRESHOLD < geom1.x ||
    geom1.y + geom1.height + PROXIMITY_THRESHOLD < geom2.y ||
    geom2.y + geom2.height + PROXIMITY_THRESHOLD < geom1.y
  );
}

/**
 * Analyze connector points to check if they follow Manhattan routing
 */
function analyzeConnectorRouting(points) {
  if (!points || points.length < 2) return true; // Assume it's OK if not enough points
  
  let isManhattan = true;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i-1];
    const curr = points[i];
    
    // Calculate angle in degrees
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Check if angle is close to 0, 90, 180, or 270 degrees
    const isHorizontal = Math.abs(angle) < CONNECTOR_ANGLE_THRESHOLD || Math.abs(angle - 180) < CONNECTOR_ANGLE_THRESHOLD;
    const isVertical = Math.abs(angle - 90) < CONNECTOR_ANGLE_THRESHOLD || Math.abs(angle + 90) < CONNECTOR_ANGLE_THRESHOLD;
    
    if (!isHorizontal && !isVertical) {
      isManhattan = false;
      break;
    }
  }
  
  return isManhattan;
}

/**
 * Extract connector points from a mxCell
 */
function extractConnectorPoints(cell) {
  const points = [];
  const geometry = cell.getElementsByTagName('mxGeometry')[0];
  
  if (!geometry) return points;
  
  // Add source point
  if (geometry.getAttribute('x') && geometry.getAttribute('y')) {
    points.push({
      x: parseFloat(geometry.getAttribute('x')),
      y: parseFloat(geometry.getAttribute('y'))
    });
  }
  
  // Add intermediate points
  const arrayNode = geometry.getElementsByTagName('Array')[0];
  if (arrayNode) {
    const pointNodes = arrayNode.getElementsByTagName('mxPoint');
    for (let i = 0; i < pointNodes.length; i++) {
      const point = pointNodes[i];
      points.push({
        x: parseFloat(point.getAttribute('x')),
        y: parseFloat(point.getAttribute('y'))
      });
    }
  }
  
  // Add target point
  const targetPoint = geometry.getElementsByTagName('mxPoint')[0];
  if (targetPoint) {
    points.push({
      x: parseFloat(targetPoint.getAttribute('x')),
      y: parseFloat(targetPoint.getAttribute('y'))
    });
  }
  
  return points;
}

/**
 * Main function to analyze the diagram
 */
function analyzeDiagram() {
  log.title('Analyzing diagram layout issues');
  
  try {
    // Check if diagram exists
    if (!fs.existsSync(diagramPath)) {
      log.error(`Diagram not found: ${diagramPath}`);
      process.exit(1);
    }
    
    // Read the diagram file
    const diagramXml = fs.readFileSync(diagramPath, 'utf-8');
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(diagramXml, 'text/xml');
    
    // Get all cells
    const cells = xmlDoc.getElementsByTagName('mxCell');
    
    // Store elements by type
    const components = [];
    const labels = [];
    const connectors = [];
    
    // Group elements by type
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const id = cell.getAttribute('id');
      const vertex = cell.getAttribute('vertex') === '1';
      const edge = cell.getAttribute('edge') === '1';
      const value = cell.getAttribute('value') || '';
      
      // Skip root and default parent cells
      if (id === '0' || id === '1') continue;
      
      // Get geometry element
      const geometryElements = cell.getElementsByTagName('mxGeometry');
      if (geometryElements.length === 0) continue;
      
      const geometryElement = geometryElements[0];
      const geometryXml = new XMLSerializer().serializeToString(geometryElement);
      const geometry = parseGeometry(geometryXml);
      
      // Categorize the element
      if (edge) {
        const points = extractConnectorPoints(cell);
        connectors.push({
          id,
          geometry,
          isManhattan: analyzeConnectorRouting(points),
          points
        });
      } else if (vertex) {
        if (value.trim() !== '') {
          // This is likely a label or a component with a label
          labels.push({
            id,
            value,
            geometry
          });
        }
        
        // All vertices are considered components
        components.push({
          id, 
          value,
          geometry
        });
      }
    }
    
    // Check for layout issues
    const issues = {
      overlappingLabels: 0,
      nonManhattanConnectors: 0,
      overlappingIcons: 0,
      iconTextOverlaps: 0,
      totalComponents: components.length,
      totalLabels: labels.length,
      totalConnectors: connectors.length,
      totalIcons: components.filter(c => !c.value || c.value.trim() === '').length
    };
    
    // Check for non-Manhattan connectors
    connectors.forEach(connector => {
      if (!connector.isManhattan) {
        issues.nonManhattanConnectors++;
        log.warning(`Connector ${connector.id} does not follow Manhattan routing`);
      }
    });
    
    // Check for overlapping labels with connectors
    for (const label of labels) {
      let isOverlapping = false;
      
      // Check against connectors
      for (const connector of connectors) {
        if (connector.points) {
          for (let i = 0; i < connector.points.length - 1; i++) {
            const start = connector.points[i];
            const end = connector.points[i + 1];
            
            // Create a bounding box for the line segment
            const lineGeom = {
              x: Math.min(start.x, end.x) - PROXIMITY_THRESHOLD,
              y: Math.min(start.y, end.y) - PROXIMITY_THRESHOLD,
              width: Math.abs(end.x - start.x) + 2 * PROXIMITY_THRESHOLD,
              height: Math.abs(end.y - start.y) + 2 * PROXIMITY_THRESHOLD
            };
            
            if (checkOverlap(label.geometry, lineGeom)) {
              isOverlapping = true;
              break;
            }
          }
        }
        
        if (isOverlapping) break;
      }
      
      if (isOverlapping) {
        issues.overlappingLabels++;
        log.warning(`Label "${label.value}" (${label.id}) may overlap with a connector`);
      }
    }

    // Check for icon-to-icon overlaps
    const icons = components.filter(c => !c.value || c.value.trim() === '');
    const MIN_ICON_SPACING_H = 20; // Minimum horizontal spacing between icons
    const MIN_ICON_SPACING_V = 30; // Minimum vertical spacing between icons

    for (let i = 0; i < icons.length; i++) {
      for (let j = i+1; j < icons.length; j++) {
        const icon1 = icons[i];
        const icon2 = icons[j];

        // Calculate spacing between icons
        const horizontalSpacing = Math.abs((icon1.geometry.x + icon1.geometry.width/2) -
                                           (icon2.geometry.x + icon2.geometry.width/2)) -
                                  (icon1.geometry.width/2 + icon2.geometry.width/2);

        const verticalSpacing = Math.abs((icon1.geometry.y + icon1.geometry.height/2) -
                                         (icon2.geometry.y + icon2.geometry.height/2)) -
                                (icon1.geometry.height/2 + icon2.geometry.height/2);

        // Check if icons are too close
        if (horizontalSpacing < MIN_ICON_SPACING_H && verticalSpacing < MIN_ICON_SPACING_V) {
          issues.overlappingIcons++;
          log.warning(`Icon ${icon1.id} is too close to icon ${icon2.id}`);
          break; // Only count each icon once
        }
      }
    }

    // Check for icon-to-text overlaps
    for (const icon of icons) {
      for (const label of labels) {
        if (checkOverlap(icon.geometry, label.geometry)) {
          issues.iconTextOverlaps++;
          log.warning(`Icon ${icon.id} may be overlapping with text "${label.value}"`);
          break; // Only count each icon once
        }
      }
    }

    // Print summary
    log.title('Layout Analysis Results');
    log.info(`Total components: ${issues.totalComponents}`);
    log.info(`Total labels: ${issues.totalLabels}`);
    log.info(`Total connectors: ${issues.totalConnectors}`);
    log.info(`Total icons: ${issues.totalIcons}`);
    log.info(`Non-Manhattan connectors: ${issues.nonManhattanConnectors} (${Math.round(issues.nonManhattanConnectors / issues.totalConnectors * 100)}%)`);
    log.info(`Potentially overlapping labels: ${issues.overlappingLabels} (${Math.round(issues.overlappingLabels / issues.totalLabels * 100)}%)`);
    log.info(`Icon-to-icon spacing issues: ${issues.overlappingIcons} (${Math.round(issues.overlappingIcons / issues.totalIcons * 100)}%)`);
    log.info(`Icon-to-text overlaps: ${issues.iconTextOverlaps} (${Math.round(issues.iconTextOverlaps / issues.totalIcons * 100)}%)`);

    if (issues.nonManhattanConnectors === 0 &&
        issues.overlappingLabels === 0 &&
        issues.overlappingIcons === 0 &&
        issues.iconTextOverlaps === 0) {
      log.success('No layout issues detected - diagram follows best practices!');
    } else {
      log.warning('Layout issues detected - refer to ARCHITECTURE_LAYOUT_STANDARDS.md for guidelines');
    }
    
    return issues;
  } catch (error) {
    log.error(`Analysis failed: ${error.message}`);
    return null;
  }
}

// Run the main function
analyzeDiagram();