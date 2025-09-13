#!/usr/bin/env node

/**
 * Pulser CLI - Real implementation with API integration
 * Combines paste detection, spinner animations, model switching, and API connectivity
 */

import PulserInputHandler from './pulser_input_handler.js';
import PulserApiConnector from './pulser_api_connector.js';
import chalk from 'chalk';
import boxen from 'boxen';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import { generateDemoResponse } from './pulser_demo_mode.js';

// In ESM, __dirname is not available, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  version: '2.1.0',
  historyFile: `${process.env.HOME}/.pulser/history/history.json`,
  configDir: `${process.env.HOME}/.pulser/config`,
  tempDir: `${process.env.HOME}/.pulser/temp`,
  promptSymbol: '➤ ',
  defaultProvider: 'anthropic',
  defaultModel: 'opus-20240229'
};

// Spinner frames for loading animation
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Process command line arguments
function processArgs() {
  const args = process.argv.slice(2);
  const options = {
    prompt: null,
    singleShot: false,
    help: false,
    version: false,
    provider: process.env.PULSER_DEFAULT_PROVIDER || config.defaultProvider,
    model: process.env.PULSER_DEFAULT_MODEL || config.defaultModel,
    thinking: process.env.PULSER_SHOW_THINKING === '1',
    debug: process.env.PULSER_DEBUG === '1',
    minimal: process.env.PULSER_MINIMAL_UI === '1',
    demo: process.env.PULSER_DEMO_MODE === '1'
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--version':
      case '-v':
        options.version = true;
        break;
      case '--provider':
        options.provider = args[++i];
        break;
      case '--model':
        options.model = args[++i];
        break;
      case '--thinking':
        options.thinking = true;
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--minimal':
        options.minimal = true;
        break;
      case '--demo':
        options.demo = true;
        break;
      case '-p':
      case '--prompt':
        options.prompt = args[++i];
        options.singleShot = true;
        break;
      default:
        if (!args[i].startsWith('-') && !options.prompt) {
          options.prompt = args[i];
          options.singleShot = true;
        }
        break;
    }
  }
  
  return options;
}

// Print the banner
function printBanner(minimal = false) {
  if (minimal) {
    console.log(chalk.cyan(`Pulser CLI v${config.version}`));
    return;
  }

  console.clear();
  console.log(chalk.cyan(`
   ___         __                  ___   __    ____
  / _ \\ __ __ / /  ___ ___  ____  / _ \\ / /   /  _/
 / ___// // // _ \\(_-</ -_)/ __/ / // // /__ _/ /  
/_/    \\_,_//_.__//___/\\__//_/   /____//____//___/  
                                                  
  CLI Version ${config.version}
`));
}

// Show help message
function showHelp() {
  console.log(`
${chalk.bold(chalk.cyan('Pulser CLI'))} v${config.version}

${chalk.yellow('Usage:')}
  pulser [options] [prompt]

${chalk.yellow('Options:')}
  -v, --version           Show version
  -h, --help              Show this help
  --provider <provider>   Set provider: anthropic, openai, deepseek (default: ${config.defaultProvider})
  --model <model>         Set model to use (default: ${config.defaultModel})
  --thinking              Enable thinking mode
  --debug                 Enable debug mode
  --minimal               Use minimal UI
  --demo                  Run in demo mode (no API keys needed)
  -p, --prompt <text>     Run with single prompt and exit
  
${chalk.yellow('Environment Variables:')}
  PULSER_SHOW_THINKING    Set to 1 to enable thinking mode
  PULSER_DEBUG            Set to 1 to enable debug output
  PULSER_MINIMAL_UI       Set to 1 for minimal UI
  PULSER_DEMO_MODE        Set to 1 to enable demo mode
  ANTHROPIC_API_KEY       Set your Anthropic API key
  OPENAI_API_KEY          Set your OpenAI API key

${chalk.yellow('Examples:')}
  pulser "What is the capital of France?"
  pulser --provider openai --model gpt-4o "Write a haiku about coding"
  pulser --thinking
  pulser --demo "Show me a code example"
  `);
}

// Show interactive help
function showInteractiveHelp() {
  console.log(chalk.yellow('\nAvailable Commands:'));
  console.log('/exit or /quit - Exit the CLI');
  console.log('/help - Show this help message');
  console.log('/clear - Clear the screen');
  console.log('/version - Show version information');
  console.log('/reset - Reset the conversation');
  console.log('/thinking - Toggle thinking mode');
  console.log('/tools - List available tools');
  console.log('/trust - Trust current directory');
  console.log('/anthropic - Switch to Anthropic API');
  console.log('/openai - Switch to OpenAI API');
  console.log('/local - Switch to local LLM');
  console.log('/demo - Toggle demo mode (no API keys needed)');
}

