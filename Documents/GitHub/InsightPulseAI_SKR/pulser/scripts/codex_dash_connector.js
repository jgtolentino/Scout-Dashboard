#!/usr/bin/env node

/**
 * Codex Dash Connector
 * 
 * This script provides a CLI interface for the Codex-Dash integration,
 * allowing dashboard generation, validation, and deployment through
 * the guardrails system.
 */

const fs = require('fs');
const path = require('path');
const { 
  generateDashboard, 
  deployDashboard, 
  validateDashboard,
  registerDashWithCodex
} = require('../utils/codex_dash_integration');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Help menu
if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log(`
Codex Dash Connector - Bridge between Codex and Dash dashboard builder

Usage:
  codex-dash generate --source <path> --requirements <path> [options]
  codex-dash deploy --path <path> --target <target> [options]
  codex-dash validate --path <path>
  codex-dash register

Commands:
  generate      Generate a dashboard using Dash
  deploy        Deploy a generated dashboard
  validate      Validate a dashboard against guardrails
  register      Register Dash with Codex guardrails

Generate Options:
  --source        Path to data source (JSON, CSV, SQL)
  --requirements  Path to requirements markdown file
  --output        Directory to output generated dashboard
  --theme         Dashboard theme (default, power-bi, dark, light)
  --deploy        Deploy the dashboard after generation

Deploy Options:
  --path          Path to dashboard HTML file
  --target        Deployment target (azure, vercel, netlify)
  --environment   Deployment environment (dev, canary, production)

Validate Options:
  --path          Path to dashboard HTML file
  
Examples:
  codex-dash generate --source data.json --requirements requirements.md
  codex-dash deploy --path dashboard.html --target azure --environment canary
  codex-dash validate --path dashboard.html
  codex-dash register
  `);
  process.exit(0);
}

// Parse options
function parseOptions(args) {
  const options = {};
  
  for (let i = 1; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      const option = args[i].substring(2);
      const value = args[i + 1];
      
      if (value === undefined || value.startsWith('--')) {
        // Boolean flag
        options[option] = true;
        i -= 1;
      } else {
        options[option] = value;
      }
    }
  }
  
  return options;
}

// Execute commands
async function main() {
  try {
    const options = parseOptions(args);
    
    switch (command) {
      case 'generate': {
        if (!options.source) {
          console.error('Error: --source option is required');
          process.exit(1);
        }
        
        console.log('Generating dashboard...');
        const result = generateDashboard({
          source: options.source,
          requirements: options.requirements,
          outputDir: options.output,
          theme: options.theme,
          deploy: options.deploy
        });
        
        if (result.success) {
          console.log(`Dashboard generated successfully at: ${result.outputPath}`);
          if (result.logs) {
            console.log('\nGeneration logs:');
            console.log(result.logs);
          }
        } else {
          console.error(`Error generating dashboard: ${result.message}`);
          process.exit(1);
        }
        break;
      }
      
      case 'deploy': {
        if (!options.path) {
          console.error('Error: --path option is required');
          process.exit(1);
        }
        
        console.log('Deploying dashboard...');
        const result = deployDashboard({
          dashboardPath: options.path,
          target: options.target || 'azure',
          environment: options.environment || 'dev'
        });
        
        if (result.success) {
          console.log(`Dashboard deployed successfully`);
          if (result.url) {
            console.log(`Deployment URL: ${result.url}`);
          }
          if (result.logs) {
            console.log('\nDeployment logs:');
            console.log(result.logs);
          }
        } else {
          console.error(`Error deploying dashboard: ${result.message}`);
          process.exit(1);
        }
        break;
      }
      
      case 'validate': {
        if (!options.path) {
          console.error('Error: --path option is required');
          process.exit(1);
        }
        
        console.log('Validating dashboard...');
        const result = validateDashboard(options.path);
        
        if (result.success) {
          console.log('Dashboard validation passed');
          
          // Show suggestions if any
          if (result.details.suggestions.length > 0) {
            console.log('\nSuggestions:');
            result.details.suggestions.forEach(suggestion => {
              console.log(`- ${suggestion}`);
            });
          }
        } else {
          console.error(`Dashboard validation failed: ${result.message}`);
          
          if (result.details && result.details.warnings.length > 0) {
            console.log('\nWarnings:');
            result.details.warnings.forEach(warning => {
              console.log(`- ${warning}`);
            });
          }
          
          process.exit(1);
        }
        break;
      }
      
      case 'register': {
        console.log('Registering Dash with Codex guardrails...');
        const success = registerDashWithCodex();
        
        if (success) {
          console.log('Dash registered successfully with Codex guardrails');
        } else {
          console.error('Failed to register Dash with Codex guardrails');
          process.exit(1);
        }
        break;
      }
      
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Execute main function
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});