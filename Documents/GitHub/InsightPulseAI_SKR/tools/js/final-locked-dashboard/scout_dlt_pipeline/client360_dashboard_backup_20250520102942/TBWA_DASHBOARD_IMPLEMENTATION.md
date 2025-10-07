# TBWA Client360 Dashboard Implementation Guide

This document provides comprehensive instructions for building, deploying, and maintaining the TBWA-themed Client360 Dashboard.

## Overview

The TBWA Client360 Dashboard is a branded analytics interface that provides at-a-glance visibility across business metrics with TBWA's distinctive branding elements. This implementation includes:

1. Custom TBWA color scheme (yellow primary: #ffc300)
2. TBWA-specific UI components and styling
3. Disruption® branding elements
4. Interactive geospatial store map
5. Responsive design for all device sizes

## Directory Structure

```
client360_dashboard/
├── assets/
│   └── logos/
│       └── tbwa-logo.svg               # TBWA logo for branding
├── dist/                               # Build output directory
│   ├── tbwa.css                        # Compiled TBWA theme CSS
│   └── assets/                         # Compiled assets
├── src/
│   ├── styles/                         # Shared styles
│   │   ├── common.scss                 # Common dashboard styles
│   │   └── variables-tbwa.scss         # TBWA-specific variables
│   └── themes/                         # Theme entry points
│       └── tbwa.scss                   # TBWA theme definition
├── static/
│   ├── css/                            # Static CSS files
│   ├── js/                             # JavaScript files
│   │   └── theme-selector.js           # Theme switching logic
│   └── data/                           # Static data files
├── scripts/
│   ├── build-tbwa-theme.sh             # Script to build TBWA theme
│   ├── deploy_tbwa_dashboard.sh        # Script to deploy TBWA dashboard
│   └── verify_tbwa_theme.sh            # Script to verify TBWA theme
├── webpack.config.js                   # Webpack configuration
└── index.html.template                 # Dashboard HTML template
```

## Setup and Installation

### Prerequisites

- Node.js and npm (v14+ recommended)
- Bash shell environment
- Access to Scout DLT pipeline data
- Optional: Azure CLI for deployment to Azure Static Web Apps

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create necessary directories:

```bash
mkdir -p assets/logos dist/assets static/js static/css data
```

3. Ensure TBWA logo exists:

```bash
# Copy from another location or create placeholder
cp /path/to/tbwa-logo.svg assets/logos/
```

## Building the TBWA Theme

The TBWA theme uses a custom build process that compiles SCSS files into optimized CSS.

### Manual Build Process

1. Run webpack to build the theme:

```bash
npx webpack --config webpack.config.js --env theme=tbwa
```

2. Verify the output files exist:

```bash
ls -la dist/tbwa.css
ls -la dist/assets/tbwa-logo.svg
```

### Automated Build Script

For convenience, use the provided build script:

```bash
./scripts/build-tbwa-theme.sh
```

## Theme Customization

### Color Scheme

The TBWA color scheme is defined in `src/styles/variables-tbwa.scss`:

```scss
:root {
  --color-primary: #ffc300; // TBWA primary yellow
  --color-secondary: #005bbb; // TBWA secondary blue
  ...
}
```

### Brand-Specific Components

Custom TBWA components are defined in `src/themes/tbwa.scss`:

```scss
// TBWA specific components
.tbwa-disruption-banner {
  background-color: var(--color-primary);
  color: #000000;
  ...
}
```

## Deployment

### Building a Deployment Package

Use the provided deployment script to create a deployment package:

```bash
./scripts/deploy_tbwa_dashboard.sh
```

This script:
1. Builds the TBWA theme CSS
2. Creates a deployment directory with all required files
3. Assembles an HTML page with TBWA branding
4. Creates a zip file for deployment
5. Generates a deployment report

### Azure Static Web Apps Deployment

To deploy to Azure Static Web Apps:

```bash
az staticwebapp deploy --name <app-name> --resource-group <resource-group> --source <zip-file> --token <deployment-token>
```

## Verification

Before deployment, verify the TBWA theme implementation:

```bash
./scripts/verify_tbwa_theme.sh
```

This script checks:
1. All required files exist
2. TBWA theme CSS contains expected brand styles
3. Logo file is valid
4. Webpack build configuration is correct

## Theme Components

The TBWA theme includes the following brand-specific components:

1. **Disruption Banner**: Yellow banner with "Disruption®" branding
2. **TBWA Header**: Black header with TBWA logo
3. **TBWA-styled KPI Cards**: Primary yellow with black text
4. **TBWA-branded Buttons**: Custom yellow buttons with TBWA styling
5. **TBWA Callouts**: Insight boxes with TBWA styling
6. **TBWA Footer**: Black footer with brand information

## Customization Options

### Adding Additional Components

To add new TBWA-specific components:

1. Add the component styles to `src/themes/tbwa.scss`
2. Update `index.html.template` to include the new components
3. Rebuild the theme with `./scripts/build-tbwa-theme.sh`

### Updating Brand Guidelines

If TBWA brand guidelines change:

1. Update colors in `src/styles/variables-tbwa.scss`
2. Update component styles in `src/themes/tbwa.scss`
3. Rebuild the theme
4. Verify changes with the verification script

## Troubleshooting

### Common Issues

1. **Missing TBWA Logo**:
   - Ensure `assets/logos/tbwa-logo.svg` exists
   - The build script will create a placeholder if not found

2. **CSS Not Applying**:
   - Check that the CSS is properly linked in HTML
   - Verify that the build generated `dist/tbwa.css`

3. **Webpack Build Errors**:
   - Ensure all dependencies are installed
   - Check for SCSS syntax errors in theme files

### Logging

All scripts write detailed logs to the `logs/` directory:

- Build logs: `logs/tbwa_build_*.log`
- Deploy logs: `logs/tbwa_deploy_*.log`
- Verification logs: `logs/verify_tbwa_*.log`

## Maintenance

### Regular Updates

1. **Color Updates**:
   - Update `src/styles/variables-tbwa.scss` with new colors
   - Rebuild the theme
   
2. **Logo Updates**:
   - Replace `assets/logos/tbwa-logo.svg` with updated logo
   - Rebuild the theme

3. **Component Additions**:
   - Add new components to `src/themes/tbwa.scss`
   - Update HTML templates as needed

### Monitoring and Reporting

Deployment reports are generated in the `reports/` directory:

- Deployment reports: `reports/tbwa_deployment_*.md`
- Verification reports: `reports/tbwa_verification_*.md`

## Conclusion

This implementation provides a comprehensive TBWA-themed dashboard that follows brand guidelines and offers an optimized user experience. The modular build system allows for easy customization and extension as requirements evolve.

For additional assistance, refer to the following resources:

- [Client360 Dashboard README](./README.md)
- [Theme System Documentation](./README_THEMING.md)
- [TBWA Brand Guidelines](https://www.tbwa.com/)