#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const program = new Command();

program
  .name('pulser')
  .description('Pulser CLI for scaffolding and automation')
  .version('1.0.0');

// Scaffold command
const scaffold = program
  .command('scaffold')
  .description('Scaffold new components');

scaffold
  .command('page')
  .description('Scaffold a new page')
  .argument('<name>', 'page name')
  .option('--path <path>', 'output path for the page')
  .option('--stub <stub>', 'page stub content')
  .action(async (name, options) => {
    try {
      const pagePath = options.path || `src/pages/${name}.tsx`;
      const stubContent = options.stub || `export default function ${name.charAt(0).toUpperCase() + name.slice(1)}() {
  return (
    <div>
      <h1>${name.charAt(0).toUpperCase() + name.slice(1)}</h1>
    </div>
  );
}`;

      await fs.ensureDir(path.dirname(pagePath));
      await fs.writeFile(pagePath, stubContent);
      
      console.log(chalk.green(`✓ Created page: ${pagePath}`));
    } catch (error) {
      console.error(chalk.red(`Error creating page: ${error.message}`));
      process.exit(1);
    }
  });

// Inject command
program
  .command('inject')
  .description('Inject components or configurations')
  .argument('<type>', 'type to inject (nav, etc.)')
  .option('--items <items...>', 'items to inject')
  .action(async (type, options) => {
    if (type === 'nav') {
      try {
        const navItems = options.items || [];
        const navConfig = navItems.map(item => {
          const [label, path] = item.split(':');
          return { label, path };
        });

        const navFilePath = 'src/components/Navigation.tsx';
        const navContent = `import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  const navItems = ${JSON.stringify(navConfig, null, 2)};

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="flex space-x-4">
        {navItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="hover:bg-gray-700 px-3 py-2 rounded"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;`;

        await fs.ensureDir(path.dirname(navFilePath));
        await fs.writeFile(navFilePath, navContent);
        
        console.log(chalk.green(`✓ Created navigation with ${navConfig.length} items`));
      } catch (error) {
        console.error(chalk.red(`Error injecting navigation: ${error.message}`));
        process.exit(1);
      }
    } else {
      console.error(chalk.red(`Unknown inject type: ${type}`));
      process.exit(1);
    }
  });

// Supabase command
const supabase = program
  .command('supabase')
  .description('Supabase operations');

const rpc = supabase
  .command('rpc')
  .description('RPC operations');

rpc
  .command('create')
  .description('Create RPC function wrapper')
  .argument('<name>', 'RPC function name')
  .option('--args <args>', 'function arguments')
  .option('--alias <alias>', 'function alias')
  .action(async (name, options) => {
    try {
      const alias = options.alias || name;
      const args = options.args ? options.args.split(',').map(arg => {
        const [argName, argType] = arg.split(':');
        return { name: argName.trim(), type: argType.trim() };
      }) : [];

      const hookContent = `import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface ${alias.charAt(0).toUpperCase() + alias.slice(1)}Args {
${args.map(arg => `  ${arg.name}: ${arg.type === 'int[]' ? 'number[]' : arg.type === 'varchar' ? 'string' : arg.type === 'timestamptz' ? 'string' : 'any'};`).join('\n')}
}

export const use${alias.charAt(0).toUpperCase() + alias.slice(1)} = (args: ${alias.charAt(0).toUpperCase() + alias.slice(1)}Args) => {
  return useQuery({
    queryKey: ['${name}', args],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('${name}', args);
      if (error) throw error;
      return data;
    },
  });
};`;

      const hookPath = `src/hooks/${alias}.ts`;
      await fs.ensureDir(path.dirname(hookPath));
      await fs.writeFile(hookPath, hookContent);
      
      console.log(chalk.green(`✓ Created RPC hook: ${hookPath}`));
    } catch (error) {
      console.error(chalk.red(`Error creating RPC hook: ${error.message}`));
      process.exit(1);
    }
  });

// Git operations
program
  .command('branch')
  .description('Git branch operations')
  .argument('<action>', 'action (create)')
  .argument('<name>', 'branch name')
  .action(async (action, name) => {
    if (action === 'create') {
      const { exec } = require('child_process');
      exec(`git checkout -b ${name}`, (error, stdout, stderr) => {
        if (error) {
          console.error(chalk.red(`Error creating branch: ${error.message}`));
          return;
        }
        console.log(chalk.green(`✓ Created and switched to branch: ${name}`));
      });
    }
  });

program
  .command('commit')
  .description('Git commit')
  .argument('<message>', 'commit message')
  .action(async (message) => {
    const { exec } = require('child_process');
    exec(`git add . && git commit -m "${message}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error committing: ${error.message}`));
        return;
      }
      console.log(chalk.green(`✓ Committed: ${message}`));
    });
  });

program
  .command('push')
  .description('Git push')
  .option('--set-upstream', 'set upstream')
  .action(async (options) => {
    const { exec } = require('child_process');
    const command = options.setUpstream ? 'git push --set-upstream origin $(git branch --show-current)' : 'git push';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error pushing: ${error.message}`));
        return;
      }
      console.log(chalk.green(`✓ Pushed to remote`));
    });
  });

program
  .command('pr')
  .description('Create pull request')
  .argument('<action>', 'action (create)')
  .option('--title <title>', 'PR title')
  .option('--label <label>', 'PR label')
  .option('--body <body>', 'PR body')
  .action(async (action, options) => {
    if (action === 'create') {
      console.log(chalk.yellow(`PR creation would be handled by your Git provider (GitHub, GitLab, etc.)`));
      console.log(chalk.blue(`Title: ${options.title || 'No title provided'}`));
      console.log(chalk.blue(`Label: ${options.label || 'No label provided'}`));
      console.log(chalk.blue(`Body: ${options.body || 'No body provided'}`));
    }
  });

program.parse();
