#!/usr/bin/env node
/**
 * validate_diagram_formats.js - Architecture Diagram Format Validator
 * 
 * This script validates architecture diagrams across multiple file formats,
 * ensuring source files have corresponding exports and that all formats meet
 * quality standards. It performs checks on file integrity, metadata, and export
 * quality without requiring image processing.
 * 
 * Usage: node validate_diagram_formats.js [diagram-name] [project-root]
 * 
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { DOMParser } = require('xmldom');

// Configuration
const args = process.argv.slice(2);
const DIAGRAM_NAME = args[0] || 'project_scout_with_genai';
const PROJECT_ROOT = args[1] || path.resolve(__dirname, '..');

// Paths
const PATHS = {
  // Source files
  architecture_src: path.join(PROJECT_ROOT, 'docs/architecture_src'),
  diagrams: path.join(PROJECT_ROOT, 'docs/diagrams'),
  // Export directories
  images: path.join(PROJECT_ROOT, 'docs/images'),
  thumbnails: path.join(PROJECT_ROOT, 'docs/images/thumbnails'),
  archive: path.join(PROJECT_ROOT, 'docs/images/archive'),
  // Specific files
  drawio: path.join(PROJECT_ROOT, 'docs/diagrams', `${DIAGRAM_NAME}.drawio`), // Check in diagrams directory first
  drawio_src: path.join(PROJECT_ROOT, 'docs/architecture_src', `${DIAGRAM_NAME}.drawio`),
  png: path.join(PROJECT_ROOT, 'docs/images', `${DIAGRAM_NAME}.png`),
  svg: path.join(PROJECT_ROOT, 'docs/images', `${DIAGRAM_NAME}.svg`),
  thumbnail: path.join(PROJECT_ROOT, 'docs/images/thumbnails', `${DIAGRAM_NAME}_thumb.png`),
  // Results
  results: path.join(PROJECT_ROOT, 'docs/images', 'format_validation_results.json')
};

// ANSI Colors for console output
const COLORS = {
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
  info: (msg) => console.log(`${COLORS.blue}ℹ️ ${msg}${COLORS.reset}`),
  success: (msg) => console.log(`${COLORS.green}✓ ${msg}${COLORS.reset}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠️ ${msg}${COLORS.reset}`),
  error: (msg) => console.log(`${COLORS.red}✗ ${msg}${COLORS.reset}`),
  title: (msg) => console.log(`\n${COLORS.bold}${COLORS.cyan}${msg}${COLORS.reset}\n`)
};

// Initialize results
const results = {
  diagram_name: DIAGRAM_NAME,
  timestamp: new Date().toISOString(),
  formats: {},
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
  
  results.checks.push(check);
  results.summary.total++;
  
  if (result === 'pass') {
    results.summary.passed++;
  } else if (result === 'warning') {
    results.summary.warnings++;
  } else if (result === 'fail') {
    results.summary.failed++;
  }
  
  return check;
}

/**
 * Validates the source drawio file structure
 */
