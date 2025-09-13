#!/usr/bin/env node

/**
 * Snow White CLI - White-Labeling & Rebranding Agent
 * Command-line interface for the Snow White agent
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { program } = require('commander');
const SnowWhiteAgent = require('./snowwhite_agent');

// Initialize Snow White agent
const snowWhite = new SnowWhiteAgent({ 
  verbose: process.env.VERBOSE === 'true' || process.env.DEBUG === 'true'
});

// CLI Configuration
program
  .name('snowwhite')
  .description('Snow White - White-Labeling & Rebranding Agent')
  .version('1.0.0');

// Whitelabel command
program
  .command('whitelabel')
  .description('Apply white-labeling to resources')
  .option('-c, --client <client>', 'Name of the client for customization')
  .option('-s, --source <directory>', 'Source directory', process.cwd())
  .option('-o, --output <directory>', 'Output directory for white-labeled assets', './client-facing')
  .option('-e, --extensions <extensions>', 'File extensions to process (comma-separated)', '.md,.js,.py,.sql,.json,.yaml,.yml,.html')
  .option('--skip <patterns>', 'Patterns to skip (comma-separated)', '.git,node_modules,dist')
  .action((options) => {
    const clientName = options.client || 'CLIENT';
    const sourceDir = options.source;
    const outputDir = options.output;
    const extensions = options.extensions.split(',');
    const skip = options.skip.split(',');
    
    console.log(chalk.blue(`Starting white-labeling process for client: ${clientName}`));
    console.log(chalk.blue(`Source directory: ${sourceDir}`));
    console.log(chalk.blue(`Output directory: ${outputDir}`));
    
    const result = snowWhite.deployToClient(clientName, sourceDir, outputDir, {
      extensions,
      skip
    });
    
    if (result.success) {
      console.log(chalk.green('White-labeling completed successfully'));
    } else {
      console.error(chalk.red('White-labeling completed with errors'));
      process.exit(1);
    }
  });

// Preview white-labeling
program
  .command('preview')
  .description('Preview white-labeled file without deployment')
  .requiredOption('-f, --file <file>', 'File to preview white-labeling changes')
  .action((options) => {
    try {
      const filePath = options.file;
      
      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`File not found: ${filePath}`));
        process.exit(1);
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const whitelabeledContent = snowWhite.applyWhitelabeling(content);
      
      console.log(chalk.blue(`White-labeled preview of ${filePath}:`));
      console.log('-------------------------------------------');
      console.log(whitelabeledContent);
      console.log('-------------------------------------------');
    } catch (error) {
      console.error(chalk.red(`Error previewing file: ${error.message}`));
      process.exit(1);
    }
  });

// Check for internal references
program
  .command('check')
  .description('Check for non-compliant internal references')
  .requiredOption('-d, --directory <directory>', 'Directory to check')
  .action((options) => {
    const directory = options.directory;
    
    if (!fs.existsSync(directory)) {
      console.error(chalk.red(`Directory not found: ${directory}`));
      process.exit(1);
    }
    
    const results = snowWhite.checkForInternalReferences(directory);
    
    if (results.total > 0) {
      process.exit(1); // Exit with error if any internal references found
    }
  });

// Alias map commands
program
  .command('aliasmap')
  .description('Manage white-labeling alias maps')
  .addCommand(
    program.createCommand('show')
      .description('Display current alias map')
      .action(() => {
        console.log(chalk.blue('Current Alias Map:'));
        console.log(JSON.stringify(snowWhite.aliasMap, null, 2));
      })
  )
  .addCommand(
    program.createCommand('edit')
      .description('Edit the alias map')
      .requiredOption('--category <category>', 'Category (agents, terms, etc.)')
      .requiredOption('--internal <internal>', 'Internal name to alias')
      .requiredOption('--replacement <replacement>', 'Client-facing replacement')
      .action((options) => {
        snowWhite.updateAlias(options.category, options.internal, options.replacement);
      })
  )
  .addCommand(
    program.createCommand('import')
      .description('Import alias map from file')
      .requiredOption('-f, --file <file>', 'File containing alias mapping')
      .action((options) => {
        try {
          const filePath = options.file;
          
          if (!fs.existsSync(filePath)) {
            console.error(chalk.red(`File not found: ${filePath}`));
            process.exit(1);
          }
          
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const ext = path.extname(filePath).toLowerCase();
          
          let importedMap;
          if (ext === '.json') {
            importedMap = JSON.parse(fileContent);
          } else if (ext === '.yaml' || ext === '.yml') {
            const yaml = require('js-yaml');
            importedMap = yaml.load(fileContent);
          } else {
            console.error(chalk.red('Unsupported file format. Use JSON or YAML.'));
            process.exit(1);
          }
          
          // Update the alias map
          snowWhite.aliasMap = importedMap;
          snowWhite.saveAliasMap();
          
          console.log(chalk.green('Alias map imported successfully'));
        } catch (error) {
          console.error(chalk.red(`Error importing alias map: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    program.createCommand('export')
      .description('Export current alias map to file')
      .requiredOption('-f, --file <file>', 'Output file for alias map')
      .action((options) => {
        try {
          const filePath = options.file;
          const ext = path.extname(filePath).toLowerCase();
          
          let content;
          if (ext === '.json') {
            content = JSON.stringify(snowWhite.aliasMap, null, 2);
          } else if (ext === '.yaml' || ext === '.yml') {
            const yaml = require('js-yaml');
            content = yaml.dump(snowWhite.aliasMap);
          } else {
            console.error(chalk.red('Unsupported file format. Use JSON or YAML.'));
            process.exit(1);
          }
          
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(chalk.green(`Alias map exported to ${filePath}`));
        } catch (error) {
          console.error(chalk.red(`Error exporting alias map: ${error.message}`));
          process.exit(1);
        }
      })
  );

// Scrub commands
program
  .command('scrub')
  .description('Scrub internal references and metadata')
  .addCommand(
    program.createCommand('insight-metadata')
      .description('Clean metadata from insights')
      .requiredOption('-t, --target <target>', 'Target file or directory to scrub')
      .action((options) => {
        const target = options.target;
        
        if (!fs.existsSync(target)) {
          console.error(chalk.red(`Target not found: ${target}`));
          process.exit(1);
        }
        
        if (fs.statSync(target).isDirectory()) {
          console.log(chalk.blue(`Scrubbing metadata from directory: ${target}`));
          snowWhite.scrubDirectoryMetadata(target);
        } else {
          console.log(chalk.blue(`Scrubbing metadata from file: ${target}`));
          snowWhite.scrubMetadata(target);
        }
        
        console.log(chalk.green('Metadata scrubbing completed'));
      })
  )
  .addCommand(
    program.createCommand('audit-trails')
      .description('Remove internal audit trails')
      .requiredOption('-t, --target <target>', 'Target file or directory to scrub')
      .action((options) => {
        const target = options.target;
        
        if (!fs.existsSync(target)) {
          console.error(chalk.red(`Target not found: ${target}`));
          process.exit(1);
        }
        
        // Implement audit trail scrubbing logic here
        console.log(chalk.blue(`Scrubbing audit trails from: ${target}`));
        
        // For simplicity, reuse the metadata scrubbing function
        if (fs.statSync(target).isDirectory()) {
          snowWhite.scrubDirectoryMetadata(target);
        } else {
          snowWhite.scrubMetadata(target);
        }
        
        console.log(chalk.green('Audit trail scrubbing completed'));
      })
  )
  .addCommand(
    program.createCommand('agent-refs')
      .description('Remove agent references')
      .requiredOption('-t, --target <target>', 'Target file or directory to scrub')
      .action((options) => {
        const target = options.target;
        
        if (!fs.existsSync(target)) {
          console.error(chalk.red(`Target not found: ${target}`));
          process.exit(1);
        }
        
        console.log(chalk.blue(`Removing agent references from: ${target}`));
        
        // Process agent references specifically
        if (fs.statSync(target).isDirectory()) {
          const walkAndScrub = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              
              if (entry.isDirectory()) {
                walkAndScrub(fullPath);
              } else if (entry.isFile()) {
                try {
                  const content = fs.readFileSync(fullPath, 'utf8');
                  
                  // Remove agent references
                  let newContent = content;
                  for (const agent in snowWhite.aliasMap.agents) {
                    const agentRegex = new RegExp(`\\b${agent}\\b`, 'g');
                    newContent = newContent.replace(agentRegex, snowWhite.aliasMap.agents[agent]);
                  }
                  
                  // Remove agent-specific patterns
                  newContent = newContent.replace(/\bAgent:\s*\w+\b/g, '');
                  newContent = newContent.replace(/\bHandled by:\s*\w+\b/g, '');
                  
                  if (newContent !== content) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                  }
                } catch (error) {
                  // Skip files that can't be processed
                }
              }
            }
          };
          
          walkAndScrub(target);
        } else {
          try {
            const content = fs.readFileSync(target, 'utf8');
            
            // Remove agent references
            let newContent = content;
            for (const agent in snowWhite.aliasMap.agents) {
              const agentRegex = new RegExp(`\\b${agent}\\b`, 'g');
              newContent = newContent.replace(agentRegex, snowWhite.aliasMap.agents[agent]);
            }
            
            // Remove agent-specific patterns
            newContent = newContent.replace(/\bAgent:\s*\w+\b/g, '');
            newContent = newContent.replace(/\bHandled by:\s*\w+\b/g, '');
            
            if (newContent !== content) {
              fs.writeFileSync(target, newContent, 'utf8');
            }
          } catch (error) {
            console.error(chalk.red(`Error processing file: ${error.message}`));
          }
        }
        
        console.log(chalk.green('Agent reference removal completed'));
      })
  );

// Parse arguments
program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length === 2) {
  program.help();
}