# Client360 Dashboard Theming System

## Overview

The Client360 Dashboard now includes a comprehensive theming system that supports multiple brand themes. This document outlines the theming implementation, deployment options, and customization capabilities.

## Features

- **Multi-brand Theming System**: Support for different brand themes (TBWA, Sari Sari)
- **Build-time Theme Generation**: Optimized CSS bundles for each brand
- **Runtime Theme Switching**: Option to switch themes without page reload
- **Geospatial Map Integration**: Interactive map with theme-specific styling
- **Optimized Deployment Options**: Full multi-theme or single-theme deployments

## Deployment Options

### Option 1: Multi-brand Theming

Deploy the dashboard with support for multiple brand themes that can be switched at runtime.

```bash
# Build all themes
npm run build:themes

# Deploy with all themes
./scripts/deploy_themed_dashboard.sh
```

This option allows switching between themes using URL parameters (`?tenant=tbwa` or `?tenant=sarisari`) or the theme selector UI.

### Option 2: TBWA-only Deployment (Optimized)

Deploy with only the TBWA theme for a more optimized bundle.

```bash
# Build and deploy TBWA theme only
./scripts/deploy_tbwa_theme.sh
```

This approach results in a smaller, more optimized bundle with no theme switching overhead.

## CI/CD Integration

The repository includes GitHub Actions workflows for automated deployment:

- `.github/workflows/ci-cd-client360.yml`: Full CI/CD pipeline with testing
- `.github/workflows/deploy-tbwa-theme.yml`: TBWA-only themed deployment

## Architecture

### Directory Structure

```
client360_dashboard/
├── src/
│   ├── styles/          # Shared styles and variables
│   │   ├── common.scss  # Common styles for all themes
│   │   ├── variables-tbwa.scss
│   │   └── variables-sarisari.scss
│   └── themes/          # Theme entry points
│       ├── tbwa.scss
│       └── sarisari.scss
├── assets/
│   └── logos/           # Brand logos
│       ├── tbwa-logo.svg
│       └── sarisari-logo.svg
├── webpack.config.js    # Multi-entry Webpack config
├── index.html.template  # HTML template with theme loader
└── scripts/
    ├── build-themes.sh  # Theme building script
    └── deploy_themed_dashboard.sh  # Deployment script
```

### How It Works

1. **Theme Definition**:
   - Each brand has a variables file (`variables-tbwa.scss`, `variables-sarisari.scss`)
   - Each brand has a theme entry point (`tbwa.scss`, `sarisari.scss`)
   - Common styles are shared in `common.scss`

2. **Build Process**:
   - Webpack processes each theme as a separate entry point
   - Each theme imports its variables and the common styles
   - Logos are embedded via CSS variables
   - Output is one CSS file per brand plus assets

3. **Runtime Selection**:
   - `theme-selector.js` dynamically loads the appropriate CSS
   - Theme can be selected via URL parameter (`?tenant=sarisari`)
   - Theme selection is preserved in localStorage
   - UI dropdown allows changing themes

## Theme Customization

### Adding a New Brand Theme

1. Create variables file: `src/styles/variables-newbrand.scss`
2. Create theme entry point: `src/themes/newbrand.scss`
3. Add logo: `assets/logos/newbrand-logo.svg`
4. Add to webpack config entries
5. Add to theme selector dropdown in HTML template

## Development

```bash
# Install dependencies
npm ci

# Build all themes for development
npm run build:dev

# Watch for changes
npm run watch

# Run tests
npm test
```

## Documentation

For more detailed information, refer to these documents:

- [THEMED_DASHBOARD_IMPLEMENTATION.md](./THEMED_DASHBOARD_IMPLEMENTATION.md): Details on the multi-brand theming system
- [TBWA_ONLY_DEPLOYMENT.md](./TBWA_ONLY_DEPLOYMENT.md): Guide for TBWA-only optimized deployment
- [DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md): Latest deployment report
- [CICD_SETUP_COMPLETE.md](./CICD_SETUP_COMPLETE.md): CI/CD pipeline documentation

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Date: May 19, 2025