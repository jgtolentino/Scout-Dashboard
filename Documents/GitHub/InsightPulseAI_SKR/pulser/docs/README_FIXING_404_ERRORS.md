# Fixing 404 Errors on Scout Dashboard Deployment

This guide provides comprehensive instructions on fixing 404 errors on Scout Dashboard deployments to Azure Static Web Apps, implementing the URL structure requirements from CLAUDE.md.

## Table of Contents

- [Problem Overview](#problem-overview)
- [Solution](#solution)
- [Quick Fix Tools](#quick-fix-tools)
- [Verification Process](#verification-process)
- [Understanding the URL Structure](#understanding-the-url-structure)
- [Additional Resources](#additional-resources)

## Problem Overview

Scout Dashboards deployed to Azure Static Web Apps frequently encounter 404 errors when:
- Navigating directly to `/advisor`, `/edge`, or `/ops` URLs
- Sharing or bookmarking specific dashboard URLs
- Redirecting from legacy `/insights_dashboard.html` URLs

These issues occur because Azure Static Web Apps requires specific routing configuration and file structure to handle both the directory pattern URLs (`/advisor/`) and flat file URLs (`/advisor.html`).

## Solution

The solution involves:

1. Creating **both** directory-based and flat-file structure:
   - `/advisor/index.html` AND `/advisor.html`
   - `/edge/index.html` AND `/edge.html`
   - `/ops/index.html` AND `/ops.html`

2. Setting up proper route configuration in `staticwebapp.config.json`:
   ```json
   {
     "routes": [
       { "route": "/advisor", "rewrite": "/advisor.html" },
       { "route": "/edge", "rewrite": "/edge.html" },
       { "route": "/ops", "rewrite": "/ops.html" },
       {
         "route": "/insights_dashboard.html",
         "redirect": "/advisor",
         "statusCode": 301
       }
     ],
     "navigationFallback": {
       "rewrite": "/index.html",
       "exclude": ["/assets/*", "/css/*", "/js/*"]
     }
   }
   ```

3. Implementing proper redirects for legacy URLs

## Quick Fix Tools

We've created these tools to streamline the process:

### 1. URL Structure Fix Script

```bash
# Make executable
chmod +x fix_scout_dashboard_404.sh

# Run to fix structure
./fix_scout_dashboard_404.sh
```

This creates a properly structured deployment package in `scout-dashboard-fixed/`.

### 2. Automated Deployment Script

```bash
# Make executable
chmod +x deploy_fixed_scout_dashboard.sh

# Run to fix and deploy
./deploy_fixed_scout_dashboard.sh
```

This script:
- Fixes the URL structure
- Gets deployment token from Azure
- Deploys to Azure Static Web Apps
- Updates verification documentation

### 3. URL Structure Verification

```bash
# Make executable
chmod +x verify_dashboard_url_structure.js

# Verify a deployed dashboard
node verify_dashboard_url_structure.js https://your-dashboard-url.azurestaticapps.net
```

This tool checks if your deployment follows the required URL structure pattern.

## Verification Process

After deployment, manually verify these URLs:

1. **Primary URLs**
   - `/advisor` - Should load the advisor dashboard
   - `/edge` - Should load the edge dashboard
   - `/ops` - Should load the ops dashboard

2. **Alternative URLs**
   - `/advisor.html` - Should load the advisor dashboard
   - `/edge.html` - Should load the edge dashboard
   - `/ops.html` - Should load the ops dashboard

3. **Legacy URL**
   - `/insights_dashboard.html` - Should redirect to `/advisor`

4. **Navigation**
   - Test inter-dashboard navigation links

## Understanding the URL Structure

### Why Both File Structures Are Needed

1. **Directory Structure** (`/advisor/index.html`):
   - Enables clean URLs like `/advisor`
   - Required for standard web conventions
   - Better for SEO and sharing

2. **Flat File Structure** (`/advisor.html`):
   - Essential for SWA routing rules
   - Provides fallback during navigation
   - Needed for redirect handling

3. **Routing Configuration**:
   - Maps clean URLs to appropriate files
   - Handles legacy URL redirects
   - Preserves assets and static resources

## Additional Resources

- [SCOUT_DASHBOARD_DEPLOYMENT_SOP.md](./SCOUT_DASHBOARD_DEPLOYMENT_SOP.md) - Complete deployment SOP
- [README_SCOUT_URL_STRUCTURE.md](./README_SCOUT_URL_STRUCTURE.md) - Detailed explanation of URL requirements
- [AZURE_DEPLOYMENT_INSTRUCTIONS.md](./AZURE_DEPLOYMENT_INSTRUCTIONS.md) - General Azure deployment guide
- [Azure Static Web Apps documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/routes) - Official Microsoft documentation on routing

## Troubleshooting

If you still encounter issues after using the fix scripts:

1. Verify the `staticwebapp.config.json` is included in your deployment
2. Check for syntax errors in the config file
3. Ensure all JavaScript and CSS file paths are correctly referenced
4. Clear browser cache and try again in incognito mode
5. Check browser developer console for specific error messages