// Process slash commands
function processSlashCommand(command, fullInput, options) {
  const parts = fullInput.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  switch (cmd) {
    case '/help':
      showInteractiveHelp();
      break;
    case '/clear':
      console.clear();
      printBanner(options.minimal);
      break;
    case '/version':
      console.log(chalk.cyan(`Pulser CLI v${config.version}`));
      break;
    case '/exit':
    case '/quit':
      console.log(chalk.yellow('Goodbye!'));
      process.exit(0);
      break;
    case '/reset':
      console.log(chalk.cyan('Resetting conversation...'));
      // In a real implementation, this would reset conversation state
      break;
    case '/thinking':
      options.thinking = !options.thinking;
      console.log(`${chalk.cyan('Thinking mode:')} ${options.thinking ? chalk.green('ON') : chalk.red('OFF')}`);
      break;
    case '/tools':
      showTools();
      break;
    case '/trust':
      trustCurrentDirectory();
      break;
    case '/anthropic':
      console.log(chalk.green('Provider set to Anthropic API'));
      options.provider = 'anthropic';
      break;
    case '/openai':
      console.log(chalk.green('Provider set to OpenAI API'));
      options.provider = 'openai';
      break;
    case '/local':
      console.log(chalk.green('Provider set to local LLM via Ollama'));
      options.provider = 'deepseek';
      break;
    case '/demo':
      options.demo = !options.demo;
      console.log(`${chalk.cyan('Demo mode:')} ${options.demo ? chalk.green('ON') : chalk.red('OFF')}`);
      break;
    default:
      console.log(chalk.red(`Unknown command: ${cmd}. Type /help for a list of commands.`));
      break;
  }
}

// Trust the current directory
function trustCurrentDirectory() {
  const currentDir = process.cwd();
  const trustFile = `${process.env.HOME}/.pulser/trusted_folders`;
  
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(trustFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Append current directory to trust file
    fs.appendFileSync(trustFile, `${currentDir}\n`);
    console.log(chalk.green(`Folder trusted: ${currentDir}`));
  } catch (error) {
    console.error(chalk.red(`Error trusting folder: ${error.message}`));
  }
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

// Process a single command
async function processCommand(command, options) {
  if (!command.trim()) return;

  // Show thinking mode if enabled
  if (options.thinking) {
    console.log(chalk.dim('Thinking...'));
    console.log(chalk.dim(`- Processing command: ${command}`));
    console.log(chalk.dim(`- Using provider: ${options.provider}`));
    console.log(chalk.dim(`- Using model: ${options.model}`));
    if (options.demo) {
      console.log(chalk.dim(`- Running in demo mode`));
    }
  }

  // Show spinner
  const spinner = ora({
    text: `Processing with ${options.provider}...`,
    spinner: {
      frames: spinnerFrames
    },
    color: 'green'
  }).start();

  // For demo mode, simulate a response without API call
  if (options.demo) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Stop spinner
    spinner.stop();

    // Generate a demo response based on the input
    const demoResponse = generateDemoResponse(command, options);

    // Output response
    console.log(`\n${demoResponse}\n`);

    // Add completion summary
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`${chalk.gray('✓ Completed with ')}${chalk.blue(options.provider)}${chalk.gray(' using ')}${chalk.blue(options.model)} ${chalk.yellow('(DEMO MODE)')}`);
    console.log(`${chalk.gray('✓ Tokens: ')}${chalk.blue('~500')} (150 prompt, 350 completion)`);
    console.log(`${chalk.gray('✓ Time: ')}${chalk.blue(new Date().toLocaleTimeString())}`);
    console.log(chalk.gray('─'.repeat(50)));
    return;
  }

  // For real API mode
  try {
    // Create API connector
    const apiConnector = new PulserApiConnector({
      provider: options.provider,
      model: options.model,
      thinking: options.thinking,
      debug: options.debug
    });

    // Make actual API call
    const response = await apiConnector.generateResponse(command);

    // Stop spinner
    spinner.stop();

    // Output response
    console.log(`\n${response.text}\n`);

    // Add completion summary
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`${chalk.gray('✓ Completed with ')}${chalk.blue(options.provider)}${chalk.gray(' using ')}${chalk.blue(response.model)}`);
    console.log(`${chalk.gray('✓ Tokens: ')}${chalk.blue(response.tokens.total)} (${response.tokens.prompt} prompt, ${response.tokens.completion} completion)`);
    console.log(`${chalk.gray('✓ Time: ')}${chalk.blue(new Date().toLocaleTimeString())}`);
    console.log(chalk.gray('─'.repeat(50)));
  } catch (error) {
    // Stop spinner on error
    spinner.stop();

    // Show error
    console.error(chalk.red(`\nError: ${error.message}\n`));

    if (error.message.includes('API key')) {
      console.log(chalk.yellow(`To set your API key, use one of the following methods:`));
      console.log(`1. Set the ${chalk.green(options.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY')} environment variable`);
      console.log(`2. Create a file at ${chalk.green(`~/.${options.provider}/api_key`)} containing your API key`);
      console.log(`3. Create a file at ${chalk.green('~/.pulser/config/api_keys.json')} with the format:`);
      console.log(`   { "${options.provider}": "your_api_key_here" }`);
      console.log(`\n${chalk.green('TIP:')} Run with --demo to test the CLI without API keys: ${chalk.blue('pulser --demo')}`);
    }

    if (error.message.includes('Is Ollama running')) {
      console.log(chalk.yellow(`To use local models, make sure Ollama is installed and running:`));
      console.log(`1. Install Ollama from ${chalk.green('https://ollama.ai')}`);
      console.log(`2. Run ${chalk.green('ollama run llama2')} or another model of your choice`);
    }
  }
}

