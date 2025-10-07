/**
 * Tests for Codex Feature Flag Integration
 * 
 * These tests verify that the feature flag system works correctly with the
 * Codex guardrails policy and patch system.
 */

const fs = require('fs');
const path = require('path');
const { validateFeatureFlagChanges, applyFeatureFlagChanges } = require('../utils/feature_flag_validator');
const { applyFeatureFlagPatch } = require('../scripts/codex_feature_flag_patch');
const { getFeatureFlags, isFeatureEnabled, setFeatureFlag } = require('../utils/feature-flags');

// Path to test features file
const TEST_FEATURES_PATH = path.join(__dirname, '../config/features.json');
const BACKUP_FEATURES_PATH = path.join(__dirname, '../config/features.backup.json');

// Sample feature flag patch
const VALID_PATCH = {
  featureFlags: {
    ENABLE_DASHBOARD_CHAT: true,
    ENABLE_DARK_MODE: true
  },
  metadata: {
    lastUpdated: new Date().toISOString(),
    updatedBy: "test_script",
    version: "1.0.1"
  }
};

// Invalid patch (missing metadata)
const INVALID_PATCH = {
  featureFlags: {
    ENABLE_DASHBOARD_CHAT: true,
    ENABLE_UNKNOWN_FEATURE: true // Unknown feature
  }
};

// Patch with experimental feature in production
const EXPERIMENTAL_PATCH = {
  canaryFeatures: {
    ENABLE_EXPERIMENTAL_FORECASTING: true
  },
  productionFeatures: {
    ENABLE_EXPERIMENTAL_FORECASTING: true // Should not be allowed
  },
  featureFlags: {
    ENABLE_DASHBOARD_CHAT: true
  },
  metadata: {
    lastUpdated: new Date().toISOString(),
    updatedBy: "test_script",
    version: "1.0.1"
  }
};

describe('Codex Feature Flag System', () => {
  // Backup features.json before tests
  beforeAll(() => {
    if (fs.existsSync(TEST_FEATURES_PATH)) {
      fs.copyFileSync(TEST_FEATURES_PATH, BACKUP_FEATURES_PATH);
    }
  });
  
  // Restore original features.json after tests
  afterAll(() => {
    if (fs.existsSync(BACKUP_FEATURES_PATH)) {
      fs.copyFileSync(BACKUP_FEATURES_PATH, TEST_FEATURES_PATH);
      fs.unlinkSync(BACKUP_FEATURES_PATH);
    }
  });
  
  describe('Feature Flag Validator', () => {
    test('validates valid feature flag changes', () => {
      const result = validateFeatureFlagChanges(VALID_PATCH);
      expect(result.success).toBe(true);
    });
    
    test('rejects invalid feature flag changes', () => {
      const result = validateFeatureFlagChanges(INVALID_PATCH);
      expect(result.success).toBe(false);
    });
    
    test('rejects experimental features in production', () => {
      const result = validateFeatureFlagChanges(EXPERIMENTAL_PATCH);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Experimental features enabled in production');
    });
  });
  
  describe('Feature Flag Patch System', () => {
    test('applies valid feature flag patch', () => {
      const initialFlags = getFeatureFlags(true); // Force refresh from file
      const result = applyFeatureFlagPatch(VALID_PATCH);
      
      expect(result.success).toBe(true);
      
      // Verify changes were applied
      const updatedFlags = getFeatureFlags(true); // Force refresh from file
      expect(updatedFlags.featureFlags.ENABLE_DASHBOARD_CHAT).toBe(true);
      expect(updatedFlags.featureFlags.ENABLE_DARK_MODE).toBe(true);
    });
    
    test('rejects invalid feature flag patch', () => {
      const result = applyFeatureFlagPatch(INVALID_PATCH);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Feature Flag Integration', () => {
    test('feature flags are properly read from configuration', () => {
      // Set a flag for testing
      setFeatureFlag('ENABLE_CUSTOM_EXPORTS', true);
      
      // Check that it's enabled
      expect(isFeatureEnabled('ENABLE_CUSTOM_EXPORTS')).toBe(true);
    });
    
    test('canary vs production environment handling', () => {
      // Mock the window.location object
      const originalLocation = global.window?.location;
      global.window = {
        location: { hostname: 'canary.example.com' }
      };
      
      // Set up canary-only feature
      setFeatureFlag('ENABLE_EXPERIMENTAL_FORECASTING', true, 'canary');
      
      // Should be enabled in canary
      expect(isFeatureEnabled('ENABLE_EXPERIMENTAL_FORECASTING')).toBe(true);
      
      // Change to production
      global.window.location.hostname = 'example.com';
      
      // Should be disabled in production
      expect(isFeatureEnabled('ENABLE_EXPERIMENTAL_FORECASTING')).toBe(false);
      
      // Restore original location
      global.window = originalLocation;
    });
  });
});