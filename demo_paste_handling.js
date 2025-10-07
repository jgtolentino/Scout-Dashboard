#!/usr/bin/env node

/**
 * Claude Code CLI - Paste Handling Demo
 * This script demonstrates the advanced paste detection and handling
 */

import readline from 'readline';
import chalk from 'chalk';
import boxen from 'boxen';

// Simulated PulserInputHandler for demo purposes
class DemoPasteHandler {
  constructor() {
    this.setupDemo();
  }
  
  setupDemo() {
    console.clear();
    console.log(chalk.cyan(`
  _____ _                _        _____          _      
 / ____| |              | |      / ____|        | |     
| |    | | __ _ _   _  __| | ___| |     ___   __| | ___ 
| |    | |/ _\` | | | |/ _\` |/ _ \\ |    / _ \\ / _\` |/ _ \\
| |____| | (_| | |_| | (_| |  __/ |___| (_) | (_| |  __/
 \\_____|_|\\__,_|\\__,_|\\__,_|\\___|\_____\\___/ \\__,_|\\___|
                                                        
  Advanced Paste Handling Demo
`));

    console.log(chalk.yellow("This demo showcases the improved paste detection and handling features.\n"));
    
    // Start with SQL connection string demo
    this.demoSqlConnectionString();
  }
  