function validateDrawioSource() {
  log.title('Validating Source DrawIO File');

  // Check file existence
  let drawioPath = null;
  if (fs.existsSync(PATHS.drawio)) {
    drawioPath = PATHS.drawio;
    log.success(`DrawIO file found in diagrams directory: ${PATHS.drawio}`);
  } else if (fs.existsSync(PATHS.drawio_src)) {
    drawioPath = PATHS.drawio_src;
    log.success(`DrawIO file found in architecture_src directory: ${PATHS.drawio_src}`);
  } else {
    results.formats.drawio = {
      exists: false,
      valid: false,
      details: 'File not found'
    };
    log.error(`DrawIO source file not found in either location:\n- ${PATHS.drawio}\n- ${PATHS.drawio_src}`);
    return addCheckResult('Source', 'DrawIO File', 'fail', 'File not found');
  }

  // Use the found drawio path
  PATHS.drawio = drawioPath;
  
  try {
    // Read file content
    const fileContent = fs.readFileSync(PATHS.drawio, 'utf8');
    
    // Basic size check
    const fileSizeKB = Math.round(fileContent.length / 1024);
    if (fileSizeKB < 10) {
      log.warning(`DrawIO file seems very small (${fileSizeKB}KB)`);
      addCheckResult('Source', 'DrawIO File Size', 'warning', `File is only ${fileSizeKB}KB, might be incomplete`);
    } else {
      log.success(`DrawIO file size: ${fileSizeKB}KB`);
      addCheckResult('Source', 'DrawIO File Size', 'pass', `File size: ${fileSizeKB}KB`);
    }
    
    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
    
    // Check for XML parsing errors
    const parserErrors = xmlDoc.getElementsByTagName('parsererror');
    if (parserErrors.length > 0) {
      log.error('DrawIO file has XML parsing errors');
      results.formats.drawio = {
        exists: true,
        valid: false,
        details: 'XML parsing errors'
      };
      return addCheckResult('Source', 'DrawIO XML Validity', 'fail', 'XML parsing errors detected');
    }
    
    // Check for mxGraphModel element (basic drawio structure)
    const mxGraphModel = xmlDoc.getElementsByTagName('mxGraphModel');
    if (mxGraphModel.length === 0) {
      log.error('DrawIO file missing mxGraphModel element');
      results.formats.drawio = {
        exists: true,
        valid: false,
        details: 'Missing mxGraphModel element'
      };
      return addCheckResult('Source', 'DrawIO Structure', 'fail', 'Missing mxGraphModel element');
    }
    
    // Look for root element
    const root = xmlDoc.getElementsByTagName('root');
    if (root.length === 0) {
      log.error('DrawIO file missing root element');
      results.formats.drawio = {
        exists: true,
        valid: false,
        details: 'Missing root element'
      };
      return addCheckResult('Source', 'DrawIO Structure', 'fail', 'Missing root element');
    }
    
    // Count important elements
    const cellCount = xmlDoc.getElementsByTagName('mxCell').length;
    
    // Check for custom namespace prefixes that might cause problems
    const fileContentString = fileContent.toString();
    const hasInvalidNamespaces = fileContentString.includes('qa:') || 
                                fileContentString.includes('ci:') ||
                                fileContentString.includes('custom:');
    
    if (hasInvalidNamespaces) {
      log.warning('DrawIO file contains potentially problematic namespace prefixes (qa:, ci:, custom:)');
      addCheckResult('Source', 'DrawIO Namespaces', 'warning', 'Contains potentially problematic namespace prefixes');
    } else {
      log.success('DrawIO file has no problematic namespace prefixes');
      addCheckResult('Source', 'DrawIO Namespaces', 'pass', 'No problematic namespace prefixes');
    }
    
    // Overall result
    results.formats.drawio = {
      exists: true,
      valid: true,
      cells: cellCount,
      size_kb: fileSizeKB,
      has_invalid_namespaces: hasInvalidNamespaces
    };
    
    log.success(`DrawIO file validated: ${cellCount} cells found`);
    return addCheckResult('Source', 'DrawIO File', 'pass', `Valid DrawIO file with ${cellCount} cells`);
    
  } catch (error) {
    log.error(`Error validating DrawIO file: ${error.message}`);
    results.formats.drawio = {
      exists: true,
      valid: false,
      details: error.message
    };
    return addCheckResult('Source', 'DrawIO File', 'fail', `Error: ${error.message}`);
  }
}

/**
 * Validates PNG export
 */
