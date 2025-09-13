#!/usr/bin/env node

/**
 * PulserShell Input Fix
 * A lightweight fix for PulserShell input handling issues
 */

const readline = require('readline');
const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configuration
const CONFIG = {
  scriptPath: path.join(os.homedir(), 'Documents/GitHub/InsightPulseAI_SKR/scripts/pulser_shell.sh'),
  logPath: path.join(os.homedir(), '.pulser', 'input_fix.log'),
  debug: false
};

// Ensure log directory exists
if (!fs.existsSync(path.dirname(CONFIG.logPath))) {
  fs.mkdirSync(path.dirname(CONFIG.logPath), { recursive: true });
}

// Setup logging
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  if (CONFIG.debug) {
    console.log(`DEBUG: ${message}`);
  }
  
  fs.appendFileSync(CONFIG.logPath, logMessage);
}

log('PulserShell Input Fix starting up');

// Verify that the script path exists
if (!fs.existsSync(CONFIG.scriptPath)) {
  console.error(`Error: PulserShell script not found at ${CONFIG.scriptPath}`);
  log(`Error: Script not found at ${CONFIG.scriptPath}`);
  process.exit(1);
}

log(`Found PulserShell script at ${CONFIG.scriptPath}`);

// Create a readline interface for input handling
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'pulser> ',
  terminal: true
});

// Launch the PulserShell process
log('Launching PulserShell subprocess');
const pulserProcess = childProcess.spawn('bash', [CONFIG.scriptPath], {
  stdio: ['pipe', 'inherit', 'inherit'],
  env: { ...process.env, PULSER_INPUT_FIX: '1' }
});

// Handle process exit
pulserProcess.on('exit', (code, signal) => {
  log(`PulserShell process exited with code ${code}, signal ${signal}`);
  rl.close();
  process.exit(code);
});

// Handle errors
pulserProcess.on('error', (err) => {
  log(`PulserShell process error: ${err.message}`);
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});

// Set up input handling
rl.prompt();

rl.on('line', (line) => {
  // Send input to PulserShell process
  try {
    pulserProcess.stdin.write(line + '\n');
    log(`Input sent: "${line}"`);
  } catch (err) {
    log(`Error sending input: ${err.message}`);
    console.error('Error sending input:', err.message);
  }
  
  // Special commands handling
  if (line.trim() === ':quit' || line.trim() === ':exit') {
    log('Exit command detected, closing input fix');
    rl.close();
    pulserProcess.stdin.end();
    return;
  }
  
  // Show prompt again
  setTimeout(() => rl.prompt(), 100);
});

rl.on('close', () => {
  log('Input interface closed');
  pulserProcess.stdin.end();
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  log('SIGINT received, forwarding to PulserShell');
  pulserProcess.kill('SIGINT');
});

console.log('PulserShell Input Fix active - all input will be properly processed');
console.log('Type :quit or :exit to exit');