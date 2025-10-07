# GitHub Deployment Instructions

Follow these steps to deploy the GenAI insights dashboards using GitHub Actions.

## 1. Add GitHub Secret

First, you need to add the Azure Static Web Apps API token as a GitHub secret:

1. Go to your GitHub repository: https://github.com/YOUR_ORG/InsightPulseAI_SKR
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click on **New repository secret**
4. Enter the following:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value**: `477f5c14b3609214c6fd232f856fbe0845f337ac39f8b4c6856f6d01528156f906-0d2e4e58-330a-4510-82ce-dcaca757e9f000f191804e54f40f`
5. Click **Add secret**

## 2. Commit and Push Changes

Commit and push all the changes to GitHub:

```bash
git add .
git commit -m "Add GenAI insights integration across all dashboards"
git push origin release/pulser-2.1.2
```

## 3. Run the GitHub Workflow

There are two ways to trigger the deployment:

### Option 1: Automatic Trigger
The workflow will automatically run when you push changes to the following paths:
- `tools/js/juicer-stack/dashboards/**`
- `tools/js/juicer-stack/tools/deploy_insights_all_dashboards.js`

### Option 2: Manual Trigger
1. Go to your GitHub repository: https://github.com/YOUR_ORG/InsightPulseAI_SKR
2. Navigate to **Actions** > **Deploy GenAI Insights Dashboards**
3. Click on **Run workflow**
4. Select the appropriate environment (dev, staging, or prod)
5. Click **Run workflow**

## 4. Monitor Deployment

1. Go to the **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Monitor the progress of the deployment

## 5. Access the Deployed Dashboards

Once the deployment is complete, you can access the dashboards at:

```
https://gentle-rock-04e54f40f.6.azurestaticapps.net
```

## Troubleshooting

If you encounter any issues with the deployment:

1. Check the GitHub Actions logs for error messages
2. Verify that the Azure Static Web Apps API token is correctly set as a GitHub secret
3. Ensure that all file paths in the GitHub workflow file are correct
4. Check that the Azure Static Web App resource exists and is properly configured

For additional help, refer to the Azure Static Web Apps documentation:
https://docs.microsoft.com/en-us/azure/static-web-apps/