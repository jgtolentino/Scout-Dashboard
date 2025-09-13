/**
 * apikey_check.js
 * 
 * Script to verify Claude API key on startup
 * Can be executed as part of the Pulser CLI startup
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

// Configuration paths
const CONFIG_DIR = path.join(os.homedir(), '.pulser');
const API_KEY_PATH = path.join(CONFIG_DIR, 'claude_api_key.txt');
const MODE_CONFIG_PATH = path.join(CONFIG_DIR, 'mode.json');

/**
 * Check if a Claude API key exists and prompt user if missing
 */
function checkClaudeApiKey() {
  try {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    // Check if we need to look for an API key
    let needsApiKey = false;
    
    // Check current mode - only need API key for api or adaptive modes
    if (fs.existsSync(MODE_CONFIG_PATH)) {
      try {
        const config = JSON.parse(fs.readFileSync(MODE_CONFIG_PATH, 'utf8'));
        needsApiKey = config.mode === 'api' || config.mode === 'adaptive';
      } catch (e) {
        // If can't read config, assume we don't need API key
        needsApiKey = false;
      }
    }
    
    if (!needsApiKey) {
      return;
    }
    
    // Check if API key exists
    const hasApiKey = fs.existsSync(API_KEY_PATH) && 
                     fs.readFileSync(API_KEY_PATH, 'utf8').trim().length > 0;
    
    if (!hasApiKey) {
      console.log('\n⚠️  No Claude API key found, but you\'re in a mode that uses Claude API.');
      console.log('You can set your API key with the command: /apikey set YOUR_API_KEY');
      console.log('Or you can switch to local mode with: /mode local\n');
    }
  } catch (error) {
    // Silently fail - this is just a helper check
  }
}

// Run the check if executed directly
if (require.main === module) {
  checkClaudeApiKey();
}

module.exports = { checkClaudeApiKey };