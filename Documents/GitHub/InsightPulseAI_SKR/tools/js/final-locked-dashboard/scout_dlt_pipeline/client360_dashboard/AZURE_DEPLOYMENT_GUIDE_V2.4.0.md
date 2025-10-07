# Client360 Dashboard v2.4.0 Azure Deployment Guide

## Deployment Summary

The Client360 Dashboard v2.4.0 has been prepared for deployment to Azure Static Web Apps. This guide provides step-by-step instructions for completing the deployment process.

## Pre-Deployment Status

- ✅ All required files for v2.4.0 have been verified
- ✅ Deployment package has been created: `output/client360_dashboard_v2.4.0_[timestamp].zip`
- ✅ Resource Group `rg-client360-dashboard` has been created in Azure
- ⏳ Static Web App creation requires manual steps

## Manual Deployment Steps

### 1. Create Azure Static Web App

Login to the Azure Portal and create a Static Web App:

1. Go to the Azure Portal: https://portal.azure.com
2. Navigate to the Resource Group: `rg-client360-dashboard`
3. Click "Create" → "Static Web App"
4. Fill in the details:
   - **Name**: `swa-client360-dashboard`
   - **Hosting Plan**: Standard
   - **Region**: East US (or your preferred region)
   - **Source**: Other
5. Click "Review + Create" → "Create"

### 2. Upload the Dashboard Files

After the Static Web App is created:

1. In the Azure Portal, navigate to your new Static Web App
2. Select "Deployment" → "Manual Upload"
3. Extract the deployment package:
   ```bash
   unzip output/client360_dashboard_v2.4.0_[timestamp].zip -d deploy_files
   ```
4. Upload the contents of the `deploy_files/deploy_v2.4.0` directory

### 3. Configure Environment Variables

In the Azure Portal, set up the required environment variables:

1. Navigate to your Static Web App
2. Select "Configuration" → "Application settings"
3. Add the following key-value pairs:

   | Key | Value |
   |-----|-------|
   | AZURE_OPENAI_ENDPOINT | https://[your-openai-service].openai.azure.com |
   | AZURE_OPENAI_DEPLOYMENT_PRIMARY | client360-insights |
   | AZURE_OPENAI_DEPLOYMENT_EMBEDDING | client360-embedding |
   | AZURE_OPENAI_API_VERSION | 2023-05-15 |
   | DASHBOARD_VERSION | 2.4.0 |
   | ENABLE_AI_STREAMING | true |
   | ENABLE_MULTI_MODEL | true |
   | ENABLE_ADVANCED_CACHING | true |

4. Click "Save"

### 4. Set Up Azure OpenAI (If Not Already Configured)

If you haven't already set up Azure OpenAI:

1. In the Azure Portal, create a new Azure OpenAI resource:
   - **Name**: `openai-client360`
   - **Region**: East US (or available region)
   - **Pricing tier**: Standard S0

2. After creation, deploy the required models:
   - Model: `gpt-35-turbo` with deployment name: `client360-insights`
   - Model: `text-embedding-ada-002` with deployment name: `client360-embedding`

3. Store the API keys securely in Azure Key Vault

### 5. Configure Authentication (Optional)

If you want to enable authentication:

1. Navigate to your Static Web App
2. Select "Authentication" → "Edit provider"
3. Choose your authentication provider (e.g., Azure Active Directory)
4. Configure the required settings

## Post-Deployment Verification

After deployment, perform these verification steps:

1. Access the dashboard URL (found in the Static Web App overview)
2. Verify the footer displays "Client360 Dashboard v2.4.0"
3. Test the AI Insights panel:
   - Generate quick insights
   - Generate detailed insights
   - Verify streaming responses
4. Test the Map Visualization:
   - Toggle between map layers
   - Select different regions
   - Use heat visualization
5. Test User Personalization:
   - Create and save dashboard layouts
   - Save filter combinations
   - Create export templates

## Monitoring Setup

Set up monitoring for your deployment:

1. Navigate to your Static Web App
2. Select "Monitoring" → "Metrics"
3. Create a dashboard with key metrics:
   - Requests
   - Failures
   - Response time
4. Set up alerts for critical thresholds

## Rollback Procedure

If issues occur and you need to roll back:

1. In the Azure Portal, navigate to your Static Web App
2. Select "Deployment" → "Manual Upload"
3. Upload the previous version (v2.3.3) files
4. Revert the environment variables to previous values

## Support Resources

If you encounter issues during deployment:

- Check the logs in Azure Monitor
- Review the Azure Static Web App documentation
- Consult the Client360 Dashboard technical documentation
- Contact the development team at support@client360dashboard.com

## Reference Files

- **Deployment Package**: `output/client360_dashboard_v2.4.0_[timestamp].zip`
- **Checksum File**: `output/checksums_v2.4.0_[timestamp].md5`
- **Feature Documentation**: `CLIENT360_V2.4.0_FEATURES.md`
- **Release Notes**: `RELEASE_2.4.0.md`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST_2.4.0.md`

---

## Appendix: Using GitHub Actions for Deployment

For future deployments, consider setting up a GitHub Actions workflow:

1. Create a `.github/workflows/azure-static-web-app.yml` file
2. Configure the workflow to deploy to your Static Web App
3. Set up secrets for API keys and configuration
4. Trigger deployments via git push or pull request

This will automate the deployment process and enable CI/CD for future releases.