# Juicer Stack Deployment Guide

This guide outlines the steps to deploy the Juicer Stack for integration with Pulser CLI and Databricks.

## Prerequisites

Before deployment, ensure you have:

- Azure subscription with access to:
  - Azure Databricks
  - Azure SQL Database
  - Azure Static Web Apps (optional, for dashboard hosting)
- Node.js 14+ and npm
- Python 3.8+
- Pulser CLI installed and configured
- Access to GitHub repository for CI/CD workflows

## Deployment Steps

### 1. Databricks Setup

#### Provision Databricks Workspace

1. In the Azure Portal, create a new Databricks workspace:
   ```
   Name: InsightPulseAI-Databricks
   Resource Group: project-scout-rg
   Pricing Tier: Standard (or Premium for Unity Catalog)
   ```

2. Launch the workspace and create a new cluster:
   ```
   Cluster name: JuicerProcessing
   Databricks Runtime: 11.3 LTS (Scala 2.12, Spark 3.3.0)
   Worker type: Standard_DS3_v2
   Min workers: 1
   Max workers: 4
   ```

#### Create Tables and Mount Storage

1. Upload and run the `juicer_setup_storage.py` notebook to create the storage mounts:
   ```python
   dbutils.fs.mount(
     source = "wasbs://<container-name>@<storage-account-name>.blob.core.windows.net/insightpulseai",
     mount_point = "/mnt/insightpulseai",
     extra_configs = {
       "fs.azure.account.key.<storage-account-name>.blob.core.windows.net": "<storage-account-key>"
     }
   )
   ```

2. Create the database and tables schema:
   ```sql
   CREATE DATABASE IF NOT EXISTS insight_pulse_ai;
   
   CREATE TABLE IF NOT EXISTS insight_pulse_ai.bronze.transcripts 
   USING DELTA
   LOCATION '/mnt/insightpulseai/bronze/transcripts';
   
   CREATE TABLE IF NOT EXISTS insight_pulse_ai.silver.transcript_entity_mentions
   USING DELTA
   LOCATION '/mnt/insightpulseai/silver/transcript_entity_mentions';
   
   CREATE TABLE IF NOT EXISTS insight_pulse_ai.gold.transcript_insights
   USING DELTA
   LOCATION '/mnt/insightpulseai/gold/transcript_insights';
   ```

3. Generate a Databricks API token:
   - In Databricks, go to User Settings > Access Tokens
   - Click "Generate New Token"
   - Save the token securely for later use

#### Upload Notebooks

1. Upload notebooks to Databricks:
   ```bash
   databricks workspace import-dir juicer-stack/notebooks /Shared/InsightPulseAI/Juicer
   ```
   
   Alternatively, you can use the GitHub Actions workflow to deploy notebooks automatically.

### 2. Dashboard Deployment

#### Option A: Deploy to Static Web App

1. Create an Azure Static Web App:
   ```
   Name: juicer-dashboard
   Resource Group: project-scout-rg
   Region: East US 2
   ```

2. Deploy the dashboard files:
   ```bash
   # Using Azure CLI
   az staticwebapp deploy --source-path juicer-stack/dashboards --app-name juicer-dashboard
   ```

3. Configure the Static Web App URL in the `.pulserrc` file.

#### Option B: Serve via Express

1. Add the static files route to your Express app:
   ```javascript
   // In your main Express app file
   app.use('/dashboards/juicer', express.static(path.join(__dirname, 'juicer-stack/dashboards')));
   ```

2. Update the `.pulserrc` file with the correct dashboard URL:
   ```
   [juicer.dashboard]
   url = "/dashboards/juicer"
   ```

### 3. API Integration

1. Ensure the sketch generation API endpoints are available:
   ```javascript
   // These should already be set up in router/api/index.js
   router.post('/sketch_generate', sketchGenerateHandler);
   router.get('/sketch_generate/status/:id', sketchGenerateHandler.getSketchJobStatus);
   router.get('/sketch_generate/preview/:id', sketchGenerateHandler.getSketchPreview);
   ```

