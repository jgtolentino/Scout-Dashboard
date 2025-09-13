# Client360 Dashboard Deployment Guide

This guide provides instructions for deploying the Client360 Dashboard with AI integration.

## Prerequisites

- Node.js 16+
- Bash shell environment
- Python 3.8+ (for AI components)
- Azure CLI (for Azure deployment)
- Databricks CLI (optional, for database operations)

## Deployment Options

The Client360 Dashboard can be deployed in several ways:

1. **Complete Deployment with AI Integration**: Deploys the full dashboard with all AI components
2. **Dashboard-only Deployment**: Deploys just the dashboard without AI components
3. **Development Deployment**: Deploys with synthetic data for development and testing
4. **Production Deployment**: Deploys with real data integration for production use

## Complete Deployment with AI Integration

This is the recommended approach for new deployments:

```bash
# Clone the repository if you haven't already
git clone https://github.com/your-repo/client360-dashboard.git
cd client360-dashboard

# Copy and configure environment variables
cp data/.env.example .env.local
# Edit .env.local with your configuration values

# Run the deployment script
./deploy_with_ai.sh
```

The `deploy_with_ai.sh` script handles:
- Setting up the dashboard files
- Creating a backup of any previous deployment
- Installing AI components and configurations
- Generating synthetic insights for development (if enabled)
- Deploying to Azure (if configured)
- Generating a verification report

## Dashboard-only Deployment

If you don't need the AI components:

```bash
# For a standard deployment
./deploy_end_to_end.sh

# OR for a fixed dashboard deployment
./deploy_fixed_dashboard.sh
```

## Development vs. Production

### Development Deployment

For development environments with synthetic data:

1. In `.env.local`, set:
   ```
   NODE_ENV=development
   ENABLE_SYNTHETIC_DATA=true
   ```

2. Run the deployment script:
   ```bash
   ./deploy_with_ai.sh
   ```

This will generate synthetic insights for testing without requiring a real database connection.

### Production Deployment

For production environments with real data:

1. In `.env.local`, set:
   ```
   NODE_ENV=production
   ENABLE_SYNTHETIC_DATA=false
   DATABRICKS_HOST=your-databricks-host
   DATABRICKS_TOKEN=your-databricks-token
   DATABRICKS_HTTP_PATH=your-databricks-http-path
   ```

2. Ensure the database schema is set up:
   ```bash
   databricks sql query --file data/ai_insights_table.sql
   ```

3. Run the deployment script:
   ```bash
   ./deploy_with_ai.sh
   ```

## Azure Deployment

To deploy to Azure Static Web Apps:

1. In `.env.local`, set:
   ```
   AZURE_STATIC_WEB_APP_NAME=your-app-name
   AZURE_RESOURCE_GROUP=your-resource-group
   AZURE_STATIC_WEB_APP_DEPLOYMENT_TOKEN=your-deployment-token
   ```

2. Run the deployment script:
   ```bash
   ./deploy_with_ai.sh
   ```

Alternatively, deploy using GitHub Actions by configuring the workflow in `.github/workflows/azure-static-web-apps.yml`.

## Verifying Deployment

After deployment, check the verification report in `output/deployment_verification_TIMESTAMP.md` for details about the deployment status.

For a deployed app, verify:
1. Dashboard loads correctly at your deployment URL
2. All components are functioning (maps, charts, data tables)
3. AI insights components are displayed (if enabled)
4. Data is refreshing as expected

## Troubleshooting

If you encounter issues:

1. Check the deployment log in `logs/deployment_TIMESTAMP.log`
2. Verify the environment variables in `.env.local`
3. For AI issues, check if synthetic data is enabled/disabled as expected
4. For database issues, verify Databricks connectivity

Common issues:
- **AI insights not showing**: Check browser console for errors, verify that `ai_insights_component.js` is loaded
- **Database connection errors**: Check Databricks credentials and network connectivity
- **Azure deployment failures**: Verify the Azure CLI is installed and you're logged in

## Manual Deployment

If automated deployment fails, you can deploy manually:

1. Copy all files from the `deploy` directory to your web server
2. Set up the database using the SQL script in `data/ai_insights_table.sql`
3. Configure your web server to serve the application (with appropriate headers)

## Rollback Procedure

To rollback to a previous deployment:

1. Locate the backup directory created during deployment (`client360_dashboard_TIMESTAMP`)
2. Replace the current deployment with the backup:
   ```bash
   cp -r client360_dashboard_TIMESTAMP/* deploy/
   ```

For Azure deployments, you can also use the Azure Portal to revert to a previous deployment.