/**
 * Insights Dashboard Helper
 * 
 * This script helps update and customize the GenAI insights dashboard
 * with real-time data from Databricks or local files.
 * 
 * Usage: node insights_dashboard_helper.js [options]
 * 
 * Options:
 *   --source <path>      Source data file or connection string
 *   --template <path>    Dashboard template to use
 *   --output <path>      Output path for the generated dashboard
 *   --theme <name>       Visual theme to apply (default, dark, light, tbwa)
 *   --port <number>      Port to use for preview server (default: 8080)
 *   --preview            Launch a preview server
 *   --deploy             Deploy to production location
 * 
 * @author InsightPulseAI Team
 * @version 1.0
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const open = require('open');

// Constants
const DEFAULT_PORT = 8080;
const DEFAULT_THEME = 'tbwa';
const DEFAULT_TEMPLATE = path.join(__dirname, '../dashboards/insights_dashboard.html');
const DEFAULT_OUTPUT = path.join(__dirname, '../output/dashboard/index.html');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    source: null,
    template: DEFAULT_TEMPLATE,
    output: DEFAULT_OUTPUT,
    theme: DEFAULT_THEME,
    port: DEFAULT_PORT,
    preview: false,
    deploy: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--source' && i + 1 < args.length) {
      options.source = args[++i];
    } else if (arg === '--template' && i + 1 < args.length) {
      options.template = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    } else if (arg === '--theme' && i + 1 < args.length) {
      options.theme = args[++i];
    } else if (arg === '--port' && i + 1 < args.length) {
      options.port = parseInt(args[++i], 10);
    } else if (arg === '--preview') {
      options.preview = true;
    } else if (arg === '--deploy') {
      options.deploy = true;
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
Insights Dashboard Helper
------------------------

This script helps update and customize the GenAI insights dashboard with real-time data.

Usage: node insights_dashboard_helper.js [options]

Options:
  --source <path>      Source data file or connection string
  --template <path>    Dashboard template to use
  --output <path>      Output path for the generated dashboard
  --theme <name>       Visual theme to apply (default, dark, light, tbwa)
  --port <number>      Port to use for preview server (default: 8080)
  --preview            Launch a preview server
  --deploy             Deploy to production location
  --help               Show this help message

Examples:
  node insights_dashboard_helper.js --source data/insights.json --preview
  node insights_dashboard_helper.js --theme dark --deploy
  `);
}

// Load data from source
function loadData(sourcePath) {
  console.log(`Loading data from ${sourcePath}...`);
  
  try {
    // Check if source is a file path or connection string
    if (sourcePath && fs.existsSync(sourcePath)) {
      // Load from file
      const data = fs.readFileSync(sourcePath, 'utf8');
      return JSON.parse(data);
    } else if (sourcePath && sourcePath.startsWith('databricks://')) {
      // Extract connection details from the URI
      const connString = sourcePath.replace('databricks://', '');
      const [workspace, path] = connString.split('/');
      
      // Use Databricks CLI to fetch data
      console.log(`Fetching data from Databricks workspace ${workspace}, path ${path}...`);
      
      try {
        const result = execSync(`databricks workspace export ${path} -f JSON`);
        return JSON.parse(result);
      } catch (error) {
        console.error(`Error fetching data from Databricks: ${error.message}`);
        return generateSampleData();
      }
    } else {
      // No valid source, generate sample data
      console.log('No valid data source provided, generating sample data...');
      return generateSampleData();
    }
  } catch (error) {
    console.error(`Error loading data: ${error.message}`);
    return generateSampleData();
  }
}

// Generate sample data for demonstration
function generateSampleData() {
  console.log('Generating sample data...');
  
  return {
    metadata: {
      generated_at: new Date().toISOString(),
      time_period: `${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
      model_used: 'claude-3-sonnet-20240229',
      total_records: 327
    },
    stats: {
      total_insights: 124,
      brand_insights: 57,
      sentiment_insights: 42,
      trend_insights: 25,
      avg_confidence: 82
    },
    brands: {
      labels: ['Jollibee', 'McDonald\'s', 'KFC', 'Burger King', 'Wendy\'s', 'Pizza Hut'],
      counts: [42, 35, 28, 22, 15, 10],
      confidences: [88, 82, 79, 86, 81, 75]
    },
    sentiment: {
      weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Jollibee',
          data: [72, 75, 78, 82]
        },
        {
          label: 'McDonald\'s',
          data: [68, 70, 69, 71]
        },
        {
          label: 'KFC',
          data: [65, 68, 67, 70]
        }
      ]
    },
    tags: [
      { name: 'pricing', count: 42 },
      { name: 'quality', count: 35 },
      { name: 'service', count: 28 },
      { name: 'app', count: 37 },
      { name: 'menu', count: 22 },
      { name: 'delivery', count: 25 },
      { name: 'value', count: 32 },
      { name: 'speed', count: 27 },
      { name: 'cleanliness', count: 18 },
      { name: 'family', count: 24 },
      { name: 'promotion', count: 21 },
      { name: 'convenience', count: 19 },
      { name: 'loyalty', count: 29 },
      { name: 'taste', count: 26 },
      { name: 'location', count: 17 }
    ],
    insights: [
      {
        type: 'general',
        title: 'Increasing focus on value meals across all demographics',
        text: 'Analysis of 327 transcripts reveals that 64% of customers mention value when discussing meal options. This represents an increasing trend compared to previous periods.',
        confidence: 85,
        brands: ['Jollibee', 'McDonald\'s', 'KFC'],
        tags: ['pricing', 'value', 'economy', 'family'],
        actions: [
          {
            text: 'Develop new value meal options',
            priority: 'high',
            team: 'Marketing Team',
            due_date: '2025-05-15'
          },
          {
            text: 'Update promotional materials to emphasize value',
            priority: 'medium',
            team: 'Marketing Team',
            due_date: '2025-05-22'
          }
        ],
        generated_by: 'claude',
        date: '2025-05-02'
      },
      {
        type: 'brand',
        title: 'Brand loyalty stronger for customers using rewards programs',
        text: 'Data from recent interactions shows Jollibee is frequently associated with loyalty programs, with 78% of mentions having positive sentiment.',
        confidence: 92,
        brands: ['Jollibee'],
        tags: ['loyalty', 'rewards', 'app', 'repeat'],
        actions: [
          {
            text: 'Enhance mobile app rewards features',
            priority: 'high',
            team: 'Development Team',
            due_date: '2025-05-30'
          },
          {
            text: 'Create member-exclusive menu items',
            priority: 'low',
            team: 'Product Team',
            due_date: '2025-06-15'
          }
        ],
        generated_by: 'openai',
        date: '2025-05-03'
      },
      {
        type: 'sentiment',
        title: 'Positive sentiment toward expanded vegetarian options',
        text: 'A recurring theme in 32% of analyzed conversations is the connection between vegetarian menu options and positive sentiment.',
        confidence: 76,
        brands: ['KFC', 'Burger King'],
        tags: ['vegetarian', 'health', 'menu', 'alternatives'],
        actions: [
          {
            text: 'Expand vegetarian menu offerings',
            priority: 'medium',
            team: 'Product Team',
            due_date: '2025-06-10'
          },
          {
            text: 'Highlight health benefits in marketing',
            priority: 'medium',
            team: 'Marketing Team',
            due_date: '2025-05-25'
          }
        ],
        generated_by: 'claude',
        date: '2025-05-05'
      },
      {
        type: 'trend',
        title: 'Rising preference for breakfast items throughout the day',
        text: 'Analysis of 215 transcripts reveals a growing customer demand for breakfast items to be available throughout the day, with 47% of customers expressing this preference.',
        confidence: 88,
        brands: ['McDonald\'s', 'Jollibee', 'Wendy\'s'],
        tags: ['breakfast', 'all-day', 'menu', 'convenience'],
        actions: [
          {
            text: 'Extend breakfast hours in select locations',
            priority: 'high',
            team: 'Operations Team',
            due_date: '2025-05-20'
          },
          {
            text: 'Update app to allow all-day breakfast ordering',
            priority: 'medium',
            team: 'Development Team',
            due_date: '2025-06-05'
          }
        ],
        generated_by: 'deepseek',
        date: '2025-05-04'
      }
    ]
  };
}

// Generate dashboard from template and data
function generateDashboard(templatePath, data, outputPath, theme) {
  console.log(`Generating dashboard using template ${templatePath}...`);
  
  try {
    // Read template file
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Inject data into template
    let dashboard = template;
    
    // Replace theme-related CSS variables
    if (theme === 'dark') {
      dashboard = dashboard.replace('body {', 'body { --tbwa-light: #212529; --tbwa-dark: #f8f9fa;');
    } else if (theme === 'light') {
      dashboard = dashboard.replace('body {', 'body { --tbwa-light: #ffffff; --tbwa-dark: #000000;');
    }
    
    // Replace data placeholders
    dashboard = dashboard
      .replace(/{{TOTAL_INSIGHTS}}/g, data.stats.total_insights)
      .replace(/{{BRAND_INSIGHTS}}/g, data.stats.brand_insights)
      .replace(/{{SENTIMENT_INSIGHTS}}/g, data.stats.sentiment_insights)
      .replace(/{{AVG_CONFIDENCE}}/g, data.stats.avg_confidence)
      .replace(/{{TIME_PERIOD}}/g, data.metadata.time_period)
      .replace(/{{GENERATED_DATE}}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
      .replace(/{{MODEL_USED}}/g, data.metadata.model_used || 'Unknown');
    
    // Update brand chart data
    const brandsDataScript = `
      const brandLabels = ${JSON.stringify(data.brands.labels)};
      const brandCounts = ${JSON.stringify(data.brands.counts)};
      const brandConfidences = ${JSON.stringify(data.brands.confidences)};
    `;
    dashboard = dashboard.replace('// BRAND_CHART_DATA', brandsDataScript);
    
    // Update sentiment chart data
    const sentimentDataScript = `
      const sentimentWeeks = ${JSON.stringify(data.sentiment.weeks)};
      const sentimentDatasets = ${JSON.stringify(data.sentiment.datasets)};
    `;
    dashboard = dashboard.replace('// SENTIMENT_CHART_DATA', sentimentDataScript);
    
    // Update tag cloud data
    const tagCloudScript = `
      const tagData = ${JSON.stringify(data.tags)};
    `;
    dashboard = dashboard.replace('// TAG_CLOUD_DATA', tagCloudScript);
    
    // Update insights cards
    // In a full implementation, this would inject all insights
    // but for simplicity, we'll skip this for now
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write dashboard to output file
    fs.writeFileSync(outputPath, dashboard);
    
    console.log(`Dashboard generated successfully at ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`Error generating dashboard: ${error.message}`);
    return null;
  }
}

// Launch preview server
function launchPreviewServer(dashboardPath, port) {
  console.log(`Launching preview server for ${dashboardPath} on port ${port}...`);
  
  try {
    // Create HTTP server to serve the dashboard
    const server = http.createServer((req, res) => {
      const requestPath = req.url === '/' ? dashboardPath : path.join(path.dirname(dashboardPath), req.url);
      
      // Handle requests for dashboard and assets
      try {
        if (fs.existsSync(requestPath) && fs.statSync(requestPath).isFile()) {
          // Determine content type based on file extension
          const ext = path.extname(requestPath).toLowerCase();
          let contentType = 'text/html';
          
          if (ext === '.js') contentType = 'application/javascript';
          else if (ext === '.css') contentType = 'text/css';
          else if (ext === '.json') contentType = 'application/json';
          else if (ext === '.png') contentType = 'image/png';
          else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.svg') contentType = 'image/svg+xml';
          
          // Read and serve the file
          const content = fs.readFileSync(requestPath);
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        } else {
          // File not found
          res.writeHead(404);
          res.end('Not found');
        }
      } catch (error) {
        // Error handling
        res.writeHead(500);
        res.end(`Server error: ${error.message}`);
      }
    });
    
    // Start server
    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`);
      
      // Open in browser
      open(`http://localhost:${port}/`);
      
      console.log('Press Ctrl+C to stop the server');
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please choose a different port.`);
        process.exit(1);
      } else {
        console.error(`Server error: ${error.message}`);
        process.exit(1);
      }
    });
    
    return server;
  } catch (error) {
    console.error(`Error launching preview server: ${error.message}`);
    return null;
  }
}

// Deploy dashboard to production location
function deployDashboard(dashboardPath) {
  console.log(`Deploying dashboard from ${dashboardPath} to production...`);
  
  try {
    // Determine production location (can be customized)
    const productionDir = path.join(__dirname, '../../../public/dashboards');
    const productionPath = path.join(productionDir, 'insights_dashboard.html');
    
    // Create production directory if it doesn't exist
    if (!fs.existsSync(productionDir)) {
      fs.mkdirSync(productionDir, { recursive: true });
    }
    
    // Copy dashboard to production location
    fs.copyFileSync(dashboardPath, productionPath);
    
    // Copy required assets
    const assetsDir = path.join(path.dirname(dashboardPath), 'assets');
    if (fs.existsSync(assetsDir)) {
      const productionAssetsDir = path.join(productionDir, 'assets');
      
      if (!fs.existsSync(productionAssetsDir)) {
        fs.mkdirSync(productionAssetsDir, { recursive: true });
      }
      
      // Copy all files in assets directory
      const assets = fs.readdirSync(assetsDir);
      assets.forEach(asset => {
        const assetPath = path.join(assetsDir, asset);
        const productionAssetPath = path.join(productionAssetsDir, asset);
        
        if (fs.statSync(assetPath).isFile()) {
          fs.copyFileSync(assetPath, productionAssetPath);
        }
      });
    }
    
    console.log(`Dashboard deployed successfully to ${productionPath}`);
    return productionPath;
  } catch (error) {
    console.error(`Error deploying dashboard: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('\n=== Insights Dashboard Helper ===\n');
  
  // Parse command line arguments
  const options = parseArgs();
  
  try {
    // Load data from source
    const data = loadData(options.source);
    
    // Generate dashboard
    const dashboardPath = generateDashboard(options.template, data, options.output, options.theme);
    
    if (!dashboardPath) {
      console.error('Failed to generate dashboard');
      process.exit(1);
    }
    
    // Deploy dashboard if requested
    if (options.deploy) {
      const deployedPath = deployDashboard(dashboardPath);
      
      if (!deployedPath) {
        console.error('Failed to deploy dashboard');
        process.exit(1);
      }
    }
    
    // Launch preview server if requested
    if (options.preview) {
      const server = launchPreviewServer(dashboardPath, options.port);
      
      if (!server) {
        console.error('Failed to launch preview server');
        process.exit(1);
      }
      
      // Keep the process running until interrupted
      process.on('SIGINT', () => {
        console.log('\nStopping server...');
        server.close(() => {
          console.log('Server stopped');
          process.exit(0);
        });
      });
    } else {
      console.log('\nDashboard generation complete!');
      
      // Suggest next steps
      console.log('\nNext steps:');
      
      if (!options.preview) {
        console.log(`- Preview dashboard: node insights_dashboard_helper.js --output "${options.output}" --preview`);
      }
      
      if (!options.deploy) {
        console.log(`- Deploy dashboard: node insights_dashboard_helper.js --output "${options.output}" --deploy`);
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
  loadData,
  generateDashboard,
  launchPreviewServer,
  deployDashboard
};