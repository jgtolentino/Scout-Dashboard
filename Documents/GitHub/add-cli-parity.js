#!/usr/bin/env node
// Script to add CLI parity features to pulser_cli_consolidated.js

const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths
const cliPath = path.join(os.homedir(), '.pulser/bin/pulser_cli_consolidated.js');
const historyPath = path.join(os.homedir(), '.pulser/history/pulser_history.jsonl');

// Read current CLI file
let cliContent = fs.readFileSync(cliPath, 'utf8');

// Add history and clear command handlers
const commandHandlers = `
  // History command - show last 20 prompts
  if (userInput === ':history' || userInput === 'history') {
    try {
      const historyFile = path.join(os.homedir(), '.pulser/history/pulser_history.jsonl');
      if (fs.existsSync(historyFile)) {
        const lines = fs.readFileSync(historyFile, 'utf8').trim().split('\\n');
        const last20 = lines.slice(-20);
        console.log(chalk.cyan('\\n📜 Recent History:\\n'));
        last20.forEach((line, i) => {
          try {
            const entry = JSON.parse(line);
            console.log(chalk.gray(\`\${i + 1}. [\${new Date(entry.timestamp).toLocaleTimeString()}]\`) + ' ' + entry.prompt.substring(0, 60) + '...');
          } catch (e) {
            // Skip malformed lines
          }
        });
        console.log('');
      } else {
        console.log(chalk.yellow('No history found yet.'));
      }
    } catch (error) {
      console.log(chalk.red('Error reading history:', error.message));
    }
    return;
  }

  // Clear command - clear screen and history
  if (userInput === ':clear' || userInput === 'clear') {
    console.clear();
    console.log(chalk.green('✨ Cleared screen'));
    
    const clearHistory = await new Promise((resolve) => {
      const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question(chalk.yellow('Clear history too? (y/N): '), (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (clearHistory) {
      try {
        const historyFile = path.join(os.homedir(), '.pulser/history/pulser_history.jsonl');
        fs.writeFileSync(historyFile, '');
        console.log(chalk.green('✨ History cleared'));
      } catch (error) {
        console.log(chalk.red('Error clearing history:', error.message));
      }
    }
    return;
  }

  // Log to history
  const logToHistory = (prompt) => {
    try {
      const historyDir = path.join(os.homedir(), '.pulser/history');
      if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
      }
      
      const entry = {
        timestamp: new Date().toISOString(),
        prompt: prompt,
        model: options.model
      };
      
      fs.appendFileSync(
        path.join(historyDir, 'pulser_history.jsonl'),
        JSON.stringify(entry) + '\\n'
      );
    } catch (error) {
      // Silently fail history logging
    }
  };
`;

// Find where to insert the command handlers
const insertPoint = cliContent.indexOf('// Process the input');
if (insertPoint === -1) {
  console.error('Could not find insertion point in CLI file');
  process.exit(1);
}

// Insert the new code
cliContent = cliContent.slice(0, insertPoint) + commandHandlers + '\n' + cliContent.slice(insertPoint);

// Also add logging after processing user input
const logPoint = cliContent.indexOf('const spinner = ora({');
if (logPoint !== -1) {
  cliContent = cliContent.slice(0, logPoint) + 'logToHistory(userInput);\n\n' + cliContent.slice(logPoint);
}

// Write the updated file
fs.writeFileSync(cliPath, cliContent);

console.log('✅ Added CLI parity features:');
console.log('  • :history command - shows last 20 prompts');
console.log('  • :clear command - clears screen and optionally history');
console.log('  • Automatic history logging to ~/.pulser/history/pulser_history.jsonl');