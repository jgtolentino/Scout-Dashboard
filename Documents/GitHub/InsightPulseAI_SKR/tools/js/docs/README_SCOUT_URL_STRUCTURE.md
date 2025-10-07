# Scout Dashboard URL Structure

## Overview

This document outlines the URL structure requirements for Scout Dashboards deployed to Azure Static Web Apps, as specified in CLAUDE.md. Following these guidelines will prevent 404 errors and ensure consistent navigation across all dashboard views.

## URL Structure Requirements

Each Scout Dashboard deployment must implement both a directory-based and flat file structure to support different URL patterns:

### Required URL Patterns

1. **Directory Structure (Primary)**
   - `/advisor/index.html`
   - `/edge/index.html`
   - `/ops/index.html`

2. **Flat File Structure (Alternate)**
   - `/advisor.html`
   - `/edge.html`
   - `/ops.html`

3. **Legacy URL Support**
   - `/insights_dashboard.html` → redirects to `/advisor`

### Static Web App Configuration

The `staticwebapp.config.json` file must include these routes:

```json
{
  "routes": [
    { 
      "route": "/advisor", 
      "rewrite": "/advisor.html" 
    },
    { 
      "route": "/edge", 
      "rewrite": "/edge.html" 
    },
    { 
      "route": "/ops", 
      "rewrite": "/ops.html" 
    },
    {
      "route": "/insights_dashboard.html",
      "redirect": "/advisor",
      "statusCode": 301
    },
    {
      "route": "/advisor.html", 
      "rewrite": "/advisor/index.html" 
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/css/*", "/js/*"]
  }
}
```

## Quick Fix Script

To quickly fix an existing deployment, use the `fix_scout_dashboard_404.sh` script:

```bash
# Make the script executable
chmod +x fix_scout_dashboard_404.sh

# Run the script
./fix_scout_dashboard_404.sh
```

This script will:
1. Create the proper directory structure
2. Add both directory and flat file versions of each dashboard
3. Set up the correct staticwebapp.config.json
4. Prepare a deployment package

## Deployment

After fixing the structure, deploy using one of these methods:

### Method 1: SWA CLI

```bash
# Get your deployment token from Azure
DEPLOY_TOKEN=$(az staticwebapp secrets list --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP --query "properties.apiKey" -o tsv)

# Deploy using SWA CLI
swa deploy scout-dashboard-fixed --env production --deployment-token $DEPLOY_TOKEN
```

### Method 2: Azure Portal

1. Create a ZIP file of the scout-dashboard-fixed directory
2. Upload through the Azure Portal's "Deployment" → "Upload" option

## Verification

After deployment, verify these URLs work correctly:

- `/advisor`
- `/advisor.html`
- `/edge`
- `/edge.html`
- `/ops`
- `/ops.html`
- `/insights_dashboard.html` (should redirect to `/advisor`)

## Why This Is Important

Azure Static Web Apps has specific routing behavior that requires this dual structure approach. Without it, you might experience:

1. 404 errors when accessing `/advisor` directly
2. Broken navigation between dashboard views
3. Issues with bookmarked or shared URLs

## Automated Deployment

For an end-to-end solution, use the `deploy_fixed_scout_dashboard.sh` script:

```bash
# Make it executable
chmod +x deploy_fixed_scout_dashboard.sh

# Run the deployment script
./deploy_fixed_scout_dashboard.sh
```

This script will:
1. Fix the URL structure
2. Get your deployment token from Azure
3. Deploy the dashboard
4. Update verification documentation with the new URLs

## References

- CLAUDE.md dashboard deployment section
- Azure Static Web Apps documentation
- SCOUT_DASHBOARD_DEPLOYMENT_SOP.md