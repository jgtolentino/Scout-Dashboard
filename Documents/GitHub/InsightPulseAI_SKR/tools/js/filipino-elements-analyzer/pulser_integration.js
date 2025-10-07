/**
 * Pulser CLI Integration for Filipino Elements Analyzer
 * 
 * This script provides integration with the Pulser CLI system
 * for analyzing Filipino cultural elements in advertising campaigns.
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const PULSER_HOME = process.env.PULSER_HOME || '/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR';
const PULSER_ALIASES_PATH = path.join(PULSER_HOME, 'pulser_aliases.sh');
const INTEGRATION_ALIAS = ':analyze-filipino';

// Command to add to pulser_aliases.sh
const ALIAS_COMMAND = `
# Filipino Elements Analyzer integration
alias ${INTEGRATION_ALIAS}="${path.join(__dirname, 'analyze_filipino_elements.js')}"
`;

/**
 * Register the tool with Pulser CLI by adding an alias to pulser_aliases.sh
 */
function registerWithPulserCLI() {
  try {
    if (!fs.existsSync(PULSER_ALIASES_PATH)) {
      console.error(`Error: Pulser aliases file not found at ${PULSER_ALIASES_PATH}`);
      console.error('Please check PULSER_HOME environment variable or file path.');
      return false;
    }

    // Read current aliases
    const currentAliases = fs.readFileSync(PULSER_ALIASES_PATH, 'utf8');

    // Check if our alias is already registered
    if (currentAliases.includes(INTEGRATION_ALIAS)) {
      console.log('Filipino Elements Analyzer is already registered with Pulser CLI.');
      return true;
    }

    // Backup the current aliases file
    const backupPath = `${PULSER_ALIASES_PATH}.bak.${Date.now()}`;
    fs.copyFileSync(PULSER_ALIASES_PATH, backupPath);
    console.log(`Backed up pulser_aliases.sh to ${backupPath}`);

    // Append our alias
    fs.appendFileSync(PULSER_ALIASES_PATH, ALIAS_COMMAND);
    console.log('Added Filipino Elements Analyzer integration to Pulser CLI.');

    // Reload the shell to apply changes
    console.log('\nTo activate the integration, run:');
    console.log('source ~/.zshrc');
    console.log(`\nThen use the tool with: ${INTEGRATION_ALIAS} [command]`);

    return true;
  } catch (error) {
    console.error('Error registering with Pulser CLI:', error.message);
    return false;
  }
}

/**
 * Register the tool as a custom command in the router system
 */
