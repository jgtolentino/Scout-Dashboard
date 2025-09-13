/**
 * interactive.js
 * 
 * Provides the interactive REPL functionality for the Pulser CLI
 * Designed to match Claude Code's terminal interaction behavior
 */

const readline = require('readline');
const chalk = require('chalk');
const { createInputBox, createResponseBox } = require('./blocks');
const { ElapsedTimeSpinner } = require('./spinner');
const { processCommand } = require('./router');
const { getContext, saveContext } = require('./context');

// ANSI escape sequences
const CLEAR_LINE = '\r\x1B[K';
const MOVE_UP = '\x1B[1A';
const HIDE_CURSOR = '\x1B[?25l';
const SHOW_CURSOR = '\x1B[?25h';

/**
 * Interactive REPL for Pulser CLI
 */
class PulserInteractive {
  constructor(options = {}) {
    this.history = [];
    this.historyIndex = -1;
    this.spinner = new ElapsedTimeSpinner({
      type: options.spinnerType || 'dots',
      color: options.spinnerColor || 'yellow',
    });
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '',
      historySize: 100,
      terminal: true,
    });
    
    this.setupListeners();
    this.context = getContext();
  }
  
  /**
   * Set up event listeners for the readline interface
   */
  setupListeners() {
    // Handle line input
    this.rl.on('line', async (line) => {
      if (line.trim() === '') {
        this.prompt();
        return;
      }
      
      // Add to history
      this.history.push(line);
      this.historyIndex = this.history.length;
      
      // Process the input
      await this.processInput(line);
    });
    
    // Handle SIGINT (Ctrl+C)
    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\nExiting Pulser CLI...'));
      process.exit(0);
    });
    
    // Custom key handlers for history navigation
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
  
  /**
   * Display the input prompt
   */
  prompt() {
    console.log(createInputBox());
    this.rl.prompt();
  }
  
  /**
   * Process user input
   * @param {string} input - The user input to process
   */
  async processInput(input) {
    try {
      // Start the spinner
      process.stdout.write(HIDE_CURSOR);
      this.spinner.start('Thinking');
      
      // Process the command through the router
      const result = await processCommand(input, this.context);
      
      // Stop the spinner
      this.spinner.stop();
      process.stdout.write(SHOW_CURSOR);
      
      // Display the response
      console.log(createResponseBox(result));
      
      // Update context
      this.context = {
        ...this.context,
        lastInput: input,
        lastResponse: result,
      };
      saveContext(this.context);
      
      // Display the next prompt
      this.prompt();
    } catch (error) {
      this.spinner.stop();
      process.stdout.write(SHOW_CURSOR);
      console.error(chalk.red(`Error: ${error.message}`));
      this.prompt();
    }
  }
  
  /**
   * Start the interactive REPL
   */
  start() {
    console.log(chalk.yellow('Welcome to Pulser CLI preview!'));
    console.log(chalk.gray('Type your requests or messages below. Type "exit" to quit.'));
    this.prompt();
  }
  
  /**
   * Stop the interactive REPL
   */
  stop() {
    this.rl.close();
  }
}

module.exports = {
  PulserInteractive,
};