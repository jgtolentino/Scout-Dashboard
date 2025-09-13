#!/usr/bin/env node

/**
 * Simple CLI launcher script
 */

const { program } = require('commander');
const chalk = require('chalk');
const { PulserInteractive } = require('./interactive');

// Version and name
program
  .name('pulser')
  .description('Pulser CLI - Terminal interface for AI agents with Claude-style UX')
  .version('0.1.0');

// API mode option
program
  .option('--api', 'Use API mode (default)')
  .option('--local', 'Use local model mode')
  .option('--demo', 'Run in demo mode without actual AI calls')
  .option('--debug', 'Enable debug mode');

// Parse arguments
program.parse(process.argv);
const options = program.opts();

// Determine the mode
const mode = options.local ? 'local' : (options.demo ? 'demo' : 'api');

// Create demo class for testing
class DemoPulserInteractive {
  constructor() {}

  start() {
    console.log(chalk.yellow('Welcome to Pulser CLI preview!'));
    console.log(chalk.gray('Running in DEMO mode - no AI model connected.'));
    console.log();
    console.log(chalk.magenta('╭─────────────────────────────────────────╮'));
    console.log(chalk.yellow('│  Pulser is ready for your input...       │'));
    console.log(chalk.magenta('╰─────────────────────────────────────────╯'));
    console.log();
    console.log(chalk.cyan("Type a message and press Enter. Type '/help' for commands or '/exit' to quit."));
    
    // Create readline interface
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '',
    });
    
    readline.on('line', (line) => {
      const input = line.trim();
      
      if (input === '/exit' || input === '/quit') {
        console.log(chalk.yellow('Exiting Pulser CLI...'));
        process.exit(0);
      } else if (input === '/help') {
        console.log(chalk.cyan('Available commands:'));
        console.log(chalk.cyan('  /help - Show this help message'));
        console.log(chalk.cyan('  /exit, /quit - Exit Pulser CLI'));
        console.log(chalk.cyan('  /clear - Clear the screen'));
      } else if (input === '/clear') {
        console.clear();
      } else if (input) {
        // Simulate thinking
        process.stdout.write(chalk.yellow('⠋ Thinking...'));
        
        setTimeout(() => {
          // Clear the thinking indicator
          process.stdout.write('\r\x1B[K');
          
          // Print response
          console.log();
          console.log(chalk.blue('╭───────────────────────────────────────────────────────────────────────╮'));
          console.log(chalk.white('│ This is a demo response from Pulser CLI.                             │'));
          console.log(chalk.white('│                                                                      │'));
          console.log(chalk.white(`│ You said: "${input}"                                                 │`));
          console.log(chalk.white('│                                                                      │'));
          console.log(chalk.white('│ In a real implementation, this would be a response from DeepSeekr1.  │'));
          console.log(chalk.blue('╰───────────────────────────────────────────────────────────────────────╯'));
          console.log();
          
          // Show prompt again
          console.log(chalk.magenta('╭─────────────────────────────────────────╮'));
          console.log(chalk.yellow('│  Pulser is ready for your input...       │'));
          console.log(chalk.magenta('╰─────────────────────────────────────────╯'));
        }, 1500);
      } else {
        // Show prompt for empty input
        console.log(chalk.magenta('╭─────────────────────────────────────────╮'));
        console.log(chalk.yellow('│  Pulser is ready for your input...       │'));
        console.log(chalk.magenta('╰─────────────────────────────────────────╯'));
      }
    });
  }
}

// Start the CLI
try {
  // For demo, use the simple DemoPulserInteractive
  const interactive = new DemoPulserInteractive();
  interactive.start();
} catch (error) {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
}