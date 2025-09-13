#!/usr/bin/env node
/**
 * Deploy GenAI Insights Across All Dashboards
 * 
 * This script integrates the GenAI insights component across all dashboards
 * in the Juicer stack, preparing them for deployment.
 * 
 * Usage: node deploy_insights_all_dashboards.js [--env dev|staging|prod]
 * 
 * Author: InsightPulseAI Team
 * Version: 1.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(path.join(__dirname, '../..'));
const JUICER_ROOT = path.resolve(path.join(__dirname, '..'));
const DEPLOY_DIR = path.join(PROJECT_ROOT, 'deploy');
const DASHBOARDS = {
  main: path.join(JUICER_ROOT, 'dashboards/insights_dashboard.html'),
  retail: path.join(JUICER_ROOT, 'dashboards/retail_edge/retail_edge_dashboard.html'),
  operations: path.join(JUICER_ROOT, 'dashboards/ops/system_dashboard.html')
};
const VISUALIZER_JS = path.join(JUICER_ROOT, 'dashboards/insights_visualizer.js');

// Parse command line arguments
const args = process.argv.slice(2);
let env = 'dev';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--env' && i + 1 < args.length) {
    env = args[i + 1];
    i++;
  }
}

console.log(`Deploying insights for environment: ${env}`);

// Setup deployment directories
function setupDirectories() {
  console.log('Setting up deployment directories...');
  
  const dirs = [
    DEPLOY_DIR,
    path.join(DEPLOY_DIR, 'dashboards'),
    path.join(DEPLOY_DIR, 'dashboards/retail_edge'),
    path.join(DEPLOY_DIR, 'dashboards/ops'),
    path.join(DEPLOY_DIR, 'js'),
    path.join(DEPLOY_DIR, 'styles'),
    path.join(DEPLOY_DIR, 'assets/data')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  console.log('✓ Deployment directories created');
}

// Copy basic assets
function copyAssets() {
  console.log('Copying assets...');
  
  // Copy JS files
  fs.copyFileSync(
    VISUALIZER_JS,
    path.join(DEPLOY_DIR, 'js/insights_visualizer.js')
  );
  
  // Copy style files if they exist
  const styleFiles = [
    { src: path.join(JUICER_ROOT, 'dashboards/styles/tbwa-theme.css'), dest: path.join(DEPLOY_DIR, 'styles/tbwa-theme.css') },
    { src: path.join(JUICER_ROOT, 'dashboards/styles/analysis-overview.css'), dest: path.join(DEPLOY_DIR, 'styles/analysis-overview.css') }
  ];
  
  for (const file of styleFiles) {
    if (fs.existsSync(file.src)) {
      fs.copyFileSync(file.src, file.dest);
    }
  }
  
  // Create sample data if needed
  const sampleData = {
    metadata: {
      generated_at: new Date().toISOString(),
      time_period: '2025-04-15 to 2025-05-15',
      model: 'claude-3-sonnet-20240229',
      insights_count: 124
    },
    insights: [
      {
        id: 'ins001',
        type: 'general',
        title: 'Increasing focus on value meals across all demographics',
        text: 'Analysis of 327 transcripts reveals that 64% of customers mention value when discussing meal options. This represents an increasing trend compared to previous periods.',
        confidence: 0.85,
        brands: ['Jollibee', 'McDonald\'s', 'KFC'],
        tags: ['pricing', 'value', 'economy', 'family'],
        date: '2025-05-02'
      },
      {
        id: 'ins002',
        type: 'brand',
        title: 'Brand loyalty stronger for customers using rewards programs',
        text: 'Data from recent interactions shows Jollibee is frequently associated with loyalty programs, with 78% of mentions having positive sentiment.',
        confidence: 0.92,
        brands: ['Jollibee'],
        tags: ['loyalty', 'rewards', 'app', 'repeat'],
        date: '2025-05-03'
      },
      {
        id: 'ins003',
        type: 'sentiment',
        title: 'Positive sentiment toward expanded vegetarian options',
        text: 'A recurring theme in 32% of analyzed conversations is the connection between vegetarian menu options and positive sentiment.',
        confidence: 0.76,
        brands: ['KFC', 'Burger King'],
        tags: ['vegetarian', 'health', 'menu', 'alternatives'],
        date: '2025-05-05'
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(DEPLOY_DIR, 'assets/data/insights_data.json'),
    JSON.stringify(sampleData, null, 2)
  );
  
  console.log('✓ Assets copied successfully');
}

// Process main insights dashboard
function processMainDashboard() {
  console.log('Processing main insights dashboard...');
  
  if (!fs.existsSync(DASHBOARDS.main)) {
    console.error(`Main dashboard not found: ${DASHBOARDS.main}`);
    return false;
  }
  
  // Just copy the main dashboard (it already has the integration)
  fs.copyFileSync(
    DASHBOARDS.main,
    path.join(DEPLOY_DIR, 'dashboards/insights_dashboard.html')
  );
  
  console.log('✓ Main dashboard processed');
  return true;
}

// Process retail dashboard
function processRetailDashboard() {
  console.log('Processing retail dashboard...');
  
  if (!fs.existsSync(DASHBOARDS.retail)) {
    console.error(`Retail dashboard not found: ${DASHBOARDS.retail}`);
    return false;
  }
  
  // Read retail dashboard
  let retailContent = fs.readFileSync(DASHBOARDS.retail, 'utf8');
  
  // GenAI insights widget to insert
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
            <a href="../insights_dashboard.html" class="btn btn-link ms-2">
              <i class="fas fa-external-link-alt me-1"></i> Full Insights Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;
  
  // Script to initialize insights
  const insightsScript = `
<script src="../../js/insights_visualizer.js"></script>
<script>
  // Initialize insights visualizer
  document.addEventListener('DOMContentLoaded', function() {
    if (window.InsightsVisualizer) {
      new InsightsVisualizer({
        apiEndpoint: '../../assets/data/insights_data.json',
        refreshInterval: 300000, // 5 minutes
        container: '#insightsCardsContainer',
        maxCards: 4, // Show only 4 cards in the widget
        theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
      });
      
      // Handle load more button
      document.getElementById('loadMoreInsightsBtn').addEventListener('click', function() {
        window.location.href = '../insights_dashboard.html';
      });
    } else {
      console.error('InsightsVisualizer not loaded');
    }
  });
</script>`;
  
  // Find insertion points
  const mainCloseTag = retailContent.lastIndexOf('</main>');
  const bodyCloseTag = retailContent.lastIndexOf('</body>');
  
  // Insert insights widget before main close tag
  if (mainCloseTag !== -1) {
    retailContent = 
      retailContent.substring(0, mainCloseTag) + 
      insightsWidget + 
      retailContent.substring(mainCloseTag);
  }
  
  // Insert script before body close tag
  if (bodyCloseTag !== -1) {
    retailContent = 
      retailContent.substring(0, bodyCloseTag) + 
      insightsScript + 
      retailContent.substring(bodyCloseTag);
  }
  
  // Write modified file
  fs.writeFileSync(
    path.join(DEPLOY_DIR, 'dashboards/retail_edge/retail_edge_dashboard.html'),
    retailContent
  );
  
  console.log('✓ Retail dashboard processed');
  return true;
}

// Process operations dashboard
function processOperationsDashboard() {
  console.log('Processing operations dashboard...');
  
  if (!fs.existsSync(DASHBOARDS.operations)) {
    console.error(`Operations dashboard not found: ${DASHBOARDS.operations}`);
    return false;
  }
  
  // Read operations dashboard
  let opsContent = fs.readFileSync(DASHBOARDS.operations, 'utf8');
  
  // GenAI insights widget to insert
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
            <a href="../insights_dashboard.html" class="btn btn-link ms-2">
              <i class="fas fa-external-link-alt me-1"></i> Full Insights Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;
  
  // Script to initialize insights
  const insightsScript = `
<script src="../../js/insights_visualizer.js"></script>
<script>
  // Initialize insights visualizer
  document.addEventListener('DOMContentLoaded', function() {
    if (window.InsightsVisualizer) {
      new InsightsVisualizer({
        apiEndpoint: '../../assets/data/insights_data.json',
        refreshInterval: 300000, // 5 minutes
        container: '#insightsCardsContainer',
        maxCards: 4, // Show only 4 cards in the widget
        theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
      });
      
      // Handle load more button
      document.getElementById('loadMoreInsightsBtn').addEventListener('click', function() {
        window.location.href = '../insights_dashboard.html';
      });
    } else {
      console.error('InsightsVisualizer not loaded');
    }
  });
</script>`;
  
  // Find insertion points - first look for system health monitoring section
  let insertPosition = opsContent.indexOf('<!-- System Health Monitoring -->');
  
  // If not found, look for a row element
  if (insertPosition === -1) {
    insertPosition = opsContent.indexOf('<div class="row mb-4">');
  }
  
  // If still not found, just put it before main closes
  if (insertPosition === -1) {
    insertPosition = opsContent.lastIndexOf('</main>');
  }
  
  // If we found a position, insert the widget
  if (insertPosition !== -1) {
    opsContent = 
      opsContent.substring(0, insertPosition) + 
      insightsWidget + 
      opsContent.substring(insertPosition);
  }
  
  // Insert script before body close tag
  const bodyCloseTag = opsContent.lastIndexOf('</body>');
  if (bodyCloseTag !== -1) {
    opsContent = 
      opsContent.substring(0, bodyCloseTag) + 
      insightsScript + 
      opsContent.substring(bodyCloseTag);
  }
  
  // Write modified file
  fs.writeFileSync(
    path.join(DEPLOY_DIR, 'dashboards/ops/system_dashboard.html'),
    opsContent
  );
  
  console.log('✓ Operations dashboard processed');
  return true;
}

// Create an index file
function createIndexFile() {
  console.log('Creating index file...');
  
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
            <p>Environment: ${env}</p>
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(DEPLOY_DIR, 'index.html'), indexHtml);
  
  console.log('✓ Index file created');
  return true;
}

// Create Azure Static Web App config
function createStaticWebAppConfig() {
  console.log('Creating Static Web App config...');
  
  const config = {
    "routes": [
      {
        "route": "/api/*",
        "methods": ["GET"],
        "allowedRoles": ["anonymous"]
      },
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
  
  fs.writeFileSync(
    path.join(DEPLOY_DIR, 'staticwebapp.config.json'),
    JSON.stringify(config, null, 2)
  );
  
  console.log('✓ Static Web App config created');
  return true;
}

// Main function
async function main() {
  console.log(`=== Deploying GenAI Insights Integration for ${env} ===\n`);
  
  // Stop if deployment directory already exists
  if (fs.existsSync(DEPLOY_DIR)) {
    console.log('Cleaning existing deployment directory...');
    fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
  }
  
  // Create deployment structure
  setupDirectories();
  
  // Copy assets
  copyAssets();
  
  // Process dashboards
  const mainSuccess = processMainDashboard();
  const retailSuccess = processRetailDashboard();
  const opsSuccess = processOperationsDashboard();
  
  // Create index file
  const indexSuccess = createIndexFile();
  
  // Create Azure config
  createStaticWebAppConfig();
  
  // Summary
  console.log('\n=== Deployment Summary ===');
  console.log(`Environment: ${env}`);
  console.log(`Main dashboard: ${mainSuccess ? '✓' : '✗'}`);
  console.log(`Retail dashboard: ${retailSuccess ? '✓' : '✗'}`);
  console.log(`Operations dashboard: ${opsSuccess ? '✓' : '✗'}`);
  console.log(`Index file: ${indexSuccess ? '✓' : '✗'}`);
  console.log(`Deployment directory: ${DEPLOY_DIR}`);
  
  console.log('\nTo view the dashboards locally:');
  console.log('1. cd to the deployment directory');
  console.log('2. Start a web server, e.g.: npx http-server');
  console.log('3. Open your browser at http://localhost:8080');
  
  console.log('\nTo deploy to Azure:');
  console.log(`az staticwebapp deploy --name "juicer-insights-${env}" --source "${DEPLOY_DIR}" --token "<deployment-token>" --no-build`);
  
  console.log('\nDeployment complete! 🚀');
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});