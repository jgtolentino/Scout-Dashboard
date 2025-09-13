#!/usr/bin/env node

/**
 * Verification Script for Pulser CLI implementation
 * Checks all components and displays diagnostics
 */

import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// In ESM, __dirname is not available, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for terminal output
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";

console.log(`${CYAN}${BOLD}Pulser CLI Implementation Verification${RESET}\n`);

// Check files exist
function checkFile(filePath, description) {
  const fullPath = path.resolve(filePath);
  const exists = fs.existsSync(fullPath);
  
  console.log(`${exists ? GREEN + '✓' : RED + '✗'} ${RESET}${description}: ${fullPath}`);
  
  if (exists) {
    // Check if executable
    try {
      const stats = fs.statSync(fullPath);
      const isExecutable = !!(stats.mode & fs.constants.S_IXUSR);
      if (filePath.endsWith('.js') || filePath.endsWith('.sh')) {
        console.log(`  ${isExecutable ? GREEN + '✓' : YELLOW + '!'} ${RESET}File is ${isExecutable ? '' : 'not '}executable`);
      }
    } catch (err) {
      console.log(`  ${RED}✗ ${RESET}Error checking file permissions: ${err.message}`);
    }
    
    // Check file size
    try {
      const stats = fs.statSync(fullPath);
      console.log(`  ${GREEN}ℹ ${RESET}File size: ${(stats.size / 1024).toFixed(2)} KB`);
    } catch (err) {
      console.log(`  ${RED}✗ ${RESET}Error checking file size: ${err.message}`);
    }
  }
  
  return exists;
}

// Main verification checks
console.log(`${BOLD}Checking Implementation Files:${RESET}`);
const files = [
  { path: '/Users/tbwa/pulser_input_handler.js', desc: 'Input Handler Module' },
  { path: '/Users/tbwa/pulser_cli_consolidated.js', desc: 'Consolidated CLI Implementation' },
  { path: '/Users/tbwa/package.json', desc: 'Package Configuration' },
  { path: '/Users/tbwa/demo_paste_handling.js', desc: 'Demo Script' },
  { path: '/Users/tbwa/install_pulser_consolidated.sh', desc: 'Installation Script' },
  { path: '/Users/tbwa/PULSER_CLI_GUIDE.md', desc: 'Documentation' }
];

const results = files.map(file => ({
  file: file.path,
  exists: checkFile(file.path, file.desc)
}));

// Check package.json dependencies
console.log(`\n${BOLD}Checking Package Dependencies:${RESET}`);
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const requiredDeps = ['boxen', 'chalk'];

  requiredDeps.forEach(dep => {
    const hasDep = packageJson.dependencies && packageJson.dependencies[dep];
    console.log(`${hasDep ? GREEN + '✓' : RED + '✗'} ${RESET}Required dependency: ${dep}`);
  });

  console.log(`${GREEN}ℹ ${RESET}Total dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
} catch (err) {
  console.log(`${RED}✗ ${RESET}Error checking package.json: ${err.message}`);
}

// Check for potential code issues
console.log(`\n${BOLD}Checking for Potential Code Issues:${RESET}`);

function countMatches(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(pattern) || [];
    return matches.length;
  } catch (err) {
    return 0;
  }
}

const codeQualityChecks = [
  { desc: 'Input Handler has paste detection', file: '/Users/tbwa/pulser_input_handler.js', pattern: /isProcessingPaste|pasteDetection/g },
  { desc: 'Security features implemented', file: '/Users/tbwa/pulser_input_handler.js', pattern: /mask|password|sensitive/gi },
  { desc: 'CLI handles slash commands', file: '/Users/tbwa/pulser_cli_consolidated.js', pattern: /\/help|\/version|\/clear/g },
  { desc: 'CLI has provider switching', file: '/Users/tbwa/pulser_cli_consolidated.js', pattern: /provider.*claude|provider.*gpt|provider.*local/g },
  { desc: 'CLI has spinner animation', file: '/Users/tbwa/pulser_cli_consolidated.js', pattern: /spinner|interval|clearInterval/g },
  { desc: 'Demo visualizes paste handling', file: '/Users/tbwa/demo_paste_handling.js', pattern: /pastedSql|pastedCode|pastedBash/g }
];

codeQualityChecks.forEach(check => {
  const matchCount = countMatches(check.file, check.pattern);
  console.log(`${matchCount > 0 ? GREEN + '✓' : RED + '✗'} ${RESET}${check.desc}: ${matchCount} matches`);
});

// Display summary
console.log(`\n${BOLD}Implementation Summary:${RESET}`);
const passedChecks = results.filter(r => r.exists).length;
console.log(`${passedChecks === results.length ? GREEN : YELLOW}${passedChecks}/${results.length} implementation files found${RESET}`);

// Verification result
if (passedChecks === results.length) {
  console.log(`\n${GREEN}${BOLD}✓ Verification Successful${RESET}`);
  console.log(`All required components are in place. You can proceed with installation.`);
  console.log(`\nTo install the CLI, run: ${YELLOW}./install_complete_pulser_cli.sh${RESET}`);
} else {
  console.log(`\n${YELLOW}${BOLD}! Verification Completed with Warnings${RESET}`);
  console.log(`Some components may be missing. Review the output above.`);
}

// Check for ESM vs CommonJS compatibility (since newer versions of chalk use ESM)
console.log(`\n${BOLD}Module Compatibility Check:${RESET}`);
const esmCheck = countMatches('/Users/tbwa/pulser_input_handler.js', /import\s+.*\s+from/g);
if (esmCheck > 0) {
  console.log(`${YELLOW}! ${RESET}ESM import syntax detected. May need to add "type": "module" to package.json`);
} else {
  console.log(`${GREEN}✓ ${RESET}Using CommonJS require() syntax`);
}