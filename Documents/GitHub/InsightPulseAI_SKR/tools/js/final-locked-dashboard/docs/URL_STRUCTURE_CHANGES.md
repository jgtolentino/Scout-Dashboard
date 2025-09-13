# URL Structure Changes

## Overview

This document details the URL structure changes implemented for the Scout dashboard suite. The changes were made to provide a cleaner, more intuitive URL structure for users and better SEO.

## New URL Structure

The new URL structure follows a simple, logical pattern:

| Dashboard      | Old URL                                  | New URL                                            |
|----------------|------------------------------------------|---------------------------------------------------|
| Scout Advisor  | `/insights_dashboard.html`               | `/advisor`                                         |
| Scout Edge     | `/retail_edge/retail_edge_dashboard.html`| `/edge`                                           |
| Scout Ops      | `/qa.html`                               | `/ops`                                             |
| Landing Page   | `/`                                      | `/` (Redesigned with navigation cards)             |

## Implementation Details

The implementation involved the following changes:

1. **Directory Structure**: Created three dedicated directories for each dashboard:
   - `/advisor/` - Contains Scout Advisor dashboard
   - `/edge/` - Contains Scout Edge dashboard
   - `/ops/` - Contains Scout Ops dashboard

2. **File Renaming**:
   - Renamed dashboard HTML files to `index.html` within their respective directories
   - This enables clean URLs without file extensions

3. **Navigation Updates**:
   - Updated all cross-navigation links to use the new URL paths
   - Updated JavaScript references to dashboard paths

4. **Azure Static Web App Configuration**:
   - Updated `staticwebapp.config.json` with appropriate route mappings
   - Added specific route handlers for `/advisor`, `/edge`, and `/ops`

5. **Deployment Script**:
   - Created `deploy_url_structure.sh` to package and deploy the new structure

## Benefits

- **Clean URLs**: More professional and user-friendly URLs without file extensions
- **Improved Navigation**: Intuitive paths that are easy to remember and communicate
- **Better SEO**: URLs that more accurately reflect content purpose
- **Mobile Compatibility**: Shorter URLs that are easier to share and type on mobile devices
- **Future Proofing**: Structure that can accommodate new dashboards by simply adding new directories

## Testing

Before deployment, ensure that all links between dashboards function correctly by testing navigation between:
- Landing page to each dashboard
- Between all three dashboards using the navigation buttons
- Any internal links that reference other dashboards

## Deployment Instructions

To deploy the new URL structure:

1. Run the deployment script:
   ```bash
   ./deploy_url_structure.sh
   ```

2. Upload the generated ZIP file to Azure Static Web App through Azure Portal
   OR
   Deploy using Azure CLI:
   ```bash
   az staticwebapp create --name 'tbwa-juicer-insights-dashboard' --resource-group 'RG-TBWA-ProjectScout-Juicer' --source-file 'scout_dashboards_url_structure.zip'
   ```

3. Verify all dashboards are accessible at their new URLs:
   - https://gentle-rock-04e54f40f.6.azurestaticapps.net/advisor
   - https://gentle-rock-04e54f40f.6.azurestaticapps.net/edge
   - https://gentle-rock-04e54f40f.6.azurestaticapps.net/ops