# Build-time Theming Implementation for Client360 Dashboard

## Overview

This implementation provides a powerful multi-brand theming system for the Client360 Dashboard. The approach uses build-time theme generation combined with runtime theme selection, giving us the best of both worlds: optimized bundle sizes and the flexibility to switch themes on demand.

## Key Features

- **Build-time theme generation**: Each brand gets its own complete CSS bundle
- **Per-brand SVG logos**: Logo is embedded in the CSS via a CSS variable
- **Runtime theme switching**: Ability to switch themes without page reload
- **Optimized performance**: CSS bundles are self-contained with no runtime overrides
- **Clear separation**: Each brand is isolated in its own theme file
- **Geospatial map integration**: Map visualization is preserved and works across themes

## Directory Structure

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

## How It Works

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

4. **Deployment**:
   - `build-themes.sh` generates all theme bundles
   - `deploy_themed_dashboard.sh` packages and deploys to Azure
   - Supports both direct deployment and staging/production workflow

## Benefits

1. **Zero runtime CSS overrides**: All styles are baked in at build time
2. **Optimized bundle size**: Users only download the CSS for their brand
3. **Simplified maintenance**: Clear separation between brand-specific code
4. **Fast performance**: No runtime theme calculations or overrides
5. **Easy to extend**: Add new brands by creating new variable and theme files

## Usage

### Building Themes

```bash
# Install dependencies and build themes
npm install
npm run build:themes

# Or use the build script
./scripts/build-themes.sh
```

### Deploying

```bash
# Deploy directly to production
./scripts/deploy_themed_dashboard.sh

# Deploy to staging first, then swap to production
./scripts/deploy_themed_dashboard.sh --staging
```

### Testing Different Themes

After deployment, use these URL patterns:

- TBWA Theme: `https://yoursite.com?tenant=tbwa`
- Sari Sari Theme: `https://yoursite.com?tenant=sarisari`

Or use the theme selector dropdown in the UI.

## Adding New Brands

1. Create a new variables file: `src/styles/variables-newbrand.scss`
2. Create a new theme entry point: `src/themes/newbrand.scss`
3. Add your brand logo: `assets/logos/newbrand-logo.svg`
4. Add the new entry point to `webpack.config.js`
5. Add the new option to the theme selector in `index.html.template`

## Conclusion

This build-time theming approach provides an optimal balance between performance and flexibility. It leverages the build process to generate optimized CSS bundles for each brand while still allowing runtime theme switching. The implementation preserves all functionality, including the geospatial map visualization, across different themes.

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Date: May 19, 2025