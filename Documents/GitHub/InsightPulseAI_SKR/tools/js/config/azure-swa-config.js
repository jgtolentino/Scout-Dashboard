/**
 * Azure Static Web Apps Configuration
 * 
 * This script generates the staticwebapp.config.json file for different
 * deployment environments (production, canary, staging).
 * 
 * Usage:
 *   node azure-swa-config.js [environment]
 */

const fs = require('fs');
const path = require('path');

// Get the target environment from command line or default to production
const environment = process.argv[2] || 'production';
const validEnvironments = ['production', 'canary', 'staging'];

if (!validEnvironments.includes(environment)) {
  console.error(`Invalid environment: ${environment}`);
  console.error(`Valid environments: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

// Base configuration for all environments
const baseConfig = {
  routes: [
    { 
      route: "/advisor", 
      rewrite: "/advisor/index.html" 
    },
    { 
      route: "/edge", 
      rewrite: "/edge/index.html" 
    },
    { 
      route: "/ops", 
      rewrite: "/ops/index.html" 
    },
    {
      route: "/insights_dashboard.html",
      redirect: "/advisor",
      statusCode: 301
    },
    {
      route: "/advisor.html", 
      rewrite: "/advisor/index.html" 
    }
  ],
  navigationFallback: {
    rewrite: "/index.html",
    exclude: ["/images/*.{png,jpg,gif}", "/css/*", "/js/*", "/assets/*"]
  },
  globalHeaders: {
    "X-Dashboard-Tag": "scout_dashboards_clean_urls",
    "X-Patch-ID": "dashboard-url-structure-v2",
    "X-Client-Context": "TBWA-direct-only",
    "X-Environment": environment,
    "X-Deployment-Timestamp": new Date().toISOString()
  }
};

// Environment-specific configurations
const environmentConfigs = {
  production: {
    globalHeaders: {
      "Cache-Control": "public, max-age=3600",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://api.example.com;"
    }
  },
  canary: {
    globalHeaders: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Feature-Flags": "ENABLE_NEW_DASHBOARD_UI,ENABLE_AI_INSIGHTS,ENABLE_CHART_ANNOTATIONS",
      "X-Robot-Tag": "noindex, nofollow",
      "X-Canary": "true"
    },
    responseOverrides: {
      "404": {
        "rewrite": "/404.html",
        "statusCode": 404
      }
    }
  },
  staging: {
    globalHeaders: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Feature-Flags": "ENABLE_NEW_DASHBOARD_UI",
      "X-Robot-Tag": "noindex, nofollow",
      "X-Staging": "true"
    }
  }
};

// Merge the base config with the environment-specific config
const config = {
  ...baseConfig,
  ...environmentConfigs[environment]
};

// For canary and staging, add a banner to alert users
if (environment !== 'production') {
  config.globalHeaders["X-Show-Environment-Banner"] = "true";
}

// Additional canary routing to enable A/B testing
if (environment === 'canary') {
  // Add routes for A/B testing different variations
  config.routes.push(
    {
      route: "/variant-a/*",
      rewrite: "/{0}",
      headers: {
        "X-Variant": "A"
      }
    },
    {
      route: "/variant-b/*",
      rewrite: "/{0}",
      headers: {
        "X-Variant": "B"
      }
    }
  );
}

// Write the configuration to the appropriate file
const outputPath = path.join(__dirname, '..', 'deploy', environment, 'staticwebapp.config.json');

// Ensure the directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the config file
fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));

console.log(`Generated staticwebapp.config.json for ${environment} environment at ${outputPath}`);

// Export the config for testing
module.exports = config;