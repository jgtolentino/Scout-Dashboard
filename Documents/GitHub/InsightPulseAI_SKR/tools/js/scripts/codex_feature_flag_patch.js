/**
 * Codex Feature Flag Patch Script
 * 
 * This script enables the Codex agent to safely modify feature flags
 * following the guardrail policies. It demonstrates the proper way to
 * interact with feature flags through the Codex agent.
 */

const fs = require('fs');
const path = require('path');
const { validateFeatureFlagChanges, applyFeatureFlagChanges } = require('../utils/feature_flag_validator');

// Path to features.json
const FEATURES_PATH = path.join(__dirname, '../config/features.json');

/**
 * Applies a feature flag patch with proper validation
 * @param {Object} patchData - The patch data containing feature flag changes
 * @returns {Object} Result of the patch operation
 */
function applyFeatureFlagPatch(patchData) {
  // Validate the proposed changes
  const validationResult = validateFeatureFlagChanges(patchData);
  
  if (!validationResult.success) {
    console.error(`Failed to apply feature flag patch: ${validationResult.message}`);
    return validationResult;
  }
  
  // Apply the validated changes
  const applyResult = applyFeatureFlagChanges(patchData);
  
  if (applyResult.success) {
    console.log('Feature flag patch applied successfully');
  } else {
    console.error(`Failed to apply feature flag patch: ${applyResult.message}`);
  }
  
  return applyResult;
}

// Example usage with CLI arguments
if (require.main === module) {
  try {
    let patchData;
    
    // Check if patch data is provided via command line
    if (process.argv.length > 2) {
      try {
        patchData = JSON.parse(process.argv[2]);
      } catch (error) {
        console.error('Invalid JSON data provided as argument');
        process.exit(1);
      }
    } else {
      // Example patch data for testing
      patchData = {
        featureFlags: {
          "ENABLE_DASHBOARD_CHAT": true,
          "ENABLE_DARK_MODE": true
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          updatedBy: "codex_patch_script",
          version: "1.0.1"
        }
      };
    }
    
    console.log('Applying feature flag patch...');
    console.log(JSON.stringify(patchData, null, 2));
    
    const result = applyFeatureFlagPatch(patchData);
    
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  applyFeatureFlagPatch
};