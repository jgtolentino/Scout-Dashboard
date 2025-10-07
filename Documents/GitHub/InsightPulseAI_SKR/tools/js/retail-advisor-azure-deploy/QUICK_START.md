# Retail Advisor Dashboard - Quick Start Guide

This guide provides the fastest way to deploy the Retail Advisor dashboard to Azure Web App.

## One-Step Manual Deployment

Execute the following commands in your terminal:

```bash
# Get the deployment scripts
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/retail-advisor-azure-deploy

# Make the script executable
chmod +x deploy_retail_advisor_to_azure.sh

# Run the deployment script
./deploy_retail_advisor_to_azure.sh
```

## GitHub Actions Setup

1. Create the `.github/workflows` directory in your repository:

```bash
mkdir -p .github/workflows
```

2. Copy the workflow file to the correct location:

```bash
cp retail-advisor-azure-deploy.yml .github/workflows/
```

3. Create the required GitHub secret:

- Navigate to your GitHub repository
- Go to Settings > Secrets and variables > Actions
- Click "New repository secret"
- Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
- Value: (Get this from Azure Portal > Your App Service > Get publish profile)

4. Push the changes to your repository

## Azure Prerequisites

If you haven't set up Azure resources yet:

```bash
# Login to Azure
az login

# Create a resource group
az group create --name RG-TBWA-RetailAdvisor --location eastus

# Create an App Service Plan
az appservice plan create \
  --name AppServicePlan-RG-TBWA-RetailAdvisor \
  --resource-group RG-TBWA-RetailAdvisor \
  --sku B1 \
  --is-linux

# Create the Web App
az webapp create \
  --name retail-advisor-dashboard \
  --resource-group RG-TBWA-RetailAdvisor \
  --plan AppServicePlan-RG-TBWA-RetailAdvisor \
  --runtime "NODE|16-lts"
```

## Verify Deployment

After deployment completes, verify the dashboard is accessible at:

```
https://retail-advisor-dashboard.azurewebsites.net
```

## Full Documentation

For complete details, refer to the [README.md](README.md) file.