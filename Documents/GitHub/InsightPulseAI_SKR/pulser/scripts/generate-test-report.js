#!/usr/bin/env node

/**
 * Test Report Generator
 * 
 * Consolidates results from different test suites (unit, smoke, e2e, visual)
 * into a single comprehensive HTML report.
 * 
 * Usage:
 *   node generate-test-report.js [--output-dir=path/to/dir]
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const outputDir = args.find(arg => arg.startsWith('--output-dir='))?.split('=')[1] || 
                  path.join('test-results', 'summary-report');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Paths to test result files
const testResults = {
  unit: {
    junit: path.join('test-results', 'unit', 'junit.xml'),
    html: path.join('test-results', 'unit', 'index.html'),
    coverage: path.join('test-results', 'coverage', 'lcov-report', 'index.html')
  },
  smoke: {
    junit: path.join('test-results', 'smoke', 'junit.xml'),
    html: path.join('test-results', 'smoke', 'index.html')
  },
  e2e: {
    html: path.join('test-results', 'html-report', 'index.html')
  },
  visual: {
    // Playwright generates screenshots in test-output directory
    screenshots: path.join('test-results', 'test-output')
  }
};

// Function to parse JUnit XML and extract test summary
function parseJUnitXML(filePath) {
  if (!fs.existsSync(filePath)) {
    return { total: 0, passed: 0, failed: 0, skipped: 0 };
  }
  
  const xml = fs.readFileSync(filePath, 'utf-8');
  
  // Simple regex-based extraction (in a production environment, use a proper XML parser)
  const testsuiteMatch = xml.match(/testsuites.*?tests="(\d+)".*?failures="(\d+)".*?errors="(\d+)".*?skipped="(\d+)"/s);
  
  if (testsuiteMatch) {
    const total = parseInt(testsuiteMatch[1], 10);
    const failures = parseInt(testsuiteMatch[2], 10);
    const errors = parseInt(testsuiteMatch[3], 10);
    const skipped = parseInt(testsuiteMatch[4], 10);
    
    return {
      total,
      passed: total - failures - errors - skipped,
      failed: failures + errors,
      skipped
    };
  }
  
  return { total: 0, passed: 0, failed: 0, skipped: 0 };
}

// Function to get list of visual test screenshots
function getVisualTestScreenshots() {
  const screenshotsDir = testResults.visual.screenshots;
  
  if (!fs.existsSync(screenshotsDir)) {
    return [];
  }
  
  // Find screenshot files and diffs
  const files = fs.readdirSync(screenshotsDir, { recursive: true })
    .filter(file => file.endsWith('.png') && (file.includes('-diff.png') || file.includes('-actual.png')))
    .map(file => path.join(screenshotsDir, file));
  
  return files;
}

// Function to copy a file or directory
function copyFileOrDir(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }
  
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    fs.readdirSync(src).forEach(file => {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);
      
      if (fs.statSync(srcFile).isDirectory()) {
        copyFileOrDir(srcFile, destFile);
      } else {
        fs.copyFileSync(srcFile, destFile);
      }
    });
  } else {
    // Make sure the destination directory exists
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(src, dest);
  }
}

// Get test results
const unitResults = parseJUnitXML(testResults.unit.junit);
const smokeResults = parseJUnitXML(testResults.smoke.junit);
const visualScreenshots = getVisualTestScreenshots();

// Generate timestamp
const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

// Generate summary HTML
const summaryHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scout Dashboard Test Report - ${timestamp}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
    }
    .header {
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #dee2e6;
    }
    .test-summary {
      margin-bottom: 30px;
    }
    .card {
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .card-header {
      font-weight: 600;
    }
    .metric {
      font-size: 2.5rem;
      font-weight: 700;
    }
    .metric-label {
      font-size: 0.9rem;
      color: #6c757d;
    }
    .status-badge {
      padding: 5px 12px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 500;
    }
    .bg-passed {
      background-color: #d1e7dd;
      color: #0f5132;
    }
    .bg-failed {
      background-color: #f8d7da;
      color: #842029;
    }
    .bg-skipped {
      background-color: #fff3cd;
      color: #664d03;
    }
    .bg-not-run {
      background-color: #e2e3e5;
      color: #41464b;
    }
    .screenshot-container {
      margin-bottom: 30px;
    }
    .screenshot-thumb {
      max-width: 200px;
      max-height: 200px;
      margin: 5px;
      border: 1px solid #dee2e6;
      cursor: pointer;
    }
    footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      text-align: center;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>Scout Dashboard Test Report</h1>
      <p class="lead">Generated on: ${timestamp}</p>
    </header>

    <div class="test-summary">
      <h2>Test Summary</h2>
      <div class="row">
        <div class="col-md-6 col-lg-3">
          <div class="card">
            <div class="card-header">Unit Tests</div>
            <div class="card-body text-center">
              <div class="metric">${unitResults.passed}/${unitResults.total}</div>
              <div class="metric-label">Tests Passed</div>
              <div class="mt-3">
                <span class="status-badge ${unitResults.failed > 0 ? 'bg-failed' : 'bg-passed'}">
                  ${unitResults.failed > 0 ? 'FAILED' : 'PASSED'}
                </span>
              </div>
            </div>
            <div class="card-footer">
              <a href="unit/index.html" class="btn btn-sm btn-primary w-100">View Detailed Report</a>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 col-lg-3">
          <div class="card">
            <div class="card-header">Smoke Tests</div>
            <div class="card-body text-center">
              <div class="metric">${smokeResults.passed}/${smokeResults.total}</div>
              <div class="metric-label">Tests Passed</div>
              <div class="mt-3">
                <span class="status-badge ${smokeResults.failed > 0 ? 'bg-failed' : (smokeResults.total === 0 ? 'bg-not-run' : 'bg-passed')}">
                  ${smokeResults.failed > 0 ? 'FAILED' : (smokeResults.total === 0 ? 'NOT RUN' : 'PASSED')}
                </span>
              </div>
            </div>
            <div class="card-footer">
              <a href="smoke/index.html" class="btn btn-sm btn-primary w-100">View Detailed Report</a>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 col-lg-3">
          <div class="card">
            <div class="card-header">E2E Tests</div>
            <div class="card-body text-center">
              <div class="metric">-/-</div>
              <div class="metric-label">Tests Passed</div>
              <div class="mt-3">
                <span class="status-badge ${fs.existsSync(testResults.e2e.html) ? 'bg-passed' : 'bg-not-run'}">
                  ${fs.existsSync(testResults.e2e.html) ? 'COMPLETED' : 'NOT RUN'}
                </span>
              </div>
            </div>
            <div class="card-footer">
              <a href="html-report/index.html" class="btn btn-sm btn-primary w-100">View Playwright Report</a>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 col-lg-3">
          <div class="card">
            <div class="card-header">Visual Tests</div>
            <div class="card-body text-center">
              <div class="metric">${visualScreenshots.filter(s => !s.includes('-diff')).length}</div>
              <div class="metric-label">Screenshots</div>
              <div class="mt-3">
                <span class="status-badge ${visualScreenshots.filter(s => s.includes('-diff')).length > 0 ? 'bg-failed' : (visualScreenshots.length === 0 ? 'bg-not-run' : 'bg-passed')}">
                  ${visualScreenshots.filter(s => s.includes('-diff')).length > 0 ? 'DIFFERENCES FOUND' : (visualScreenshots.length === 0 ? 'NOT RUN' : 'PASSED')}
                </span>
              </div>
            </div>
            <div class="card-footer">
              <a href="#visual-screenshots" class="btn btn-sm btn-primary w-100">View Screenshots</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">Unit Test Coverage</div>
          <div class="card-body">
            <p>View the complete code coverage report to see which parts of the application are covered by tests.</p>
          </div>
          <div class="card-footer">
            <a href="coverage/lcov-report/index.html" class="btn btn-sm btn-primary">View Coverage Report</a>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">E2E Test Results</div>
          <div class="card-body">
            <p>Playwright test results show end-to-end test execution across different browsers.</p>
          </div>
          <div class="card-footer">
            <a href="html-report/index.html" class="btn btn-sm btn-primary">View Playwright Report</a>
          </div>
        </div>
      </div>
    </div>

    ${visualScreenshots.length > 0 ? `
    <div id="visual-screenshots" class="mt-5">
      <h2>Visual Test Screenshots</h2>
      <p>The following screenshots show visual differences between baseline and current implementation:</p>
      
      <div class="row screenshot-container">
        ${visualScreenshots.map(screenshot => {
          const filename = path.basename(screenshot);
          const relativePath = path.relative(path.join('test-results'), screenshot);
          return `
          <div class="col-md-4 mb-4">
            <div class="card">
              <div class="card-header">${filename.replace(/-diff\.png$/, '').replace(/-actual\.png$/, '')}</div>
              <div class="card-body text-center">
                <a href="${relativePath}" target="_blank">
                  <img src="${relativePath}" alt="${filename}" class="img-fluid screenshot-thumb">
                </a>
              </div>
              <div class="card-footer">
                <small class="text-muted">${filename.includes('-diff') ? 'Difference Highlighted' : 'Actual Screenshot'}</small>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
    ` : ''}

    <footer>
      <p>Scout Dashboard Test Report | InsightPulseAI | Generated by CI/CD Pipeline</p>
    </footer>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

// Write summary HTML
fs.writeFileSync(path.join(outputDir, 'index.html'), summaryHTML);

// Copy detailed reports
if (fs.existsSync(testResults.unit.html)) {
  copyFileOrDir(path.dirname(testResults.unit.html), path.join(outputDir, 'unit'));
}

if (fs.existsSync(testResults.smoke.html)) {
  copyFileOrDir(path.dirname(testResults.smoke.html), path.join(outputDir, 'smoke'));
}

if (fs.existsSync(testResults.e2e.html)) {
  copyFileOrDir(path.dirname(testResults.e2e.html), path.join(outputDir, 'html-report'));
}

if (fs.existsSync(path.join('test-results', 'coverage'))) {
  copyFileOrDir(path.join('test-results', 'coverage'), path.join(outputDir, 'coverage'));
}

// Copy visual test screenshots
if (visualScreenshots.length > 0) {
  visualScreenshots.forEach(screenshot => {
    const relativePath = path.relative(path.join('test-results'), screenshot);
    const destPath = path.join(outputDir, relativePath);
    
    copyFileOrDir(screenshot, destPath);
  });
}

console.log(`✅ Test report generated at ${path.join(outputDir, 'index.html')}`);