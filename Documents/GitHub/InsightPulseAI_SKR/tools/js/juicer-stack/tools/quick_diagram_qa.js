#!/usr/bin/env node
/**
 * quick_diagram_qa.js - Quick Architecture Diagram QA Tool
 * 
 * A lightweight, fast tool to perform basic quality checks on architecture diagrams.
 * Designed for quick validation before detailed QA or deployment.
 * 
 * Usage: node quick_diagram_qa.js [diagram-path] [output-dir]
 * 
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { DOMParser } = require('xmldom');

// Configuration
const DEFAULT_PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIAGRAM_PATH = path.join(DEFAULT_PROJECT_ROOT, 'docs/diagrams/project_scout_with_genai.drawio');
const DEFAULT_OUTPUT_DIR = path.join(DEFAULT_PROJECT_ROOT, 'docs/images');

// Parse arguments
const args = process.argv.slice(2);
const DIAGRAM_PATH = args[0] || DEFAULT_DIAGRAM_PATH;
const OUTPUT_DIR = args[1] || DEFAULT_OUTPUT_DIR;
const QA_RESULTS_PATH = path.join(OUTPUT_DIR, 'quick_qa_results.json');
const QA_RESULTS_MD_PATH = path.join(OUTPUT_DIR, 'quick_qa_results.md');

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Console output helpers
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`)
};

// Initialize QA results
let qaResults = {
  timestamp: new Date().toISOString(),
  diagram_path: DIAGRAM_PATH,
  output_directory: OUTPUT_DIR,
  checks: [],
  summary: {
    total: 0,
    passed: 0,
    warnings: 0,
    failed: 0
  }
};

// Add a check result
function addCheckResult(category, name, result, details = null) {
  const check = {
    category,
    name,
    result, // 'pass', 'warning', 'fail'
    details
  };
  
  qaResults.checks.push(check);
  qaResults.summary.total++;
  
  if (result === 'pass') {
    qaResults.summary.passed++;
  } else if (result === 'warning') {
    qaResults.summary.warnings++;
  } else if (result === 'fail') {
    qaResults.summary.failed++;
  }
  
  return check;
}

// Convert QA results to markdown
function resultsToMarkdown() {
  let md = `# Quick Architecture Diagram QA Results\n\n`;
  md += `**Diagram:** ${path.basename(qaResults.diagram_path)}\n`;
  md += `**Date:** ${new Date(qaResults.timestamp).toLocaleString()}\n\n`;
  
  md += `## Summary\n\n`;
  md += `- **Total Checks:** ${qaResults.summary.total}\n`;
  md += `- **Passed:** ${qaResults.summary.passed} ✓\n`;
  md += `- **Warnings:** ${qaResults.summary.warnings} ⚠️\n`;
  md += `- **Failed:** ${qaResults.summary.failed} ✗\n\n`;
  
  // Group checks by category
  const checksByCategory = {};
  qaResults.checks.forEach(check => {
    if (!checksByCategory[check.category]) {
      checksByCategory[check.category] = [];
    }
    checksByCategory[check.category].push(check);
  });
  
  // Output checks by category
  Object.keys(checksByCategory).forEach(category => {
    md += `## ${category}\n\n`;
    
    checksByCategory[category].forEach(check => {
      let icon = '✓';
      if (check.result === 'warning') icon = '⚠️';
      if (check.result === 'fail') icon = '✗';
      
      md += `### ${icon} ${check.name}\n\n`;
      
      if (check.details) {
        if (typeof check.details === 'string') {
          md += `${check.details}\n\n`;
        } else if (Array.isArray(check.details)) {
          check.details.forEach(detail => {
            md += `- ${detail}\n`;
          });
          md += '\n';
        } else if (typeof check.details === 'object') {
          Object.keys(check.details).forEach(key => {
            md += `- **${key}:** ${check.details[key]}\n`;
          });
          md += '\n';
        }
      }
    });
  });
  
  md += `## Next Steps\n\n`;
  
  if (qaResults.summary.failed > 0) {
    md += `1. Fix the ${qaResults.summary.failed} failed check(s) before proceeding\n`;
    md += `2. Address warnings where possible\n`;
    md += `3. Run full diagram QA after resolving critical issues\n`;
  } else if (qaResults.summary.warnings > 0) {
    md += `1. Review the ${qaResults.summary.warnings} warning(s)\n`;
    md += `2. Run full diagram QA for comprehensive validation\n`;
    md += `3. Proceed with deployment if all requirements are met\n`;
  } else {
    md += `1. Run full diagram QA for comprehensive validation\n`;
    md += `2. Proceed with deployment\n`;
    md += `3. Update documentation with diagram links\n`;
  }
  
  return md;
}

// Create directories if they don't exist
function ensureDirectories() {
  log.info(`Ensuring output directories exist`);
  
  const dirs = [
    OUTPUT_DIR,
    path.join(OUTPUT_DIR, 'archive'),
    path.dirname(DIAGRAM_PATH)
  ];
  
  let allCreated = true;
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        log.success(`Created directory: ${dir}`);
      } catch (err) {
        log.error(`Failed to create directory: ${dir}`);
        allCreated = false;
      }
    }
  });
  
  return addCheckResult('Setup', 'Directory Structure', allCreated ? 'pass' : 'fail', {
    directories: dirs
  });
}

// Check if diagram exists and has valid content
function validateDiagramFile() {
  log.info(`Validating diagram file: ${DIAGRAM_PATH}`);
  
  if (!fs.existsSync(DIAGRAM_PATH)) {
    return addCheckResult('File', 'Diagram Existence', 'fail', `Diagram file not found: ${DIAGRAM_PATH}`);
  }
  
  try {
    const stats = fs.statSync(DIAGRAM_PATH);
    
    if (stats.size === 0) {
      return addCheckResult('File', 'Diagram Content', 'fail', 'Diagram file is empty');
    }
    
    // Check if it's a valid XML file (for .drawio)
    const content = fs.readFileSync(DIAGRAM_PATH, 'utf-8');
    if (path.extname(DIAGRAM_PATH).toLowerCase() === '.drawio' && !content.includes('<mxfile')) {
      return addCheckResult('File', 'Diagram Format', 'fail', 'Not a valid draw.io file format');
    }
    
    // File is valid
    return addCheckResult('File', 'Diagram Validation', 'pass', {
      fileSize: `${Math.round(stats.size / 1024)} KB`,
      lastModified: stats.mtime.toISOString()
    });
  } catch (error) {
    return addCheckResult('File', 'Diagram Validation', 'fail', `Error: ${error.message}`);
  }
}

// Basic diagram structure analysis
function quickAnalyzeDiagram() {
  log.title('Quick Diagram Analysis');
  
  try {
    const diagramXml = fs.readFileSync(DIAGRAM_PATH, 'utf-8');
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(diagramXml, 'text/xml');
    
    // Find the main graph/model element
    const models = xmlDoc.getElementsByTagName('mxGraphModel');
    if (models.length === 0) {
      return addCheckResult('Structure', 'XML Structure', 'fail', 'No mxGraphModel found in the diagram');
    }
    
    const model = models[0];
    const root = model.getElementsByTagName('root')[0];
    
    if (!root) {
      return addCheckResult('Structure', 'XML Structure', 'fail', 'No root element found in the diagram');
    }
    
    // Get all cells
    const cells = root.getElementsByTagName('mxCell');
    
    // Count basic elements
    const stats = {
      totalCells: cells.length,
      vertices: 0,
      edges: 0,
      textElements: 0
    };
    
    // Collect statistics
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      
      // Check cell type
      if (cell.getAttribute('vertex') === '1') {
        stats.vertices++;
        
        // Check for text content
        const value = cell.getAttribute('value');
        if (value && value.trim() !== '') {
          stats.textElements++;
        }
      } else if (cell.getAttribute('edge') === '1') {
        stats.edges++;
      }
    }
    
    // Perform basic checks
    
    // 1. Check for minimum components (at least 5 shapes)
    const minComponentsCheck = stats.vertices >= 5;
    addCheckResult('Structure', 'Minimum Components', 
      minComponentsCheck ? 'pass' : 'warning', 
      `${stats.vertices} shapes found (minimum expected: 5)`
    );
    
    // 2. Check for connections (at least 3 connections)
    const connectionCheck = stats.edges >= 3;
    addCheckResult('Structure', 'Component Connections', 
      connectionCheck ? 'pass' : 'warning',
      `${stats.edges} connections found (minimum expected: 3)`
    );
    
    // 3. Check for labeled elements
    const labelCheck = stats.textElements >= (stats.vertices * 0.7); // 70% of vertices should have labels
    addCheckResult('Structure', 'Component Labeling', 
      labelCheck ? 'pass' : 'warning', 
      `${stats.textElements} labeled components out of ${stats.vertices} total shapes (${Math.round(stats.textElements/stats.vertices*100)}% labeled)`
    );
    
    // Return overall structure result
    return addCheckResult('Structure', 'Overall Structure', 
      (minComponentsCheck && connectionCheck && labelCheck) ? 'pass' : 'warning',
      {
        vertices: stats.vertices,
        edges: stats.edges,
        textElements: stats.textElements
      }
    );
    
  } catch (error) {
    return addCheckResult('Structure', 'Diagram Analysis', 'fail', `Error: ${error.message}`);
  }
}

// Check if draw.io CLI is available
function checkDrawIoAvailability() {
  log.info('Checking for draw.io CLI availability');
  
  try {
    execSync('draw.io --version', { stdio: 'ignore' });
    return addCheckResult('Tools', 'draw.io CLI', 'pass', 'draw.io CLI is available for exports');
  } catch (error) {
    return addCheckResult('Tools', 'draw.io CLI', 'warning', 'draw.io CLI not found - manual export will be required');
  }
}

// Check if related documentation exists
function checkRelatedDocumentation() {
  log.info('Checking for related documentation');
  
  const docsToCheck = [
    {
      path: path.join(DEFAULT_PROJECT_ROOT, 'docs/ARCHITECTURE_DIAGRAM.md'),
      name: 'Architecture Documentation'
    },
    {
      path: path.join(DEFAULT_PROJECT_ROOT, 'docs/QA_CHECKLIST_PROJECT_SCOUT.md'),
      name: 'QA Checklist'
    },
    {
      path: path.join(DEFAULT_PROJECT_ROOT, 'README.md'),
      name: 'Project README'
    }
  ];
  
  const existingDocs = [];
  const missingDocs = [];
  
  docsToCheck.forEach(doc => {
    if (fs.existsSync(doc.path)) {
      existingDocs.push(doc.name);
    } else {
      missingDocs.push(doc.name);
    }
  });
  
  const result = missingDocs.length === 0 ? 'pass' : 'warning';
  
  return addCheckResult('Documentation', 'Related Documents', result, {
    existing: existingDocs,
    missing: missingDocs
  });
}

// Output final results
function outputResults() {
  log.title('Quick QA Results Summary');
  
  // Calculate pass rate
  const passRate = Math.round((qaResults.summary.passed / qaResults.summary.total) * 100);
  
  // Display summary
  console.log(`${colors.bold}Total Checks:${colors.reset} ${qaResults.summary.total}`);
  console.log(`${colors.bold}${colors.green}Passed:${colors.reset} ${qaResults.summary.passed}`);
  console.log(`${colors.bold}${colors.yellow}Warnings:${colors.reset} ${qaResults.summary.warnings}`);
  console.log(`${colors.bold}${colors.red}Failed:${colors.reset} ${qaResults.summary.failed}`);
  console.log(`${colors.bold}Pass Rate:${colors.reset} ${passRate}%`);
  
  // Save results to JSON
  fs.writeFileSync(QA_RESULTS_PATH, JSON.stringify(qaResults, null, 2));
  log.success(`Results saved to: ${QA_RESULTS_PATH}`);
  
  // Save results as markdown
  const markdown = resultsToMarkdown();
  fs.writeFileSync(QA_RESULTS_MD_PATH, markdown);
  log.success(`Markdown results saved to: ${QA_RESULTS_MD_PATH}`);
  
  // Overall assessment
  if (qaResults.summary.failed > 0) {
    log.error(`Quick QA found ${qaResults.summary.failed} critical issues that must be fixed.`);
    process.exit(1);
  } else if (qaResults.summary.warnings > 0) {
    log.warning(`Quick QA completed with ${qaResults.summary.warnings} warnings to review.`);
    process.exit(0);
  } else {
    log.success('Quick QA completed successfully! All checks passed.');
    process.exit(0);
  }
}

// Main function
async function main() {
  console.log(`${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║  Quick Architecture Diagram QA                             ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  
  log.info(`Analyzing diagram: ${DIAGRAM_PATH}`);
  log.info(`Output directory: ${OUTPUT_DIR}`);
  
  // Run QA steps
  ensureDirectories();
  validateDiagramFile();
  quickAnalyzeDiagram();
  checkDrawIoAvailability();
  checkRelatedDocumentation();
  outputResults();
}

// Run main function
main().catch(error => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});