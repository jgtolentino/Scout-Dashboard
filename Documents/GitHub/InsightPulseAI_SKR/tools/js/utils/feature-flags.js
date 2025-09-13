/**
 * Feature Flags Manager
 * 
 * This module manages feature flags for the application, allowing for gradual
 * rollout of new features, A/B testing, and easy enablement/disablement of
 * features without code changes.
 */

// Default feature flag definitions
const DEFAULT_FLAGS = {
  // UI Features
  ENABLE_NEW_DASHBOARD_UI: false,
  ENABLE_POWER_BI_THEME: true,
  ENABLE_DARK_MODE: false,
  ENABLE_EXPORT_FUNCTIONALITY: true,
  
  // Backend Features
  ENABLE_REAL_TIME_UPDATES: false,
  ENABLE_ADVANCED_FILTERING: true,
  ENABLE_DATA_CACHE: true,
  
  // New Features
  ENABLE_AI_INSIGHTS: false,
  ENABLE_CHART_ANNOTATIONS: false,
  ENABLE_COLLABORATION: false,
  
  // System Features
  ENABLE_TELEMETRY: true,
  ENABLE_ERROR_REPORTING: true,
  ENABLE_PERFORMANCE_MONITORING: true
};

// Feature flag override from environment variables
const ENV_FLAGS = {};
if (typeof process !== 'undefined' && process.env) {
  Object.keys(DEFAULT_FLAGS).forEach(flag => {
    const envValue = process.env[`REACT_APP_${flag}`];
    if (envValue !== undefined) {
      ENV_FLAGS[flag] = envValue === 'true';
    }
  });
}

// Feature flag override from localStorage (client-side only)
const LOCAL_STORAGE_FLAGS = {};
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const storedFlags = localStorage.getItem('feature_flags');
    if (storedFlags) {
      Object.assign(LOCAL_STORAGE_FLAGS, JSON.parse(storedFlags));
    }
  } catch (e) {
    console.error('Error reading feature flags from localStorage:', e);
  }
}

// Combine all sources of feature flags with the following precedence:
// 1. localStorage overrides (highest priority - for development)
// 2. Environment variables
// 3. Default values (lowest priority)
const featureFlags = {
  ...DEFAULT_FLAGS,
  ...ENV_FLAGS,
  ...LOCAL_STORAGE_FLAGS
};

/**
 * Get the current value of a feature flag
 * @param {string} flagName - The name of the feature flag
 * @param {boolean} defaultValue - Default value if flag is not defined
 * @returns {boolean} - The current state of the feature flag
 */
function isFeatureEnabled(flagName, defaultValue = false) {
  // Special handling for canary deployment
  if (typeof window !== 'undefined' && window.location.hostname.includes('canary')) {
    // Enable more features in canary environment
    if (flagName.startsWith('ENABLE_') && !flagName.includes('EXPERIMENTAL')) {
      return true;
    }
  }
  
  return flagName in featureFlags ? featureFlags[flagName] : defaultValue;
}

/**
 * Set a feature flag value (only affects localStorage)
 * @param {string} flagName - The name of the feature flag
 * @param {boolean} value - The value to set
 */
function setFeatureFlag(flagName, value) {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn('setFeatureFlag can only be used in browser environment');
    return;
  }
  
  try {
    const storedFlags = JSON.parse(localStorage.getItem('feature_flags') || '{}');
    storedFlags[flagName] = !!value;
    localStorage.setItem('feature_flags', JSON.stringify(storedFlags));
    
    // Update runtime flags
    featureFlags[flagName] = !!value;
  } catch (e) {
    console.error('Error saving feature flag to localStorage:', e);
  }
}

/**
 * Reset all feature flags to their default values
 */
function resetFeatureFlags() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  
  try {
    localStorage.removeItem('feature_flags');
    
    // Reset runtime flags
    Object.keys(LOCAL_STORAGE_FLAGS).forEach(flag => {
      delete featureFlags[flag];
    });
    
    // Re-apply env flags
    Object.assign(featureFlags, ENV_FLAGS);
  } catch (e) {
    console.error('Error resetting feature flags:', e);
  }
}

/**
 * Component to conditionally render based on feature flag
 * @param {Object} props - Component props
 * @param {string} props.flag - Feature flag name
 * @param {ReactNode} props.children - Content to render if flag is enabled
 * @param {ReactNode} props.fallback - Content to render if flag is disabled
 */
function FeatureFlag({ flag, children, fallback = null }) {
  return isFeatureEnabled(flag) ? children : fallback;
}

module.exports = {
  isFeatureEnabled,
  setFeatureFlag,
  resetFeatureFlags,
  FeatureFlag,
  // Export all current flag values
  flags: { ...featureFlags }
};