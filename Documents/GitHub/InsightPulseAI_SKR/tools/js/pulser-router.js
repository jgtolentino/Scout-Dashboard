#!/usr/bin/env node

/**
 * pulser-router.js
 * 
 * Main entry point for the Pulser CLI with adaptive routing
 * Supports multiple operation modes (local, api, adaptive, demo)
 */

const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { program } = require('commander');
const { processCommand, loadModeConfig, saveModeConfig } = require('./router');
const { checkClaudeApiKey } = require('./apikey_check');

// Get environment variables for model override and flags
const MODEL_OVERRIDE = process.env.PULSER_MODEL_OVERRIDE;
const NO_FALLBACK = process.env.PULSER_NO_FALLBACK === 'true';
const FORCE_LOCAL = process.env.PULSER_FORCE_LOCAL === 'true';

// ANSI escape sequences
const CLEAR_LINE = '\r\x1B[K';
const HIDE_CURSOR = '\x1B[?25l';
const SHOW_CURSOR = '\x1B[?25h';

// Configuration paths
const CONFIG_DIR = path.join(os.homedir(), '.pulser');
const MODE_CONFIG_PATH = path.join(CONFIG_DIR, 'mode.json');

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

// Create input box and ensure focus
function createInputBox(mode) {
  const modelLabel = getModelLabel(mode);
  console.log(chalk.magenta('╭─────────────────────────────────────────╮'));
  console.log(chalk.yellow(`│  ${modelLabel} is ready for your input...   │`));
  console.log(chalk.magenta('╰─────────────────────────────────────────╯'));
  
  // Ensure cursor is visible and terminal is in focus mode
  process.stdout.write('\x1B[?25h'); // Show cursor
  
  // Force focus to input by triggering a fake keypress event
  if (process.stdin.isTTY) {
    setTimeout(() => {
      // Send a null key event to force focus
      process.stdin.emit('keypress', '', { name: 'tab', ctrl: false, meta: false, shift: false });
    }, 100);
  }
}

// Get model label based on mode
function getModelLabel(mode) {
  switch (mode) {
    case 'api':
      return 'Claude API';
    case 'local':
      return 'DeepSeekr1';
    case 'adaptive':
      return 'Pulser (Adaptive)';
    case 'demo':
      return 'Pulser (Demo)';
    default:
      return 'Pulser';
  }
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
    const paddedLine = line.padEnd(70);
    result.push(chalk.white(`│ ${paddedLine} │`));
  }
  
  result.push(chalk.blue('╰───────────────────────────────────────────────────────────────────────╯'));
  
  return result.join('\n');
}

