#!/usr/bin/env node

/**
 * Production CLI launcher script for Pulser CLI
 * Connects to the DeepSeekr1 API service
 */

const readline = require('readline');
const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI escape sequences
const CLEAR_LINE = '\r\x1B[K';
const HIDE_CURSOR = '\x1B[?25l';
const SHOW_CURSOR = '\x1B[?25h';

// Configuration
const CONFIG_DIR = path.join(os.homedir(), '.pulser');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const CONTEXT_PATH = path.join(CONFIG_DIR, 'context.json');

// Default configuration
const DEFAULT_CONFIG = {
  api: {
    endpoint: 'http://localhost:8000/v1/chat/completions',
    timeout: 60000
  },
  model: {
    name: 'deepseekr1-8k',
    temperature: 0.7,
    max_tokens: 1000
  }
};

// Default context
const DEFAULT_CONTEXT = {
  trustedDirectories: [os.homedir()],
  history: [],
  currentSessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
};

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Load or create config
let config;
try {
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } else {
    config = DEFAULT_CONFIG;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  }
} catch (error) {
  console.error(chalk.red(`Error loading config: ${error.message}`));
  config = DEFAULT_CONFIG;
}

// Load or create context
let context;
try {
  if (fs.existsSync(CONTEXT_PATH)) {
    context = JSON.parse(fs.readFileSync(CONTEXT_PATH, 'utf8'));
  } else {
    context = DEFAULT_CONTEXT;
    fs.writeFileSync(CONTEXT_PATH, JSON.stringify(context, null, 2));
  }
} catch (error) {
  console.error(chalk.red(`Error loading context: ${error.message}`));
  context = DEFAULT_CONTEXT;
}

// Spinner implementation
class Spinner {
  constructor() {
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.interval = null;
    this.current = 0;
    this.startTime = null;
    this.message = '';
  }

  start(message = 'Thinking') {
    this.message = message;
    this.startTime = Date.now();
    this.current = 0;
    process.stdout.write(HIDE_CURSOR);
    
    this.interval = setInterval(() => {
      const frame = this.frames[this.current];
      const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      process.stdout.write(CLEAR_LINE);
      process.stdout.write(chalk.yellow(`${frame} ${this.message}... ${elapsedSeconds}s`));
      this.current = (this.current + 1) % this.frames.length;
    }, 100);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write(CLEAR_LINE);
      process.stdout.write(SHOW_CURSOR);
    }
  }
}

// Create input box
function createInputBox() {
  console.log(chalk.magenta('╭─────────────────────────────────────────╮'));
  console.log(chalk.yellow('│  DeepSeekr1 is ready for your input...   │'));
  console.log(chalk.magenta('╰─────────────────────────────────────────╯'));
}

// Format response text
function formatResponse(text) {
  if (!text) return '';
  
  // Split response into lines
  const lines = text.split('\n');
  
  // Create box with content
  let result = [];
  result.push(chalk.blue('╭───────────────────────────────────────────────────────────────────────╮'));
  
  // Add each line of content
  for (const line of lines) {
    result.push(chalk.white(`│ ${line.padEnd(70)} │`));
  }
  
  result.push(chalk.blue('╰───────────────────────────────────────────────────────────────────────╯'));
  
  return result.join('\n');
}

// Save context
function saveContext() {
  try {
    fs.writeFileSync(CONTEXT_PATH, JSON.stringify(context, null, 2));
  } catch (error) {
    console.error(chalk.red(`Error saving context: ${error.message}`));
  }
}

// Handle special commands
function handleSpecialCommand(input) {
  const command = input.trim().toLowerCase();
  
  if (command === '/exit' || command === '/quit') {
    console.log(chalk.yellow('Exiting Pulser CLI...'));
    saveContext();
    process.exit(0);
    return true;
  } else if (command === '/help') {
    console.log(chalk.cyan('Available commands:'));
    console.log(chalk.cyan('  /help - Show this help message'));
    console.log(chalk.cyan('  /exit, /quit - Exit Pulser CLI'));
    console.log(chalk.cyan('  /clear - Clear the screen'));
    console.log(chalk.cyan('  /config - Show current configuration'));
    console.log(chalk.cyan('  /status - Check API connection status'));
    return true;
  } else if (command === '/clear') {
    console.clear();
    return true;
  } else if (command === '/config') {
    console.log(chalk.cyan('Current configuration:'));
    console.log(JSON.stringify(config, null, 2));
    return true;
  } else if (command === '/status') {
    checkApiStatus();
    return true;
  }
  
  return false;
}