function validatePngExport() {
  log.title('Validating PNG Export');
  
  // Check file existence
  if (!fs.existsSync(PATHS.png)) {
    results.formats.png = {
      exists: false,
      valid: false,
      details: 'File not found'
    };
    log.error(`PNG export not found: ${PATHS.png}`);
    return addCheckResult('Exports', 'PNG Export', 'fail', 'File not found');
  }
  
  try {
    // Get file size
    const stats = fs.statSync(PATHS.png);
    const fileSizeKB = Math.round(stats.size / 1024);
    
    // Check size - PNG should be reasonably sized for a diagram
    if (fileSizeKB < 50) {
      log.warning(`PNG export is very small (${fileSizeKB}KB), might be low resolution`);
      addCheckResult('Exports', 'PNG Export Size', 'warning', `File is only ${fileSizeKB}KB, might be low resolution`);
    } else if (fileSizeKB > 5000) {
      log.warning(`PNG export is very large (${fileSizeKB}KB), might be inefficient`);
      addCheckResult('Exports', 'PNG Export Size', 'warning', `File is ${fileSizeKB}KB, consider optimization`);
    } else {
      log.success(`PNG export size: ${fileSizeKB}KB (good range)`);
      addCheckResult('Exports', 'PNG Export Size', 'pass', `File size: ${fileSizeKB}KB`);
    }
    
    // Check file header magic bytes to confirm it's actually a PNG
    const buffer = Buffer.alloc(8);
    const fileHandle = fs.openSync(PATHS.png, 'r');
    fs.readSync(fileHandle, buffer, 0, 8, 0);
    fs.closeSync(fileHandle);
    
    const isPNG = buffer.toString('hex').startsWith('89504e47');
    if (!isPNG) {
      log.error('File has .png extension but is not a valid PNG file');
      results.formats.png = {
        exists: true,
        valid: false,
        size_kb: fileSizeKB,
        details: 'Not a valid PNG file'
      };
      return addCheckResult('Exports', 'PNG Export Validity', 'fail', 'Not a valid PNG file');
    }
    
    // Overall result
    results.formats.png = {
      exists: true,
      valid: true,
      size_kb: fileSizeKB
    };
    
    log.success(`PNG export validated: ${fileSizeKB}KB`);
    return addCheckResult('Exports', 'PNG Export', 'pass', `Valid PNG export, ${fileSizeKB}KB`);
    
  } catch (error) {
    log.error(`Error validating PNG export: ${error.message}`);
    results.formats.png = {
      exists: true,
      valid: false,
      details: error.message
    };
    return addCheckResult('Exports', 'PNG Export', 'fail', `Error: ${error.message}`);
  }
}

/**
 * Validates SVG export
 */
function validateSvgExport() {
  log.title('Validating SVG Export');
  
  // Check file existence
  if (!fs.existsSync(PATHS.svg)) {
    results.formats.svg = {
      exists: false,
      valid: false,
      details: 'File not found'
    };
    log.warning(`SVG export not found: ${PATHS.svg}`);
    return addCheckResult('Exports', 'SVG Export', 'warning', 'File not found (recommended but optional)');
  }
  
  try {
    // Read file content
    const fileContent = fs.readFileSync(PATHS.svg, 'utf8');
    
    // Basic size check
    const fileSizeKB = Math.round(fileContent.length / 1024);
    if (fileSizeKB < 10) {
      log.warning(`SVG export seems very small (${fileSizeKB}KB)`);
      addCheckResult('Exports', 'SVG Export Size', 'warning', `File is only ${fileSizeKB}KB, might be incomplete`);
    } else {
      log.success(`SVG export size: ${fileSizeKB}KB`);
      addCheckResult('Exports', 'SVG Export Size', 'pass', `File size: ${fileSizeKB}KB`);
    }
    
    // Check if it's a valid SVG
    if (!fileContent.includes('<svg') || !fileContent.includes('</svg>')) {
      log.error('File has .svg extension but is not a valid SVG file');
      results.formats.svg = {
        exists: true,
        valid: false,
        size_kb: fileSizeKB,
        details: 'Not a valid SVG file'
      };
      return addCheckResult('Exports', 'SVG Export Validity', 'fail', 'Not a valid SVG file');
    }
    
    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
    
    // Check for XML parsing errors
    const parserErrors = xmlDoc.getElementsByTagName('parsererror');
    if (parserErrors.length > 0) {
      log.error('SVG file has XML parsing errors');
      results.formats.svg = {
        exists: true,
        valid: false,
        size_kb: fileSizeKB,
        details: 'XML parsing errors'
      };
      return addCheckResult('Exports', 'SVG XML Validity', 'fail', 'XML parsing errors detected');
    }
    
    // Overall result
    results.formats.svg = {
      exists: true,
      valid: true,
      size_kb: fileSizeKB
    };
    
    log.success(`SVG export validated: ${fileSizeKB}KB`);
    return addCheckResult('Exports', 'SVG Export', 'pass', `Valid SVG export, ${fileSizeKB}KB`);
    
  } catch (error) {
    log.error(`Error validating SVG export: ${error.message}`);
    results.formats.svg = {
      exists: true,
      valid: false,
      details: error.message
    };
    return addCheckResult('Exports', 'SVG Export', 'fail', `Error: ${error.message}`);
  }
}

