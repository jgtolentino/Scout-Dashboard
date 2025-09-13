# Comprehensive Theme System Integration Guide

This guide explains how to integrate the immediate CSS fixes for the rollback component with the new token-based theming system, providing a complete solution for the Client360 Dashboard.

## Table of Contents
1. [Overview](#overview)
2. [Integration Process](#integration-process)
3. [Immediate Fixes](#immediate-fixes)
4. [Token-Based Theming](#token-based-theming)
5. [Verification](#verification)
6. [CI/CD Integration](#ci-cd-integration)
7. [Troubleshooting](#troubleshooting)

## Overview

We've implemented a two-part solution:

1. **Immediate Fixes**: Addresses the current CSS issues with the rollback component styling
2. **Token-Based Theming**: Establishes a robust, future-proof theming system to prevent recurrence

This combined approach provides both immediate stabilization and long-term maintainability.

## Integration Process

### Step 1: Apply Immediate Fixes

```bash
# Run the comprehensive fix script for the rollback component styling
./fix_dashboard_styles.sh

# Verify the fixes
./scripts/verify_rollback_styles.sh
```

### Step 2: Upgrade to Token-Based Theme System

```bash
# Upgrade to the token-based theme system
./scripts/upgrade_to_token_system.sh

# Fix any CSS linting issues
npm run fix:css
```

### Step 3: Deploy Fixed Dashboard

```bash
# Deploy with the combined fixes
./deploy_fixed_dashboard.sh
```

## Immediate Fixes

The immediate fixes address the current CSS issues by:

1. Adding explicit variables for rollback component styling in `variables-tbwa.scss`
2. Ensuring comprehensive styles for the rollback component in `tbwa.scss`
3. Providing fallback mechanisms if styles aren't properly compiled
4. Adding verification scripts to check that styles are included

These fixes are implemented in the following files:
- `src/styles/variables-tbwa.scss`
- `src/themes/tbwa.scss`
- `scripts/verify_rollback_styles.sh`
- `fix_dashboard_styles.sh`
- `deploy_fixed_dashboard.sh`

## Token-Based Theming

The token-based theming system provides a robust foundation for future styling:

1. **Single Source of Truth**: `tokens.css` contains all design variables
2. **Theme Switching**: `<html data-theme="tbwa">` controls the active theme
3. **CSS Linting**: Prevents hard-coded values with `.stylelintrc.json`
4. **CI/CD Integration**: Validates CSS styling as part of the build process
5. **Tailwind Integration**: Uses design tokens for utility classes

Key files:
- `src/styles/tokens.css`: The single source of truth for design tokens
- `src/js/theme-switcher.js`: Handles theme switching and persistence
- `.stylelintrc.json`: CSS linting rules to enforce token usage
- `tailwind.config.js`: Tailwind configuration using CSS variables
- `.github/workflows/unified-pipeline.yml`: CI/CD pipeline with CSS validation

## Verification

After applying both sets of fixes, verify the integration:

1. **Immediate Fixes Verification**:
   ```bash
   ./scripts/verify_rollback_styles.sh
   ```

2. **Token System Verification**:
   ```bash
   npm run lint:css
   ```

3. **Visual Verification**:
   - Open the dashboard in a browser
   - Check that the rollback component is properly styled
   - Try switching themes to verify theme changes apply correctly

## CI/CD Integration

The unified CI/CD pipeline includes:

1. **CSS Linting**: Validates CSS to ensure token usage
2. **Build Verification**: Checks that compiled CSS includes the necessary styles
3. **Deployment**: Includes all required CSS files and theme switcher
4. **Branch Mirroring**: Maintains a feature branch with the latest code

Configuration is in `.github/workflows/unified-pipeline.yml`.

## Troubleshooting

### Rollback Component Still Missing Styles

1. Check the CSS bundle: `dist/tbwa.css` should contain `.rollback-dashboard` styles
2. Verify that `tokens.css` has the rollback component variables
3. Ensure the HTML includes the necessary CSS files:
   ```html
   <link rel="stylesheet" href="/styles/tokens.css">
   <link rel="stylesheet" href="/theme.css">
   ```
4. Try adding the emergency fallback:
   ```html
   <link rel="stylesheet" href="/css/rollback-styles.css">
   ```

### Theme Switching Not Working

1. Verify `data-theme` attribute is on the `<html>` element
2. Check that `theme-switcher.js` is loaded
3. Look for errors in the browser console
4. Try switching manually:
   ```javascript
   document.documentElement.setAttribute('data-theme', 'sarisari');
   ```

### CSS Linting Failures

1. Run `npm run fix:css` to automatically fix simple issues
2. For remaining issues, replace hardcoded values with CSS variables:
   ```css
   /* Before */
   color: #002B80;
   
   /* After */
   color: var(--color-primary);
   ```

### Deployment Issues

If Azure deployment shows incorrect styling:
1. Verify all CSS files are included in the deployment package
2. Check that the Azure Static Web App is correctly configured to serve CSS files
3. Ensure `staticwebapp.config.json` has the correct MIME types configured

## Architecture Diagrams

Architecture diagrams for the Client360 Dashboard system are now available in the `docs/architecture` directory:

- `context.mmd`: System context diagram showing how the dashboard interacts with other components
- `hld.mmd`: High-level design diagram with frontend, API, edge, and data plane components
- `erd.mmd`: Entity-relationship diagram showing the database schema
- `medallion.mmd`: Medallion architecture diagram for the data lake implementation

These Mermaid-based diagrams can be visualized with tools like Mermaid Live Editor or GitHub's built-in Mermaid renderer.

## CI/CD Updates

The CI/CD pipeline now includes an automated DBML export job that:

1. Connects to the production SQL database after deployment
2. Exports the current schema to DBML format
3. Saves it as `docs/architecture/schema.dbml`
4. Uploads it as a build artifact

This ensures that the database documentation stays in sync with the actual database schema.

## Next Steps

1. **Documentation**: Keep the `THEME_SYSTEM_INTEGRATION_GUIDE.md` updated
2. **Monitoring**: Monitor the dashboard for CSS issues after deployment
3. **Expansion**: Add additional themes as needed (client-specific, dark mode, etc.)
4. **Training**: Train developers on using the token-based system
5. **Architecture**: Review and update the architecture diagrams as the system evolves

---

By following this integration guide, you will have both fixed the immediate CSS issues and implemented a sustainable, maintainable theming system that prevents similar problems in the future.