#!/usr/bin/env node
/**
 * TBWA PageIndex Agent CLI
 * TypeScript wrapper for Python PageIndex agent
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ProcessResult {
  success: boolean;
  fileId?: string;
  error?: string;
  duration: number;
}

class PageIndexCLI {
  private pythonScript: string;

  constructor() {
    this.pythonScript = path.join(__dirname, 'pageindex_agent.py');
  }

  async processFile(
    filepath: string,
    options: {
      campaign?: string;
      client?: string;
      verbose?: boolean;
    } = {}
  ): Promise<ProcessResult> {
    const startTime = Date.now();
    const spinner = ora(`Processing file: ${path.basename(filepath)}`).start();

    try {
      // Build Python command
      const args = [this.pythonScript, filepath];
      
      if (options.campaign) {
        args.push('--campaign', options.campaign);
      }
      
      if (options.client) {
        args.push('--client', options.client);
      }
      
      if (options.verbose) {
        args.push('--debug');
      }

      // Execute Python script
      const { stdout, stderr } = await execa('python', args, {
        timeout: 300000, // 5 minutes timeout
        encoding: 'utf8'
      });

      // Extract file ID from output
      const fileIdMatch = stdout.match(/File ID: ([a-f0-9-]+)/i);
      const fileId = fileIdMatch ? fileIdMatch[1] : undefined;

      const duration = Date.now() - startTime;
      
      spinner.succeed(chalk.green(`✅ File processed successfully in ${duration}ms`));
      
      if (options.verbose) {
        console.log(chalk.gray(stdout));
      }

      return {
        success: true,
        fileId,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      spinner.fail(chalk.red(`❌ Processing failed after ${duration}ms`));
      
      console.error(chalk.red(error.message));
      
      if (options.verbose && error.stderr) {
        console.error(chalk.gray(error.stderr));
      }

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  async processBatch(
    directoryPath: string,
    options: {
      campaign?: string;
      client?: string;
      pattern?: string;
      parallel?: number;
      verbose?: boolean;
    } = {}
  ): Promise<ProcessResult[]> {
    const startTime = Date.now();
    
    // Find files to process
    const pattern = options.pattern || '**/*.{pdf,pptx,docx,jpg,jpeg,png,mp4,mov}';
    const searchPattern = path.join(directoryPath, pattern);
    
    console.log(chalk.blue(`🔍 Searching for files: ${searchPattern}`));
    
    const files = await glob(searchPattern, {
      nodir: true,
      absolute: true
    });

    if (files.length === 0) {
      console.log(chalk.yellow('⚠️  No files found to process'));
      return [];
    }

    console.log(chalk.blue(`📁 Found ${files.length} files to process`));

    // Process files
    const results: ProcessResult[] = [];
    const parallelLimit = options.parallel || 3; // Process 3 files at a time
    
    for (let i = 0; i < files.length; i += parallelLimit) {
      const batch = files.slice(i, i + parallelLimit);
      
      console.log(chalk.blue(`\n🔄 Processing batch ${Math.floor(i / parallelLimit) + 1}/${Math.ceil(files.length / parallelLimit)}`));
      
      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.processFile(file, {
            campaign: options.campaign,
            client: options.client,
            verbose: options.verbose
          });
          
          return {
            ...result,
            file
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            duration: 0,
            file
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log(chalk.blue(`\n📊 Batch processing completed in ${totalDuration}ms`));
    console.log(chalk.green(`✅ Successful: ${successCount}`));
    
    if (failCount > 0) {
      console.log(chalk.red(`❌ Failed: ${failCount}`));
    }

    return results;
  }

  async checkPythonDependencies(): Promise<boolean> {
    const spinner = ora('Checking Python dependencies...').start();

    try {
      // Check if Python is available
      await execa('python', ['--version']);
      
      // Check if required packages are installed
      const requiredPackages = [
        'openai',
        'azure-ai-formrecognizer',
        'opencv-python',
        'PyMuPDF',
        'python-pptx',
        'pyodbc'
      ];

      for (const pkg of requiredPackages) {
        try {
          await execa('python', ['-c', `import ${pkg.replace('-', '_')}`]);
        } catch (error) {
          spinner.fail(chalk.red(`❌ Missing Python package: ${pkg}`));
          console.log(chalk.yellow(`Install with: pip install ${pkg}`));
          return false;
        }
      }

      spinner.succeed(chalk.green('✅ All Python dependencies are available'));
      return true;

    } catch (error) {
      spinner.fail(chalk.red('❌ Python is not available'));
      console.log(chalk.yellow('Please install Python 3.8+ and required packages'));
      return false;
    }
  }

  async installPythonDependencies(): Promise<boolean> {
    const spinner = ora('Installing Python dependencies...').start();

    try {
      const requirementsPath = path.join(__dirname, '..', 'requirements.txt');
      
      await execa('pip', ['install', '-r', requirementsPath], {
        stdio: 'pipe'
      });

      spinner.succeed(chalk.green('✅ Python dependencies installed successfully'));
      return true;

    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to install Python dependencies'));
      console.error(chalk.red(error.message));
      return false;
    }
  }

  async getProcessingStatus(): Promise<any> {
    try {
      // Check for JSON output files
      const outputDir = path.join(process.cwd(), 'pageindex_output');
      
      try {
        const files = await fs.readdir(outputDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        console.log(chalk.blue(`📁 Found ${jsonFiles.length} processed files in output directory`));
        
        // Load recent files
        const recentFiles = jsonFiles.slice(-5);
        for (const file of recentFiles) {
          const filePath = path.join(outputDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          
          console.log(chalk.green(`📄 ${data.file_metadata.original_filename}`));
          console.log(chalk.gray(`   Campaign: ${data.file_metadata.campaign_name || 'N/A'}`));
          console.log(chalk.gray(`   Chunks: ${data.chunks.length}`));
          console.log(chalk.gray(`   Processed: ${data.processed_at}`));
        }
        
      } catch (error) {
        console.log(chalk.yellow('📂 No processed files found (output directory empty)'));
      }

      return {
        outputDirectory: outputDir,
        status: 'ready'
      };

    } catch (error) {
      console.error(chalk.red('❌ Error checking processing status:'), error.message);
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// CLI Commands
const program = new Command();
const cli = new PageIndexCLI();

program
  .name('pageindex')
  .description('TBWA PageIndex Agent - Semantic file processing')
  .version('1.0.0');

program
  .command('process <filepath>')
  .description('Process a single file')
  .option('-c, --campaign <name>', 'Campaign name')
  .option('-l, --client <name>', 'Client name')
  .option('-v, --verbose', 'Verbose output')
  .action(async (filepath, options) => {
    const result = await cli.processFile(filepath, options);
    
    if (!result.success) {
      process.exit(1);
    }
  });

program
  .command('batch <directory>')
  .description('Process all files in a directory')
  .option('-c, --campaign <name>', 'Campaign name')
  .option('-l, --client <name>', 'Client name')
  .option('-p, --pattern <pattern>', 'File pattern', '**/*.{pdf,pptx,docx,jpg,jpeg,png,mp4,mov}')
  .option('-n, --parallel <number>', 'Number of parallel processes', '3')
  .option('-v, --verbose', 'Verbose output')
  .action(async (directory, options) => {
    const results = await cli.processBatch(directory, {
      ...options,
      parallel: parseInt(options.parallel)
    });
    
    const failedCount = results.filter(r => !r.success).length;
    if (failedCount > 0) {
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Check and install Python dependencies')
  .option('--install', 'Install missing dependencies')
  .action(async (options) => {
    const isReady = await cli.checkPythonDependencies();
    
    if (!isReady && options.install) {
      const installed = await cli.installPythonDependencies();
      if (!installed) {
        process.exit(1);
      }
    } else if (!isReady) {
      console.log(chalk.yellow('\nRun with --install to install missing dependencies'));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check processing status and recent files')
  .action(async () => {
    await cli.getProcessingStatus();
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\n'), program.args.join(' '));
  program.help();
});

// Parse arguments
program.parse();

export { PageIndexCLI };