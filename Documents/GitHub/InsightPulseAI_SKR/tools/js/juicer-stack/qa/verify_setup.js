/**
 * QA Framework Setup Verification Script
 *
 * This script verifies that all QA framework components
 * are properly set up and connected.
 */

const fs = require('fs');
const path = require('path');

// Define terminal colors
const colors = {
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

// Helper function for colored output
function colorize(color, text, bold = false) {
  if (bold) {
    return `${colors.bold}${colors[color]}${text}${colors.reset}`;
  }
  return `${colors[color]}${text}${colors.reset}`;
}

// Define required directories and files
const REQUIRED_DIRS = [
  'baselines',
  'tests',
  'themes',
  'utils',
  'temp',
  'reports',
  '.github/workflows'
];

const REQUIRED_FILES = [
  'package.json',
  'README.md',
  'STYLE_GUIDE.md',
  'tests/visual-parity.test.js',
  'tests/behavior-parity.test.js',
  'tests/accessibility.test.js',
  'tests/performance.test.js',
  'themes/tbwa.powerbiTheme.json',
  'utils/capture-baselines.js',
  '.github/workflows/dashboard-qa.yml'
];

// Define required npm packages
const REQUIRED_PACKAGES = [
  'jest',
  'puppeteer',
  'pixelmatch',
  'color',
  'axe-core'
];

console.log(colorize('blue', '🔍 Verifying QA Framework Setup\n', true));

// Current directory
const qaDir = __dirname;

// Check required directories
console.log(colorize('yellow', 'Checking required directories...'));
let allDirsExist = true;
for (const dir of REQUIRED_DIRS) {
  const dirPath = path.join(qaDir, dir);
  const exists = fs.existsSync(dirPath);

  if (exists) {
    console.log(`  ${colorize('green', '✓')} ${dir}`);
  } else {
    console.log(`  ${colorize('red', '✗')} ${dir}`);
    allDirsExist = false;
  }
}

// Check required files
console.log(colorize('yellow', '\nChecking required files...'));
let allFilesExist = true;
for (const file of REQUIRED_FILES) {
  const filePath = path.join(qaDir, file);
  const exists = fs.existsSync(filePath);

  if (exists) {
    console.log(`  ${colorize('green', '✓')} ${file}`);
  } else {
    console.log(`  ${colorize('red', '✗')} ${file}`);
    allFilesExist = false;
  }
}

// Check package.json scripts
console.log(colorize('yellow', '\nChecking package.json scripts...'));
let allScriptsExist = true;
try {
  const packageJson = require('./package.json');
  const requiredScripts = [
    'test',
    'test:visual',
    'test:behavior',
    'test:accessibility',
    'test:performance',
    'capture-baselines'
  ];

  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ${colorize('green', '✓')} ${script}`);
    } else {
      console.log(`  ${colorize('red', '✗')} ${script}`);
      allScriptsExist = false;
    }
  }

  // Check dependencies
  console.log(colorize('yellow', '\nChecking package dependencies...'));
  let allDepsExist = true;
  for (const pkg of REQUIRED_PACKAGES) {
    if (packageJson.dependencies && packageJson.dependencies[pkg]) {
      console.log(`  ${colorize('green', '✓')} ${pkg}`);
    } else {
      console.log(`  ${colorize('red', '✗')} ${pkg}`);
      allDepsExist = false;
    }
  }

} catch (e) {
  console.log(`  ${colorize('red', '✗')} Error reading package.json: ${e.message}`);
  allScriptsExist = false;
}

// Check if workflow file has correct structure
console.log(colorize('yellow', '\nChecking GitHub workflow file...'));
try {
  const workflowPath = path.join(qaDir, '.github/workflows/dashboard-qa.yml');
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');

  const hasJobs = workflowContent.includes('jobs:');
  const hasVisualJob = workflowContent.includes('test-visual-parity:');
  const hasBehaviorJob = workflowContent.includes('test-behavior:');
  const hasAccessibilityJob = workflowContent.includes('test-accessibility:');
  const hasPerformanceJob = workflowContent.includes('test-performance:');

  if (hasJobs) console.log(`  ${colorize('green', '✓')} Workflow has jobs section`);
  else console.log(`  ${colorize('red', '✗')} Workflow missing jobs section`);

  if (hasVisualJob) console.log(`  ${colorize('green', '✓')} Workflow has visual parity job`);
  else console.log(`  ${colorize('red', '✗')} Workflow missing visual parity job`);

  if (hasBehaviorJob) console.log(`  ${colorize('green', '✓')} Workflow has behavior parity job`);
  else console.log(`  ${colorize('red', '✗')} Workflow missing behavior parity job`);

  if (hasAccessibilityJob) console.log(`  ${colorize('green', '✓')} Workflow has accessibility job`);
  else console.log(`  ${colorize('red', '✗')} Workflow missing accessibility job`);

  if (hasPerformanceJob) console.log(`  ${colorize('green', '✓')} Workflow has performance job`);
  else console.log(`  ${colorize('red', '✗')} Workflow missing performance job`);

} catch (e) {
  console.log(`  ${colorize('red', '✗')} Error reading workflow file: ${e.message}`);
}

// Check Power BI theme file
console.log(colorize('yellow', '\nChecking Power BI theme file...'));
try {
  const themePath = path.join(qaDir, 'themes/tbwa.powerbiTheme.json');
  const themeJson = require(themePath);

  if (themeJson.name) console.log(`  ${colorize('green', '✓')} Theme has name: ${themeJson.name}`);
  else console.log(`  ${colorize('red', '✗')} Theme missing name`);

  if (themeJson.dataColors && themeJson.dataColors.length) {
    console.log(`  ${colorize('green', '✓')} Theme has ${themeJson.dataColors.length} data colors`);
  } else {
    console.log(`  ${colorize('red', '✗')} Theme missing data colors`);
  }

  if (themeJson.visualStyles) console.log(`  ${colorize('green', '✓')} Theme has visual styles`);
  else console.log(`  ${colorize('red', '✗')} Theme missing visual styles`);

} catch (e) {
  console.log(`  ${colorize('red', '✗')} Error reading theme file: ${e.message}`);
}

// Final summary
console.log(colorize('blue', '\n🔎 Verification Summary', true));
if (allDirsExist && allFilesExist && allScriptsExist) {
  console.log(colorize('green', '✅ QA Framework setup is complete and ready to use!', true));
} else {
  console.log(colorize('red', '❌ QA Framework setup is incomplete. Please address the issues above.', true));
}

// Create a simple test-fix index
console.log(colorize('blue', '\n📋 Quick Setup Fixes (if needed)', true));
if (!allDirsExist) {
  console.log(colorize('yellow', 'Create missing directories:'));
  console.log(`mkdir -p ${REQUIRED_DIRS.filter(dir => !fs.existsSync(path.join(qaDir, dir))).join(' ')}`);
}

if (!allFilesExist) {
  console.log(colorize('yellow', '\nCreate missing placeholder files:'));
  for (const file of REQUIRED_FILES.filter(file => !fs.existsSync(path.join(qaDir, file)))) {
    console.log(`touch ${file}`);
  }
}

console.log(colorize('blue', '\n📌 Next Steps:', true));
console.log('1. Install dependencies: npm install');
console.log('2. Generate baseline images: npm run capture-baselines');
console.log('3. Run tests: npm test');