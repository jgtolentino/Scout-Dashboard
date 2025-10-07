# Deployment Flow – Scout Advanced Analytics v2

This document provides comprehensive instructions for deploying the Power BI-styled Scout Advanced Analytics dashboard to Azure Static Web Apps.

## Prerequisites

Before deployment, ensure you have:

1. Azure CLI installed and configured
2. Azure Static Web Apps CLI (`swa`) installed (optional, for local testing)
3. Azure account with appropriate permissions
4. Access to the correct Azure subscription and resource group

## Deployment Options

### Option 1: Using the Deployment Script (Recommended)

The included deployment script handles all details automatically, including error handling and fallback methods.

```bash
# Navigate to the project directory
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard

# Run the deployment script
./deploy_power_bi_styled.sh
```

This script will:
1. Prepare all files for deployment
2. Login to Azure if necessary
3. Deploy to Azure Static Web Apps
4. Provide a summary with deployment URLs

### Option 2: Using Azure CLI Directly

If you prefer to use Azure CLI commands directly, use the following:

```bash
# Navigate to the deployment directory
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/deployment-v2

# Deploy using Azure CLI
az staticwebapp deploy \
  --name "tbwa-juicer-insights-dashboard" \
  --resource-group "RG-TBWA-ProjectScout-Juicer" \
  --source "./public" \
  --no-build \
  --verbose
```

Replace `tbwa-juicer-insights-dashboard` and `RG-TBWA-ProjectScout-Juicer` with your actual Azure Static Web App name and resource group.

### Option 3: Using GitHub Actions (CI/CD)

For automated deployments via GitHub, use the GitHub Actions workflow. 

1. Add the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to your GitHub repository:
   - Go to your repository Settings > Secrets and variables > Actions
   - Add a new secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value should be your Azure Static Web Apps deployment token

2. Create the workflow file in your GitHub repository at `.github/workflows/azure-static-web-apps.yml`
   - Use the template provided in `GITHUB_WORKFLOW_SWA.yml`

3. Push to the `main` branch to trigger deployment

## Deployment Environments

| Environment | App Name | Resource Group | Region |
|-------------|----------|----------------|--------|
| Production | tbwa-juicer-insights-dashboard | RG-TBWA-ProjectScout-Juicer | East US 2 |

## Verification Steps

After deployment, verify success by:

1. Accessing the deployed dashboard URL:
   - `https://{your-static-webapp-url}/insights_dashboard.html`
   - `https://{your-static-webapp-url}/insights_dashboard_v2.html`

2. Check the following:
   - All styles are correctly applied (header, cards, charts)
   - All JavaScript functionality works (charts render, GenAI integration)
   - Responsive design works on different screen sizes
   - No console errors appear in browser dev tools

## Rollback Process

If issues are discovered, you can roll back to the previous version:

1. Using the Azure portal:
   - Navigate to your Static Web App resource
   - Go to "Deployment History"
   - Select the previous deployment and click "Redeploy"

2. Using the CLI:
   ```bash
   # Get the list of deployments
   az staticwebapp deployment list \
     --name "tbwa-juicer-insights-dashboard" \
     --resource-group "RG-TBWA-ProjectScout-Juicer"
    
   # Redeploy a previous build (replace [buildId] with the actual ID)
   az staticwebapp deployment redeploy \
     --name "tbwa-juicer-insights-dashboard" \
     --resource-group "RG-TBWA-ProjectScout-Juicer" \
     --deployment-id [buildId]
   ```

## Troubleshooting

Common issues and solutions:

1. **Deployment fails with authentication error**:
   - Ensure you're logged in: `az login`
   - Verify you have the correct permissions

2. **Files not showing up after deployment**:
   - Check the source path in your deployment command
   - Verify the file structure matches what SWA expects

3. **JavaScript errors in the browser**:
   - Check browser console for specific errors
   - Verify all JS files are correctly deployed and referenced

4. **Styling doesn't match expected look**:
   - Verify CSS files are correctly deployed
   - Check for CSS conflicts or browser caching issues (use hard refresh)

## Support and Contact

For deployment issues, contact:

- Azure Static Web Apps support: [docs.microsoft.com/en-us/azure/static-web-apps/troubleshooting](https://docs.microsoft.com/en-us/azure/static-web-apps/troubleshooting)
- Project maintainer: TBD