// Main CLI class
class PulserCLI {
  constructor(options = {}) {
    this.options = options;
    this.spinner = new Spinner();
    this.context = {
      trustedDirectories: [os.homedir()],
      history: [],
      overrideModel: MODEL_OVERRIDE || null,
      noFallback: NO_FALLBACK || false,
      forceLocal: FORCE_LOCAL || false,
      usePromptCache: true, // Enable prompt caching by default
    };
    
    // Set up readline interface with auto-focus
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '',
      historySize: 100,
      terminal: true, // Enable terminal features
    });
    
    // Ensure input is in focus
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    // Command history
    this.history = [];
    this.historyIndex = 0;
    
    // Set up event listeners
    this.setupListeners();
  }
  
  // Set up event listeners
  setupListeners() {
    // Handle line input
    this.rl.on('line', async (line) => {
      const input = line.trim();
      
      if (!input) {
        const modeConfig = await loadModeConfig();
        createInputBox(modeConfig.mode);
        return;
      }
      
      // Add to history
      this.history.push(input);
      this.historyIndex = this.history.length;
      
      // Process the input
      await this.processInput(input);
    });
    
    // Handle SIGINT (Ctrl+C)
    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\nExiting Pulser CLI...'));
      process.exit(0);
    });
    
    // Custom key handlers for history navigation
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    process.stdin.on('keypress', (str, key) => {
      if (key.name === 'up' && this.historyIndex > 0) {
        this.historyIndex--;
        this.rl.line = this.history[this.historyIndex];
        this.rl.cursor = this.rl.line.length;
        this.rl._refreshLine();
      } else if (key.name === 'down') {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.rl.line = this.history[this.historyIndex];
        } else {
          this.historyIndex = this.history.length;
          this.rl.line = '';
        }
        this.rl.cursor = this.rl.line.length;
        this.rl._refreshLine();
      }
    });
  }
  
  // Process user input
  async processInput(input) {
    try {
      // Start the spinner
      this.spinner.start('Thinking');
      
      // Process the command through the router
      const result = await processCommand(input, this.context);
      
      // Stop the spinner
      this.spinner.stop();
      
      // Display the response
      console.log();
      console.log(formatResponse(result));
      console.log();
      
      // Update context
      if (!this.context.history) {
        this.context.history = [];
      }
      
      this.context.history.push({
        input: input,
        response: result,
        timestamp: new Date().toISOString()
      });
      
      // Limit history size
      if (this.context.history.length > 50) {
        this.context.history = this.context.history.slice(-50);
      }
      
      // Show input box again and ensure focus
      const modeConfig = await loadModeConfig();
      createInputBox(modeConfig.mode);
      
      // Force focus the input field
      this.rl.cursor = 0;
      this.rl._refreshLine();
      
      // Explicitly set tty raw mode to ensure input capture
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }
    } catch (error) {
      // Stop the spinner
      this.spinner.stop();
      
      // Display error
      console.error(chalk.red(`Error: ${error.message}`));
      console.log();
      
      // Show input box again and ensure focus
      const modeConfig = await loadModeConfig();
      createInputBox(modeConfig.mode);
      
      // Force focus the input field
      this.rl.cursor = 0;
      this.rl._refreshLine();
      
      // Explicitly set tty raw mode to ensure input capture
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }
    }
  }
  
  // Start the CLI
  async start() {
    try {
      // Ensure config directory exists
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }
      
      // Get or set mode based on command line arguments
      let modeConfig = await loadModeConfig();
      
      // Check if mode was specified as command line argument
      if (this.options.local) {
        modeConfig.mode = 'local';
        await saveModeConfig(modeConfig);
      } else if (this.options.api) {
        modeConfig.mode = 'api';
        await saveModeConfig(modeConfig);
      } else if (this.options.adaptive) {
        modeConfig.mode = 'adaptive';
        await saveModeConfig(modeConfig);
      } else if (this.options.demo) {
        modeConfig.mode = 'demo';
        await saveModeConfig(modeConfig);
      }
      
      // Display welcome message
      console.log(chalk.yellow('Welcome to Pulser CLI!'));
      console.log(chalk.gray(`Running in ${modeConfig.mode.toUpperCase()} mode`));
      
      // Check for Claude API key if needed
      checkClaudeApiKey();
      
      // Show model override if set
      if (this.context.overrideModel) {
        console.log(chalk.green(`Model override: ${this.context.overrideModel}`));
      }
      
      // Show flags if set
      if (this.context.noFallback) {
        console.log(chalk.yellow('Model fallback: Disabled'));
      }
      
      if (this.context.forceLocal) {
        console.log(chalk.blue('Local model usage: Forced'));
      }
      
      // Show prompt caching status
      console.log(chalk.green('Prompt caching: Enabled 📦'));
      
      console.log(chalk.gray('Type /help for available commands'));
      console.log();
      
      // Show the initial input box and ensure focus
      createInputBox(modeConfig.mode);
      
      // After a short delay to allow terminal to be ready, force focus the input
      setTimeout(() => {
        this.rl.cursor = 0;
        this.rl._refreshLine();
        
        // Force terminal into raw mode to better capture input
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
        }
        
        // Ensure cursor is visible
        process.stdout.write('\x1B[?25h');
      }, 200);
    } catch (error) {
      console.error(chalk.red(`Startup error: ${error.message}`));
      process.exit(1);
    }
  }
  
  // Stop the CLI
  stop() {
    this.spinner.stop();
    this.rl.close();
  }
}

// Setup command line arguments
program
  .name('pulser')
  .description('Pulser CLI - Terminal interface for AI agents with adaptive routing')
  .version('0.2.0');

program
  .option('--local', 'Use local DeepSeekr1 mode (default)')
  .option('--api', 'Use Claude API mode')
  .option('--adaptive', 'Use adaptive routing mode')
  .option('--demo', 'Use demo mode (no API calls)')
  .option('--debug', 'Enable debug mode');

program.parse(process.argv);
const options = program.opts();

// Start the CLI
const cli = new PulserCLI(options);

// Handle graceful exit
process.on('SIGINT', () => {
  cli.stop();
  console.log(chalk.yellow('\nExiting Pulser CLI...'));
  process.exit(0);
});

// Start CLI
cli.start().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});