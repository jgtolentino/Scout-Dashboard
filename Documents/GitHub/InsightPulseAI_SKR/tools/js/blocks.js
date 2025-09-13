/**
 * blocks.js - Claude-style text block components
 * 
 * This provides consistent block-style text components similar
 * to Claude's CLI interface.
 */

const chalk = require('chalk');
const boxen = require('boxen');
const util = require('util');
const stripAnsi = require('strip-ansi');

// Styles that match Claude's interface
const STYLE = {
  INPUT_BORDER: 'blue',
  RESPONSE_BORDER: 'blue',
  SUMMARY_BORDER: 'green',
  THINKING_TEXT: 'yellow',
  PROMPT_TEXT: 'white',
  ERROR_TEXT: 'red',
  SUCCESS_TEXT: 'green',
  INFO_TEXT: 'blue',
};

/**
 * Creates a Claude-style input box
 * @param {string} text - Optional text to display in the input box
 * @returns {string} Formatted input box
 */
function createInputBox(text = '') {
  // Return a box with a blue border and white text
  return boxen(` > "${text}"`, {
    padding: 0,
    margin: 0,
    borderStyle: 'round',
    borderColor: STYLE.INPUT_BORDER,
    width: 70,
  });
}

/**
 * Creates a Claude-style response box
 * @param {string} text - Text to display in the response box
 * @returns {string} Formatted response box
 */
function createResponseBox(text) {
  // Process code blocks specially
  if (text.includes('```')) {
    const processedText = processCodeBlocks(text);
    return boxen(processedText, {
      padding: 1,
      margin: 0,
      borderStyle: 'round',
      borderColor: STYLE.RESPONSE_BORDER,
      width: 70,
    });
  }
  
  return boxen(text, {
    padding: 1,
    margin: 0,
    borderStyle: 'round',
    borderColor: STYLE.RESPONSE_BORDER,
    width: 70,
  });
}

/**
 * Creates a Claude-style summary box
 * @param {string} title - Summary title
 * @param {string} text - Summary content
 * @returns {string} Formatted summary box
 */
function createSummaryBox(title, text) {
  return boxen(chalk.bold(title) + '\n\n' + text, {
    padding: 1,
    margin: {top: 1, bottom: 1},
    borderStyle: 'round',
    borderColor: STYLE.SUMMARY_BORDER,
    title: '✅ Summary',
    width: 70,
  });
}

/**
 * Creates a thinking indicator for spinner
 * @param {string} text - Custom thinking text
 * @returns {string} Formatted thinking text
 */
function createThinkingText(text = 'Thinking...') {
  return chalk.yellow(text);
}

/**
 * Creates an error box
 * @param {string} error - Error message
 * @returns {string} Formatted error box
 */
function createErrorBox(error) {
  return boxen(chalk.red(error), {
    padding: 1,
    margin: 0,
    borderStyle: 'round',
    borderColor: 'red',
    title: '❌ Error',
    width: 70,
  });
}

/**
 * Process markdown code blocks for syntax highlighting
 * @param {string} text - Text containing markdown code blocks
 * @returns {string} Text with processed code blocks
 */
function processCodeBlocks(text) {
  // Simple version just preserves the code block
  // In a complete implementation, this would use syntax highlighting
  return text;
}

/**
 * Calculate visual width of text (accounting for ANSI codes)
 * @param {string} text - Input text
 * @returns {number} Visual width
 */
function getVisualWidth(text) {
  return stripAnsi(text).length;
}

/**
 * Create trust folder dialog box
 * @param {string} folder - Folder path
 * @returns {string} Formatted trust dialog
 */
function createTrustDialog(folder) {
  const message = `* Do you trust the files in this folder?

${chalk.bold(folder)}

Pulser CLI may read files in this folder. Reading untrusted files may lead
Pulser to behave in unexpected ways.

With your permission Pulser CLI may execute files in this folder. Executing
untrusted code is unsafe.

${chalk.blue('https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions')}

${chalk.bold('❯ 1. Yes, proceed')}
  2. No, exit

${chalk.dim('⌨  Enter to confirm • Esc to exit')}`;

  return message;
}

module.exports = {
  createInputBox,
  createResponseBox,
  createSummaryBox,
  createThinkingText,
  createErrorBox,
  createTrustDialog,
  getVisualWidth,
  STYLE
};