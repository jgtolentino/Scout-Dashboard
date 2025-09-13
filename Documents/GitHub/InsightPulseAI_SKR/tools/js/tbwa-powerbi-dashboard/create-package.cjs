const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define directories and package name
const deployDir = path.join(__dirname, 'deploy-powerbi');
const buildDir = path.join(__dirname, 'dist');
const packageName = 'tbwa-powerbi-dashboard.zip';

// Ensure the deploy directory exists
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir, { recursive: true });
  console.log(`Created deploy directory: ${deployDir}`);
}

// Function to run build if needed
function ensureBuildExists() {
  if (!fs.existsSync(buildDir) || fs.readdirSync(buildDir).length === 0) {
    console.log('Build folder not found or empty, running build...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('Build completed successfully.');
    } catch (error) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Using existing build files.');
  }
}

// Function to copy build files to deploy directory
function copyBuildFiles() {
  try {
    // Clear any existing files in the deploy directory
    if (fs.existsSync(deployDir)) {
      fs.readdirSync(deployDir).forEach(file => {
        const filePath = path.join(deployDir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    // Copy build files to deploy directory
    fs.readdirSync(buildDir).forEach(file => {
      const srcPath = path.join(buildDir, file);
      const destPath = path.join(deployDir, file);
      
      if (fs.lstatSync(srcPath).isDirectory()) {
        // For directories, create the directory and copy recursively
        fs.mkdirSync(destPath, { recursive: true });
        copyDirRecursive(srcPath, destPath);
      } else {
        // For files, just copy
        fs.copyFileSync(srcPath, destPath);
      }
    });
    
    console.log('Build files copied to deploy directory.');
  } catch (error) {
    console.error('Error copying build files:', error.message);
    process.exit(1);
  }
}

// Recursive directory copy
function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Create staticwebapp.config.json for proper routing
function createStaticWebAppConfig() {
  const config = {
    "routes": [
      { "route": "/advisor", "rewrite": "/advisor.html" },
      { "route": "/edge", "rewrite": "/edge.html" },
      { "route": "/ops", "rewrite": "/ops.html" },
      { "route": "/powerbi", "rewrite": "/index.html?powerbi=true" }
    ],
    "navigationFallback": {
      "rewrite": "/index.html",
      "exclude": ["/assets/*", "/css/*", "/js/*", "/images/*"]
    },
    "globalHeaders": {
      "cache-control": "max-age=3600",
      "X-Frame-Options": "SAMEORIGIN"
    },
    "responseOverrides": {
      "404": {
        "rewrite": "/index.html",
        "statusCode": 200
      }
    }
  };
  
  fs.writeFileSync(
    path.join(deployDir, 'staticwebapp.config.json'),
    JSON.stringify(config, null, 2)
  );
  
  console.log('Created staticwebapp.config.json');
}

// Create a deployment success file
function createDeploymentReadme() {
  const content = `# TBWA Power BI Dashboard - Deployment Package

This folder contains a deployment-ready version of the TBWA Power BI Dashboard.

## Deployment Instructions

1. Upload this entire folder to Azure Static Web App
2. Access the Power BI dashboard at: https://<your-site>.azurestaticapps.net/powerbi

## Features Added

- Complete Power BI UI integration
- Multiple data source support (simulated, API, Power BI)
- Tabbed navigation interface
- Enhanced filter pane
- Real-time data indicators
- Export options for Power BI

Deployment Date: ${new Date().toISOString().split('T')[0]}
  `;
  
  fs.writeFileSync(
    path.join(deployDir, 'README.md'),
    content
  );
  
  console.log('Created deployment README.md');
}

// Main execution
console.log('Starting PowerBI Dashboard deployment package creation...');
ensureBuildExists();
copyBuildFiles();
createStaticWebAppConfig();
createDeploymentReadme();
console.log(`\nDeployment package created successfully!`);
console.log(`Files are available in: ${deployDir}`);
console.log(`\nTo deploy to Azure Static Web Apps:`);
console.log('1. Go to Azure Portal and create a new Static Web App');
console.log('2. Navigate to your Static Web App resource');
console.log('3. Click on "Deployment" -> "Manual Upload"');
console.log('4. Upload the entire deploy-powerbi folder');
console.log('5. Access your Power BI dashboard at: https://your-site.azurestaticapps.net/powerbi');