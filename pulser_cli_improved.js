#!/usr/bin/env node

/**
 * Pulser CLI - Claude Code-style experience
 * Enhanced shell with advanced input handling, paste detection, and command processing
 */

import PulserInputHandler from './pulser_input_handler.js';
import chalk from 'chalk';
import boxen from 'boxen';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';

// In ESM, __dirname is not available, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  version: '2.0.1',
  historyFile: `${process.env.HOME}/.claude-pulser/history/history.json`,
  configDir: `${process.env.HOME}/.claude-pulser/config`,
  tempDir: `${process.env.HOME}/.claude-pulser/temp`,
  promptSymbol: '➤ '
};

// Ensure directories exist
[
  path.dirname(config.historyFile),
  config.configDir,
  config.tempDir
].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Print the banner
function printBanner() {
  console.clear();
  console.log(chalk.cyan(`
  _____ _                _        _____          _      
 / ____| |              | |      / ____|        | |     
| |    | | __ _ _   _  __| | ___| |     ___   __| | ___ 
| |    | |/ _\` | | | |/ _\` |/ _ \\ |    / _ \\ / _\` |/ _ \\
| |____| | (_| | |_| | (_| |  __/ |___| (_) | (_| |  __/
 \\_____|_|\\__,_|\\__,_|\\__,_|\\___|\_____\\___/ \\__,_|\\___|
                                                        
  CLI Version ${config.version}
`));
}

// Process slash commands
function processSlashCommand(command, fullInput) {
  const parts = fullInput.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  switch (cmd) {
    case '/help':
      showHelp();
      break;
    case '/clear':
      console.clear();
      break;
    case '/version':
      console.log(chalk.cyan(`Pulser CLI Version: ${config.version}`));
      break;
    case '/tools':
      showTools();
      break;
    case '/exit':
      console.log(chalk.cyan('Exiting Pulser CLI...'));
      process.exit(0);
      break;
    case '/reset':
      console.log(chalk.cyan('Resetting conversation...'));
      // In a real implementation, this would reset the conversation state
      break;
    case '/thinking':
      toggleThinking();
      break;
    case '/trust':
      trustCurrentDirectory();
      break;
    default:
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log(`Type ${chalk.yellow('/help')} for available commands`);
  }
}

// Show help message
function showHelp() {
  const helpContent = `
${chalk.bold('Available Commands:')}

  ${chalk.yellow('/help')}         - Display this help message
  ${chalk.yellow('/clear')}        - Clear the terminal screen
  ${chalk.yellow('/version')}      - Show the Pulser CLI version
  ${chalk.yellow('/tools')}        - List available tools
  ${chalk.yellow('/exit')}         - Exit the Pulser CLI
  ${chalk.yellow('/reset')}        - Reset the current conversation
  ${chalk.yellow('/thinking')}     - Toggle thinking mode
  ${chalk.yellow('/trust')}        - Trust current directory

${chalk.bold('Keyboard Shortcuts:')}

  ${chalk.yellow('Ctrl+C')}        - Exit the application
  ${chalk.yellow('Ctrl+D')}        - Submit multi-line input
  ${chalk.yellow('Ctrl+L')}        - Clear the screen
  ${chalk.yellow('Up/Down')}       - Navigate through command history
`;

  const box = boxen(helpContent, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'blue',
    title: 'Pulser CLI Help',
    titleAlignment: 'center'
  });
  
  console.log(box);
}

// Show available tools
function showTools() {
  const toolsContent = `
${chalk.bold('Available Tools:')}

  ${chalk.yellow('Bash')}          - Execute shell commands
  ${chalk.yellow('Glob')}          - Find files matching a pattern
  ${chalk.yellow('Grep')}          - Search file contents
  ${chalk.yellow('LS')}            - List directory contents
  ${chalk.yellow('Read')}          - Read file contents
  ${chalk.yellow('Write')}         - Write content to a file
  ${chalk.yellow('Edit')}          - Edit file contents
  ${chalk.yellow('MultiEdit')}     - Make multiple edits to a file
  ${chalk.yellow('Task')}          - Launch a new agent for tasks
`;

  const box = boxen(toolsContent, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green',
    title: 'Pulser CLI Tools',
    titleAlignment: 'center'
  });
  
  console.log(box);
}

