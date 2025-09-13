// dash.deploy.js - Optimized deployment handler for the Dash agent
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

/**
 * Dashboard deployment handler for the Dash agent
 * @param {object} options Configuration options
 * @param {string} options.route Route name (e.g., "advisor", "edge", "ops")
 * @param {boolean} options.hotDeploy Use hot deployment mode
 * @param {boolean} options.skipBuild Skip build phase
 * @param {boolean} options.dryRun Don't actually deploy, just show what would be done
 * @param {string} options.deployEnv Deployment environment (dev/test/prod)
 */
async function deployDashboard(options) {
  const {
    route = 'advisor',
    hotDeploy = false,
    skipBuild = false,
    dryRun = false,
    deployEnv = 'prod',
  } = options;
  
  console.log(`🚀 Dash deploying ${route} dashboard to ${deployEnv}...`);
  
  // Base directories
  const repoRoot = '/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js';
  const sourceDir = path.join(repoRoot, `mockify-${route}-ui`);
  const deployDir = path.join(repoRoot, 'deploy-ready');
  const toolkitDir = path.join(repoRoot, 'tools/cli/deploy_optimize');
  
  // Check source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`);
    return { 
      success: false, 
      error: `Source directory not found: ${sourceDir}` 
    };
  }
  
  // Analysis variables
  let shouldBuild = !skipBuild;
  let hashChanged = true;
  
  // Hash verification to check if build is necessary
  if (shouldBuild) {
    try {
      const hashFilePath = path.join(repoRoot, `.${route}-build-hash`);
      const sourceFiles = execSync(`find ${sourceDir}/src -type f -not -path "*/node_modules/*" | sort`).toString().split('\n').filter(Boolean);
      
      // Calculate current source hash
      const hasher = crypto.createHash('sha256');
      for (const file of sourceFiles) {
        if (fs.existsSync(file)) {
          hasher.update(fs.readFileSync(file));
        }
      }
      const currentHash = hasher.digest('hex');
      
      // Compare with previous hash
      if (fs.existsSync(hashFilePath)) {
        const previousHash = fs.readFileSync(hashFilePath, 'utf-8').trim();
        if (previousHash === currentHash) {
          console.log('✅ Source code unchanged. Skipping build.');
          shouldBuild = false;
          hashChanged = false;
        } else {
          console.log('🔄 Source code changed. Build required.');
          // Save new hash
          fs.writeFileSync(hashFilePath, currentHash);
        }
      } else {
        console.log('📝 No previous hash record. Build required.');
        // Save initial hash
        fs.writeFileSync(hashFilePath, currentHash);
      }
    } catch (error) {
      console.warn(`⚠️ Hash verification failed: ${error.message}`);
      // Continue with build as a fallback
    }
  }
  
  // Set up Vite cache config
  if (shouldBuild) {
    try {
      const viteConfigPath = path.join(sourceDir, 'vite.config.ts');
      if (fs.existsSync(viteConfigPath)) {
        const viteCache = require('./vite_cache_config');
        viteCache.addViteCacheConfig(viteConfigPath);
      }
    } catch (error) {
      console.warn(`⚠️ Could not configure Vite cache: ${error.message}`);
    }
  }
  
  // Build if needed
  if (shouldBuild) {
    console.log(`🏗️ Building ${route} dashboard...`);
    
    if (!dryRun) {
      try {
        execSync(`cd ${sourceDir} && npm run build`, { stdio: 'inherit' });
      } catch (error) {
        return { 
          success: false, 
          error: `Build failed: ${error.message}` 
        };
      }
    } else {
      console.log('🔍 [DRY RUN] Would run build process');
    }
  }
  
  // Prepare deploy directory structure
  const routeDir = path.join(deployDir, route);
  
  if (!dryRun) {
    // Ensure deploy directories exist
    if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir, { recursive: true });
    if (!fs.existsSync(routeDir)) fs.mkdirSync(routeDir, { recursive: true });
    
    // Copy build files if we built or hash changed
    if (shouldBuild || hashChanged) {
      console.log(`📂 Copying build files to ${routeDir}...`);
      execSync(`cp -r ${sourceDir}/dist/* ${routeDir}/`);
      
      // Create redirect HTML
      const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Project Scout | ${route.charAt(0).toUpperCase() + route.slice(1)}</title>
  <meta http-equiv="refresh" content="0;url=/${route}">
</head>
<body>
  <p>Redirecting to ${route} dashboard...</p>
  <script>
    window.location.href = '/${route}';
  </script>
</body>
</html>`;
      
      fs.writeFileSync(path.join(deployDir, `${route}.html`), redirectHtml);
    }
    
    // Ensure staticwebapp.config.json exists
    const configPath = path.join(deployDir, 'staticwebapp.config.json');
    if (!fs.existsSync(configPath)) {
      const configJson = {
        routes: [
          { route: "/advisor", rewrite: "/advisor/index.html" },
          { route: "/edge", rewrite: "/edge/index.html" },
          { route: "/ops", rewrite: "/ops/index.html" },
          { route: "/insights_dashboard.html", redirect: "/advisor", statusCode: 301 }
        ],
        navigationFallback: {
          rewrite: "/index.html",
          exclude: ["/assets/*", "/advisor/assets/*", "/css/*", "/js/*"]
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(configJson, null, 2));
    }
  } else {
    console.log('🔍 [DRY RUN] Would prepare deployment directory');
  }
  
  // Create deployment package
  let packagePath = '';
  
  if (!dryRun) {
    console.log('📦 Creating deployment package...');
    const packageName = `${route}_${deployEnv}_${Date.now()}.zip`;
    packagePath = path.join(repoRoot, packageName);
    
    try {
      execSync(`cd ${deployDir} && zip -r ${packagePath} ${route} ${route}.html staticwebapp.config.json`);
      console.log(`✅ Deployment package created: ${packagePath}`);
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to create deployment package: ${error.message}` 
      };
    }
  } else {
    console.log('🔍 [DRY RUN] Would create deployment package');
  }
  
  // Deployment steps
  if (hotDeploy && !dryRun) {
    console.log('🔥 Using hot deployment...');
    
    try {
      execSync(`${toolkitDir}/hot_redeploy.sh ${route}`, { stdio: 'inherit' });
    } catch (error) {
      return { 
        success: false, 
        error: `Hot deployment failed: ${error.message}` 
      };
    }
  } else if (!dryRun) {
    console.log('☁️ Deployment instructions:');
    console.log('1. Login to Azure Portal');
    console.log('2. Navigate to your Static Web App');
    console.log(`3. Upload the package: ${packagePath}`);
    console.log('4. Wait for deployment to complete');
    console.log(`5. Verify at: https://wonderful-desert-03a292c00.6.azurestaticapps.net/${route}`);
  } else {
    console.log('🔍 [DRY RUN] Would deploy to Azure');
  }
  
  return {
    success: true,
    packagePath: dryRun ? null : packagePath,
    url: `https://wonderful-desert-03a292c00.6.azurestaticapps.net/${route}`,
    deployEnv,
    wasBuilt: shouldBuild
  };
}

// If running directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const route = args[0] || 'advisor';
  const hotDeploy = args.includes('--hot');
  const skipBuild = args.includes('--skip-build');
  const dryRun = args.includes('--dry-run');
  const deployEnv = args.includes('--prod') ? 'prod' : (args.includes('--test') ? 'test' : 'dev');
  
  deployDashboard({ route, hotDeploy, skipBuild, dryRun, deployEnv })
    .then(result => {
      if (result.success) {
        console.log('✅ Deployment process completed successfully!');
      } else {
        console.error(`❌ Deployment failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`❌ Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { deployDashboard };