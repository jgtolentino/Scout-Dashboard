# Retail Advisor Dashboard - Azure Deployment

This directory contains the necessary scripts and workflows to deploy the Retail Advisor dashboard from the `mockify-creator` repository to Azure Web App. This ensures the dashboard is properly hosted and accessible to TBWA clients.

## Deployment Options

There are two deployment options available:

1. **Manual Deployment** - Using the `deploy_retail_advisor_to_azure.sh` shell script
2. **Automated Deployment** - Using GitHub Actions with the provided workflow file

## 1. Manual Deployment

The shell script automates the entire deployment process, including:

- Cloning the repository from `https://github.com/jgtolentino/mockify-creator`
- Building the project
- Creating the Azure Web App (if it doesn't exist)
- Configuring deployment settings
- Deploying the dashboard to Azure
- Setting up custom domain (optional)

### Prerequisites

- Azure CLI installed and logged in
- Git installed
- Node.js and npm installed

### Usage

1. Edit the configuration variables in the script to match your Azure environment:

```bash
REPO_URL="https://github.com/jgtolentino/mockify-creator"
BRANCH="main"
AZURE_RESOURCE_GROUP="RG-TBWA-RetailAdvisor"
AZURE_WEB_APP_NAME="retail-advisor-dashboard"
DEPLOYMENT_SLOT="production"
```

2. Make the script executable:

```bash
chmod +x deploy_retail_advisor_to_azure.sh
```

3. Run the script:

```bash
./deploy_retail_advisor_to_azure.sh
```

## 2. GitHub Actions Workflow

The GitHub Actions workflow automates the deployment process from your GitHub repository. It triggers on:

- Pushes to the main branch
- Pull requests to the main branch
- Manual workflow dispatch (with environment selection)

### Prerequisites

1. GitHub repository setup with the workflow file in `.github/workflows/`
2. Azure Web App created
3. Azure service principal for deployment

### Configuration

1. Store the following GitHub secrets:
   - `AZURE_WEBAPP_PUBLISH_PROFILE` - The publish profile from Azure Web App

2. Customize the environment variables in the workflow file:
   - `NODE_VERSION` - Node.js version (default: 16.x)
   - `AZURE_WEBAPP_NAME` - Azure Web App name
   - `AZURE_RESOURCE_GROUP` - Azure Resource Group
   - `DASHBOARD_NAME` - Dashboard display name

### Usage

1. Place the workflow file in `.github/workflows/` directory
2. Push changes to trigger the workflow automatically
3. Alternatively, manually trigger the workflow from the GitHub Actions tab

## Deployment Status Verification

After deployment, verify that the dashboard is accessible at:

- Azure Web App URL: `https://{AZURE_WEBAPP_NAME}.azurewebsites.net`
- Custom domain (if configured): `https://retail-advisor.tbwa.com`

## Important Notes

1. The Retail Advisor dashboard **must be deployed on Azure**, not Vercel
2. The source code must come from `https://github.com/jgtolentino/mockify-creator`
3. The dashboard is client-facing and should be properly secured
4. The branding is set to "Retail Advisor" for this specific dashboard

## Troubleshooting

If you encounter issues during deployment:

1. **Azure CLI login issues**: Run `az login` separately and try again
2. **Build failures**: Check if the repository structure is compatible with the build script
3. **Deployment failures**: Check Azure App Service logs for details
4. **Custom domain issues**: Verify DNS settings and SSL certificate configuration