# Azure Static Web App Deployment Instructions

These instructions guide you through manually deploying the Advisor dashboard to Azure Static Web Apps through the Azure Portal.

## Pre-Deployment Checklist

- [x] Dashboard UI components created and tested locally
- [x] Dashboard routing configuration set up correctly
- [x] Proper directory structure following SOP_DEPLOYMENT.md guidelines
- [x] staticwebapp.config.json configured with the right routes
- [x] Deployment package created: `scout_dashboards_url_structure.zip`

## Manual Deployment Steps

1. **Login to Azure Portal**
   - Navigate to https://portal.azure.com
   - Login with your Azure credentials

2. **Navigate to the Static Web App**
   - Go to the resource group: `RG-TBWA-ProjectScout-Juicer`
   - Find the Static Web App: `wonderful-desert-03a292c00`

3. **Upload the Deployment Package**
   - In the left navigation, select "Deployment" 
   - Click "Upload"
   - Select the file: `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/scout_dashboards_url_structure.zip`
   - Click "Upload" to start the deployment

4. **Wait for Deployment to Complete**
   - The deployment process typically takes 1-3 minutes
   - You'll see a notification when the deployment is complete

5. **Verify the Deployment**
   - Visit the following URLs to verify the dashboard is working:
     - Main dashboard: https://wonderful-desert-03a292c00.6.azurestaticapps.net/advisor
     - Edge route: https://wonderful-desert-03a292c00.6.azurestaticapps.net/edge
     - Ops route: https://wonderful-desert-03a292c00.6.azurestaticapps.net/ops
     - Legacy URL: https://wonderful-desert-03a292c00.6.azurestaticapps.net/insights_dashboard.html

## Troubleshooting

If the dashboard doesn't appear after deployment, check the following:

1. **Check Browser Console**
   - Open browser developer tools (F12)
   - Look for any 404 errors or asset loading issues

2. **Verify staticwebapp.config.json**
   - Make sure the routes are correctly configured
   - Check that the navigationFallback is set properly

3. **Check Asset Paths**
   - Ensure CSS and JS files are using relative paths (./assets/) not absolute paths (/assets/)

4. **Clear Browser Cache**
   - Try hard-refreshing the page (Ctrl+F5)
   - Or use incognito/private browsing mode

## CI/CD Setup (Future Enhancement)

For future deployments, consider setting up CI/CD with GitHub Actions by:

1. Connecting the Static Web App to your GitHub repository
2. Setting up a GitHub Actions workflow
3. Configuring automatic deployments on merge to main branch

This will eliminate the need for manual deployments.

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [URL Routing in Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/routes)
- SOP_DEPLOYMENT.md in final-locked-dashboard/docs/