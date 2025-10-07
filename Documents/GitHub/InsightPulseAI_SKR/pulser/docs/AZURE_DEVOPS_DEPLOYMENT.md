# Scout Dashboard Deployment with Azure DevOps

This guide explains how to set up CI/CD for the Scout Dashboard using Azure DevOps pipelines while keeping the code in GitHub.

## Overview

![Azure DevOps + GitHub Workflow](https://docs.microsoft.com/en-us/azure/devops/pipelines/repos/media/pipelines-github.png?view=azure-devops)

The deployment workflow is:
1. Code is stored in GitHub repository
2. Azure DevOps pipeline monitors the repository for changes
3. When changes are detected, the pipeline builds and deploys to Azure Static Web Apps
4. The dashboard is available at Azure Static Web Apps URL

## Prerequisites

- GitHub repository with dashboard code
- Azure account with permission to create Static Web Apps
- Azure DevOps organization and project

## Step 1: Create Azure Static Web App

1. Login to [Azure Portal](https://portal.azure.com)
2. Navigate to **Create a Resource** > **Web** > **Static Web App**
3. Fill in the details:
   - **Resource Group**: `RG-TBWA-ProjectScout-Juicer` (or create new)
   - **Name**: `scout-dashboard` (or your preferred name)
   - **Hosting Plan**: Free
   - **Region**: Select nearest region
   - **Source**: Other
4. Click **Review + create** then **Create**
5. After creation, go to the resource and note the URL (e.g., `https://scout-dashboard.azurestaticapps.net`)

## Step 2: Get Azure Static Web App Deployment Token

1. In the Azure Portal, navigate to your Static Web App
2. Go to **Deployment** > **Manage deployment token**
3. Copy the deployment token (we'll need this in Azure DevOps)

## Step 3: Set Up Azure DevOps Pipeline

1. Login to [Azure DevOps](https://dev.azure.com)
2. Navigate to your project (or create a new one)
3. Go to **Pipelines** > **New Pipeline**
4. Choose **GitHub** as the source
5. Authorize Azure DevOps to access your GitHub account if needed
6. Select your repository (`InsightPulseAI_SKR` or equivalent)
7. Choose **Existing Azure Pipelines YAML file**
8. Enter path to the YAML file: `/tools/js/azure-pipelines.yml`
9. Click **Continue**

## Step 4: Add Deployment Token to Azure DevOps

1. In Azure DevOps, go to **Pipelines** > **Library**
2. Click **+ Variable group**
3. Name the group: `azure-static-webapp-vars`
4. Add the following variables:
   - Name: `AZURE_STATIC_WEB_APP_TOKEN`
   - Value: (paste the deployment token from Azure)
   - Check the "Keep this value secret" option
5. Add another variable:
   - Name: `STATIC_WEB_APP_NAME`
   - Value: The name of your Static Web App (e.g., `scout-dashboard`)
6. Click **Save**

## Step 5: Run the Pipeline

1. Review the pipeline
2. Click **Run**
3. The pipeline will:
   - Validate deployment files
   - Create a deployment report
   - Deploy to Azure Static Web App
   - Provide verification instructions

## Step 6: Verify the Deployment

After deployment completes:

1. Navigate to the Azure Static Web App URL:
   - Main dashboard: `https://<your-app-name>.azurestaticapps.net/advisor`
   - Legacy URL: `https://<your-app-name>.azurestaticapps.net/insights_dashboard.html`

2. Verify:
   - All dashboard components load correctly
   - Navigation between different views works
   - No JavaScript errors in browser console
   - Responsive design works on different screen sizes

## Troubleshooting

### 404 Errors on Navigation

If you encounter 404 errors when navigating between routes:

1. Verify the `staticwebapp.config.json` file is in the deployment
2. Check the routes configuration is correct
3. Use the Azure Portal to check Static Web App configuration

### Pipeline Fails to Deploy

If the pipeline fails:

1. Check the error message in the pipeline logs
2. Verify the deployment token is correct
3. Ensure the deployment files are in the correct location

## Continuous Deployment

The pipeline is configured to trigger automatically when changes are pushed to:
- The `main` branch
- The `dashboard-deployment` branch
- Specific paths related to the dashboard

This ensures your dashboard is always up-to-date with the latest changes.

## Manual Deployment

If you need to deploy manually:

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Deploy to Azure Static Web App
az staticwebapp deploy \
  --source-location "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy-advisor-fixed" \
  --app-name "scout-dashboard" \
  --no-build
```

## Contact

For deployment issues, contact the Scout Dashboard team.