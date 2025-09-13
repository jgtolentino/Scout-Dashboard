/**
 * terminal/spinner.js
 * 
 * Terminal spinner and UI components for Claude CLI
 * Mimics the behavior of the ora and chalk libraries used in Claude Code CLI
 */

const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Spinner frames for animation (same as the Ora default)
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Create a terminal spinner that mimics Ora
 * @param {string} text - Initial spinner text
 * @returns {object} - Spinner control object
 */
function createSpinner(text = '') {
  let isSpinning = false;
  let currentFrame = 0;
  let interval = null;
  let currentText = text;
  let textColor = colors.cyan;
  let spinnerColor = colors.cyan;
  let prefixText = '';
  let suffixText = '';
  
  // Store original stream write to restore it later
  const originalWrite = process.stdout.write;
  
  const spinner = {
    /**
     * Start the spinner animation
     * @param {string} startText - Optional text to display with spinner
     * @returns {object} - Spinner instance
     */
    start: function(startText) {
      if (startText) currentText = startText;
      
      if (!isSpinning) {
        isSpinning = true;
        
        // Create interval to update spinner frame
        interval = setInterval(() => {
          this.render();
          currentFrame = (currentFrame + 1) % spinnerFrames.length;
        }, 80);
      }
      
      return this;
    },
    
    /**
     * Stop the spinner animation
     * @param {string} text - Optional final text to display
     * @returns {object} - Spinner instance
     */
    stop: function(text) {
      if (isSpinning) {
        clearInterval(interval);
        isSpinning = false;
        
        // Clear the spinner line
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        
        // If final text is provided, display it
        if (text !== undefined) {
          currentText = text;
          this.render(true);
          console.log(''); // Add a line break
        }
      }
      
      return this;
    },
    
    /**
     * Update the spinner text or get current text
     * @param {string} newText - New text to display (optional)
     * @returns {string|object} - Current text or spinner instance
     */
    text: function(newText) {
      // Getter mode
      if (newText === undefined) {
        return currentText;
      }
      
      // Setter mode
      currentText = newText;
      if (isSpinning) {
        this.render();
      }
      return this;
    },
    
    /**
     * Add a prefix to the spinner
     * @param {string} text - Prefix text
     * @returns {object} - Spinner instance
     */
    prefix: function(text) {
      prefixText = text;
      if (isSpinning) {
        this.render();
      }
      return this;
    },
    
    /**
     * Add a suffix to the spinner
     * @param {string} text - Suffix text
     * @returns {object} - Spinner instance
     */
    suffix: function(text) {
      suffixText = text;
      if (isSpinning) {
        this.render();
      }
      return this;
    },
    
    /**
     * Set the color of the spinner text
     * @param {string} color - Color name
     * @returns {object} - Spinner instance
     */
    color: function(color) {
      if (colors[color]) {
        textColor = colors[color];
        if (isSpinning) {
          this.render();
        }
      }
      return this;
    },
    
    /**
     * Set the color of the spinner animation
     * @param {string} color - Color name
     * @returns {object} - Spinner instance
     */
    spinnerColor: function(color) {
      if (colors[color]) {
        spinnerColor = colors[color];
        if (isSpinning) {
          this.render();
        }
      }
      return this;
    },
    
    /**
     * Mark the spinner as succeeded
     * @param {string} text - Success message
     * @returns {object} - Spinner instance
     */
    succeed: function(text) {
      return this.stopAndPersist({
        symbol: colors.green + '✓' + colors.reset,
        text: text
      });
    },
    
    /**
     * Mark the spinner as failed
     * @param {string} text - Failure message
     * @returns {object} - Spinner instance
     */
    fail: function(text) {
      return this.stopAndPersist({
        symbol: colors.red + '✖' + colors.reset,
        text: text
      });
    },
    
    /**
     * Mark the spinner with a warning
     * @param {string} text - Warning message
     * @returns {object} - Spinner instance
     */
    warn: function(text) {
      return this.stopAndPersist({
        symbol: colors.yellow + '⚠' + colors.reset,
        text: text
      });
    },
    
    /**
     * Mark the spinner with an info symbol
     * @param {string} text - Info message
     * @returns {object} - Spinner instance
     */
    info: function(text) {
      return this.stopAndPersist({
        symbol: colors.blue + 'ℹ' + colors.reset,
        text: text
      });
    },
    
    /**
     * Stop the spinner and display a custom symbol
     * @param {object} options - Options for the persistent spinner
     * @returns {object} - Spinner instance
     */
    stopAndPersist: function({ symbol = '', text, prefixText: prefix, suffixText: suffix } = {}) {
      const finalText = text !== undefined ? text : currentText;
      const finalPrefix = prefix !== undefined ? prefix : prefixText;
      const finalSuffix = suffix !== undefined ? suffix : suffixText;
      
      this.stop();
      
      // Construct the final line
      const line = [
        finalPrefix,
        symbol,
        finalText,
        finalSuffix
      ].filter(Boolean).join(' ');
      
      console.log(line);
      
      return this;
    },
    
    /**
     * Render the current frame of the spinner
     * @param {boolean} isFinal - Whether this is the final render (no spinner)
     */
    render: function(isFinal = false) {
      // Clear the current line
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      
      // Construct the spinner line
      const frame = isFinal ? '' : spinnerColor + spinnerFrames[currentFrame] + colors.reset;
      const line = [
        prefixText,
        frame,
        textColor + currentText + colors.reset,
        suffixText
      ].filter(Boolean).join(' ');
      
      // Write the line without a newline
      process.stdout.write(line);
    }
  };
  
  return spinner;
}

/**
 * Colorize a string for terminal output
 * @param {string} color - Color name
 * @param {string} text - Text to colorize
 * @returns {string} - Colorized text
 */
function colorize(color, text) {
  if (colors[color]) {
    return colors[color] + text + colors.reset;
  }
  return text;
}

// Store original color codes
const originalColors = Object.assign({}, colors);

// Add color functions to easily colorize text
Object.keys(originalColors).forEach(color => {
  if (typeof originalColors[color] === 'string' && !color.startsWith('bg') && color !== 'reset' && 
      color !== 'bright' && color !== 'dim' && color !== 'underscore' && 
      color !== 'blink' && color !== 'reverse' && color !== 'hidden') {
    colors[color] = function(text) {
      return originalColors[color] + text + originalColors.reset;
    };
  }
});

// Export functions and color constants
module.exports = {
  createSpinner,
  colorize,
  colors
};