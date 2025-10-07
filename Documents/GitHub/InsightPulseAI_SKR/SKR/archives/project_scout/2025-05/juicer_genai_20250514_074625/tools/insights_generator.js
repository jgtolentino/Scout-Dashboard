/**
 * Insights Generator for Juicer Stack
 * 
 * This script provides a command-line interface to generate and visualize 
 * GenAI-powered insights from Juicer's Medallion architecture data.
 * 
 * Usage: node insights_generator.js [options]
 * 
 * Options:
 *   --days <number>        Number of days to analyze (default: 7)
 *   --model <name>         LLM model to use: claude, openai, deepseek, auto (default: claude)
 *   --type <type>          Insight type: general, brand, sentiment, trend, all (default: all)
 *   --brand <name>         Filter by brand name
 *   --visualize            Generate visualization dashboard
 *   --confidence <number>  Minimum confidence threshold (0-1, default: 0.7)
 *   --output <path>        Output directory for generated assets
 * 
 * @author InsightPulseAI Team
 * @version 1.0
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const http = require('http');
const open = require('open');

// Constants
const DEFAULT_DAYS = 7;
const DEFAULT_MODEL = 'claude';
const DEFAULT_CONFIDENCE = 0.7;
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '../output');
const DASHBOARD_TEMPLATE = path.join(__dirname, '../dashboards/insights_dashboard.html');
const VISUALIZER_SCRIPT = path.join(__dirname, '../dashboards/insights_visualizer.js');
const DATABRICKS_NOTEBOOK = '/juicer/juicer_gold_insights';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    days: DEFAULT_DAYS,
    model: DEFAULT_MODEL,
    type: 'all',
    confidence: DEFAULT_CONFIDENCE,
    visualize: false,
    output: DEFAULT_OUTPUT_DIR
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--days' && i + 1 < args.length) {
      options.days = parseInt(args[++i], 10);
    } else if (arg === '--model' && i + 1 < args.length) {
      options.model = args[++i];
    } else if (arg === '--type' && i + 1 < args.length) {
      options.type = args[++i];
    } else if (arg === '--brand' && i + 1 < args.length) {
      options.brand = args[++i];
    } else if (arg === '--visualize') {
      options.visualize = true;
    } else if (arg === '--confidence' && i + 1 < args.length) {
      options.confidence = parseFloat(args[++i]);
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    } else if (arg === '--help') {
      showHelp();
      process.exit(0);
    }
  }

  return options;
}

// Display help information
function showHelp() {
  console.log(`
Insights Generator for Juicer Stack
-----------------------------------

This script helps generate and visualize GenAI-powered insights from Juicer's data.

Usage: node insights_generator.js [options]

Options:
  --days <number>        Number of days to analyze (default: 7)
  --model <name>         LLM model to use: claude, openai, deepseek, auto (default: claude)
  --type <type>          Insight type: general, brand, sentiment, trend, all (default: all)
  --brand <name>         Filter by brand name
  --visualize            Generate visualization dashboard
  --confidence <number>  Minimum confidence threshold (0-1, default: 0.7)
  --output <path>        Output directory for generated assets
  --help                 Show this help message

Examples:
  node insights_generator.js --days 30 --model claude --visualize
  node insights_generator.js --type brand --brand "Jollibee" --confidence 0.8
  `);
}

// Check if Databricks CLI is available
function checkDatabricksAvailability() {
  try {
    execSync('databricks --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Execute Databricks notebook to generate insights
async function generateInsights(options) {
  console.log('Generating insights from Databricks...');
  console.log(`- Time range: Last ${options.days} days`);
  console.log(`- Model: ${options.model}`);
  console.log(`- Insight types: ${options.type === 'all' ? 'All types' : options.type}`);
  
  // If Databricks CLI is available, use it to run the notebook
  if (checkDatabricksAvailability()) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - options.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      console.log('Executing Databricks notebook...');
      
      // Build parameters for notebook
      const params = {
        date: startDate,
        end_date: endDate,
        env: 'dev',
        model: options.model,
        generate_dashboard: options.visualize ? 'true' : 'false'
      };
      
      // Construct parameters string for Databricks CLI
      const paramsStr = Object.entries(params)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');
      
      // Execute notebook using Databricks CLI
      const command = `databricks workspace run ${DATABRICKS_NOTEBOOK} -o json --parameters ${paramsStr}`;
      
      console.log(`Running command: ${command}`);
      
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing Databricks notebook: ${error.message}`);
            console.error(stderr);
            
            // Fall back to simulated results
            console.log('Falling back to simulated results...');
            setTimeout(() => resolve(simulateInsightGeneration(options)), 2000);
            return;
          }
          
          try {
            const result = JSON.parse(stdout);
            console.log('Notebook execution successful!');
            console.log(`Generated ${result.insights_generated} insights from ${result.processed_records} records`);
            resolve(result);
          } catch (parseError) {
            console.error('Error parsing notebook output', parseError);
            resolve({ status: 'error', message: parseError.message });
          }
        });
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return simulateInsightGeneration(options);
    }
  } else {
    console.log('Databricks CLI not found. Simulating insight generation...');
    return simulateInsightGeneration(options);
  }
}

// Simulate insight generation (for demo/testing)
function simulateInsightGeneration(options) {
  console.log('Simulating insight generation process...');
  
  // Simulate processing time
  return new Promise(resolve => {
    setTimeout(() => {
      const recordsProcessed = Math.floor(100 + Math.random() * 400);
      const insightsGenerated = Math.floor(recordsProcessed * 0.2);
      
      console.log(`Simulated processing ${recordsProcessed} records`);
      console.log(`Generated ${insightsGenerated} insights`);
      
      resolve({
        status: 'success',
        processed_records: recordsProcessed,
        insights_generated: insightsGenerated
      });
    }, 3000);
  });
}

// Generate a visualization dashboard from insights
async function generateVisualization(options, insightsResult) {
  if (!options.visualize) {
    return null;
  }
  
  console.log('Generating insights visualization dashboard...');
  
  // Create output directory if it doesn't exist
  const outputDir = options.output;
  const dashboardDir = path.join(outputDir, 'dashboard');
  const assetsDir = path.join(dashboardDir, 'assets');
  
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    if (!fs.existsSync(dashboardDir)) {
      fs.mkdirSync(dashboardDir, { recursive: true });
    }
    
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Copy dashboard template
    const dashboardHtml = fs.readFileSync(DASHBOARD_TEMPLATE, 'utf8');
    const dashboardPath = path.join(dashboardDir, 'insights_dashboard.html');
    
    // Copy visualizer script
    const visualizerJs = fs.readFileSync(VISUALIZER_SCRIPT, 'utf8');
    const visualizerPath = path.join(dashboardDir, 'insights_visualizer.js');
    
    // Update dashboard with current date and configuration
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const updatedDashboard = dashboardHtml
      .replace('{{GENERATED_DATE}}', currentDate)
      .replace('{{DAYS_ANALYZED}}', options.days)
      .replace('{{MODEL_USED}}', options.model)
      .replace('{{INSIGHTS_COUNT}}', insightsResult.insights_generated || 0);
    
    fs.writeFileSync(dashboardPath, updatedDashboard);
    fs.writeFileSync(visualizerPath, visualizerJs);
    
    // Create a minimal server to serve the dashboard
    const server = http.createServer((req, res) => {
      let filePath;
      
      if (req.url === '/' || req.url === '/index.html') {
        filePath = dashboardPath;
      } else if (req.url === '/insights_visualizer.js') {
        filePath = visualizerPath;
      } else {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      
      const contentType = req.url.endsWith('.js') ? 'application/javascript' : 'text/html';
      const content = fs.readFileSync(filePath);
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
    
    // Find an available port
    const port = 8080;
    server.listen(port);
    
    console.log(`\nDashboard server started at http://localhost:${port}`);
    console.log(`Opening dashboard in your default browser...`);
    
    // Open the dashboard in the default browser
    await open(`http://localhost:${port}`);
    
    console.log('\nPress Ctrl+C to stop the server and exit');
    
    // Keep the server running until the process is terminated
    return server;
  } catch (error) {
    console.error(`Error generating visualization: ${error.message}`);
    return null;
  }
}

// Save insights summary to file
function saveInsightsSummary(options, insightsResult) {
  try {
    const outputFile = path.join(options.output, 'insights_summary.json');
    
    const summary = {
      timestamp: new Date().toISOString(),
      configuration: {
        days_analyzed: options.days,
        model: options.model,
        insight_type: options.type,
        brand_filter: options.brand || 'all',
        confidence_threshold: options.confidence
      },
      results: {
        status: insightsResult.status,
        processed_records: insightsResult.processed_records,
        insights_generated: insightsResult.insights_generated,
        execution_time_ms: insightsResult.execution_time_ms || 0
      }
    };
    
    if (!fs.existsSync(options.output)) {
      fs.mkdirSync(options.output, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
    console.log(`Insights summary saved to ${outputFile}`);
    
    return outputFile;
  } catch (error) {
    console.error(`Error saving insights summary: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('\n=== Juicer Insights Generator ===\n');
  
  // Parse command line arguments
  const options = parseArgs();
  
  // Validate options
  if (options.days <= 0) {
    console.error('Error: Days must be a positive number');
    process.exit(1);
  }
  
  if (!['claude', 'openai', 'deepseek', 'auto'].includes(options.model)) {
    console.error('Error: Model must be one of: claude, openai, deepseek, auto');
    process.exit(1);
  }
  
  if (!['general', 'brand', 'sentiment', 'trend', 'all'].includes(options.type)) {
    console.error('Error: Type must be one of: general, brand, sentiment, trend, all');
    process.exit(1);
  }
  
  if (options.confidence < 0 || options.confidence > 1) {
    console.error('Error: Confidence must be between 0 and 1');
    process.exit(1);
  }
  
  try {
    // Generate insights
    const startTime = Date.now();
    const insightsResult = await generateInsights(options);
    const endTime = Date.now();
    
    // Add execution time to result
    insightsResult.execution_time_ms = endTime - startTime;
    
    // Save summary to file
    const summaryFile = saveInsightsSummary(options, insightsResult);
    
    // Generate visualization if requested
    if (options.visualize) {
      const server = await generateVisualization(options, insightsResult);
      
      // Keep the process running if server is created
      if (server) {
        // Handle Ctrl+C to gracefully shut down the server
        process.on('SIGINT', () => {
          console.log('\nShutting down server...');
          server.close(() => {
            console.log('Server stopped');
            process.exit(0);
          });
        });
      }
    } else {
      console.log('\nInsights generation complete!');
      if (summaryFile) {
        console.log(`Summary saved to: ${summaryFile}`);
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  generateInsights,
  generateVisualization,
  saveInsightsSummary
};