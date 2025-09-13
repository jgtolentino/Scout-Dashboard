# Feature Flag Compatibility Guide for Codex

This document outlines the implementation of feature flag compatibility for the Codex agent system, as part of the guardrails implementation.

## Feature Flag System Overview

The feature flag system has been extended to support:

1. **Centralized Configuration** - All feature flags are defined in `config/features.json`
2. **Environment-specific Flags** - Separate flags for canary vs. production environments 
3. **Validation Rules** - Guardrails that prevent unsafe flag changes
4. **Codex Integration** - Safe feature flag modification via Codex agent

## Key Components

### 1. Feature Flag Configuration File

Located at `config/features.json`, this file contains:

```json
{
  "canaryFeatures": {
    "newDataVisualization": true,
    "enhancedFiltering": true,
    "realTimeUpdates": false
  },
  "productionFeatures": {
    "newDataVisualization": false,
    "enhancedFiltering": false,
    "realTimeUpdates": false
  },
  "featureFlags": {
    "ENABLE_DASHBOARD_CHAT": false,
    "ENABLE_ADVANCED_ANALYTICS": false,
    "ENABLE_CUSTOM_EXPORTS": true,
    "ENABLE_DARK_MODE": true,
    "ENABLE_EXPERIMENTAL_FORECASTING": false
  },
  "metadata": {
    "lastUpdated": "2025-05-17T12:00:00Z",
    "updatedBy": "codex",
    "version": "1.0.0"
  }
}
```

### 2. Feature Flag Validator

Located at `utils/feature_flag_validator.js`, this validator:
- Ensures changes maintain the correct structure
- Prevents unknown flags from being added
- Enforces environment-specific rules (e.g., experimental features only in canary)
- Requires proper metadata for change tracking

### 3. Feature Flag Module

The enhanced `utils/feature-flags.js` module:
- Reads flags from the configuration file
- Implements caching for performance
- Handles environment-specific feature detection
- Provides backward compatibility with the previous implementation

### 4. Codex Integration

The Codex guardrails policy has been updated to:
- Reference the feature flag configuration file
- Define validation rules for feature flag changes
- Provide a patch script for safe feature flag modification

## Using Feature Flags with Codex

### Example: Update Feature Flags via Codex

To enable a feature via Codex, use the `:codex patch` command:

```bash
:codex patch --feature-flag ENABLE_DASHBOARD_CHAT=true
```

The patch will be validated against the guardrails policy before being applied.

### Example: Feature Flag Patch JSON

For more complex changes, a JSON patch can be provided:

```json
{
  "featureFlags": {
    "ENABLE_DASHBOARD_CHAT": true,
    "ENABLE_DARK_MODE": true
  },
  "canaryFeatures": {
    "newDataVisualization": true
  },
  "metadata": {
    "lastUpdated": "2025-05-17T12:00:00Z",
    "updatedBy": "codex_patch",
    "version": "1.0.1"
  }
}
```

### Safety Rules

1. **Experimental Features** - Features with names containing `EXPERIMENTAL` are restricted to canary environments only
2. **Production Changes** - Changes to production feature flags require explicit approval
3. **Metadata Tracking** - All changes must include updated metadata with timestamp and author
4. **Schema Validation** - All changes must conform to the feature flag schema

## Testing

To verify the feature flag compatibility, run:

```bash
npm test -- tests/codex_feature_flags.test.js
```

The tests verify:
- Feature flag validation
- Patch application
- Environment-specific behavior
- Integration with the Codex agent

## Implementation Complete

The feature flag compatibility implementation satisfies the requirements from the Codex + Guardrails integration checklist:

✅ Codex can only modify flags in `features.json`  
✅ Behavior confirmed under `:codex patch` with example flag: `{ "canaryFeature": true }`  
✅ Feature flag validation integrated with guardrails policy