/**
 * Validates thumbnail export
 */
function validateThumbnail() {
  log.title('Validating Thumbnail');
  
  // Check file existence
  if (!fs.existsSync(PATHS.thumbnail)) {
    results.formats.thumbnail = {
      exists: false,
      valid: false,
      details: 'File not found'
    };
    log.warning(`Thumbnail not found: ${PATHS.thumbnail}`);
    return addCheckResult('Exports', 'Thumbnail', 'warning', 'File not found (recommended but optional)');
  }
  
  try {
    // Get file size
    const stats = fs.statSync(PATHS.thumbnail);
    const fileSizeKB = Math.round(stats.size / 1024);
    
    // Check size - thumbnails should be small
    if (fileSizeKB > 300) {
      log.warning(`Thumbnail is large (${fileSizeKB}KB), may load slowly`);
      addCheckResult('Exports', 'Thumbnail Size', 'warning', `File is ${fileSizeKB}KB, consider optimization`);
    } else {
      log.success(`Thumbnail size: ${fileSizeKB}KB (good)`);
      addCheckResult('Exports', 'Thumbnail Size', 'pass', `File size: ${fileSizeKB}KB`);
    }
    
    // Check file header magic bytes to confirm it's actually a PNG
    const buffer = Buffer.alloc(8);
    const fileHandle = fs.openSync(PATHS.thumbnail, 'r');
    fs.readSync(fileHandle, buffer, 0, 8, 0);
    fs.closeSync(fileHandle);
    
    const isPNG = buffer.toString('hex').startsWith('89504e47');
    if (!isPNG) {
      log.error('Thumbnail has .png extension but is not a valid PNG file');
      results.formats.thumbnail = {
        exists: true,
        valid: false,
        size_kb: fileSizeKB,
        details: 'Not a valid PNG file'
      };
      return addCheckResult('Exports', 'Thumbnail Validity', 'fail', 'Not a valid PNG file');
    }
    
    // Overall result
    results.formats.thumbnail = {
      exists: true,
      valid: true,
      size_kb: fileSizeKB
    };
    
    log.success(`Thumbnail validated: ${fileSizeKB}KB`);
    return addCheckResult('Exports', 'Thumbnail', 'pass', `Valid thumbnail, ${fileSizeKB}KB`);
    
  } catch (error) {
    log.error(`Error validating thumbnail: ${error.message}`);
    results.formats.thumbnail = {
      exists: true,
      valid: false,
      details: error.message
    };
    return addCheckResult('Exports', 'Thumbnail', 'fail', `Error: ${error.message}`);
  }
}

/**
 * Checks for archived versions of the diagram
 */
function checkArchives() {
  log.title('Checking Archives');
  
  // Check if archive directory exists
  if (!fs.existsSync(PATHS.archive)) {
    log.warning(`Archive directory not found: ${PATHS.archive}`);
    addCheckResult('Exports', 'Archive Directory', 'warning', 'Directory not found');
    results.formats.archives = {
      exists: false,
      count: 0
    };
    return;
  }
  
  try {
    // Get all files in archive
    const files = fs.readdirSync(PATHS.archive);
    
    // Filter for files that might be archives of this diagram
    const archiveFiles = files.filter(file => 
      file.startsWith(DIAGRAM_NAME) || 
      file.startsWith('AZURE_ARCHITECTURE') ||
      file.includes(DIAGRAM_NAME)
    );
    
    const archiveCount = archiveFiles.length;
    
    if (archiveCount === 0) {
      log.warning('No archived versions found');
      addCheckResult('Exports', 'Archived Versions', 'warning', 'No archived versions found');
    } else {
      log.success(`Found ${archiveCount} archived versions`);
      addCheckResult('Exports', 'Archived Versions', 'pass', `Found ${archiveCount} archived versions`);
    }
    
    // Overall result
    results.formats.archives = {
      exists: true,
      count: archiveCount,
      files: archiveFiles
    };
    
  } catch (error) {
    log.error(`Error checking archives: ${error.message}`);
    results.formats.archives = {
      exists: true,
      error: error.message
    };
    addCheckResult('Exports', 'Archived Versions', 'fail', `Error: ${error.message}`);
  }
}

