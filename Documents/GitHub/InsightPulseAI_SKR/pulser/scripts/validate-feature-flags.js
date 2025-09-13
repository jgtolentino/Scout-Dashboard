#!/usr/bin/env node

/**
 * Feature Flag Validation Script
 * 
 * This script validates feature flags against the schema and ensures
 * that they follow the required patterns for the specified environment.
 */

const fs = require('fs');
const path = require('path');
const { validateFeatureFlagChanges } = require('../utils/feature_flag_validator');

// Path to the features.json file
const FEATURES_PATH = path.join(__dirname, '../config/features.json');

// Environment specific validations
const environments = {
  preview: {
    allowExperimental: true,
    requireApproval: false
  },
  staging: {
    allowExperimental: true,
    requireApproval: false
  },
  production: {
    allowExperimental: false,
    requireApproval: true
  }
};

// Main function
async function main() {
  try {
    console.log('Validating feature flags...');
    
    // Determine environment
    const env = process.argv[2] || process.env.NODE_ENV || 'preview';
    console.log(`Environment: ${env}`);
    
    // Check if features.json exists
    if (!fs.existsSync(FEATURES_PATH)) {
      console.error(`Features file not found: ${FEATURES_PATH}`);
      process.exit(1);
    }
    
    // Read features.json
    const featuresJson = fs.readFileSync(FEATURES_PATH, 'utf8');
    const features = JSON.parse(featuresJson);
    
    // Perform general validation
    const validationResult = validateFeatureFlagChanges(features);
    
    if (!validationResult.success) {
      console.error(`Feature flag validation failed: ${validationResult.message}`);
      process.exit(1);
    }
    
    // Perform environment-specific validations
    const envRules = environments[env] || environments.preview;
    
    // Check for experimental features in production
    if (!envRules.allowExperimental) {
      const experimentalFeatures = Object.keys(features.featureFlags).filter(
        flag => flag.includes('EXPERIMENTAL') && features.featureFlags[flag]
      );
      
      if (experimentalFeatures.length > 0) {
        console.error(`Experimental features are not allowed in ${env} environment:`);
        experimentalFeatures.forEach(flag => console.error(`- ${flag}`));
        process.exit(1);
      }
    }
    
    // Additional validation logic can be added here
    
    console.log('Feature flag validation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error validating feature flags: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});