// Check API status
async function checkApiStatus() {
  const spinner = new Spinner();
  spinner.start('Checking API connection');
  
  try {
    const response = await axios.get(config.api.endpoint.replace('/v1/chat/completions', '/v1/health'), {
      timeout: 5000
    });
    
    spinner.stop();
    
    if (response.status === 200) {
      console.log(chalk.green('✓ API is available and ready'));
    } else {
      console.log(chalk.red(`✗ API responded with status code: ${response.status}`));
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red(`✗ API connection failed: ${error.message}`));
    console.log(chalk.yellow(`API endpoint: ${config.api.endpoint}`));
    console.log(chalk.yellow('Make sure the DeepSeekr1 API service is running'));
  }
}

// Make API request to DeepSeekr1
async function makeApiRequest(input) {
  const spinner = new Spinner();
  spinner.start('Thinking');
  
  try {
    // Add to history
    if (!context.history) {
      context.history = [];
    }
    
    // Build message history
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant. Respond concisely and accurately to the user\'s questions.'
      }
    ];
    
    // Add recent history (last 5 exchanges)
    const recentHistory = context.history.slice(-5);
    for (const entry of recentHistory) {
      messages.push({ role: 'user', content: entry.input });
      if (entry.response) {
        messages.push({ role: 'assistant', content: entry.response });
      }
    }
    
    // Add current message
    messages.push({ role: 'user', content: input });
    
    // Make the API request
    const response = await axios.post(
      config.api.endpoint,
      {
        model: config.model.name,
        messages: messages,
        temperature: config.model.temperature,
        max_tokens: config.model.max_tokens
      },
      {
        timeout: config.api.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    spinner.stop();
    
    if (response.data.choices && response.data.choices.length > 0) {
      const responseContent = response.data.choices[0].message.content;
      
      // Add to history
      context.history.push({
        input: input,
        response: responseContent,
        timestamp: new Date().toISOString()
      });
      
      // Limit history size
      if (context.history.length > 50) {
        context.history = context.history.slice(-50);
      }
      
      // Save context
      saveContext();
      
      // Return the response content
      return responseContent;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    spinner.stop();
    
    if (error.response) {
      throw new Error(`API error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
    } else if (error.request) {
      throw new Error(`Network error: ${error.message}. Is the API server running?`);
    }
    
    throw error;
  }
}

// Main CLI loop
async function startCli() {
  // Welcome message
  console.log(chalk.yellow('Welcome to Pulser CLI (Production Mode)!'));
  console.log(chalk.gray('Connected to DeepSeekr1 API.'));
  console.log(chalk.gray(`API endpoint: ${config.api.endpoint}`));
  console.log(chalk.gray(`Model: ${config.model.name}`));
  console.log();
  
  createInputBox();
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '',
    historySize: 100
  });
  
  // Command history
  let history = [];
  let historyIndex = 0;
  
  // Custom keypress handler for history navigation
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  
  process.stdin.on('keypress', (str, key) => {
    if (key.name === 'up' && historyIndex > 0) {
      historyIndex--;
      rl.line = history[historyIndex];
      rl.cursor = rl.line.length;
      rl._refreshLine();
    } else if (key.name === 'down') {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        rl.line = history[historyIndex];
      } else {
        historyIndex = history.length;
        rl.line = '';
      }
      rl.cursor = rl.line.length;
      rl._refreshLine();
    }
  });
  
  // Handle line input
  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (!input) {
      createInputBox();
      return;
    }
    
    // Add to history
    history.push(input);
    historyIndex = history.length;
    
    // Handle special commands
    if (input.startsWith('/')) {
      const handled = handleSpecialCommand(input);
      if (handled) {
        createInputBox();
        return;
      }
    }
    
    try {
      // Get response from DeepSeekr1 API
      const response = await makeApiRequest(input);
      
      // Display response
      console.log();
      console.log(formatResponse(response));
      console.log();
      
      // Show input box again
      createInputBox();
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      console.log();
      createInputBox();
    }
  });
  
  // Handle Ctrl+C
  rl.on('SIGINT', () => {
    console.log(chalk.yellow('\nExiting Pulser CLI...'));
    saveContext();
    process.exit(0);
  });
}

// Start the CLI
startCli().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});