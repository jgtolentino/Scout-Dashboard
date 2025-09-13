/**
 * spinner.js - Claude-style thinking spinner
 * 
 * Provides an animated spinner with elapsed time display,
 * matching Claude's UI behavior.
 */

const ora = require('ora');
const chalk = require('chalk');
const readline = require('readline');

// Spinner configs for different agent types
const SPINNER_TYPES = {
  default: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
    color: 'yellow',
    text: 'Thinking...'
  },
  claude: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
    color: 'yellow',
    text: 'Thinking...'
  },
  deepseekr1: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
    color: 'yellow',
    text: 'Thinking...'
  },
  mistral: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
    color: 'blue',
    text: 'Processing...'
  }
};

/**
 * A spinner that shows elapsed time in Claude style
 */
class ElapsedTimeSpinner {
  constructor(options = {}) {
    // Determine spinner type
    const type = options.type || 'default';
    const config = SPINNER_TYPES[type] || SPINNER_TYPES.default;
    
    // Create the spinner
    this.spinner = ora({
      spinner: {
        frames: config.frames,
        interval: config.interval
      },
      color: config.color,
      text: options.text || config.text,
      discardStdin: false
    });
    
    this.startTime = null;
    this.updateInterval = null;
    this.finished = false;
  }
  
  /**
   * Start the spinner with elapsed time
   */
  start() {
    this.startTime = Date.now();
    this.spinner.start();
    
    // Update spinner text with elapsed time every 100ms
    this.updateInterval = setInterval(() => {
      if (this.finished) return;
      
      const elapsed = (Date.now() - this.startTime) / 1000;
      this.spinner.text = `${this.spinner.text.split('(')[0]} (${elapsed.toFixed(1)}s)`;
    }, 100);
    
    return this;
  }
  
  /**
   * Stop the spinner
   * @param {string} text - Optional text to display after stopping
   */
  stop(text) {
    clearInterval(this.updateInterval);
    this.finished = true;
    
    if (text) {
      this.spinner.succeed(text);
    } else {
      this.spinner.stop();
    }
    
    // Clear the line to ensure spinner is completely removed
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    
    return this;
  }
  
  /**
   * Show success message after stopping
   * @param {string} text - Success message
   */
  succeed(text) {
    clearInterval(this.updateInterval);
    this.finished = true;
    this.spinner.succeed(text || '✓ Completed');
    return this;
  }
  
  /**
   * Show failure message after stopping
   * @param {string} text - Error message
   */
  fail(text) {
    clearInterval(this.updateInterval);
    this.finished = true;
    this.spinner.fail(text || 'Failed');
    return this;
  }
  
  /**
   * Show warning message after stopping
   * @param {string} text - Warning message
   */
  warn(text) {
    clearInterval(this.updateInterval);
    this.finished = true;
    this.spinner.warn(text || 'Warning');
    return this;
  }
  
  /**
   * Show info message after stopping
   * @param {string} text - Info message
   */
  info(text) {
    clearInterval(this.updateInterval);
    this.finished = true;
    this.spinner.info(text || 'Info');
    return this;
  }
}

module.exports = {
  ElapsedTimeSpinner,
  SPINNER_TYPES
};