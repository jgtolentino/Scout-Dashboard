# UI-Genie Azure Deployment Guide

This directory contains all the necessary scripts to deploy the UI-Genie application to Azure. The application is deployed as a Static Web App for the frontend and an App Service for the backend API.

## Prerequisites

1. [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
2. Active Azure subscription
3. Node.js and npm installed
4. Python 3.9+ installed

## Scripts Overview

### Initial Deployment

- **deploy.sh**: Deploys the frontend to Azure Static Web App
- **setup-api-backend.sh**: Sets up and deploys the backend API to Azure App Service

### Continuous Deployment

- **deploy-staging.sh**: Deploys the frontend to a staging slot
- **swap-slots.sh**: Swaps the staging slot with production
- **purge-cdn.sh**: Purges the CDN cache to ensure latest content is served

### Custom Domain

- **add-custom-domain.sh**: Adds a custom domain to the Static Web App

## GitHub Actions

Two GitHub Actions workflows are included:

1. **azure-static-web-app.yml**: Builds and deploys the frontend
2. **azure-backend-api.yml**: Builds and deploys the backend API

## Deployment Steps

### First Time Setup

1. Update subscription name in all scripts:
   ```bash
   # Replace "your-subscription-name" with your actual subscription name
   SUBSCRIPTION_NAME="your-actual-subscription-name"
   ```

2. Make all scripts executable:
   ```bash
   chmod +x deploy/*.sh
   ```

3. Deploy infrastructure and frontend:
   ```bash
   ./deploy/deploy.sh
   ```

4. Deploy backend API:
   ```bash
   ./deploy/setup-api-backend.sh
   ```

### GitHub Actions Setup

1. Create a repository secret named `AZURE_STATIC_WEB_APPS_API_TOKEN` with the deployment token from Azure Static Web App.
   
   Get the token using:
   ```bash
   az staticwebapp secrets list \
     --name ui-genie-app \
     --resource-group ui-genie-rg \
     --query "properties.apiKey" -o tsv
   ```

2. Create a repository secret named `AZURE_CREDENTIALS` with a service principal JSON.
   
   Create the service principal using:
   ```bash
   az ad sp create-for-rbac --name "ui-genie-github-actions" \
     --role contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/ui-genie-rg \
     --sdk-auth
   ```

### Staging Deployment and Promotion

1. Deploy to staging:
   ```bash
   ./deploy/deploy-staging.sh
   ```

2. After testing, promote to production:
   ```bash
   ./deploy/swap-slots.sh
   ```

### Adding a Custom Domain

1. Update the domain in the script:
   ```bash
   # Replace "ui-genie.yourdomain.com" with your actual domain
   CUSTOM_DOMAIN="your-actual-domain.com"
   ```

2. Run the script:
   ```bash
   ./deploy/add-custom-domain.sh
   ```

3. Add the required DNS records as instructed by the script.

## Troubleshooting

If you encounter issues:

1. Check Azure resource deployment status:
   ```bash
   az staticwebapp show --name ui-genie-app --resource-group ui-genie-rg
   az webapp show --name ui-genie-api --resource-group ui-genie-rg
   ```

2. View application logs:
   ```bash
   az staticwebapp logs show --name ui-genie-app --resource-group ui-genie-rg
   az webapp log tail --name ui-genie-api --resource-group ui-genie-rg
   ```

3. Purge CDN cache after updates:
   ```bash
   ./deploy/purge-cdn.sh
   ```