# Azure Static Web App Dashboard Deployment

This guide explains how to deploy the Juicer Insights Dashboard to Azure Static Web Apps.

## ✅ Deployment Status

**Live Dashboard URL:**
```
https://gentle-rock-04e54f40f.6.azurestaticapps.net/insights_dashboard.html
```

**Direct Link:**
```
https://gentle-rock-04e54f40f.6.azurestaticapps.net/
```

**Deployment Method:**
GitHub Actions (via `.github/workflows/azure-static-web-apps.yml`)

## Automated Deployment via GitHub Actions

The repository is configured with a GitHub Actions workflow that automatically deploys the dashboard to Azure Static Web Apps whenever changes are pushed to the `dashboards/` folder.

### Prerequisites

1. An Azure Static Web App resource must be created in your Azure account
2. The GitHub repository must be connected to the Azure Static Web App
3. The `AZURE_STATIC_WEB_APPS_API_TOKEN` secret must be configured in the GitHub repository

### Deployment Process

1. Make changes to files in the `dashboards/` directory
2. Commit and push the changes to the `main` branch
3. GitHub Actions will automatically build and deploy your changes
4. Wait for the GitHub Action workflow to complete
5. Access your dashboard at the URLs above

## Manual Deployment via Azure CLI

You can also deploy manually using the Azure CLI:

```bash
# Login to Azure
az login

# Deploy the dashboard
az staticwebapp upload \
  --name gentle-rock-04e54f40f \
  --source ./dashboards \
  --output-location . \
  --resource-group <YOUR_RESOURCE_GROUP>
```

Replace `<YOUR_RESOURCE_GROUP>` with your actual Azure resource group name.

## File Structure

The following files are included in the deployment:

- `insights_dashboard.html` - The main dashboard interface
- `insights_visualizer.js` - JavaScript for visualizing data and rendering charts
- `index.html` - Redirect page that points to the dashboard
- `staticwebapp.config.json` - Configuration for Azure Static Web Apps including routes and MIME types

## Useful Links

- Dashboard URL: https://gentle-rock-04e54f40f.6.azurestaticapps.net/
- Dashboard direct link: https://gentle-rock-04e54f40f.6.azurestaticapps.net/insights_dashboard.html
- Azure Static Web Apps documentation: https://docs.microsoft.com/en-us/azure/static-web-apps/

## Troubleshooting

If you encounter deployment issues:

1. Check the GitHub Actions logs for error messages
2. Verify that the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret is correctly set
3. Ensure the file paths in the workflow YAML match your project structure
4. Check the `staticwebapp.config.json` for correct routing configurations