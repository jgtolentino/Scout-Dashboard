# Client360 Dashboard URL Consolidation

## Summary

As of version 2.3.1, we have consolidated all Client360 Dashboard URLs to use a single, consistent path structure. This change streamlines access, improves user experience, and simplifies deployment processes.

## Changes

1. The `/360` path is now deprecated and redirects to the root URL.
2. All dashboard functionality previously available at `/360` is now available at the root path.
3. Static Web App configuration has been updated to handle redirects automatically.

## Technical Details

The following changes have been implemented:

1. **301 Redirects**: Added permanent redirect from `/360/*` to `/` in `staticwebapp.config.json`.
2. **Documentation Updates**: Updated the PRD and README to reflect the new URL structure.
3. **Deployment Scripts**: Consolidated deployment scripts to handle a single path.

## Migration Guide

### For Users

Simply access the dashboard at the main URL: `https://blue-coast-0acb6880f.6.azurestaticapps.net/`

Any bookmarks to `/360` paths will continue to work but will redirect to the root URL.

### For Developers

1. **Update References**: Update any hardcoded references to `/360` in your code to use the root path.
2. **Documentation**: Update any documentation that references the `/360` path.
3. **Scripts**: Use the main deployment scripts instead of separate scripts for `/360`.

## Deployment

This change has been deployed to all environments as of May 21, 2025.

## Questions?

If you have any questions about this change, please contact the Client360 Dashboard team at `dashboard-support@example.com`.