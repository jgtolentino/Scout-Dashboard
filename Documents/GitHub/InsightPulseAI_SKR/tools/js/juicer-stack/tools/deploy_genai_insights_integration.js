#!/usr/bin/env node
/**
 * Deploy GenAI Insights Integration Script
 * 
 * This script deploys the GenAI insights integration across all three dashboards:
 * - Main insights dashboard
 * - Retail dashboard
 * - Operations dashboard
 * 
 * Usage: node deploy_genai_insights_integration.js [options]
 * 
 * Options:
 *   --env <environment>      Deployment environment (dev, staging, prod) (default: dev)
 *   --generate-insights      Generate insights using Databricks before deployment
 *   --skip-capture           Skip dashboard screenshot capture
 *   --azure-deploy           Deploy to Azure Static Web Apps (requires auth)
 *   --force                  Force deployment even if validation fails
 *   --help                   Show this help message
 * 
 * @author InsightPulseAI Team
 * @version 1.0
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { promisify } = require('util');
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Constants
const PROJECT_ROOT = path.join(__dirname, '../..');
const JUICER_ROOT = path.join(__dirname, '..');
const INSIGHTS_DASHBOARD_SRC = path.join(JUICER_ROOT, 'dashboards/insights_dashboard.html');
const INSIGHTS_VISUALIZER_SRC = path.join(JUICER_ROOT, 'dashboards/insights_visualizer.js');
const DEPLOY_DIR = path.join(PROJECT_ROOT, 'deploy');
const DASHBOARD_TEMPLATES = {
  insights: path.join(JUICER_ROOT, 'dashboards/insights_dashboard.html'),
  retail: path.join(JUICER_ROOT, 'dashboards/retail_edge/retail_edge_dashboard.html'),
  operations: path.join(JUICER_ROOT, 'dashboards/ops/system_dashboard.html')
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    env: 'dev',
    generateInsights: false,
    skipCapture: false,
    azureDeploy: false,
    force: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--env' && i + 1 < args.length) {
      options.env = args[++i];
    } else if (arg === '--generate-insights') {
      options.generateInsights = true;
    } else if (arg === '--skip-capture') {
      options.skipCapture = true;
    } else if (arg === '--azure-deploy') {
      options.azureDeploy = true;
    } else if (arg === '--force') {
      options.force = true;
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
Deploy GenAI Insights Integration Script
---------------------------------------

This script deploys the GenAI insights integration across all three dashboards:
- Main insights dashboard
- Retail dashboard
- Operations dashboard

Usage: node deploy_genai_insights_integration.js [options]

Options:
  --env <environment>      Deployment environment (dev, staging, prod) (default: dev)
  --generate-insights      Generate insights using Databricks before deployment
  --skip-capture           Skip dashboard screenshot capture
  --azure-deploy           Deploy to Azure Static Web Apps (requires auth)
  --force                  Force deployment even if validation fails
  --help                   Show this help message

Examples:
  node deploy_genai_insights_integration.js --env staging
  node deploy_genai_insights_integration.js --env prod --generate-insights --azure-deploy
  `);
}

// Check if Docker is available
async function checkDockerAvailability() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if Databricks CLI is available
async function checkDatabricksAvailability() {
  try {
    execSync('databricks --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if Azure CLI is available
async function checkAzureAvailability() {
  try {
    execSync('az --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Validate dashboard files
async function validateDashboards() {
  console.log('Validating dashboard files...');
  
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check if dashboard files exist
  for (const [name, filePath] of Object.entries(DASHBOARD_TEMPLATES)) {
    try {
      await stat(filePath);
      console.log(`✓ ${name} dashboard found: ${filePath}`);
    } catch (error) {
      validationResults.errors.push(`Dashboard file not found: ${filePath}`);
      validationResults.isValid = false;
    }
  }

  // Check if insights visualizer exists
  try {
    await stat(INSIGHTS_VISUALIZER_SRC);
    console.log(`✓ Insights visualizer script found: ${INSIGHTS_VISUALIZER_SRC}`);
  } catch (error) {
    validationResults.errors.push(`Insights visualizer script not found: ${INSIGHTS_VISUALIZER_SRC}`);
    validationResults.isValid = false;
  }

  // Basic HTML validation (quick check for closing tags)
  for (const [name, filePath] of Object.entries(DASHBOARD_TEMPLATES)) {
    if (fs.existsSync(filePath)) {
      const content = await readFile(filePath, 'utf8');
      
      // Very basic HTML validation
      const openTags = (content.match(/<[^/!][^>]*>/g) || []).length;
      const closeTags = (content.match(/<\/[^>]*>/g) || []).length;
      
      if (openTags - closeTags > 5) { // Allow some self-closing tags
        validationResults.warnings.push(`${name} dashboard may have unclosed HTML tags (${openTags} opening vs ${closeTags} closing)`);
      }
      
      // Check for required elements
      if (!content.includes('<canvas') && !content.includes('<div id="chart')) {
        validationResults.warnings.push(`${name} dashboard does not appear to have chart elements`);
      }
      
      console.log(`✓ ${name} dashboard basic validation completed`);
    }
  }

  return validationResults;
}

// Generate insights using Databricks notebook
async function generateInsights(options) {
  console.log('Generating GenAI insights using Databricks...');
  
  const hasDatabricks = await checkDatabricksAvailability();
  
  if (!hasDatabricks) {
    console.log('Databricks CLI not found. Skipping insights generation.');
    return false;
  }
  
  try {
    // Format date ranges (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Build parameters for notebook
    const params = {
      date: startDate,
      end_date: endDate,
      env: options.env,
      model: 'claude',
      generate_dashboard: 'true'
    };
    
    // Construct parameters string for Databricks CLI
    const paramsStr = Object.entries(params)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    // Execute notebook using Databricks CLI
    const command = `databricks workspace run /Shared/InsightPulseAI/Juicer/juicer_gold_insights -o json --parameters ${paramsStr}`;
    
    console.log(`Running Databricks command: ${command}`);
    
    const output = execSync(command, { encoding: 'utf8' });
    
    try {
      const result = JSON.parse(output);
      console.log('Insights generation successful!');
      console.log(`Generated ${result.insights_generated} insights from ${result.processed_records} records`);
      return true;
    } catch (parseError) {
      console.error('Error parsing notebook output', parseError);
      return false;
    }
  } catch (error) {
    console.error(`Error executing Databricks notebook: ${error.message}`);
    return false;
  }
}

// Prepare the deployment directory
async function prepareDeploymentDirectory() {
  console.log('Preparing deployment directory...');
  
  // Create directory structure
  const directories = [
    DEPLOY_DIR,
    path.join(DEPLOY_DIR, 'dashboards'),
    path.join(DEPLOY_DIR, 'dashboards/retail_edge'),
    path.join(DEPLOY_DIR, 'dashboards/ops'),
    path.join(DEPLOY_DIR, 'dashboards/client-facing'),
    path.join(DEPLOY_DIR, 'js'),
    path.join(DEPLOY_DIR, 'styles'),
    path.join(DEPLOY_DIR, 'assets/data'),
    path.join(DEPLOY_DIR, 'images')
  ];
  
  for (const dir of directories) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}: ${error.message}`);
      throw error;
    }
  }
  
  // Copy dashboard styles and scripts
  const stylesheets = [
    { src: path.join(JUICER_ROOT, 'dashboards/styles/tbwa-charts.js'), dest: path.join(DEPLOY_DIR, 'styles/tbwa-charts.js') },
    { src: path.join(JUICER_ROOT, 'dashboards/styles/tbwa-theme.css'), dest: path.join(DEPLOY_DIR, 'styles/tbwa-theme.css') },
    { src: path.join(JUICER_ROOT, 'dashboards/styles/analysis-overview.css'), dest: path.join(DEPLOY_DIR, 'styles/analysis-overview.css') }
  ];
  
  // Copy additional assets
  try {
    // Create static web app config
    const staticWebAppConfig = {
      "routes": [
        {
          "route": "/images/*",
          "headers": {
            "cache-control": "public, max-age=86400"
          }
        },
        {
          "route": "/styles/*",
          "headers": {
            "cache-control": "public, max-age=86400"
          }
        },
        {
          "route": "/js/*",
          "headers": {
            "cache-control": "public, max-age=86400"
          }
        },
        {
          "route": "/assets/*",
          "headers": {
            "cache-control": "public, max-age=86400"
          }
        },
        {
          "route": "/*",
          "headers": {
            "cache-control": "no-cache"
          }
        }
      ],
      "navigationFallback": {
        "rewrite": "/index.html",
        "exclude": ["/images/*.{png,jpg,gif,svg}", "/styles/*.css", "/js/*.js"]
      }
    };
    
    await writeFile(
      path.join(DEPLOY_DIR, 'staticwebapp.config.json'),
      JSON.stringify(staticWebAppConfig, null, 2),
      'utf8'
    );
    
    for (const file of stylesheets) {
      await copyFile(file.src, file.dest);
    }
    
    // Copy insights visualizer
    await copyFile(
      INSIGHTS_VISUALIZER_SRC,
      path.join(DEPLOY_DIR, 'js/insights_visualizer.js')
    );
    
    // Copy sample data files if they exist
    const dataFiles = [
      { src: path.join(JUICER_ROOT, 'data/insights/metrics.json'), dest: path.join(DEPLOY_DIR, 'assets/data/metrics.json') },
      { src: path.join(JUICER_ROOT, 'data/insights/reports/sample_insight_001.json'), dest: path.join(DEPLOY_DIR, 'assets/data/insights_data.json') }
    ];
    
    for (const file of dataFiles) {
      if (fs.existsSync(file.src)) {
        await copyFile(file.src, file.dest);
      } else {
        console.log(`Warning: Data file not found: ${file.src}`);
      }
    }
    
    console.log('✓ Deployment directory prepared successfully');
    return true;
  } catch (error) {
    console.error(`Error copying assets: ${error.message}`);
    return false;
  }
}

// Integrate GenAI insights into dashboards
async function integrateInsights() {
  console.log('Integrating GenAI insights into dashboards...');
  
  // Read the insights visualizer script
  const visualizerScript = await readFile(INSIGHTS_VISUALIZER_SRC, 'utf8');
  
  // Start with the main insights dashboard
  try {
    // Copy main insights dashboard directly - it already has the integration
    await copyFile(
      INSIGHTS_DASHBOARD_SRC,
      path.join(DEPLOY_DIR, 'dashboards/insights_dashboard.html')
    );
    
    console.log('✓ Main insights dashboard copied successfully');
  } catch (error) {
    console.error(`Error copying main insights dashboard: ${error.message}`);
    return false;
  }
  
  // Read dashboard templates
  const dashboards = {};
  for (const [name, filePath] of Object.entries(DASHBOARD_TEMPLATES)) {
    if (fs.existsSync(filePath)) {
      dashboards[name] = await readFile(filePath, 'utf8');
    }
  }
  
  // Common GenAI insights section to inject into dashboards
  const insightsWidget = `
  <!-- GenAI Insights Section -->
  <div class="row mb-4">
    <div class="col-12">
      <div class="card">
        <div class="card-header bg-white">
          <h5 class="card-title mb-0">
            <i class="fas fa-lightbulb text-warning me-2"></i>
            GenAI Insights
          </h5>
        </div>
        <div class="card-body">
          <div id="genai-insights-container">
            <div class="row" id="insightsCardsContainer">
              <!-- Insights cards will be dynamically inserted here -->
              <div class="col-md-6 mb-3">
                <div class="card card-insight-general">
                  <div class="card-header">
                    <span class="badge bg-light text-dark me-2">Loading</span>
                    Fetching insights...
                  </div>
                  <div class="card-body">
                    <p>Loading GenAI insights from data source...</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="text-center mt-3">
              <button class="btn btn-outline-primary" id="loadMoreInsightsBtn">
                <i class="fas fa-sync-alt me-1"></i> Load More Insights
              </button>
              <a href="insights_dashboard.html" class="btn btn-link ms-2">
                <i class="fas fa-external-link-alt me-1"></i> Full Insights Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  
  // Script to initialize insights
  const insightsInitScript = `
  <script src="../js/insights_visualizer.js"></script>
  <script>
    // Initialize insights visualizer when document is ready
    document.addEventListener('DOMContentLoaded', function() {
      // Create insights visualizer instance
      if (window.InsightsVisualizer) {
        new InsightsVisualizer({
          apiEndpoint: '../assets/data/insights_data.json',
          refreshInterval: 300000, // 5 minutes
          container: '#insightsCardsContainer',
          maxCards: 4, // Show only 4 cards in the widget
          theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
        });
        
        // Handle load more button
        document.getElementById('loadMoreInsightsBtn').addEventListener('click', function() {
          window.location.href = 'insights_dashboard.html';
        });
      } else {
        console.error('InsightsVisualizer not loaded');
      }
    });
  </script>`;
  
  // Integrate GenAI insights into retail dashboard
  if (dashboards.retail) {
    try {
      let retailDashboard = dashboards.retail;
      
      // Find position to insert insights (before the last closing div or before footer)
      const insertPosition = retailDashboard.lastIndexOf('</main>');
      if (insertPosition !== -1) {
        // Insert insights widget before the closing main tag
        retailDashboard = retailDashboard.substring(0, insertPosition) + 
                         insightsWidget + 
                         retailDashboard.substring(insertPosition);
      }
      
      // Add insights initializer script before closing body tag
      const bodyClosePosition = retailDashboard.lastIndexOf('</body>');
      if (bodyClosePosition !== -1) {
        retailDashboard = retailDashboard.substring(0, bodyClosePosition) + 
                        insightsInitScript + 
                        retailDashboard.substring(bodyClosePosition);
      }
      
      // Write integrated dashboard
      await writeFile(
        path.join(DEPLOY_DIR, 'dashboards/retail_edge/retail_edge_dashboard.html'),
        retailDashboard,
        'utf8'
      );
      
      console.log('✓ Retail dashboard integrated successfully');
    } catch (error) {
      console.error(`Error integrating retail dashboard: ${error.message}`);
      return false;
    }
  } else {
    console.log('Warning: Retail dashboard template not found');
  }
  
  // Integrate GenAI insights into operations dashboard
  if (dashboards.operations) {
    try {
      let opsDashboard = dashboards.operations;
      
      // Find position to insert insights (before system health monitoring)
      let insertPosition = opsDashboard.indexOf('<!-- System Health Monitoring -->');
      if (insertPosition === -1) {
        // Alternative: try to find another landmark
        insertPosition = opsDashboard.indexOf('<div class="row mb-4">');
      }
      
      if (insertPosition !== -1) {
        // Insert insights widget at the found position
        opsDashboard = opsDashboard.substring(0, insertPosition) + 
                      insightsWidget + 
                      opsDashboard.substring(insertPosition);
      } else {
        // If no good insertion point found, add it before closing main
        const mainClosePosition = opsDashboard.lastIndexOf('</main>');
        if (mainClosePosition !== -1) {
          opsDashboard = opsDashboard.substring(0, mainClosePosition) + 
                        insightsWidget + 
                        opsDashboard.substring(mainClosePosition);
        }
      }
      
      // Add insights initializer script before closing body tag
      const bodyClosePosition = opsDashboard.lastIndexOf('</body>');
      if (bodyClosePosition !== -1) {
        opsDashboard = opsDashboard.substring(0, bodyClosePosition) + 
                      insightsInitScript + 
                      opsDashboard.substring(bodyClosePosition);
      }
      
      // Write integrated dashboard
      await writeFile(
        path.join(DEPLOY_DIR, 'dashboards/ops/system_dashboard.html'),
        opsDashboard,
        'utf8'
      );
      
      console.log('✓ Operations dashboard integrated successfully');
    } catch (error) {
      console.error(`Error integrating operations dashboard: ${error.message}`);
      return false;
    }
  } else {
    console.log('Warning: Operations dashboard template not found');
  }
  
  // Create a simple index file at the root to navigate between dashboards
  try {
    const currentEnv = options ? options.env : 'dev';
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Juicer GenAI Insights Dashboard</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css">
    <link rel="stylesheet" href="styles/tbwa-theme.css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            text-align: center;
            background-color: #f5f5f5;
        }
        h1 { color: #002b49; }
        .dashboard-links {
            display: flex;
            flex-direction: column;
            max-width: 600px;
            margin: 30px auto;
        }
        .dashboard-link {
            margin: 10px 0;
            padding: 15px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-decoration: none;
            color: #333;
            font-weight: bold;
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            align-items: center;
        }
        .dashboard-link:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.1);
        }
        .dashboard-icon {
            margin-right: 15px;
            background-color: #f89e1b;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .footer {
            margin-top: 40px;
            font-size: 0.8rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Juicer GenAI Insights Dashboard</h1>
        <p class="lead">Access the available dashboards below:</p>

        <div class="dashboard-links">
            <a class="dashboard-link" href="dashboards/insights_dashboard.html">
                <div class="dashboard-icon"><i class="fas fa-lightbulb"></i></div>
                <div>
                    <div>GenAI Insights Dashboard</div>
                    <small class="text-muted">AI-generated insights from transcript data</small>
                </div>
            </a>
            <a class="dashboard-link" href="dashboards/retail_edge/retail_edge_dashboard.html">
                <div class="dashboard-icon"><i class="fas fa-store"></i></div>
                <div>
                    <div>Retail Edge Dashboard</div>
                    <small class="text-muted">Retail performance metrics and insights</small>
                </div>
            </a>
            <a class="dashboard-link" href="dashboards/ops/system_dashboard.html">
                <div class="dashboard-icon"><i class="fas fa-server"></i></div>
                <div>
                    <div>Operations Dashboard</div>
                    <small class="text-muted">System health and operational metrics</small>
                </div>
            </a>
        </div>

        <div class="footer">
            <p>&copy; 2025 Juicer GenAI Insights • Powered by InsightPulseAI</p>
            <p>Environment: ${currentEnv}</p>
        </div>
    </div>
</body>
</html>`;
    
    await writeFile(path.join(DEPLOY_DIR, 'index.html'), indexHtml, 'utf8');
    console.log('✓ Index page created successfully');
    
    return true;
  } catch (error) {
    console.error(`Error creating index page: ${error.message}`);
    return false;
  }
}

// Run the dashboard screenshot capture tool
async function captureDashboardScreenshots() {
  console.log('Capturing dashboard screenshots...');
  
  // Check if screenshot tools exist
  const captureScript = path.join(JUICER_ROOT, 'tools/shogun_dashboard_capture.sh');
  const thumbnailScript = path.join(JUICER_ROOT, 'tools/generate_thumbnails.sh');
  
  if (!fs.existsSync(captureScript)) {
    console.error(`Screenshot capture script not found: ${captureScript}`);
    return false;
  }
  
  if (!fs.existsSync(thumbnailScript)) {
    console.error(`Thumbnail generator script not found: ${thumbnailScript}`);
    return false;
  }
  
  try {
    // Create required directories
    const directories = [
      path.join(JUICER_ROOT, 'assets/screenshots'),
      path.join(JUICER_ROOT, 'assets/thumbnails'),
      path.join(JUICER_ROOT, 'assets/reports'),
      path.join(JUICER_ROOT, 'docs/images/archive')
    ];
    
    for (const dir of directories) {
      await mkdir(dir, { recursive: true });
    }
    
    // Make scripts executable
    execSync(`chmod +x ${captureScript}`);
    execSync(`chmod +x ${thumbnailScript}`);
    
    // Start a simple HTTP server to serve the dashboard
    const server = require('http').createServer((req, res) => {
      // Handle requests for different files
      let filePath;
      
      if (req.url === '/' || req.url === '/index.html') {
        filePath = path.join(DEPLOY_DIR, 'index.html');
      } else {
        filePath = path.join(DEPLOY_DIR, req.url);
      }
      
      // Determine content type
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'text/html';
      
      if (ext === '.js') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg') contentType = 'image/jpeg';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      
      // Read and serve the file
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });
    
    // Start server on port 9090
    await new Promise(resolve => {
      server.listen(9090, () => {
        console.log('Preview server started at http://localhost:9090');
        resolve();
      });
    });
    
    // Use the capture script to take screenshots
    console.log('Taking screenshots...');
    
    // Change to tools directory and run the script
    process.chdir(path.join(JUICER_ROOT, 'tools'));
    execSync('./shogun_dashboard_capture.sh http://localhost:9090', { stdio: 'inherit' });
    
    // Generate thumbnails
    execSync('./generate_thumbnails.sh', { stdio: 'inherit' });
    
    // Copy screenshots to deployment directory
    const screenshotsDir = path.join(JUICER_ROOT, 'assets/screenshots');
    const thumbnailsDir = path.join(JUICER_ROOT, 'assets/thumbnails');
    const destScreenshotsDir = path.join(DEPLOY_DIR, 'assets/screenshots');
    const destThumbnailsDir = path.join(DEPLOY_DIR, 'assets/thumbnails');
    
    // Create destination directories
    await mkdir(destScreenshotsDir, { recursive: true });
    await mkdir(destThumbnailsDir, { recursive: true });
    
    // Copy screenshots and thumbnails
    const screenshots = await readdir(screenshotsDir);
    for (const file of screenshots) {
      await copyFile(
        path.join(screenshotsDir, file),
        path.join(destScreenshotsDir, file)
      );
    }
    
    const thumbnails = await readdir(thumbnailsDir);
    for (const file of thumbnails) {
      await copyFile(
        path.join(thumbnailsDir, file),
        path.join(destThumbnailsDir, file)
      );
    }
    
    // Close the server
    server.close();
    
    console.log('✓ Dashboard screenshots captured successfully');
    return true;
  } catch (error) {
    console.error(`Error capturing screenshots: ${error.message}`);
    return false;
  }
}

// Deploy to Azure Static Web Apps
async function deployToAzure(options) {
  console.log('Deploying to Azure Static Web Apps...');
  
  const hasAzure = await checkAzureAvailability();
  
  if (!hasAzure) {
    console.error('Azure CLI not found. Deployment to Azure skipped.');
    return false;
  }
  
  try {
    // Set Azure Static Web App name based on environment
    let staticWebAppName;
    
    if (options.env === 'prod') {
      staticWebAppName = 'tbwa-juicer-insights-dashboard';
    } else if (options.env === 'staging') {
      staticWebAppName = 'staging-juicer-insights-dashboard';
    } else {
      staticWebAppName = 'dev-juicer-insights-dashboard';
    }
    
    const resourceGroup = 'RG-TBWA-ProjectScout-Juicer';
    
    // Try to get deployment token from environment or prompt user
    let deploymentToken = process.env.AZURE_STATIC_WEB_APPS_API_TOKEN;
    
    if (!deploymentToken) {
      console.error('Azure Static Web Apps deployment token not found in environment.');
      console.error('Hint: Set AZURE_STATIC_WEB_APPS_API_TOKEN environment variable.');
      
      try {
        // Try to get token from Azure Key Vault using CLI
        console.log('Attempting to get token from Azure Key Vault...');
        
        deploymentToken = execSync(
          `az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv`,
          { encoding: 'utf8' }
        ).trim();
        
        if (!deploymentToken) {
          console.error('Failed to get deployment token from Key Vault');
          return false;
        }
        
        console.log('Retrieved deployment token from Key Vault');
      } catch (error) {
        console.error(`Failed to get deployment token: ${error.message}`);
        return false;
      }
    }
    
    // Deploy to Azure Static Web App
    console.log(`Deploying to Static Web App: ${staticWebAppName}`);
    
    execSync(
      `az staticwebapp deploy --name "${staticWebAppName}" --resource-group "${resourceGroup}" --source "${DEPLOY_DIR}" --token "${deploymentToken}" --no-build`,
      { stdio: 'inherit' }
    );
    
    // Get Static Web App URL
    const staticWebAppUrl = execSync(
      `az staticwebapp show --name "${staticWebAppName}" --resource-group "${resourceGroup}" --query "defaultHostname" -o tsv`,
      { encoding: 'utf8' }
    ).trim();
    
    console.log(`✓ Deployment successful! Static Web App URL: https://${staticWebAppUrl}`);
    return true;
  } catch (error) {
    console.error(`Error deploying to Azure: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('\n=== GenAI Insights Integration Deployment ===\n');
  
  // Parse command line arguments
  const options = parseArgs();
  
  console.log(`Environment: ${options.env}`);
  console.log(`Generate insights: ${options.generateInsights}`);
  console.log(`Skip screenshot capture: ${options.skipCapture}`);
  console.log(`Deploy to Azure: ${options.azureDeploy}`);
  
  try {
    // Validate dashboards
    const validationResults = await validateDashboards();
    
    if (!validationResults.isValid && !options.force) {
      console.error('Dashboard validation failed:');
      validationResults.errors.forEach(error => console.error(`- ${error}`));
      validationResults.warnings.forEach(warning => console.warn(`- ${warning}`));
      
      console.error('\nDeployment aborted due to validation errors.');
      console.error('Use --force to deploy anyway.');
      process.exit(1);
    } else if (validationResults.warnings.length > 0) {
      console.warn('Dashboard validation warnings:');
      validationResults.warnings.forEach(warning => console.warn(`- ${warning}`));
      console.log('Continuing with deployment...');
    }
    
    // Generate insights if requested
    if (options.generateInsights) {
      const insightsSuccess = await generateInsights(options);
      
      if (!insightsSuccess && !options.force) {
        console.error('Failed to generate insights. Deployment aborted.');
        console.error('Use --force to deploy anyway.');
        process.exit(1);
      }
    }
    
    // Prepare deployment directory
    const prepSuccess = await prepareDeploymentDirectory();
    
    if (!prepSuccess) {
      console.error('Failed to prepare deployment directory. Deployment aborted.');
      process.exit(1);
    }
    
    // Integrate insights into dashboards
    const integrationSuccess = await integrateInsights(options);
    
    if (!integrationSuccess) {
      console.error('Failed to integrate insights into dashboards. Deployment aborted.');
      process.exit(1);
    }
    
    // Capture dashboard screenshots
    if (!options.skipCapture) {
      const captureSuccess = await captureDashboardScreenshots();
      
      if (!captureSuccess && !options.force) {
        console.warn('Failed to capture dashboard screenshots.');
        console.warn('Continuing with deployment...');
      }
    }
    
    // Deploy to Azure if requested
    if (options.azureDeploy) {
      const deploySuccess = await deployToAzure(options);
      
      if (!deploySuccess && !options.force) {
        console.error('Failed to deploy to Azure. Deployment aborted.');
        process.exit(1);
      }
    }
    
    console.log('\n=== Deployment Summary ===');
    console.log(`Environment: ${options.env}`);
    console.log(`Deployment directory: ${DEPLOY_DIR}`);
    
    if (options.azureDeploy) {
      let staticWebAppName;
      
      if (options.env === 'prod') {
        staticWebAppName = 'tbwa-juicer-insights-dashboard';
      } else if (options.env === 'staging') {
        staticWebAppName = 'staging-juicer-insights-dashboard';
      } else {
        staticWebAppName = 'dev-juicer-insights-dashboard';
      }
      
      const resourceGroup = 'RG-TBWA-ProjectScout-Juicer';
      
      try {
        const staticWebAppUrl = execSync(
          `az staticwebapp show --name "${staticWebAppName}" --resource-group "${resourceGroup}" --query "defaultHostname" -o tsv`,
          { encoding: 'utf8' }
        ).trim();
        
        console.log(`Azure Static Web App URL: https://${staticWebAppUrl}`);
      } catch (error) {
        console.log('Azure Static Web App URL: <Unable to retrieve URL>');
      }
    }
    
    console.log('\nDeployment complete! 🚀');
  } catch (error) {
    console.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  validateDashboards,
  generateInsights,
  prepareDeploymentDirectory,
  integrateInsights,
  captureDashboardScreenshots,
  deployToAzure
};