2. Add the Juicer command handler to Pulser CLI:
   ```javascript
   // These should be set up in router/index.js
   app.post('/command', handleCommand);
   ```

### 4. Pulser CLI Configuration

1. Apply the `.pulserrc` patch to your existing configuration:
   ```bash
   # Backup current config
   cp ~/.pulserrc ~/.pulserrc.bak
   
   # Append the Juicer configuration
   cat juicer-stack/pulser_config/.pulserrc_patch >> ~/.pulserrc
   ```

2. Update the Databricks connection information in `.pulserrc`:
   ```
   [juicer.databricks]
   workspace_url = "https://your-workspace.azuredatabricks.net"
   ```

3. Set the Databricks API token as an environment variable:
   ```bash
   echo 'export DATABRICKS_API_TOKEN=your-token-here' >> ~/.bashrc
   source ~/.bashrc
   ```

### 5. GitHub Actions Setup

1. Create the GitHub Actions workflow file:
   ```bash
   mkdir -p .github/workflows/
   cp juicer-stack/github_workflows/deploy-juicer.yml .github/workflows/
   ```

2. Add required secrets to your GitHub repository:
   - `DATABRICKS_HOST`: Your Databricks workspace URL
   - `DATABRICKS_TOKEN`: Your Databricks API token
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: Token for Azure Static Web Apps (if used)
   - `MS_TEAMS_WEBHOOK_URL`: Optional Teams notification webhook
   - `NOTIFICATION_EMAIL`: Optional email for deployment notifications
   - Email server settings if using email notifications

3. Commit and push the changes:
   ```bash
   git add .github/workflows/deploy-juicer.yml
   git commit -m "Add Juicer deployment workflow"
   git push
   ```

### 6. Validation and Testing

1. Verify CLI functionality:
   ```bash
   pulser :juicer query "Show brand mentions for last 7 days"
   ```

2. Check dashboard access:
   ```
   http://your-server/dashboards/juicer
   ```

3. Test the API endpoints:
   ```bash
   curl -X POST http://your-server/api/sketch_generate \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Test diagram","description":"Test"}'
   ```

## Troubleshooting

### Common Issues

1. **Databricks Connection Fails**:
   - Verify the workspace URL and API token
   - Check network connectivity and firewall rules
   - Ensure the cluster is running when notebooks are executed

2. **Missing Dashboard**:
   - Confirm the static files are properly deployed
   - Check the URL path in browser developer tools
   - Verify Express static file configuration

3. **CLI Command Not Recognized**:
   - Ensure the `.pulserrc` file is properly updated
   - Check that the command handler is registered in `router/index.js`
   - Restart Pulser CLI or terminal session

4. **GitHub Actions Workflow Fails**:
   - Check the action logs for specific errors
   - Verify all required secrets are properly set
   - Ensure the repository structure matches expected paths

## Manual Deployment (Without GitHub Actions)

If you prefer to deploy manually:

1. Upload notebooks to Databricks workspace via UI or CLI
2. Copy dashboard files to your web server
3. Update the Pulser configuration with `.pulserrc_patch`
4. Install the Python CLI with `pip install -r juicer-stack/cli/requirements.txt`
5. Create symlink for the CLI with `ln -sf /path/to/juicer_cli.py ~/bin/juicer`

## Post-Deployment Tasks

1. Create schedule for Databricks notebooks:
   ```
   Notebook Path: /Shared/InsightPulseAI/Juicer/juicer_ingest_bronze
   Schedule: Daily, 1:00 AM
   Cluster: JuicerProcessing
   ```

2. Set up monitoring for the API endpoints:
   ```bash
   # Example Azure App Insights setup
   npm install applicationinsights
   ```

3. Add documentation links to your team wiki or documentation:
   ```markdown
   [Juicer Dashboard](https://your-server/dashboards/juicer)
   [Databricks Workspace](https://your-workspace.azuredatabricks.net)
   ```

## Contact

For deployment assistance, contact:
- InsightPulseAI DevOps Team
- Project Scout administrators