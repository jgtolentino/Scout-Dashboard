# Azure Deployment Instructions

Follow these steps to complete the deployment to Azure Static Web Apps.

## 1. Push to GitHub

First, push this repository to GitHub:

```bash
# Add your GitHub repository as a remote
git remote add origin https://github.com/your-org/project-scout.git

# Push to GitHub
git push -u origin main
```

## 2. Add GitHub Secret

1. Go to your GitHub repository: https://github.com/your-org/project-scout
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click on **New repository secret**
4. Add the following secret:
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value**: Your Azure Static Web Apps deployment token

You can get this token from the Azure Portal by:
1. Going to your Static Web App resource
2. Under **Settings**, click on **Deployment tokens**
3. Copy the token value

## 3. Run GitHub Workflow

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Select the **Deploy Retail Advisor Insights Dashboards** workflow
4. Click **Run workflow**
5. Select the desired environment (dev, staging, or prod)
6. Click **Run workflow**

## 4. Verify Deployment

After the workflow completes:
1. Go to the **Actions** tab and click on the completed workflow run
2. Check the logs for any errors and the deployment URL
3. Visit the deployment URL to verify everything is working correctly
4. Check the automatically captured screenshots in the workflow artifacts

## Troubleshooting

If you encounter issues:
1. Verify your Azure Static Web App resource is properly configured
2. Check that the GitHub secret is correctly set
3. Review the GitHub Actions workflow logs for detailed error messages

## Next Steps

Once deployed:
1. Share the dashboard URL with stakeholders
2. Consider setting up custom domain if needed
3. Set up monitoring for the deployed application