  // Demo SQL connection string paste detection
  demoSqlConnectionString() {
    console.log(chalk.green("DEMO #1: SQL Connection String Handling"));
    console.log(chalk.yellow("SQL connection strings often contain sensitive information like passwords."));
    console.log(chalk.yellow("The improved CLI detects and masks this information automatically.\n"));
    
    // Simulate paste after delay
    console.log(chalk.magenta("Simulating paste of a SQL connection string..."));
    
    setTimeout(() => {
      // The pasted "SQL connection string"
      const pastedSql = `SQL_CONN_STR = (
    "Driver=/opt/homebrew/lib/libmsodbcsql.17.dylib;"
    "Server=sqlkayprojectscoutserver.database.windows.net;"
    "Database=SQL-TBWA-ProjectScout-Reporting;"
    "Uid=TBWA;"
    "Pwd=R@nd0mPA$2025!;"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
    "Connection Timeout=30;"
)`;

      // Show paste detection
      console.log(chalk.green("➤ ") + pastedSql + chalk.yellow(" (Pasting...)"));
      console.log(); // New line after input
      
      console.log(chalk.yellow("Detected pasted content:"));
      
      // Format the SQL connection string with masked password
      const formattedSql = pastedSql
        .replace(/^(\s*"Pwd=)([^;]+)(;")$/gm, '$1' + chalk.red('********') + '$3')
        .replace(/^(\s*"Server=)([^;]+)(;")$/gm, '$1' + chalk.green('$2') + '$3')
        .replace(/^(\s*"Database=)([^;]+)(;")$/gm, '$1' + chalk.green('$2') + '$3')
        .replace(/^(\s*"Uid=)([^;]+)(;")$/gm, '$1' + chalk.green('$2') + '$3');
      
      // Show the formatted content in a box
      const sqlBox = boxen(formattedSql, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        title: 'SQL Connection String',
        titleAlignment: 'center'
      });
      
      console.log(sqlBox);
      
      // Show options
      console.log(chalk.cyan('How would you like to process this content?'));
      console.log(`${chalk.yellow('1.')} Execute as a single command`);
      console.log(`${chalk.yellow('2.')} Execute each line as a separate command`);
      console.log(`${chalk.yellow('3.')} Store as a secure file`);
      console.log(`${chalk.yellow('4.')} Cancel`);
      
      // Continue to code block demo after delay
      setTimeout(() => {
        console.log(chalk.green("\nSelected option: 3. Store as a secure file"));
        console.log(chalk.green("Content saved to: ~/.claude-pulser/temp/sql_connection_20250510.txt"));
        console.log(chalk.yellow("Sensitive information has been masked in the stored file.\n"));
        
        // Move to next demo
        this.demoCodeBlock();
      }, 3000);
    }, 2000);
  }
  
  // Demo code block paste detection
  demoCodeBlock() {
    console.log(chalk.green("\n\nDEMO #2: Code Block Detection"));
    console.log(chalk.yellow("The improved CLI can identify and format various types of code blocks."));
    console.log(chalk.yellow("This makes it easier to review and execute pasted code.\n"));
    
    // Simulate paste after delay
    console.log(chalk.magenta("Simulating paste of a Python code block..."));
    
    setTimeout(() => {
      // The pasted "Python code"
      const pastedCode = `def analyze_data(filename, columns=None):
    """
    Analyze data from a CSV file and return summary statistics.
    
    Args:
        filename (str): Path to the CSV file
        columns (list, optional): List of columns to analyze. Defaults to None.
    
    Returns:
        dict: Statistical summary of the data
    """
    import pandas as pd
    import numpy as np
    
    # Load the data
    data = pd.read_csv(filename)
    
    # Select columns if specified
    if columns:
        data = data[columns]
    
    # Calculate statistics
    stats = {
        'mean': data.mean().to_dict(),
        'median': data.median().to_dict(),
        'std': data.std().to_dict(),
        'min': data.min().to_dict(),
        'max': data.max().to_dict()
    }
    
    return stats`;

      // Show paste detection
      console.log(chalk.green("➤ ") + pastedCode.split('\n')[0] + "..." + chalk.yellow(" (Pasting...)"));
      console.log(); // New line after input
      
      console.log(chalk.yellow("Detected pasted code block:"));
      
      // Format the code with syntax highlighting
      const formattedCode = pastedCode
        .replace(/def\s+(\w+)/g, `${chalk.blue('def')} ${chalk.green('$1')}`)
        .replace(/import\s+(\w+)/g, `${chalk.blue('import')} ${chalk.green('$1')}`)
        .replace(/if\s+/g, `${chalk.blue('if')} `)
        .replace(/return\s+/g, `${chalk.blue('return')} `)
        .replace(/"([^"]*)"/g, `"${chalk.yellow('$1')}"`)
        .replace(/'([^']*)'/g, `'${chalk.yellow('$1')}'`)
        .replace(/(\w+)\(/g, `${chalk.cyan('$1')}(`);
      
      // Show the formatted content in a box
      const codeBox = boxen(formattedCode, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue',
        title: 'Python Code Block',
        titleAlignment: 'center'
      });
      
      console.log(codeBox);
      
      // Show options
      console.log(chalk.cyan('How would you like to process this code?'));
      console.log(`${chalk.yellow('1.')} Execute the code`);
      console.log(`${chalk.yellow('2.')} Save as a Python file`);
      console.log(`${chalk.yellow('3.')} Analyze the code structure`);
      console.log(`${chalk.yellow('4.')} Cancel`);
      
      // Continue to bash script demo after delay
      setTimeout(() => {
        console.log(chalk.green("\nSelected option: 2. Save as a Python file"));
        console.log(chalk.green("Code saved to: ~/analyze_data.py"));
        
        // Move to next demo
        this.demoBashScript();
      }, 3000);
    }, 2000);
  }
  
  // Demo bash script paste detection
  demoBashScript() {
    console.log(chalk.green("\n\nDEMO #3: Bash Script Detection"));
    console.log(chalk.yellow("When pasting Bash scripts, the CLI offers additional execution options."));
    console.log(chalk.yellow("This includes executing the entire script or running commands one by one.\n"));
    
    // Simulate paste after delay
    console.log(chalk.magenta("Simulating paste of a Bash script..."));
    
    setTimeout(() => {
      // The pasted "Bash script"
      const pastedBash = `#!/bin/bash
# Setup script for Project Scout environment

# Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Aborting."
    exit 1
fi

# Create project directories
echo "Creating project directories..."
mkdir -p ~/ProjectScout/{data,models,reports,logs}

# Install required Python packages
echo "Installing Python dependencies..."
pip3 install pandas numpy matplotlib scikit-learn tensorflow

# Download initial dataset
echo "Downloading sample dataset..."
curl -o ~/ProjectScout/data/sample.csv https://example.com/sample_data.csv

# Set up environment variables
echo "export PROJECT_SCOUT_HOME=~/ProjectScout" >> ~/.bashrc
echo "export PYTHONPATH=$PYTHONPATH:~/ProjectScout" >> ~/.bashrc

echo "Setup complete! Please restart your terminal session."`;

      // Show paste detection
      console.log(chalk.green("➤ ") + pastedBash.split('\n')[0] + "..." + chalk.yellow(" (Pasting...)"));
      console.log(); // New line after input
      
      console.log(chalk.yellow("Detected pasted Bash script:"));
      
      // Format the bash script with syntax highlighting
      const formattedBash = pastedBash
        .replace(/^(#!\/bin\/bash)/gm, chalk.green('$1'))
        .replace(/^(#.*)$/gm, chalk.gray('$1'))
        .replace(/\b(if|then|fi|else|elif|for|do|done|while|case|esac)\b/g, chalk.blue('$1'))
        .replace(/\b(echo|exit|mkdir|pip3|curl|export)\b/g, chalk.cyan('$1'))
        .replace(/("[^"]*")/g, chalk.yellow('$1'));
      
      // Show the formatted content in a box
      const bashBox = boxen(formattedBash, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
        title: 'Bash Script',
        titleAlignment: 'center'
      });
      
      console.log(bashBox);
      
      // Show warning for potentially dangerous commands
      console.log(chalk.red('⚠️  Warning: This script modifies your ~/.bashrc and installs packages.'));
      
      // Show options with security warning
      console.log(chalk.cyan('How would you like to process this script?'));
      console.log(`${chalk.yellow('1.')} Execute the entire script`);
      console.log(`${chalk.yellow('2.')} Execute each command interactively`);
      console.log(`${chalk.yellow('3.')} Save as a file without executing`);
      console.log(`${chalk.yellow('4.')} Cancel`);
      
      // Conclude demo after delay
      setTimeout(() => {
        console.log(chalk.green("\nSelected option: 3. Save as a file without executing"));
        console.log(chalk.green("Script saved to: ~/setup_project_scout.sh"));
        console.log(chalk.green("File permissions set to executable."));
        
        // Finish demo
        this.concludeDemo();
      }, 3000);
    }, 2000);
  }
  
  // Conclude the demo
  concludeDemo() {
    console.log(chalk.green("\n\nDEMO COMPLETE"));
    console.log(chalk.yellow("The improved Claude Code CLI provides:"));
    console.log("  • " + chalk.cyan("Intelligent paste detection"));
    console.log("  • " + chalk.cyan("Content-aware formatting and syntax highlighting"));
    console.log("  • " + chalk.cyan("Security features for sensitive information"));
    console.log("  • " + chalk.cyan("Multiple processing options for pasted content"));
    
    console.log(chalk.green("\nTo install the improved CLI:"));
    console.log(chalk.white("  chmod +x install_improved_cli.sh"));
    console.log(chalk.white("  ./install_improved_cli.sh"));
    
    console.log(chalk.green("\nTo use the CLI after installation:"));
    console.log(chalk.white("  clode"));
    
    console.log(chalk.yellow("\nPress Ctrl+C to exit the demo"));
  }
}

// Run the demo
new DemoPasteHandler();