function registerAsCommand() {
  try {
    const commandsDir = path.join(PULSER_HOME, 'tools', 'js', 'router', 'commands');
    
    if (!fs.existsSync(commandsDir)) {
      console.error(`Error: Commands directory not found at ${commandsDir}`);
      return false;
    }

    const commandPath = path.join(commandsDir, 'filipino_elements.js');

    // Check if command already exists
    if (fs.existsSync(commandPath)) {
      console.log('Filipino Elements command is already registered.');
      return true;
    }

    // Create command file
    const commandContent = `/**
 * Filipino Elements Analysis Command
 * 
 * Command handler for analyzing Filipino cultural elements in advertising campaigns.
 */

const path = require('path');
const { execSync } = require('child_process');

const analyzerPath = path.join(__dirname, '..', '..', 'filipino-elements-analyzer', 'analyze_filipino_elements.js');

/**
 * Handle filipino_elements command
 * @param {Object} args - Command arguments
 * @param {Function} callback - Callback function
 */
function handleCommand(args, callback) {
  try {
    // Default to visualize if no subcommand is provided
    const subcommand = args.subcommand || 'visualize';
    
    // Build command
    let command = \`node \${analyzerPath} \${subcommand}\`;
    
    // Add options
    if (args.database) {
      command += \` --database "\${args.database}"\`;
    }
    
    if (args.output) {
      command += \` --output "\${args.output}"\`;
    }
    
    if (args.sort && subcommand === 'correlations') {
      command += \` --sort \${args.sort}\`;
    }
    
    if (args.count && subcommand === 'top-campaigns') {
      command += \` --count \${args.count}\`;
    }
    
    // Execute command
    const result = execSync(command, { encoding: 'utf8' });
    
    // Return result
    callback(null, {
      message: 'Filipino elements analysis completed',
      command: command,
      result: result
    });
  } catch (error) {
    callback(error);
  }
}

// Command definition for export
module.exports = {
  name: 'filipino_elements',
  description: 'Analyze Filipino cultural elements in advertising campaigns',
  usage: 'filipino_elements [subcommand] [options]',
  examples: [
    'filipino_elements visualize',
    'filipino_elements analyze',
    'filipino_elements correlations --sort roi',
    'filipino_elements top-campaigns --count 20'
  ],
  optionsDescription: \`
    Subcommands:
      visualize           Generate visualizations and enhanced report
      analyze             Run basic analysis and generate report
      usage               Show usage of Filipino elements
      correlations        Show correlations with business metrics
      top-campaigns       Show top campaigns by Filipino Index
      chart-usage         Generate Filipino element usage chart
      chart-correlation   Generate correlation heatmap
      chart-distribution  Generate Filipino Index distribution chart
    
    Options:
      --database <path>   Path to SQLite database
      --output <dir>      Output directory for reports
      --sort <metric>     Sort by metric (roi, sales_lift, brand_lift, award_count)
      --count <number>    Number of campaigns to show
  \`,
  handler: handleCommand
};`;

    fs.writeFileSync(commandPath, commandContent);
    console.log(`Created Filipino Elements command at ${commandPath}`);

    // Update command registry
    const registryPath = path.join(PULSER_HOME, 'tools', 'js', 'router', 'command_registry.js');
    
    if (!fs.existsSync(registryPath)) {
      console.error(`Error: Command registry not found at ${registryPath}`);
      return false;
    }

    let registry = fs.readFileSync(registryPath, 'utf8');
    
    // Check if command is already registered
    if (registry.includes("require('./commands/filipino_elements')")) {
      console.log('Command is already registered in command registry.');
      return true;
    }

    // Find the commands array
    const commandsArrayMatch = registry.match(/const commands = \[([\s\S]*?)\];/m);
    
    if (!commandsArrayMatch) {
      console.error('Error: Could not find commands array in registry.');
      return false;
    }

    // Check for the last command to place ours after it
    const lastCommandMatch = commandsArrayMatch[1].match(/(\s+)require\('.\/commands\/[\w_]+'\),?\s*$/m);
    
    if (!lastCommandMatch) {
      console.error('Error: Could not find a good place to insert the command.');
      return false;
    }

    // Get the indentation
    const indent = lastCommandMatch[1];
    
    // Create new command entry
    const newCommandEntry = `${indent}require('./commands/filipino_elements'),\n`;
    
    // Insert after the last command
    const newRegistry = registry.replace(
      /const commands = \[([\s\S]*?)\];/m,
      `const commands = [$1${newCommandEntry}];`
    );

    // Backup the current registry
    const backupRegistryPath = `${registryPath}.bak.${Date.now()}`;
    fs.copyFileSync(registryPath, backupRegistryPath);
    console.log(`Backed up command registry to ${backupRegistryPath}`);

    // Write updated registry
    fs.writeFileSync(registryPath, newRegistry);
    console.log('Updated command registry with Filipino Elements command.');

    return true;
  } catch (error) {
    console.error('Error registering as command:', error.message);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('Filipino Elements Analyzer - Pulser CLI Integration');
  console.log('================================================\n');

  const cliSuccess = registerWithPulserCLI();
  const commandSuccess = registerAsCommand();

  if (cliSuccess && commandSuccess) {
    console.log('\nIntegration complete! You can now use:');
    console.log(`1. ${INTEGRATION_ALIAS} [command] - Direct CLI access`);
    console.log('2. pulser filipino_elements [subcommand] - Through Pulser command router');
    
    console.log('\nExamples:');
    console.log(`${INTEGRATION_ALIAS} visualize`);
    console.log('pulser filipino_elements correlations --sort roi');
  } else {
    console.log('\nIntegration partially complete. Please check the errors above.');
  }
}

// Execute when run directly
if (require.main === module) {
  main();
}

module.exports = {
  registerWithPulserCLI,
  registerAsCommand
};