# Scout Dashboard CI/CD Setup - Complete Guide

This document provides the final setup instructions to complete the CI/CD pipeline configuration for the Scout Dashboard in Azure DevOps.

## 1. Deployment Status

✅ **Dashboard has been deployed successfully!**

- **URL**: https://delightful-glacier-03349aa0f.6.azurestaticapps.net
- **Resource Group**: RG-TBWA-ProjectScout-Juicer
- **Static Web App Name**: scout-dashboard

## 2. Azure DevOps Setup Instructions

Follow these steps to complete the CI/CD pipeline configuration:

### 2.1. Access Azure DevOps

1. Go to [Azure DevOps](https://dev.azure.com)
2. Sign in with your Microsoft account

### 2.2. Create or Select Organization

1. Use an existing organization or create a new one:
   - Click **New organization**
   - Name it (e.g., `tbwa-project-scout`)
   - Select region and click **Continue**

### 2.3. Create Project

1. Click **+ New project**
2. Fill in the details:
   - **Project name**: `scout-dashboard`
   - **Visibility**: Private (recommended)
   - **Version control**: Git
   - **Work item process**: Agile (or your preference)
3. Click **Create project**

### 2.4. Create Variable Group

1. Go to **Pipelines** → **Library**
2. Click **+ Variable group**
3. Set the following:
   - **Variable group name**: `azure-static-webapp-vars`
   - Add these variables:
     - Name: `AZURE_STATIC_WEB_APP_TOKEN`
       - Value: `5d4094b03359795014c37eae8dfa7bbe46ffc4bd9a5684cdc8526b8a9b6baa9d06-522d0a67-bdf4-4de9-9a9e-95105ab6f05300f181203349aa0f`
       - Check **Keep this value secret**
     - Name: `STATIC_WEB_APP_NAME`
       - Value: `scout-dashboard`
4. Click **Save**

### 2.5. Connect to GitHub Repository

1. Go to **Project settings** → **Service connections**
2. Click **Create service connection**
3. Select **GitHub**
4. Choose **OAuth** or **Personal Access Token**
   - For OAuth: Follow the prompts to authorize Azure DevOps
   - For PAT: Provide your GitHub personal access token
5. Name the connection (e.g., `github-connection`)
6. Select **Grant access permission to all pipelines**
7. Click **Save**

### 2.6. Create Pipeline

1. Go to **Pipelines** → **Pipelines**
2. Click **Create pipeline**
3. Select **GitHub** as source
4. Select your repository: `jgtolentino/InsightPulseAI_SKR`
5. You may need to authorize Azure Pipelines on GitHub if prompted
6. Select **Existing Azure Pipelines YAML file**
7. Path: `/tools/js/azure-pipelines.yml`
8. Click **Continue**
9. Review the pipeline YAML
10. Click **Run** to create and run the pipeline

## 3. Verify Pipeline Execution

After running the pipeline:

1. Monitor the pipeline execution in Azure DevOps
2. When the pipeline completes, verify the deployment:
   - Visit https://delightful-glacier-03349aa0f.6.azurestaticapps.net
   - Check that all dashboard components load correctly
   - Verify that navigation works between different views

## 4. Continuous Deployment

The pipeline is now set up for continuous deployment. When you push changes to:
- The `main` branch
- The `dashboard-deployment` branch
- Files in the specified paths in the repository

The pipeline will automatically:
1. Validate the deployment files
2. Create a deployment report
3. Deploy to Azure Static Web App
4. Provide verification instructions

## 5. Manual Deployment (if needed)

If you need to deploy manually, use the SWA CLI:

```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy using SWA CLI
swa deploy "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy-advisor-fixed" \
  --deployment-token "5d4094b03359795014c37eae8dfa7bbe46ffc4bd9a5684cdc8526b8a9b6baa9d06-522d0a67-bdf4-4de9-9a9e-95105ab6f05300f181203349aa0f" \
  --env "production"
```

## 6. Deployment Verification

After deployment, verify using the verification script:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js
./azure-deployment-verification-fixed.sh
```

## 7. Next Steps

1. Consider implementing automated testing for the dashboard components
2. Set up monitoring and alerts for the Azure Static Web App
3. Document the dashboard URLs and functionality for end users
4. Consider setting up a staging environment for testing changes before production

## 8. Maintenance

- To update the dashboard, simply push changes to the repository
- The CI/CD pipeline will handle the deployment
- Monitor the pipeline execution in Azure DevOps
- Check deployment logs for any issues

---

✅ **CI/CD Setup Complete!**

Your Scout Dashboard now has a fully automated CI/CD pipeline. Any changes pushed to the repository will be automatically deployed to Azure Static Web Apps.