// Handle multi-line input or pasted content
function handleMultilineInput(lines, rawInput, formattedContent, options) {
  console.log(chalk.cyan('How would you like to process this content?'));
  console.log(`${chalk.yellow('1.')} Execute as a single command`);
  console.log(`${chalk.yellow('2.')} Execute each line as a separate command`);
  console.log(`${chalk.yellow('3.')} Store as a file`);
  console.log(`${chalk.yellow('4.')} Cancel`);
  
  // Store the lines for later processing
  process.stdin.once('keypress', async (str, key) => {
    console.log(); // New line
    
    if (str === '1') {
      console.log(chalk.green('Executing as a single command...'));
      await processCommand(rawInput, options);
    } else if (str === '2') {
      console.log(chalk.green(`Executing ${lines.length} commands sequentially:`));
      
      // Process each line with a delay
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim()) {
          console.log(chalk.cyan(`\n[${i + 1}/${lines.length}] Executing: ${line}`));
          await processCommand(line, options);
          // Small delay between commands
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
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
    // Create directory if it doesn't exist
    if (!fs.existsSync(config.tempDir)) {
      fs.mkdirSync(config.tempDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, content);
    console.log(chalk.green(`Content saved to: ${filepath}`));
  } catch (error) {
    console.error(chalk.red(`Error saving file: ${error.message}`));
  }
}

// Check if API keys are configured
function checkApiKeys() {
  const apiConnector = new PulserApiConnector({
    provider: 'anthropic',
    debug: false
  });
  
  const anthropicKey = apiConnector.getApiKey('anthropic');
  const openaiKey = apiConnector.getApiKey('openai');
  
  if (!anthropicKey && !openaiKey) {
    console.log(chalk.yellow('No API keys found for Anthropic or OpenAI.'));
    console.log('To set up API keys, use one of these methods:');
    console.log(`1. Set ${chalk.green('ANTHROPIC_API_KEY')} or ${chalk.green('OPENAI_API_KEY')} environment variables`);
    console.log(`2. Create ${chalk.green('~/.anthropic/api_key')} or ${chalk.green('~/.openai/api_key')} files`);
    console.log(`3. Create ${chalk.green('~/.pulser/config/api_keys.json')} with API keys\n`);
    return false;
  }
  
  return true;
}

// Main function
async function main() {
  // Process command line arguments
  const options = processArgs();
  
  // Handle simple flags
  if (options.version) {
    console.log(config.version);
    process.exit(0);
  }
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  // Check for API keys
  checkApiKeys();
  
  // Handle single-shot mode
  if (options.singleShot && options.prompt) {
    await processCommand(options.prompt, options);
    process.exit(0);
  }
  
  // Interactive mode
  printBanner(options.minimal);
  console.log(`Provider: ${chalk.green(options.provider)} | Model: ${chalk.green(options.model)}\n`);
  
  // Create input handler
  const inputHandler = new PulserInputHandler({
    promptSymbol: config.promptSymbol,
    historyFile: config.historyFile,
    onCommand: (input) => processCommand(input, options),
    onMultiline: (lines, rawInput, formattedContent) => handleMultilineInput(lines, rawInput, formattedContent, options),
    onSlashCommand: (command, fullInput) => processSlashCommand(command, fullInput, options)
  });
  
  // Handle exit
  process.on('SIGINT', () => {
    inputHandler.cleanup();
    console.log('\n🙏 Thank you for using Pulser CLI!');
    process.exit(0);
  });
}

// Start the application
main().catch(error => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});