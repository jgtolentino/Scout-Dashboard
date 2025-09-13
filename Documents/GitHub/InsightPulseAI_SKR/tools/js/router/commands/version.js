/**
 * commands/version.js
 * 
 * Command module for 'version' command in the Claude CLI
 * Shows version information for CLI, API, and model
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration paths
const CONFIG_DIR = path.join(os.homedir(), '.pulser', 'config');
const VERSION_FILE = path.join(CONFIG_DIR, 'claude_version.json');

// Default version information
const DEFAULT_VERSION = {
  cli: '1.1.1',              // CLI interface version
  api: '2023-06-01',         // Claude API version
  model: 'claude-3-sonnet-20240229',  // Default model
  protocol: 'anthropic-v1',  // Protocol version
  lastChecked: new Date().toISOString()
};

/**
 * Get current version information
 * @returns {Promise<object>} - Version information
 */
async function getVersionInfo() {
  try {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    // Check if version file exists
    if (fs.existsSync(VERSION_FILE)) {
      const content = await fs.promises.readFile(VERSION_FILE, 'utf8');
      return JSON.parse(content);
    }
    
    // Create default version file if it doesn't exist
    await fs.promises.writeFile(VERSION_FILE, JSON.stringify(DEFAULT_VERSION, null, 2));
    return DEFAULT_VERSION;
  } catch (error) {
    console.error('Error reading version info:', error);
    return DEFAULT_VERSION;
  }
}

/**
 * Execute the 'version' command
 * @returns {Promise<string>} - Version information formatted for display
 */
async function execute() {
  const versionInfo = await getVersionInfo();
  
  return `
Claude CLI Version: ${versionInfo.cli}
Claude API Version: ${versionInfo.api}
Default Model: ${versionInfo.model}
Protocol Version: ${versionInfo.protocol}
Last API Check: ${new Date(versionInfo.lastChecked).toLocaleString()}
`;
}

/**
 * Get help information for this command
 * @returns {string} - Help text
 */
function getHelp() {
  return `
Usage: version

Displays version information for the Claude CLI and API
`;
}

module.exports = {
  execute,
  getHelp,
  getVersionInfo
};