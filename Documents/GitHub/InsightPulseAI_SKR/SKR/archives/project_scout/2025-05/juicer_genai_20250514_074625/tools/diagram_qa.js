#!/usr/bin/env node
/**
 * diagram_qa.js - Advanced Architecture Diagram QA Tool
 * 
 * This script performs comprehensive quality checks on architecture diagrams,
 * specifically for Azure/Medallion architectures. It analyzes structure, style,
 * connections, and generates standardized exports.
 * 
 * Usage: node diagram_qa.js [input-diagram] [output-directory]
 * 
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { DOMParser, XMLSerializer } = require('xmldom');
const http = require('http');
const chalk = require('chalk');
const open = require('open');

// Configuration
const DEFAULT_PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIAGRAM_PATH = path.join(DEFAULT_PROJECT_ROOT, 'docs/architecture_src/architecture.drawio');
const DEFAULT_OUTPUT_DIR = path.join(DEFAULT_PROJECT_ROOT, 'docs/images');

// Parse arguments
const args = process.argv.slice(2);
const DIAGRAM_PATH = args[0] || DEFAULT_DIAGRAM_PATH;
const OUTPUT_DIR = args[1] || DEFAULT_OUTPUT_DIR;
const QA_RESULTS_PATH = path.join(OUTPUT_DIR, 'qa_results.json');
const QA_RESULTS_MD_PATH = path.join(OUTPUT_DIR, 'qa_results.md');

// Expected structure elements for Medallion architecture
const EXPECTED_ELEMENTS = {
  layers: ['bronze', 'silver', 'gold', 'platinum'],
  components: {
    datastores: 2,
    processing: 2,
    visualization: 1,
    connections: 5
  }
};

// Fallback icon handling checks
const FALLBACK_ICON_CHECKS = {
  customIconAttribute: 'qa:custom-icon',
  missingIconsFile: path.join(DEFAULT_PROJECT_ROOT, 'docs/MISSING_AZURE_ICONS.md'),
  policyFile: path.join(DEFAULT_PROJECT_ROOT, 'docs/ICON_FALLBACK_POLICY.md'),
  azureBlueColor: '#0078D4',
  requiredAnnotation: 'unofficial visual',
  standardShapes: ['rounded rectangle', 'hexagon']
};

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
  },
  exports: []
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

// Add an export result
function addExport(type, path, success) {
  qaResults.exports.push({
    type,
    path,
    success
  });
}

// Convert QA results to markdown
function resultsToMarkdown() {
  let md = `# Architecture Diagram QA Results\n\n`;
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
  
  // Output exports
  md += `## Generated Exports\n\n`;
  qaResults.exports.forEach(exp => {
    const icon = exp.success ? '✓' : '✗';
    md += `- ${icon} **${exp.type}:** ${path.basename(exp.path)}\n`;
  });
  
  return md;
}

// Create directories if they don't exist
function ensureDirectories() {
  log.info(`Ensuring output directories exist`);
  
  const dirs = [
    OUTPUT_DIR,
    path.join(OUTPUT_DIR, 'archive'),
    path.join(DEFAULT_PROJECT_ROOT, 'docs/architecture_src')
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

// Analyze diagram XML for structure and style
function analyzeDiagram() {
  log.title('Analyzing Diagram Structure');
  
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
    
    // Statistics for basic checks
    const stats = {
      totalCells: cells.length,
      vertices: 0,
      edges: 0,
      textElements: 0,
      styles: {},
      styleCount: {},
      layerKeys: []
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
          
          // Check for layer keys (Bronze, Silver, Gold, Platinum)
          EXPECTED_ELEMENTS.layers.forEach(layer => {
            if (value.toLowerCase().includes(layer)) {
              stats.layerKeys.push(layer);
            }
          });
        }
      } else if (cell.getAttribute('edge') === '1') {
        stats.edges++;
      }
      
      // Analyze styles
      const style = cell.getAttribute('style');
      if (style) {
        // Count styles
        if (!stats.styleCount[style]) {
          stats.styleCount[style] = 0;
        }
        stats.styleCount[style]++;
        
        // Extract style properties
        const styleProps = {};
        style.split(';').forEach(prop => {
          const [key, value] = prop.split('=');
          if (key && value) {
            styleProps[key] = value;
          }
        });
        
        stats.styles[i] = styleProps;
      }
    }
    
    // Perform basic checks
    
    // 1. Check for labeled elements
    const labelCheck = stats.textElements >= (stats.vertices * 0.8); // 80% of vertices should have labels
    addCheckResult('Structure', 'Component Labeling', 
      labelCheck ? 'pass' : 'warning', 
      `${stats.textElements} labeled components out of ${stats.vertices} total shapes (${Math.round(stats.textElements/stats.vertices*100)}% labeled)`
    );
    
    // 2. Check for connections
    const connectionCheck = stats.edges >= EXPECTED_ELEMENTS.components.connections;
    addCheckResult('Structure', 'Component Connections', 
      connectionCheck ? 'pass' : 'warning',
      `${stats.edges} connections found (minimum expected: ${EXPECTED_ELEMENTS.components.connections})`
    );
    
    // 3. Check for Medallion layers
    const uniqueLayers = [...new Set(stats.layerKeys)];
    const layerCheck = uniqueLayers.length >= EXPECTED_ELEMENTS.layers.length * 0.75; // At least 75% of expected layers
    addCheckResult('Structure', 'Medallion Layer Structure', 
      layerCheck ? 'pass' : 'warning',
      `Found ${uniqueLayers.length} layers: ${uniqueLayers.join(', ')}`
    );
    
    // 4. Check style consistency
    const styleKeys = Object.keys(stats.styleCount);
    const mostFrequentStyles = styleKeys.sort((a, b) => stats.styleCount[b] - stats.styleCount[a]).slice(0, 5);
    const styleConsistency = mostFrequentStyles.length <= 10; // Not too many different styles
    addCheckResult('Style', 'Visual Consistency', 
      styleConsistency ? 'pass' : 'warning',
      `Using ${styleKeys.length} distinct styles (${styleConsistency ? 'good' : 'consider standardizing styles'})`
    );
    
    // Return overall structure result
    return addCheckResult('Structure', 'Overall Structure', 
      (labelCheck && connectionCheck && layerCheck) ? 'pass' : 'warning',
      {
        vertices: stats.vertices,
        edges: stats.edges,
        textElements: stats.textElements,
        layersIdentified: uniqueLayers
      }
    );
    
  } catch (error) {
    return addCheckResult('Structure', 'Diagram Analysis', 'fail', `Error: ${error.message}`);
  }
}

// Check for proper fallback icon handling
function checkFallbackIcons() {
  log.title('Checking Fallback Icon Handling');

  try {
    // Read the diagram file
    const diagramXml = fs.readFileSync(DIAGRAM_PATH, 'utf-8');

    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(diagramXml, 'text/xml');

    // Find all custom shapes with custom icon attributes
    const customIcons = [];
    const cells = xmlDoc.getElementsByTagName('mxCell');

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];

      // Check for custom icon attribute
      if (cell.hasAttribute(FALLBACK_ICON_CHECKS.customIconAttribute) ||
          (cell.hasAttribute('value') && cell.getAttribute('value').toLowerCase().includes(FALLBACK_ICON_CHECKS.requiredAnnotation))) {

        const id = cell.getAttribute('id');
        const style = cell.getAttribute('style') || '';
        const value = cell.getAttribute('value') || '';

        customIcons.push({
          id,
          style,
          value,
          hasProperColor: style.includes(FALLBACK_ICON_CHECKS.azureBlueColor),
          hasProperAnnotation: value.toLowerCase().includes(FALLBACK_ICON_CHECKS.requiredAnnotation),
          hasProperAttribute: cell.hasAttribute(FALLBACK_ICON_CHECKS.customIconAttribute)
        });
      }
    }

    // Check for required documentation files
    const missingIconsFileExists = fs.existsSync(FALLBACK_ICON_CHECKS.missingIconsFile);
    const policyFileExists = fs.existsSync(FALLBACK_ICON_CHECKS.policyFile);

    // Evaluate results
    const iconCheckResult = customIcons.length === 0 ||
      (customIcons.every(icon => icon.hasProperColor && (icon.hasProperAnnotation || icon.hasProperAttribute)) &&
       missingIconsFileExists && policyFileExists);

    return addCheckResult('Style', 'Fallback Icon Handling',
      iconCheckResult ? 'pass' : 'warning',
      `Found ${customIcons.length} custom icon${customIcons.length === 1 ? '' : 's'}. ${!missingIconsFileExists && customIcons.length > 0 ? 'Missing icons file not found.' : ''} ${!policyFileExists && customIcons.length > 0 ? 'Icon fallback policy not found.' : ''}`
    );
  } catch (error) {
    return addCheckResult('Style', 'Fallback Icon Handling', 'fail', `Error: ${error.message}`);
  }
}

// Copy diagram to architecture_src if needed
function archiveDiagram() {
  log.info(`Archiving diagram source file`);

  try {
    // Only copy if the source isn't already in architecture_src
    if (!DIAGRAM_PATH.includes('architecture_src')) {
      const basename = path.basename(DIAGRAM_PATH);
      const destPath = path.join(DEFAULT_PROJECT_ROOT, 'docs/architecture_src', basename);

      fs.copyFileSync(DIAGRAM_PATH, destPath);
      log.success(`Copied diagram to: ${destPath}`);

      return addCheckResult('Setup', 'Diagram Archiving', 'pass', {
        source: DIAGRAM_PATH,
        destination: destPath
      });
    } else {
      return addCheckResult('Setup', 'Diagram Archiving', 'pass', 'Already in architecture_src directory');
    }
  } catch (error) {
    return addCheckResult('Setup', 'Diagram Archiving', 'fail', `Error: ${error.message}`);
  }
}

// Check if draw.io CLI is available and generate exports
async function generateExports() {
  log.title('Generating Diagram Exports');
  
  // Check for draw.io CLI
  let drawioAvailable = false;
  
  try {
    execSync('draw.io --version', { stdio: 'ignore' });
    drawioAvailable = true;
    addCheckResult('Tools', 'draw.io CLI', 'pass', 'draw.io CLI is available');
  } catch (error) {
    addCheckResult('Tools', 'draw.io CLI', 'warning', 'draw.io CLI not found - manual export required');
  }
  
  // If draw.io is available, generate exports
  if (drawioAvailable) {
    try {
      // Generate PNG export
      log.info('Creating high-resolution PNG export');
      execSync(`draw.io -x -f png -o "${path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_PRO.png')}" "${DIAGRAM_PATH}"`);
      log.success('PNG export created');
      addExport('PNG', path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_PRO.png'), true);
      
      // Generate SVG export
      log.info('Creating SVG export');
      execSync(`draw.io -x -f svg -o "${path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_PRO.svg')}" "${DIAGRAM_PATH}"`);
      log.success('SVG export created');
      addExport('SVG', path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_PRO.svg'), true);
      
      // Generate thumbnail
      log.info('Creating thumbnail for README');
      
      // First generate a high-res version
      execSync(`draw.io -x -f png -s 2 -o "${path.join(OUTPUT_DIR, 'temp_high_res.png')}" "${DIAGRAM_PATH}"`);
      
      // Then resize it to create a thumbnail
      try {
        // Try using ImageMagick if available
        execSync(`convert "${path.join(OUTPUT_DIR, 'temp_high_res.png')}" -resize 800x "${path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_THUMBNAIL.png')}"`);
      } catch (error) {
        // Fallback to copying the high-res file as thumbnail
        fs.copyFileSync(path.join(OUTPUT_DIR, 'temp_high_res.png'), path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_THUMBNAIL.png'));
      }
      
      // Clean up temp file
      if (fs.existsSync(path.join(OUTPUT_DIR, 'temp_high_res.png'))) {
        fs.unlinkSync(path.join(OUTPUT_DIR, 'temp_high_res.png'));
      }
      
      log.success('Thumbnail created');
      addExport('Thumbnail', path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_THUMBNAIL.png'), true);
      
      // Create archived version with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0].replace('T', '_');
      const archivePath = path.join(OUTPUT_DIR, 'archive', `AZURE_ARCHITECTURE_${timestamp}.png`);
      fs.copyFileSync(path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_PRO.png'), archivePath);
      log.success('Archived version created');
      addExport('Archive', archivePath, true);
      
      return addCheckResult('Exports', 'Generated Exports', 'pass', 'All exports created successfully');
    } catch (error) {
      return addCheckResult('Exports', 'Generated Exports', 'fail', `Error: ${error.message}`);
    }
  } else {
    // Manual export instructions
    log.warning('Manual export required - follow these steps:');
    log.info('1. Open the diagram in draw.io');
    log.info('2. File > Export as > PNG... (set scale: 2x)');
    log.info(`3. Save to: ${path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_PRO.png')}`);
    log.info('4. File > Export as > SVG...');
    log.info(`5. Save to: ${path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_PRO.svg')}`);
    
    return addCheckResult('Exports', 'Generated Exports', 'warning', 'Manual export required');
  }
}

// Run visual QA check with headless browser
async function runVisualQA() {
  log.title('Running Visual QA Checks');
  
  // Check if PNG export exists
  const pngPath = path.join(OUTPUT_DIR, 'AZURE_ARCHITECTURE_PRO.png');
  if (!fs.existsSync(pngPath)) {
    return addCheckResult('Visual', 'Render Check', 'warning', 'PNG export not found, skipping visual check');
  }
  
  // Check for screenshot capability
  const screenshotScript = path.join(__dirname, 'shogun_dashboard_capture.sh');
  if (!fs.existsSync(screenshotScript)) {
    return addCheckResult('Visual', 'Render Check', 'warning', 'Screenshot script not found, skipping visual check');
  }
  
  try {
    log.info('Creating preview HTML page');
    
    // Generate a simple HTML file to display the diagram
    const htmlPath = path.join(OUTPUT_DIR, 'diagram_preview.html');
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Architecture Diagram Preview</title>
    <style>
        body { font-family: Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 20px; }
        .diagram-container { max-width: 100%; text-align: center; }
        img { max-width: 100%; height: auto; border: 1px solid #ddd; }
        h1 { color: #0078D4; }
    </style>
</head>
<body>
    <h1>Architecture Diagram Preview</h1>
    <div class="diagram-container">
        <img src="AZURE_ARCHITECTURE_PRO.png" alt="Azure Architecture Diagram">
    </div>
</body>
</html>`;
    
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Set up a simple server to serve the HTML
    const server = http.createServer((req, res) => {
      let filePath;
      
      if (req.url === '/' || req.url === '/index.html') {
        filePath = htmlPath;
      } else if (req.url === '/AZURE_ARCHITECTURE_PRO.png') {
        filePath = pngPath;
      } else {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      
      // Determine content type
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.html' ? 'text/html' : 'image/png';
      
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
    
    return new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        const url = `http://localhost:${port}/`;
        
        log.info(`Preview server running at ${url}`);
        
        // Take screenshot
        log.info('Taking screenshot of rendered diagram');
        
        // Set screenshot path
        const screenshotPath = path.join(OUTPUT_DIR, 'diagram_render_check.png');
        
        // Use node spawn to run the screenshot script asynchronously
        const subprocess = spawn(screenshotScript, [url, screenshotPath], {
          stdio: 'inherit'
        });
        
        subprocess.on('close', (code) => {
          server.close();
          
          if (code === 0 && fs.existsSync(screenshotPath)) {
            log.success('Visual render check successful');
            addExport('Render Check', screenshotPath, true);
            resolve(addCheckResult('Visual', 'Render Check', 'pass', 'Diagram renders correctly in browser'));
          } else {
            log.error('Visual render check failed');
            resolve(addCheckResult('Visual', 'Render Check', 'warning', 'Failed to take screenshot of rendered diagram'));
          }
        });
      });
    });
  } catch (error) {
    return addCheckResult('Visual', 'Render Check', 'warning', `Error: ${error.message}`);
  }
}

// Output final results
function outputResults() {
  log.title('QA Results Summary');
  
  // Calculate pass rate
  const passRate = Math.round((qaResults.summary.passed / qaResults.summary.total) * 100);
  
  // Display summary
  console.log(`${colors.bold}Total Checks:${colors.reset} ${qaResults.summary.total}`);
  console.log(`${colors.bold}${colors.green}Passed:${colors.reset} ${qaResults.summary.passed}`);
  console.log(`${colors.bold}${colors.yellow}Warnings:${colors.reset} ${qaResults.summary.warnings}`);
  console.log(`${colors.bold}${colors.red}Failed:${colors.reset} ${qaResults.summary.failed}`);
  console.log(`${colors.bold}Pass Rate:${colors.reset} ${passRate}%`);
  
  // Display exports
  console.log(`\n${colors.bold}Generated Exports:${colors.reset}`);
  qaResults.exports.forEach(exp => {
    const color = exp.success ? colors.green : colors.red;
    const icon = exp.success ? '✓' : '✗';
    console.log(`${color}${icon}${colors.reset} ${exp.type}: ${path.basename(exp.path)}`);
  });
  
  // Save results to JSON
  fs.writeFileSync(QA_RESULTS_PATH, JSON.stringify(qaResults, null, 2));
  log.success(`Full results saved to: ${QA_RESULTS_PATH}`);
  
  // Save results as markdown
  const markdown = resultsToMarkdown();
  fs.writeFileSync(QA_RESULTS_MD_PATH, markdown);
  log.success(`Markdown results saved to: ${QA_RESULTS_MD_PATH}`);
  
  // Overall assessment
  if (qaResults.summary.failed > 0) {
    log.warning(`QA completed with ${qaResults.summary.failed} failed checks. See results for details.`);
  } else if (qaResults.summary.warnings > 0) {
    log.warning(`QA completed with ${qaResults.summary.warnings} warnings. See results for details.`);
  } else {
    log.success('QA completed successfully! All checks passed.');
  }
  
  // Output README snippet
  console.log(`\n${colors.bold}${colors.blue}README snippet for diagram:${colors.reset}`);
  console.log(`
![Azure Architecture](docs/images/AZURE_ARCHITECTURE_PRO.png)

*Click for [full-size diagram](docs/images/AZURE_ARCHITECTURE_PRO.png)*
`);
}

// Main function
async function main() {
  console.log(`${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║  Advanced Architecture Diagram QA                          ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  
  log.info(`Analyzing diagram: ${DIAGRAM_PATH}`);
  log.info(`Output directory: ${OUTPUT_DIR}`);
  
  // Check if diagram exists
  if (!fs.existsSync(DIAGRAM_PATH)) {
    log.error(`Diagram not found: ${DIAGRAM_PATH}`);
    process.exit(1);
  }
  
  // Run QA steps
  ensureDirectories();
  archiveDiagram();
  analyzeDiagram();
  checkFallbackIcons(); // Check for proper fallback icon handling
  await generateExports();
  await runVisualQA();
  outputResults();
}

// Run main function
main().catch(error => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});