# Retail Advisor Insights Dashboard Deployment Guide

This guide provides instructions for deploying the Retail Advisor Insights Dashboard to Azure Static Web Apps using GitHub Actions.

## Prerequisites

- GitHub repository with the Retail Advisor codebase
- Azure subscription
- Azure Static Web Apps resource

## Deployment Process

### 1. Set Up GitHub Secrets

Before you can deploy, you need to add the Azure Static Web Apps API token as a GitHub secret:

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click on **New repository secret**
4. Add the following secret:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value**: Your Azure Static Web Apps deployment token (from Azure Portal)

### 2. Automatic Deployment

The deployment is handled automatically via GitHub Actions in the following scenarios:

- When code is pushed to the `main` branch or any `release/*` branch
- When changes are made to files in:
  - `dashboards/` directory
  - `notebooks/` directory
  - `.github/workflows/deploy-insights-dashboards.yml` file
- When manually triggered via GitHub Actions workflow dispatch

### 3. Manual Deployment

To manually trigger a deployment:

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Select the **Deploy Retail Advisor Insights Dashboards** workflow
4. Click **Run workflow**
5. Select the desired environment (dev, staging, or prod)
6. Click **Run workflow**

### 4. Verify Deployment

After the deployment completes:

1. Check the GitHub Actions logs for any errors
2. Look for the deployment URL at the end of the workflow output
3. Visit the URL to verify the dashboard is working correctly
4. Check the automatically captured screenshots in the workflow artifacts

## Deployment Environments

The dashboard can be deployed to different environments:

- **dev**: For development and testing
- **staging**: For pre-production validation
- **prod**: For production release

## Troubleshooting

If you encounter issues with the deployment:

1. Check the GitHub Actions workflow logs for error messages
2. Verify that all GitHub secrets are correctly configured
3. Make sure the Azure Static Web App resource exists and is properly set up
4. Check that the repository has all the necessary files (dashboards, visualizer JS, etc.)

## Additional Resources

- [Azure Static Web Apps documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- For detailed technical implementation, refer to `.github/workflows/deploy-insights-dashboards.yml`