// Toggle thinking mode
function toggleThinking() {
  const thinkingMode = process.env.PULSER_SHOW_THINKING === '1';
  process.env.PULSER_SHOW_THINKING = thinkingMode ? '0' : '1';
  console.log(`${chalk.cyan('Thinking mode:')} ${thinkingMode ? chalk.red('OFF') : chalk.green('ON')}`);
}

// Trust the current directory
function trustCurrentDirectory() {
  const currentDir = process.cwd();
  const trustFile = `${process.env.HOME}/.rap_trusted_folders`;
  
  try {
    fs.appendFileSync(trustFile, `${currentDir}\n`);
    console.log(chalk.green(`Folder trusted: ${currentDir}`));
  } catch (error) {
    console.error(chalk.red(`Error trusting folder: ${error.message}`));
  }
}

// Process a single command
function processCommand(command) {
  if (!command.trim()) return;
  
  console.log(chalk.dim(`Processing command: ${command}`));
  
  // Simulate command processing with spinner
  const spinner = ora({
    text: 'Processing...',
    color: 'yellow'
  }).start();
  
  setTimeout(() => {
    spinner.succeed('Command completed successfully');
    
    // Show a sample output
    console.log(`${chalk.dim('L')} Sample command output line 1`);
    console.log(`${chalk.dim('L')} Sample command output line 2`);
  }, 2000);
}

// Handle multi-line input or pasted content
function handleMultilineInput(lines, rawInput, formattedContent) {
  console.log(chalk.cyan('How would you like to process this content?'));
  console.log(`${chalk.yellow('1.')} Execute as a single command`);
  console.log(`${chalk.yellow('2.')} Execute each line as a separate command`);
  console.log(`${chalk.yellow('3.')} Store as a file`);
  console.log(`${chalk.yellow('4.')} Cancel`);
  
  // Store the lines for later processing
  process.stdin.once('keypress', (str, key) => {
    console.log(); // New line
    
    if (str === '1') {
      console.log(chalk.green('Executing as a single command...'));
      processCommand(rawInput);
    } else if (str === '2') {
      console.log(chalk.green(`Executing ${lines.length} commands sequentially:`));
      
      // Process each line with a delay
      lines.forEach((line, index) => {
        if (line.trim()) {
          setTimeout(() => {
            console.log(chalk.cyan(`\n[${index + 1}/${lines.length}] Executing: ${line}`));
            processCommand(line);
          }, index * 3000);
        }
      });
    } else if (str === '3') {
      storePastedContentAsFile(rawInput);
    } else {
      console.log(chalk.yellow('Operation cancelled.'));
    }
  });
}

// Store pasted content as a file
function storePastedContentAsFile(content) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `pasted_content_${timestamp}.txt`;
  const filepath = path.join(config.tempDir, filename);
  
  try {
    fs.writeFileSync(filepath, content);
    console.log(chalk.green(`Content saved to: ${filepath}`));
  } catch (error) {
    console.error(chalk.red(`Error saving file: ${error.message}`));
  }
}

// Main function
function main() {
  printBanner();
  
  // Create the input handler
  const inputHandler = new PulserInputHandler({
    promptSymbol: config.promptSymbol,
    historyFile: config.historyFile,
    onCommand: processCommand,
    onMultiline: handleMultilineInput,
    onSlashCommand: processSlashCommand
  });
  
  // Handle exit
  process.on('SIGINT', () => {
    inputHandler.cleanup();
    console.log('\n🙏 Thank you for using Pulser CLI!');
    process.exit(0);
  });
}

// Start the application
main();