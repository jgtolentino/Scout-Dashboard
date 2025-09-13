#!/usr/bin/env node

/**
 * Apply Environment Feature Flags
 * 
 * This script applies feature flags specific to a target environment
 * during the deployment process.
 */

const fs = require('fs');
const path = require('path');

// Path to the features.json file
const FEATURES_PATH = path.join(__dirname, '../config/features.json');

// Parse arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && i + 1 < args.length) {
      params.env = args[i + 1];
      i++;
    }
  }
  
  return params;
}

// Main function
async function main() {
  try {
    // Parse arguments
    const args = parseArgs();
    const env = args.env || process.env.NODE_ENV || 'preview';
    
    console.log(`Applying feature flags for ${env} environment...`);
    
    // Check if features.json exists
    if (!fs.existsSync(FEATURES_PATH)) {
      console.error(`Features file not found: ${FEATURES_PATH}`);
      process.exit(1);
    }
    
    // Read features.json
    const featuresJson = fs.readFileSync(FEATURES_PATH, 'utf8');
    const features = JSON.parse(featuresJson);
    
    // Back up original file
    const backupPath = `${FEATURES_PATH}.backup`;
    fs.writeFileSync(backupPath, featuresJson, 'utf8');
    
    // Apply environment-specific rules
    switch (env) {
      case 'production':
        // In production, disable experimental features
        Object.keys(features.featureFlags).forEach(flag => {
          if (flag.includes('EXPERIMENTAL')) {
            features.featureFlags[flag] = false;
          }
        });
        
        // Copy production features
        if (features.productionFeatures) {
          Object.keys(features.productionFeatures).forEach(key => {
            if (features.featureFlags[key] !== undefined) {
              features.featureFlags[key] = features.productionFeatures[key];
            }
          });
        }
        break;
        
      case 'staging':
        // In staging, use canary features but not experimental ones
        if (features.canaryFeatures) {
          Object.keys(features.canaryFeatures).forEach(key => {
            if (features.featureFlags[key] !== undefined && !key.includes('EXPERIMENTAL')) {
              features.featureFlags[key] = features.canaryFeatures[key];
            }
          });
        }
        break;
        
      case 'preview':
      default:
        // In preview, enable all canary features
        if (features.canaryFeatures) {
          Object.keys(features.canaryFeatures).forEach(key => {
            if (features.featureFlags[key] !== undefined) {
              features.featureFlags[key] = features.canaryFeatures[key];
            }
          });
        }
        break;
    }
    
    // Update metadata
    features.metadata = {
      ...features.metadata,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'apply-environment-feature-flags.js',
      environment: env
    };
    
    // Write updated features.json
    fs.writeFileSync(FEATURES_PATH, JSON.stringify(features, null, 2), 'utf8');
    
    console.log(`Successfully applied feature flags for ${env} environment`);
    console.log('Applied feature flags:');
    
    // Log enabled features
    Object.keys(features.featureFlags).forEach(flag => {
      if (features.featureFlags[flag]) {
        console.log(`- ${flag}: ENABLED`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error(`Error applying feature flags: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});