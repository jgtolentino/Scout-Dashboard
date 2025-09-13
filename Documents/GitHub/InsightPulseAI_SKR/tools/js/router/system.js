/**
 * router/system.js
 * 
 * System command execution and utility functions
 */

const util = require('util');
const { exec } = require('child_process');
const execPromise = util.promisify(exec);
const path = require('path');
const fs = require('fs');

// Define allowed system commands for security
const ALLOWED_COMMANDS = [
  'ls', 'dir', 'pwd', 'echo', 'date', 'whoami', 'hostname',
  'cat', 'head', 'tail', 'grep', 'find', 'wc', 'sort', 'uniq',
  'mkdir', 'rm', 'cp', 'mv', 'touch', 'df', 'du', 'ps'
];

/**
 * Execute a system command with safety checks
 * @param {string} command - The command to execute
 * @returns {Promise<string>} - Command output
 */
async function executeSystemCommand(command) {
  try {
    // Security check: Ensure the command starts with an allowed command
    const firstWord = command.trim().split(/\s+/)[0];
    
    if (!ALLOWED_COMMANDS.includes(firstWord)) {
      return `Error: Command '${firstWord}' is not allowed for security reasons.`;
    }
    
    // Execute the command
    const { stdout, stderr } = await execPromise(command, { timeout: 10000 });
    
    if (stderr) {
      return `Command completed with warnings:\n${stderr}\n\nOutput:\n${stdout}`;
    }
    
    return stdout || 'Command executed successfully (no output).';
  } catch (error) {
    if (error.killed) {
      return `Error: Command timed out after 10 seconds`;
    }
    
    return `Error executing command: ${error.message}`;
  }
}

/**
 * Check if the system has the required dependencies
 * @returns {Promise<object>} - System check results
 */
async function checkSystemDependencies() {
  const results = {
    node: { version: process.version, status: 'ok' },
    npm: { status: 'unknown' },
    git: { status: 'unknown' },
    curl: { status: 'unknown' }
  };
  
  try {
    // Check npm
    try {
      const { stdout: npmVersion } = await execPromise('npm --version');
      results.npm = { version: npmVersion.trim(), status: 'ok' };
    } catch (error) {
      results.npm = { status: 'missing', error: error.message };
    }
    
    // Check git
    try {
      const { stdout: gitVersion } = await execPromise('git --version');
      results.git = { version: gitVersion.trim(), status: 'ok' };
    } catch (error) {
      results.git = { status: 'missing', error: error.message };
    }
    
    // Check curl
    try {
      const { stdout: curlVersion } = await execPromise('curl --version');
      results.curl = { 
        version: curlVersion.trim().split('\n')[0], 
        status: 'ok' 
      };
    } catch (error) {
      results.curl = { status: 'missing', error: error.message };
    }
    
    return {
      success: true,
      dependencies: results,
      allOk: Object.values(results).every(dep => dep.status === 'ok')
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format a dependency report for display
 * @param {object} results - System check results
 * @returns {string} - Formatted report
 */
function formatDependencyReport(results) {
  if (!results.success) {
    return `Error checking dependencies: ${results.error}`;
  }
  
  const report = ['System Dependency Check:'];
  
  for (const [name, info] of Object.entries(results.dependencies)) {
    const status = info.status === 'ok' 
      ? '✓' 
      : '✗';
      
    const version = info.version || 'Not found';
    
    report.push(`${status} ${name}: ${version}`);
    
    if (info.error) {
      report.push(`  ${info.error}`);
    }
  }
  
  if (results.allOk) {
    report.push('\nAll required dependencies are installed.');
  } else {
    report.push('\nSome dependencies are missing. This may affect functionality.');
  }
  
  return report.join('\n');
}

module.exports = {
  executeSystemCommand,
  checkSystemDependencies,
  formatDependencyReport
};