/**
 * Script to fix template strings in test files
 * 
 * This utility fixes the ${DASHBOARD_URL:-http://localhost:8080} pattern
 * with proper JavaScript global variable access
 */

const fs = require('fs');
const path = require('path');

// Files to fix
const testFiles = [
  '../tests/visual-parity.test.js',
  '../tests/behavior-parity.test.js',
  '../tests/accessibility.test.js',
  '../tests/performance.test.js',
  '../utils/capture-baselines.js',
  '../utils/debug_tests.js'
];

// Fix function
function fixTemplateStrings(filePath) {
  console.log(`Fixing template strings in ${filePath}...`);
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Replace shell-style variable substitution with JS global variable
  const fixedContent = content.replace(
    /\${DASHBOARD_URL:-http:\/\/localhost:8080}/g, 
    '${DASHBOARD_URL || "http://localhost:8080"}'
  );
  
  // Replace hard coded URLs with the variable
  const furtherFixedContent = fixedContent.replace(
    /'http:\/\/localhost:8080\/dashboards/g,
    '`${DASHBOARD_URL || "http://localhost:8080"}/dashboards'
  ).replace(
    /"http:\/\/localhost:8080\/dashboards/g,
    '`${DASHBOARD_URL || "http://localhost:8080"}/dashboards'
  );
  
  // Write fixed content back
  fs.writeFileSync(filePath, furtherFixedContent);
  
  console.log(`✓ Fixed ${filePath}`);
}

// Run the fix for each file
for (const relativeFilePath of testFiles) {
  const filePath = path.resolve(__dirname, relativeFilePath);
  if (fs.existsSync(filePath)) {
    fixTemplateStrings(filePath);
  } else {
    console.log(`⚠️ File not found: ${filePath}`);
  }
}

console.log('Template string fixing complete!');