/**
 * Feature Flag Validator
 * 
 * Validates that feature flag modifications follow the established guidelines:
 * 1. Only modifies flags in the approved features.json file
 * 2. Maintains the correct structure
 * 3. Includes appropriate metadata
 */

const fs = require('fs');
const path = require('path');

const FEATURES_PATH = path.join(__dirname, '../config/features.json');

/**
 * Validates feature flag changes before they're applied
 * @param {Object} proposedChanges - The changes being proposed to feature flags
 * @returns {Object} Result with success status and message
 */
function validateFeatureFlagChanges(proposedChanges) {
  try {
    // Read current features
    const currentFeatures = JSON.parse(fs.readFileSync(FEATURES_PATH, 'utf8'));
    
    // Basic structure validation
    if (!proposedChanges.featureFlags) {
      return {
        success: false,
        message: 'Proposed changes must include featureFlags section'
      };
    }
    
    // Check for unknown flags
    const unknownFlags = Object.keys(proposedChanges.featureFlags).filter(
      flag => !Object.prototype.hasOwnProperty.call(currentFeatures.featureFlags, flag)
    );
    
    if (unknownFlags.length > 0) {
      return {
        success: false,
        message: `Unknown feature flags detected: ${unknownFlags.join(', ')}`
      };
    }
    
    // Validate metadata is present and updated
    if (!proposedChanges.metadata || 
        !proposedChanges.metadata.lastUpdated || 
        !proposedChanges.metadata.updatedBy) {
      return {
        success: false,
        message: 'Changes must include updated metadata with lastUpdated and updatedBy fields'
      };
    }
    
    // Ensure canary features are handled properly
    if (proposedChanges.canaryFeatures) {
      const productionFlags = Object.keys(proposedChanges.canaryFeatures).filter(
        flag => proposedChanges.canaryFeatures[flag] === true && 
               (!proposedChanges.productionFeatures || proposedChanges.productionFeatures[flag] === true)
      );
      
      if (productionFlags.length > 0) {
        return {
          success: false,
          message: `Experimental features enabled in production without canary testing: ${productionFlags.join(', ')}`
        };
      }
    }
    
    // All validations passed
    return {
      success: true,
      message: 'Feature flag changes are valid'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error validating feature flags: ${error.message}`
    };
  }
}

/**
 * Applies validated changes to the features.json file
 * @param {Object} validatedChanges - Changes that have passed validation
 * @returns {Object} Result with success status and message
 */
function applyFeatureFlagChanges(validatedChanges) {
  try {
    // Read current features
    const currentFeatures = JSON.parse(fs.readFileSync(FEATURES_PATH, 'utf8'));
    
    // Apply changes
    const updatedFeatures = {
      ...currentFeatures,
      ...validatedChanges,
      featureFlags: {
        ...currentFeatures.featureFlags,
        ...validatedChanges.featureFlags
      },
      metadata: {
        ...currentFeatures.metadata,
        ...validatedChanges.metadata
      }
    };
    
    // If canary features are included, merge them properly
    if (validatedChanges.canaryFeatures) {
      updatedFeatures.canaryFeatures = {
        ...currentFeatures.canaryFeatures,
        ...validatedChanges.canaryFeatures
      };
    }
    
    // If production features are included, merge them properly
    if (validatedChanges.productionFeatures) {
      updatedFeatures.productionFeatures = {
        ...currentFeatures.productionFeatures,
        ...validatedChanges.productionFeatures
      };
    }
    
    // Write updated features back to file
    fs.writeFileSync(FEATURES_PATH, JSON.stringify(updatedFeatures, null, 2), 'utf8');
    
    return {
      success: true,
      message: 'Feature flag changes applied successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error applying feature flag changes: ${error.message}`
    };
  }
}

module.exports = {
  validateFeatureFlagChanges,
  applyFeatureFlagChanges
};