/**
 * Checks if there's a README or documentation referencing the diagram
 */
function checkDocReferences() {
  log.title('Checking Documentation References');
  
  const docFiles = [
    path.join(PROJECT_ROOT, 'docs/README.md'),
    path.join(PROJECT_ROOT, 'docs/README_FINAL.md'),
    path.join(PROJECT_ROOT, 'README.md'),
    path.join(PROJECT_ROOT, 'STAKEHOLDER_BRIEF.md')
  ];
  
  let referencesFound = 0;
  const referencingFiles = [];
  
  // Search for references to the diagram in documentation
  docFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for references to the diagram 
        if (content.includes(DIAGRAM_NAME) || 
            content.includes('AZURE_ARCHITECTURE_PRO.png') ||
            content.includes('architecture diagram')) {
          
          referencesFound++;
          referencingFiles.push(path.basename(filePath));
        }
      } catch (error) {
        log.warning(`Error reading ${filePath}: ${error.message}`);
      }
    }
  });
  
  if (referencesFound === 0) {
    log.warning('No documentation references to the diagram found');
    addCheckResult('Documentation', 'Diagram References', 'warning', 'No references found in documentation');
  } else {
    log.success(`Found ${referencesFound} documentation references to the diagram`);
    addCheckResult('Documentation', 'Diagram References', 'pass', `Found ${referencesFound} references in: ${referencingFiles.join(', ')}`);
  }
  
  results.documentation = {
    references_found: referencesFound,
    referencing_files: referencingFiles
  };
}

/**
 * Generate export helper script when exports are missing
 */
