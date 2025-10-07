/**
 * Pulser CLI Input Handler
 * Advanced input processing with paste detection for the Claude Code-style Pulser CLI
 */

import readline from 'readline';
import chalk from 'chalk';
import boxen from 'boxen';
import logUpdate from 'log-update';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// In ESM, __dirname is not available, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PulserInputHandler {
  constructor(options = {}) {
    this.options = {
      maxHistorySize: options.maxHistorySize || 50,
      promptSymbol: options.promptSymbol || '> ',
      pasteDetectionThreshold: options.pasteDetectionThreshold || 3, // chars per event suggesting paste
      pasteDetectionInterval: options.pasteDetectionInterval || 10, // ms between keystrokes suggesting paste
      historyFile: options.historyFile || `${process.env.HOME}/.claude-pulser/history/history.json`,
      ...options
    };
    
    this.inputBuffer = '';
    this.history = [];
    this.historyIndex = -1;
    this.isProcessingPaste = false;
    this.lastInputTime = 0;
    this.inputRate = 0;
    this.callbacks = {
      onCommand: options.onCommand || this.defaultCommandHandler,
      onMultiline: options.onMultiline || this.defaultMultilineHandler,
      onSlashCommand: options.onSlashCommand || this.defaultSlashCommandHandler
    };
    
    // Initialize
    this.loadHistory();
    this.setupPasteHandler();
  }
  
  setupPasteHandler() {
    // Setup stdin for raw input
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    process.stdin.on('keypress', (str, key) => {
      const now = Date.now();
      
      // Calculate input rate for paste detection
      if (this.lastInputTime > 0) {
        const timeDiff = now - this.lastInputTime;
        if (timeDiff < this.options.pasteDetectionInterval && str && str.length > this.options.pasteDetectionThreshold) {
          this.isProcessingPaste = true;
          this.showPasteIndicator(true);
        }
      }
      this.lastInputTime = now;
      
      // Handle key presses
      if (key) {
        if (key.ctrl && key.name === 'c') {
          // Exit on Ctrl+C
          this.cleanup();
          process.exit();
        } else if (key.ctrl && key.name === 'd') {
          // Submit on Ctrl+D (typically used for multi-line input)
          if (this.inputBuffer.trim()) {
            this.processInput();
          }
        } else if (key.name === 'return') {
          // Process input on Enter
          this.processInput();
        } else if (key.name === 'backspace') {
          // Handle backspace
          this.inputBuffer = this.inputBuffer.slice(0, -1);
          this.renderPrompt();
        } else if (key.name === 'up') {
          // Navigate history up
          this.navigateHistory(-1);
        } else if (key.name === 'down') {
          // Navigate history down
          this.navigateHistory(1);
        } else if (key.ctrl && key.name === 'l') {
          // Clear screen on Ctrl+L
          console.clear();
          this.renderPrompt();
        } else if (str && !key.ctrl && !key.meta) {
          // Add character to input buffer
          this.inputBuffer += str;
          this.renderPrompt();
        }
      }
      
      // Reset paste indicator after short delay
      if (this.isProcessingPaste) {
        clearTimeout(this._pasteTimeout);
        this._pasteTimeout = setTimeout(() => {
          this.isProcessingPaste = false;
          this.showPasteIndicator(false);
        }, 500);
      }
    });
    
    // Initial prompt
    this.renderPrompt();
    return this;
  }
  
  renderPrompt() {
    const promptText = `${chalk.green(this.options.promptSymbol)}${this.inputBuffer}`;
    logUpdate(promptText);
  }
  
  showPasteIndicator(isPasting) {
    if (isPasting) {
      const pasteNotice = chalk.yellow(' (Pasting...)');
      process.stdout.write(`\r${this.options.promptSymbol}${this.inputBuffer}${pasteNotice}`);
    } else {
      this.renderPrompt();
    }
  }
  
  processInput() {
    console.log(); // New line after input
    
    const input = this.inputBuffer.trim();
    
    // Check for slash commands
    if (input.startsWith('/')) {
      const slashCommand = input.split(' ')[0]; // Get the command part
      this.callbacks.onSlashCommand(slashCommand, input);
    }
    // Detect if this is a multi-line paste
    else if (input.includes('\n') || this.isProcessingPaste || this.detectCodeBlockOrConfig(input)) {
      // This is likely a multi-line paste or code
      const lines = input.split('\n').filter(line => line.trim());
      this.handleMultilinePaste(lines, input);
    } else {
      // Single line command
      this.callbacks.onCommand(input);
    }
    
    // Add to history and reset
    if (input) {
      this.addToHistory(input);
    }
    this.inputBuffer = '';
    this.isProcessingPaste = false;
    this.renderPrompt();
  }
  
  handleMultilinePaste(lines, rawInput) {
    // Format the pasted content based on type
    let title = 'Pasted Content';
    let formattedContent = rawInput;
    
    // Detect content type for better formatting
    if (this.detectSqlContent(rawInput)) {
      title = 'SQL Content';
      formattedContent = this.formatSqlContent(rawInput);
    } else if (this.detectCodeBlock(rawInput)) {
      title = 'Code Block';
      formattedContent = this.formatCodeBlock(rawInput);
    } else if (this.detectConfigContent(rawInput)) {
      title = 'Configuration';
      formattedContent = this.formatConfigContent(rawInput);
    }
    
    // Create a box around the pasted content for review
    const pasteBox = boxen(formattedContent, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      title: title,
      titleAlignment: 'center'
    });
    
    console.log(pasteBox);
    
    // Show paste options and process with callback
    this.callbacks.onMultiline(lines, rawInput, formattedContent);
  }
  
  // Default handlers (should be overridden)
  defaultCommandHandler(command) {
    console.log(chalk.dim(`Processing command: ${command}`));
  }
  
  defaultMultilineHandler(lines, rawInput, formattedContent) {
    console.log(chalk.cyan('How would you like to process this content?'));
    console.log('1. Execute as a single command');
    console.log('2. Execute each line as a separate command');
    console.log('3. Store as a file');
    console.log('4. Cancel');
  }
  
  defaultSlashCommandHandler(command, fullInput) {
    console.log(chalk.cyan(`Processing slash command: ${command}`));
  }
  
  // Content detection helpers
  detectCodeBlockOrConfig(text) {
    return this.detectCodeBlock(text) || this.detectConfigContent(text) || this.detectSqlContent(text);
  }
  
  detectCodeBlock(text) {
    const codeIndicators = [
      text.includes('{') && text.includes('}'),
      text.includes('function'),
      text.includes('class'),
      text.includes('import '),
      text.includes('def '),
      /^\s+/.test(text.split('\n')[1] || ''), // Check if second line is indented
      text.includes('if ') && text.includes(':'),
      text.includes('for ') && text.includes(':')
    ];
    
    return codeIndicators.filter(Boolean).length >= 2;
  }
  
  detectSqlContent(text) {
    const upperText = text.toUpperCase();
    const sqlIndicators = [
      upperText.includes('SELECT'),
      upperText.includes('FROM'),
      upperText.includes('WHERE'),
      upperText.includes('INSERT'),
      upperText.includes('UPDATE'),
      upperText.includes('DELETE'),
      upperText.includes('CREATE TABLE'),
      upperText.includes('ALTER TABLE'),
      upperText.includes('JOIN'),
      upperText.includes('GROUP BY')
    ];
    
    return sqlIndicators.filter(Boolean).length >= 2;
  }
  
  detectConfigContent(text) {
    const configIndicators = [
      text.includes('=') && !text.includes('{'),
      text.includes('config'),
      text.includes('settings'),
      text.includes('CONNECTION'),
      text.includes('SERVER'),
      text.includes('DATABASE'),
      text.includes('PASSWORD'),
      text.includes('USERNAME'),
      text.includes('API_KEY'),
      text.match(/[A-Z_]+=/)
    ];
    
    return configIndicators.filter(Boolean).length >= 2;
  }
  
  // Content formatting helpers
  formatSqlContent(sql) {
    // Simple SQL formatter
    return sql
      .replace(/SELECT/gi, chalk.cyan('SELECT'))
      .replace(/FROM/gi, chalk.cyan('FROM'))
      .replace(/WHERE/gi, chalk.cyan('WHERE'))
      .replace(/INSERT/gi, chalk.cyan('INSERT'))
      .replace(/UPDATE/gi, chalk.cyan('UPDATE'))
      .replace(/DELETE/gi, chalk.cyan('DELETE'))
      .replace(/JOIN/gi, chalk.cyan('JOIN'))
      .replace(/GROUP BY/gi, chalk.cyan('GROUP BY'))
      .replace(/ORDER BY/gi, chalk.cyan('ORDER BY'))
      .replace(/HAVING/gi, chalk.cyan('HAVING'));
  }
  
  formatCodeBlock(code) {
    // Simple code formatter
    return code
      .replace(/function/g, chalk.blue('function'))
      .replace(/class/g, chalk.blue('class'))
      .replace(/import/g, chalk.blue('import'))
      .replace(/def/g, chalk.blue('def'))
      .replace(/if|else|for|while/g, chalk.blue('$&'))
      .replace(/return/g, chalk.blue('return'))
      .replace(/\{|\}/g, chalk.yellow('$&'))
      .replace(/\(|\)/g, chalk.yellow('$&'));
  }
  
  formatConfigContent(config) {
    // Config formatter that masks sensitive values
    return config.replace(/^(\s*[A-Za-z0-9_]+\s*=\s*)["']?(.+?)["']?$/gm, (match, key, value) => {
      // Check if this is a sensitive key that should be masked
      if (/password|pwd|secret|key|token|auth/i.test(key)) {
        return `${chalk.green(key)}${chalk.red('*********')}`;
      }
      return `${chalk.green(key)}${chalk.yellow(value)}`;
    });
  }
  
  // History management
  addToHistory(command) {
    this.history.unshift(command);
    if (this.history.length > this.options.maxHistorySize) {
      this.history.pop();
    }
    this.historyIndex = -1;
    this.saveHistory();
  }
  
  navigateHistory(direction) {
    const newIndex = this.historyIndex + direction;
    
    if (newIndex >= -1 && newIndex < this.history.length) {
      this.historyIndex = newIndex;
      
      if (this.historyIndex === -1) {
        this.inputBuffer = '';
      } else {
        this.inputBuffer = this.history[this.historyIndex];
      }
      
      this.renderPrompt();
    }
  }
  
  saveHistory() {
    try {
      const dir = dirname(this.options.historyFile);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.options.historyFile,
        JSON.stringify(this.history.slice(0, this.options.maxHistorySize)),
        'utf8'
      );
    } catch (error) {
      console.error(chalk.red(`Error saving history: ${error.message}`));
    }
  }

  loadHistory() {
    try {
      if (fs.existsSync(this.options.historyFile)) {
        this.history = JSON.parse(fs.readFileSync(this.options.historyFile, 'utf8'));
      }
    } catch (error) {
      console.error(chalk.red(`Error loading history: ${error.message}`));
      this.history = [];
    }
  }
  
  // Cleanup resources
  cleanup() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.removeAllListeners('keypress');
  }
}

export default PulserInputHandler;