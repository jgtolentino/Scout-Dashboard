#!/usr/bin/env node

/**
 * PulseForge CLI
 * AI-powered full-stack app generator from prompt to deploy
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const commander = require('commander');
const inquirer = require('inquirer');
const ora = require('ora');
const boxen = require('boxen');
const { execSync } = require('child_process');

// API client (to be implemented)
const api = require('./lib/api-client');
// Template manager
const templates = require('./lib/templates');
// Stack configuration
const stacks = require('./lib/stacks');
// Deployment helpers
const deployment = require('./lib/deployment');

// Set up CLI program
const program = new commander.Command();

program
  .name('pulseforge')
  .description('AI-powered full-stack app builder from prompt to deploy')
  .version('1.0.0');

// Initialize command
program
  .command('init')
  .description('Initialize PulseForge with your API key')
  .option('--api-key <key>', 'Your PulseForge API key')
  .action(async (options) => {
    let apiKey = options.apiKey;
    
    if (!apiKey) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter your PulseForge API key:',
          validate: input => input.length > 0 ? true : 'API key is required'
        }
      ]);
      apiKey = answers.apiKey;
    }
    
    const spinner = ora('Initializing PulseForge...').start();
    
    try {
      // Validate API key
      await api.validateApiKey(apiKey);
      
      // Save API key to config
      const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.pulseforge');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify({ apiKey }));
      
      spinner.succeed('PulseForge initialized successfully!');
      
      console.log(boxen(
        `${chalk.bold('PulseForge is ready!')}
        
Run ${chalk.cyan('pulseforge create')} to start building your app.`, 
        { padding: 1, borderColor: 'green', margin: 1 }
      ));
    } catch (error) {
      spinner.fail('Failed to initialize PulseForge');
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Create app command
program
  .command('create [prompt]')
  .description('Create a new app from a prompt')
  .option('-i, --interactive', 'Use interactive mode to configure your app')
  .option('-t, --template <template>', 'Use a predefined template')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-s, --stack <stack>', 'Specify tech stack (react-fastapi-postgres, vue-express-mysql, etc.)')
  .option('-d, --deploy', 'Deploy the app after creation')
  .option('--skip-validation', 'Skip code validation')
  .action(async (prompt, options) => {
    try {
      // Load config
      const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.pulseforge', 'config.json');
      if (!fs.existsSync(configPath)) {
        console.error(chalk.red('Error: PulseForge is not initialized. Run "pulseforge init" first.'));
        process.exit(1);
      }
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Interactive mode
      if (options.interactive || !prompt && !options.template) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'prompt',
            message: 'Describe your app:',
            when: !prompt && !options.template,
            validate: input => input.length > 0 ? true : 'Description is required'
          },
          {
            type: 'list',
            name: 'template',
            message: 'Or select a template:',
            when: !prompt && !options.template,
            choices: templates.getTemplatesList().map(t => ({ name: t.name, value: t.id })),
            filter: input => input || undefined
          },
          {
            type: 'list',
            name: 'frontend',
            message: 'Select frontend framework:',
            choices: stacks.getFrontendOptions(),
            default: 'react'
          },
          {
            type: 'list',
            name: 'backend',
            message: 'Select backend framework:',
            choices: stacks.getBackendOptions(),
            default: 'fastapi'
          },
          {
            type: 'list',
            name: 'database',
            message: 'Select database:',
            choices: stacks.getDatabaseOptions(),
            default: 'postgres'
          },
          {
            type: 'confirm',
            name: 'auth',
            message: 'Include authentication?',
            default: true
          },
          {
            type: 'checkbox',
            name: 'features',
            message: 'Select additional features:',
            choices: [
              { name: 'Admin dashboard', value: 'admin' },
              { name: 'API documentation', value: 'api-docs' },
              { name: 'File uploads', value: 'file-uploads' },
              { name: 'Email integration', value: 'email' }
            ]
          },
          {
            type: 'confirm',
            name: 'deploy',
            message: 'Deploy app after creation?',
            default: false
          }
        ]);
        
        // Merge answers into options
        prompt = prompt || answers.prompt;
        options.template = options.template || answers.template;
        options.stack = `${answers.frontend}-${answers.backend}-${answers.database}`;
        options.features = answers.features;
        options.auth = answers.auth;
        options.deploy = options.deploy || answers.deploy;
      }
      
      // Start generating the app
      const spinner = ora('Generating your app...').start();
      
      try {
        // Create app generation request
        const request = {
          prompt,
          template: options.template,
          stack: options.stack,
          features: options.features,
          auth: options.auth,
          skipValidation: options.skipValidation
        };
        
        // Send request to API
        const appId = await api.generateApp(config.apiKey, request);
        
        // Poll for completion
        let app;
        let status = 'processing';
        
        while (status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const result = await api.getAppStatus(config.apiKey, appId);
          status = result.status;
          spinner.text = `Generating your app... ${result.progress || ''}`;
          
          if (status === 'complete') {
            app = result.app;
          } else if (status === 'failed') {
            throw new Error(result.error || 'App generation failed');
          }
        }
        
        // Download the app
        spinner.text = 'Downloading your app...';
        await api.downloadApp(config.apiKey, appId, options.output);
        
        spinner.succeed('App generated successfully!');
        
        // Show app info
        console.log(boxen(
          `${chalk.bold(`App: ${app.name}`)}
          
${chalk.blue('Stack:')} ${app.stack}
${chalk.blue('Features:')} ${app.features.join(', ')}
${chalk.blue('Location:')} ${path.resolve(options.output)}`, 
          { padding: 1, borderColor: 'green', margin: 1 }
        ));
        
        // Deploy if requested
        if (options.deploy) {
          const deploySpinner = ora('Deploying your app...').start();
          
          try {
            const deployResult = await deployment.deployApp(options.output);
            deploySpinner.succeed('App deployed successfully!');
            console.log(`${chalk.blue('Preview URL:')} ${chalk.cyan(deployResult.url)}`);
          } catch (error) {
            deploySpinner.fail('Failed to deploy app');
            console.error(chalk.red(`Deployment error: ${error.message}`));
          }
        }
        
        // Next steps
        console.log('\n🚀 What\'s next?');
        console.log(`
1. ${chalk.cyan(`cd ${options.output}`)}
2. ${chalk.cyan('npm install')} (or yarn)
3. ${chalk.cyan('npm run dev')} (or yarn dev)

To deploy manually: ${chalk.cyan('pulseforge deploy')}
        `);
      } catch (error) {
        spinner.fail('Failed to generate app');
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// List templates command
program
  .command('templates')
  .description('List available templates')
  .action(() => {
    const templatesList = templates.getTemplatesList();
    
    console.log(chalk.bold('\nAvailable Templates:'));
    console.log('=====================\n');
    
    templatesList.forEach(template => {
      console.log(`${chalk.cyan(template.name)} - ${template.description}`);
      console.log(`ID: ${template.id}`);
      console.log(`Stack: ${template.stack}`);
      console.log('');
    });
    
    console.log(`Use with: ${chalk.cyan('pulseforge create --template <template-id>')}\n`);
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy your app')
  .option('-d, --dir <dir>', 'Directory to deploy', '.')
  .option('-p, --provider <provider>', 'Deployment provider (vercel, azure, netlify)', 'vercel')
  .action(async (options) => {
    const spinner = ora(`Deploying to ${options.provider}...`).start();
    
    try {
      const deployResult = await deployment.deployApp(options.dir, options.provider);
      spinner.succeed('App deployed successfully!');
      console.log(`${chalk.blue('Preview URL:')} ${chalk.cyan(deployResult.url)}`);
    } catch (error) {
      spinner.fail('Failed to deploy app');
      console.error(chalk.red(`Deployment error: ${error.message}`));
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export app to GitHub')
  .option('-d, --dir <dir>', 'Directory to export', '.')
  .option('-r, --repo <repo>', 'GitHub repository (username/repo)')
  .option('-p, --private', 'Create a private repository')
  .action(async (options) => {
    try {
      if (!options.repo) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'repo',
            message: 'GitHub repository (username/repo):',
            validate: input => /^[^/]+\/[^/]+$/.test(input) ? true : 'Invalid repository format. Should be username/repo'
          },
          {
            type: 'confirm',
            name: 'private',
            message: 'Create a private repository?',
            default: false
          }
        ]);
        
        options.repo = answers.repo;
        options.private = answers.private;
      }
      
      const spinner = ora('Exporting to GitHub...').start();
      
      try {
        await deployment.exportToGitHub(options.dir, options.repo, options.private);
        spinner.succeed('App exported to GitHub successfully!');
        console.log(`${chalk.blue('Repository:')} ${chalk.cyan(`https://github.com/${options.repo}`)}`);
      } catch (error) {
        spinner.fail('Failed to export to GitHub');
        console.error(chalk.red(`Export error: ${error.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Process arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Mock implementations for the imported modules

// Note: These would be implemented in separate files in a real implementation
// This is just to show the structure and API

// lib/api-client.js
module.exports = {
  validateApiKey: async (apiKey) => {
    // Mock API key validation
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key');
    }
    return true;
  },
  
  generateApp: async (apiKey, request) => {
    // Mock app generation
    // In a real implementation, this would call the PulseForge API
    console.log('Generation request:', request);
    return 'mock-app-id-123';
  },
  
  getAppStatus: async (apiKey, appId) => {
    // Mock app status check
    // In a real implementation, this would poll the PulseForge API
    return {
      status: 'complete',
      progress: '100%',
      app: {
        name: 'MyApp',
        stack: 'react-fastapi-postgres',
        features: ['auth', 'admin']
      }
    };
  },
  
  downloadApp: async (apiKey, appId, outputDir) => {
    // Mock app download
    // In a real implementation, this would download the generated app code
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create a basic structure to simulate download
    fs.writeFileSync(path.join(outputDir, 'README.md'), '# Generated App\n\nThis is a PulseForge generated app.');
    
    // Create package.json with basic structure
    const packageJson = {
      name: 'pulseforge-app',
      version: '1.0.0',
      scripts: {
        dev: 'echo "Development server would start here"',
        build: 'echo "Build process would run here"',
        start: 'echo "Production server would start here"'
      }
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
    
    return true;
  }
};

// lib/templates.js
module.exports = {
  getTemplatesList: () => {
    // Mock templates list
    return [
      {
        id: 'crm',
        name: 'CRM System',
        description: 'Customer relationship management with contacts, deals, and dashboard',
        stack: 'react-fastapi-postgres'
      },
      {
        id: 'ecommerce',
        name: 'E-commerce Store',
        description: 'Online store with products, cart, checkout, and admin',
        stack: 'react-express-mongodb'
      },
      {
        id: 'blog',
        name: 'Blog Platform',
        description: 'Content management system with posts, categories, and comments',
        stack: 'vue-laravel-mysql'
      },
      {
        id: 'pm',
        name: 'Project Management',
        description: 'Task management with projects, tasks, and team collaboration',
        stack: 'react-express-postgres'
      },
      {
        id: 'saas',
        name: 'SaaS Dashboard',
        description: 'Software-as-a-service dashboard with subscription management',
        stack: 'react-fastapi-postgres'
      }
    ];
  }
};

// lib/stacks.js
module.exports = {
  getFrontendOptions: () => {
    return ['react', 'vue', 'angular'];
  },
  getBackendOptions: () => {
    return ['fastapi', 'express', 'laravel'];
  },
  getDatabaseOptions: () => {
    return ['postgres', 'mysql', 'mongodb'];
  }
};

// lib/deployment.js
module.exports = {
  deployApp: async (dir, provider = 'vercel') => {
    // Mock deployment
    // In a real implementation, this would use the Vercel/Azure/Netlify API
    return {
      url: 'https://myapp.vercel.app'
    };
  },
  
  exportToGitHub: async (dir, repo, isPrivate) => {
    // Mock GitHub export
    // In a real implementation, this would use the GitHub API
    console.log(`Exporting to GitHub: ${repo} (private: ${isPrivate})`);
    return true;
  }
};