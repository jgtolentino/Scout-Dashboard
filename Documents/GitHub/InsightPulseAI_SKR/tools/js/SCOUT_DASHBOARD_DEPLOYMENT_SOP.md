# Scout Dashboard Deployment SOP

## Overview
This Standard Operating Procedure (SOP) document outlines the process for deploying the Scout Dashboard to Azure Static Web Apps while ensuring proper URL structure and routing.

## Prerequisites
- Azure CLI installed and configured
- SWA CLI installed (`npm install -g @azure/static-web-apps-cli`)
- Access to Azure account with necessary permissions
- Source files for the Scout Dashboard

## URL Structure Requirements
All Scout Dashboard deployments must follow this URL structure pattern to prevent 404 errors and ensure consistent navigation:

1. **Directory + index.html Structure**:
   - `/advisor/index.html`
   - `/edge/index.html`
   - `/ops/index.html`

2. **Flat File Structure** (for direct access):
   - `/advisor.html`
   - `/edge.html`
   - `/ops.html`

3. **Legacy URL Support**:
   - `/insights_dashboard.html` → redirects to `/advisor`

## Deployment Steps

### 1. Prepare the Deployment Package

Use the `fix_scout_dashboard_404.sh` script to prepare your deployment package:

```bash
# Make the script executable
chmod +x fix_scout_dashboard_404.sh

# Run the script
./fix_scout_dashboard_404.sh
```

This script will:
- Create both directory and flat file structures
- Set up proper redirects
- Generate the required `staticwebapp.config.json` file

### 2. Test Locally Before Deployment

```bash
# Start local testing server
swa start scout-dashboard-fixed --open
```

Verify the following routes work correctly:
- `/advisor`
- `/advisor.html`
- `/edge`
- `/edge.html`
- `/ops`
- `/ops.html`
- `/insights_dashboard.html` (should redirect to `/advisor`)

### 3. Deploy to Azure Static Web Apps

#### Option A: Using SWA CLI

```bash
# Get deployment token from Azure Portal or CLI
DEPLOY_TOKEN=$(az staticwebapp secrets list --name YOUR_STATIC_WEBAPP_NAME --resource-group YOUR_RESOURCE_GROUP --query "properties.apiKey" -o tsv)

# Deploy with SWA CLI
swa deploy scout-dashboard-fixed --env production --deployment-token $DEPLOY_TOKEN
```

#### Option B: Using Azure Portal

1. Navigate to your Static Web App in the Azure Portal
2. Go to "Deployment" → "Manual Upload"
3. Upload the `scout-dashboard-fixed` folder as a ZIP file

### 4. Verify Deployment

After deployment, verify the following:

1. **URL Routing**:
   - `/advisor` loads correctly
   - `/advisor.html` loads correctly
   - Legacy URL `/insights_dashboard.html` redirects to `/advisor`
   - Navigation between dashboards works

2. **PRD Requirements**:
   - All dashboard components load properly
   - All interactive elements function as expected
   - Data appears correctly in all visualizations

## Azure Static Web App Configuration

The `staticwebapp.config.json` file must contain these routes:

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

## Troubleshooting

### Common Issues

1. **404 Errors After Deployment**:
   - Verify the `staticwebapp.config.json` file is present in the root of your deployment
   - Check that both the directory/index.html and flat file structures exist
   - Ensure the routes in the config file match the actual file structure

2. **Redirect Loops**:
   - Check for circular redirects in the route configuration
   - Verify that rewrite targets actually exist

3. **Missing Resources (CSS/JS)**:
   - Ensure the `navigationFallback.exclude` section correctly exempts static assets

## Documentation Updates

After successful deployment:
1. Update the `DEPLOYMENT_VERIFICATION.md` document with the new deployment details
2. Record the deployment URL in the project documentation
3. Share the dashboard URL with stakeholders

## References
- [Azure Static Web Apps documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- Project CLAUDE.md guidelines
- Scout Dashboard PRD