function generateExportHelper() {
  log.title('Generating Export Helper');
  
  const missingExports = [];
  
  if (!results.formats.png || !results.formats.png.exists) {
    missingExports.push('PNG');
  }
  
  if (!results.formats.svg || !results.formats.svg.exists) {
    missingExports.push('SVG');
  }
  
  if (!results.formats.thumbnail || !results.formats.thumbnail.exists) {
    missingExports.push('Thumbnail');
  }
  
  if (missingExports.length === 0) {
    log.success('All exports exist, no helper needed');
    return;
  }
  
  log.warning(`Missing exports: ${missingExports.join(', ')}`);
  log.info('Generating export helper script');
  
  const helperScript = `#!/bin/bash
# Export Helper for ${DIAGRAM_NAME}
# Generated by validate_diagram_formats.js on ${new Date().toISOString()}

# Ensure directories exist
mkdir -p ${PATHS.images}
mkdir -p ${PATHS.thumbnails}
mkdir -p ${PATHS.archive}

echo "Export Helper for ${DIAGRAM_NAME}"
echo "================================="
echo ""

if command -v draw.io &> /dev/null; then
    # Using draw.io CLI
    echo "Using draw.io CLI for exports"
    
    ${!results.formats.png || !results.formats.png.exists ? `
    # PNG Export
    echo "Generating PNG export..."
    draw.io -x -f png -s 2 -o "${PATHS.png}" "${PATHS.drawio}" && \\
        echo "✓ PNG export created: ${PATHS.png}" || \\
        echo "✗ PNG export failed"
    ` : ''}
    
    ${!results.formats.svg || !results.formats.svg.exists ? `
    # SVG Export
    echo "Generating SVG export..."
    draw.io -x -f svg -o "${PATHS.svg}" "${PATHS.drawio}" && \\
        echo "✓ SVG export created: ${PATHS.svg}" || \\
        echo "✗ SVG export failed"
    ` : ''}
    
    ${!results.formats.thumbnail || !results.formats.thumbnail.exists ? `
    # Thumbnail
    echo "Generating thumbnail..."
    draw.io -x -f png -s 1 -o "${PATHS.thumbnails}/temp.png" "${PATHS.drawio}" && \\
        convert "${PATHS.thumbnails}/temp.png" -resize 300x "${PATHS.thumbnail}" && \\
        rm "${PATHS.thumbnails}/temp.png" && \\
        echo "✓ Thumbnail created: ${PATHS.thumbnail}" || \\
        echo "✗ Thumbnail creation failed"
    ` : ''}
    
    # Archive copy
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    cp "${PATHS.png}" "${PATHS.archive}/${DIAGRAM_NAME}_\${TIMESTAMP}.png" && \\
        echo "✓ Archive copy created: ${PATHS.archive}/${DIAGRAM_NAME}_\${TIMESTAMP}.png"
else
    # Manual instructions
    echo "draw.io CLI not found. Please follow these manual steps:"
    echo ""
    
    ${!results.formats.png || !results.formats.png.exists ? `
    echo "1. PNG Export:"
    echo "   - Open ${PATHS.drawio} in draw.io"
    echo "   - File > Export as > PNG..."
    echo "   - Set scale to 2x"
    echo "   - Save to: ${PATHS.png}"
    echo ""
    ` : ''}
    
    ${!results.formats.svg || !results.formats.svg.exists ? `
    echo "2. SVG Export:"
    echo "   - Open ${PATHS.drawio} in draw.io"
    echo "   - File > Export as > SVG..."
    echo "   - Save to: ${PATHS.svg}"
    echo ""
    ` : ''}
    
    ${!results.formats.thumbnail || !results.formats.thumbnail.exists ? `
    echo "3. Thumbnail:"
    echo "   - Open ${PATHS.drawio} in draw.io"
    echo "   - File > Export as > PNG..."
    echo "   - Set scale to 1x"
    echo "   - Save to: ${PATHS.thumbnail}"
    echo "   - Use an image editor to resize to 300px width"
    echo ""
    ` : ''}
    
    echo "4. Archive copy:"
    echo "   - Copy ${PATHS.png} to ${PATHS.archive}/${DIAGRAM_NAME}_YYYYMMDD_HHMMSS.png"
    echo "   - Replace YYYYMMDD_HHMMSS with current timestamp"
fi

echo ""
echo "After creating exports, run this script again to validate:"
echo "node validate_diagram_formats.js ${DIAGRAM_NAME}"
`;
  
  const helperPath = path.join(PROJECT_ROOT, 'tools', `export_${DIAGRAM_NAME}.sh`);
  
  try {
    fs.writeFileSync(helperPath, helperScript, { mode: 0o755 }); // Make executable
    log.success(`Export helper script created: ${helperPath}`);
    
    results.helper_script = {
      created: true,
      path: helperPath
    };
  } catch (error) {
    log.error(`Failed to create helper script: ${error.message}`);
    
    results.helper_script = {
      created: false,
      error: error.message
    };
  }
}

/**
 * Output results
 */
