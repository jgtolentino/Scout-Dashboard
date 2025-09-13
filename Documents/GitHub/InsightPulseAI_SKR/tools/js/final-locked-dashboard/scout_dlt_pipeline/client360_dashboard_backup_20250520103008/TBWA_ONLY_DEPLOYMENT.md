# TBWA-Only Themed Dashboard Deployment

## Overview

This document outlines the streamlined approach for building and deploying the Client360 Dashboard with only the TBWA theme. This simplified process eliminates the runtime theme switching in favor of a smaller, more optimized bundle with the TBWA branding baked in at build time.

## Implementation Details

The TBWA-only deployment approach:

1. **Builds only the TBWA theme CSS bundle** using Webpack
2. **Copies the TBWA CSS and logo** into a minimal client360 app structure
3. **Builds the client360 app** with TBWA branding already integrated
4. **Deploys the result to Azure Static Web Apps**

This approach offers several advantages:
- Smaller bundle size (only one theme instead of many)
- No runtime theme switching overhead
- Simpler HTML structure without theme selection UI
- Optimized for production use

## Deployment Options

### Local Deployment

Use the `deploy_tbwa_theme.sh` script to build and deploy from your local environment:

```bash
# Set the Azure Static Web App API token (if not already set)
export AZ_STATIC_WEBAPP_API_TOKEN="your-api-token"

# Run the deployment script
./scripts/deploy_tbwa_theme.sh
```

### CI/CD Deployment

A GitHub Actions workflow is provided in `.github/workflows/deploy-tbwa-theme.yml` that:
- Triggers on changes to TBWA theme files or manual dispatch
- Builds only the TBWA theme
- Creates a minimal client360 app with the theme baked in
- Deploys to Azure Static Web Apps

## Implementation Changes

### Webpack Configuration

The Webpack configuration has been updated to support building a single theme:

```js
module.exports = (env = {}) => {
  // If a specific theme is requested, build only that theme
  const entries = env.theme 
    ? { [env.theme]: `./src/themes/${env.theme}.scss` }
    : {
        // Default: build all themes
        tbwa: './src/themes/tbwa.scss',
        sarisari: './src/themes/sarisari.scss',
      };
  
  // ...configuration continues
}
```

This allows us to use the `--env theme=tbwa` flag to build only the TBWA theme.

### Simplified HTML

The HTML template has been simplified by:
- Removing the theme selection dropdown
- Replacing dynamic theme loading with a direct CSS link
- Maintaining all dashboard functionality

## Usage Instructions

Once deployed, the TBWA-themed dashboard is accessible at the Azure Static Web App URL. Unlike the multi-theme version, no URL parameters are needed to select a theme.

## Benefits

1. **Reduced Complexity**: No theme switching logic to maintain
2. **Smaller Payload**: Users only download assets for the TBWA theme
3. **Improved Performance**: No runtime theme calculation or switching
4. **Simplified Deployment**: Direct build-to-deploy pipeline

## Adding Additional Themes

If you need to deploy a different theme (e.g., Sari Sari), you can use the same process but specify the different theme:

```bash
# For local deployment with Sari Sari theme
npx webpack --config webpack.config.js --env theme=sarisari
cp dist/sarisari.css client360/public/theme.css
cp dist/assets/sarisari-logo.svg client360/public/logo.svg
# ...continue with build and deploy
```

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Date: May 19, 2025