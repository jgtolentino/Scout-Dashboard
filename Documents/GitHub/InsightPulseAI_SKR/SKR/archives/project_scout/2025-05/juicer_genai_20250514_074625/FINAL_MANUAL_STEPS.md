# Final Manual Steps for Juicer GenAI Insights Deployment

All core Azure resources have been successfully deployed. To complete the setup, follow these manual steps:

## 1. Databricks Setup

### Access Databricks Workspace
1. Log in to the Azure Portal: https://portal.azure.com
2. Navigate to the resource group: **RG-TBWA-ProjectScout-Juicer**
3. Select the Databricks workspace: **tbwa-juicer-databricks**
4. Click on "Launch Workspace" to open the Databricks UI

### Create Databricks Access Token
1. In the Databricks workspace, click on the user icon in the top-right corner
2. Select "User Settings"
3. Go to the "Access Tokens" tab
4. Click "Generate New Token"
5. Provide a name (e.g., "JuicerInsightsToken") and set an expiration (e.g., 90 days)
6. Click "Generate" and copy the token

### Store Token in Key Vault
```bash
az keyvault secret set --vault-name kv-tbwa-juicer-insights2 --name DATABRICKS-TOKEN --value "your-databricks-token"
```

### Create Databricks Cluster
1. In the Databricks workspace, click on "Compute" in the left sidebar
2. Click "Create Cluster"
3. Set the following configuration:
   - Cluster Name: **JuicerProcessing**
   - Databricks Runtime Version: **Runtime: 11.3 LTS (Scala 2.12, Spark 3.3.0)**
   - Node Type: **Standard_D4s_v3**
   - Min Workers: **1**
   - Max Workers: **4**
   - Auto-termination: **60 minutes**
4. Click "Create Cluster"

### Import Notebooks
1. In the Databricks workspace, click on "Workspace" in the left sidebar
2. Navigate to the desired location or create a new folder: "/Shared/InsightPulseAI/Juicer"
3. Click the dropdown next to the folder and select "Import"
4. Upload each notebook from the local directory:
   - `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/notebooks/juicer_gold_insights.py`
   - `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/notebooks/juicer_setup_insights_tables.sql`
   - `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/notebooks/juicer_enrich_silver.py`
   - `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/notebooks/juicer_ingest_bronze.sql`
   - `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/notebooks/juicer_setup_storage.py`

### Create Scheduled Jobs
1. In the Databricks workspace, click on "Workflows" in the left sidebar
2. Click "Create Job"
3. Configure the daily job:
   - Job Name: **Juicer Daily Insights Generation**
   - Notebook: Select the `juicer_gold_insights` notebook
   - Parameters:
     - date: 1d
     - env: prod
     - model: claude
     - generate_dashboard: true
   - Cluster: Select the JuicerProcessing cluster
   - Schedule: Daily at 6:00 AM UTC
4. Click "Create"
5. Repeat for the weekly job with these differences:
   - Job Name: **Juicer Weekly Insights Summary**
   - Parameters:
     - date: 7d
     - model: auto
   - Schedule: Weekly on Monday at 7:00 AM UTC

## 2. Static Web App Deployment

### Option 1: Deploy via Azure Portal
1. In the Azure Portal, navigate to the Static Web App: **tbwa-juicer-insights-dashboard**
2. Go to the "Deployments" tab
3. Click "Manage Deployment Token" and copy the token
4. Deploy your local dashboard files using your preferred CI/CD tool or manually via the Azure CLI:
   ```bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/dashboards
   zip -r dashboard.zip .
   az staticwebapp upload --name tbwa-juicer-insights-dashboard --source-path dashboard.zip --token YOUR_DEPLOYMENT_TOKEN
   ```

### Option 2: Setup GitHub Integration
1. In the Azure Portal, navigate to the Static Web App: **tbwa-juicer-insights-dashboard**
2. Click on "GitHub" under "Source"
3. Connect to your GitHub repository
4. Configure the build settings:
   - Source: Choose your repository
   - Branch: main (or your preferred branch)
   - Build Preset: Custom
   - App location: /tools/js/juicer-stack/dashboards
   - Api location: (leave empty)
   - Output location: (leave empty)
5. Click "Save"

## 3. Update API Keys

Replace the placeholder API keys with real values:

```bash
# Update Claude API key
az keyvault secret set --vault-name kv-tbwa-juicer-insights2 --name CLAUDE-API-KEY --value "your-actual-claude-api-key"

# Update OpenAI API key (optional)
az keyvault secret set --vault-name kv-tbwa-juicer-insights2 --name OPENAI-API-KEY --value "your-actual-openai-api-key"
```

## 4. Test End-to-End Pipeline

1. **Generate Test Data**:
   ```bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
   python generate_test_data.py --count 100 --upload --connection-string "YOUR_STORAGE_CONNECTION_STRING" --container bronze
   ```

2. **Run the Databricks Notebooks**:
   - Open the Databricks workspace
   - Run the `juicer_setup_insights_tables` notebook to create the schema
   - Run the `juicer_gold_insights` notebook to process the test data

3. **Verify Dashboard**:
   - Access the Static Web App URL: https://gentle-rock-04e54f40f.6.azurestaticapps.net
   - Confirm the dashboard loads and displays the insights

## 5. Setup Monitoring

1. Configure the insights quality monitoring script:
   ```bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
   python monitor_insights_quality.py --keyvault kv-tbwa-juicer-insights2 --days 30 --min-confidence 0.7 --output-dir ./quality_reports
   ```

2. Schedule the monitoring script to run regularly:
   ```bash
   # Example cron job (add to crontab)
   0 9 * * * cd /path/to/juicer-stack && python monitor_insights_quality.py --keyvault kv-tbwa-juicer-insights2 > /path/to/logs/monitoring_$(date +\%Y\%m\%d).log 2>&1
   ```

## 6. Final Verification

Run the verification script one last time to ensure all components are deployed:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
./azure_deployment_verification_custom.sh
```

## Resources

- **Databricks Workspace URL**: https://adb-2769038304082127.7.azuredatabricks.net
- **Static Web App URL**: https://gentle-rock-04e54f40f.6.azurestaticapps.net
- **Azure Portal**: https://portal.azure.com

Once you've completed these steps, the Juicer GenAI Insights system will be fully deployed and operational.