function outputResults() {
  log.title('Format Validation Summary');
  
  // Calculate pass rate
  const passRate = Math.round((results.summary.passed / results.summary.total) * 100);
  
  // Display summary
  console.log(`${COLORS.bold}Diagram:${COLORS.reset} ${DIAGRAM_NAME}`);
  console.log(`${COLORS.bold}Total Checks:${COLORS.reset} ${results.summary.total}`);
  console.log(`${COLORS.bold}${COLORS.green}Passed:${COLORS.reset} ${results.summary.passed}`);
  console.log(`${COLORS.bold}${COLORS.yellow}Warnings:${COLORS.reset} ${results.summary.warnings}`);
  console.log(`${COLORS.bold}${COLORS.red}Failed:${COLORS.reset} ${results.summary.failed}`);
  console.log(`${COLORS.bold}Pass Rate:${COLORS.reset} ${passRate}%`);
  
  // Display formats
  console.log(`\n${COLORS.bold}Format Status:${COLORS.reset}`);
  
  if (results.formats.drawio && results.formats.drawio.exists) {
    const icon = results.formats.drawio.valid ? '✓' : '✗';
    const color = results.formats.drawio.valid ? COLORS.green : COLORS.red;
    console.log(`${color}${icon}${COLORS.reset} DrawIO: ${results.formats.drawio.valid ? 'Valid' : 'Invalid'}`);
  } else {
    console.log(`${COLORS.red}✗${COLORS.reset} DrawIO: Missing`);
  }
  
  if (results.formats.png && results.formats.png.exists) {
    const icon = results.formats.png.valid ? '✓' : '✗';
    const color = results.formats.png.valid ? COLORS.green : COLORS.red;
    console.log(`${color}${icon}${COLORS.reset} PNG: ${results.formats.png.size_kb}KB`);
  } else {
    console.log(`${COLORS.red}✗${COLORS.reset} PNG: Missing`);
  }
  
  if (results.formats.svg && results.formats.svg.exists) {
    const icon = results.formats.svg.valid ? '✓' : '✗';
    const color = results.formats.svg.valid ? COLORS.green : COLORS.red;
    console.log(`${color}${icon}${COLORS.reset} SVG: ${results.formats.svg.size_kb}KB`);
  } else {
    console.log(`${COLORS.yellow}⚠️${COLORS.reset} SVG: Missing`);
  }
  
  if (results.formats.thumbnail && results.formats.thumbnail.exists) {
    const icon = results.formats.thumbnail.valid ? '✓' : '✗';
    const color = results.formats.thumbnail.valid ? COLORS.green : COLORS.red;
    console.log(`${color}${icon}${COLORS.reset} Thumbnail: ${results.formats.thumbnail.size_kb}KB`);
  } else {
    console.log(`${COLORS.yellow}⚠️${COLORS.reset} Thumbnail: Missing`);
  }
  
  if (results.formats.archives && results.formats.archives.exists) {
    console.log(`${COLORS.green}✓${COLORS.reset} Archives: ${results.formats.archives.count} versions`);
  } else {
    console.log(`${COLORS.yellow}⚠️${COLORS.reset} Archives: None found`);
  }
  
  // Save results to JSON
  try {
    fs.writeFileSync(PATHS.results, JSON.stringify(results, null, 2));
    log.success(`Results saved to: ${PATHS.results}`);
  } catch (error) {
    log.error(`Failed to save results: ${error.message}`);
  }
  
  // Print next steps
  console.log(`\n${COLORS.bold}${COLORS.blue}Next Steps:${COLORS.reset}`);
  
  if (results.summary.failed > 0) {
    console.log(`1. Fix the ${results.summary.failed} critical issues`);
    console.log(`2. Run this validator again`);
  } else if (results.helper_script && results.helper_script.created) {
    console.log(`1. Run the export helper script: ${results.helper_script.path}`);
    console.log(`2. Run this validator again to confirm exports`);
  } else if (results.summary.warnings > 0) {
    console.log(`1. Address the ${results.summary.warnings} warnings if possible`);
    console.log(`2. Run the diagram_qa.js tool for a more comprehensive QA check`);
  } else {
    console.log(`1. All format checks passed!`);
    console.log(`2. Run the diagram_qa.js tool for a more comprehensive QA check`);
  }
}

// Main function
function main() {
  console.log(`${COLORS.bold}${COLORS.blue}╔════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.blue}║  Architecture Diagram Format Validator                     ║${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.blue}╚════════════════════════════════════════════════════════════╝${COLORS.reset}`);
  console.log('');
  
  log.info(`Validating diagram: ${DIAGRAM_NAME}`);
  log.info(`Project root: ${PROJECT_ROOT}`);
  
  // Create directories if they don't exist
  Object.values(PATHS).forEach(p => {
    if (p.endsWith('.json') || p.endsWith('.drawio') || 
        p.endsWith('.png') || p.endsWith('.svg')) {
      return; // Skip file paths
    }
    
    if (!fs.existsSync(p)) {
      try {
        fs.mkdirSync(p, { recursive: true });
        log.info(`Created directory: ${p}`);
      } catch (error) {
        log.warning(`Failed to create directory: ${p}`);
      }
    }
  });
  
  // Run validation steps
  validateDrawioSource();
  validatePngExport();
  validateSvgExport();
  validateThumbnail();
  checkArchives();
  checkDocReferences();
  
  // Generate helper if needed
  generateExportHelper();
  
  // Output results
  outputResults();
  
  // Return exit code based on failures
  return results.summary.failed > 0 ? 1 : 0;
}

// Run main function
try {
  const exitCode = main();
  process.exitCode = exitCode;
} catch (error) {
  log.error(`Unhandled error: ${error.message}`);
  process.exitCode = 1;
}