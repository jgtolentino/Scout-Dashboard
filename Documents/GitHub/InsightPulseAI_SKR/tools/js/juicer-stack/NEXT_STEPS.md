# Next Steps for Juicer GenAI Insights Deployment

This document outlines the next steps for deploying and testing the Juicer GenAI Insights system in Azure.

## 1. Azure Resources Setup

### 1.1 Run Azure Resources Setup Script

The `setup_azure_resources.sh` script helps you create all necessary Azure resources:

```bash
# Review and edit configuration variables in the script first
./setup_azure_resources.sh
```

This script will create:
- Resource Group
- Storage Account with containers
- Databricks Workspace
- Static Web App
- Key Vault

### 1.2 Create Databricks Cluster and Token

1. Log in to the Databricks workspace
2. Create a new cluster:
   - Cluster name: `JuicerProcessing`
   - Databricks Runtime: `11.3 LTS (Scala 2.12, Spark 3.3.0)`
   - Worker type: `Standard_DS3_v2`
   - Min workers: `1`
   - Max workers: `4`

3. Create a Databricks API token:
   - User settings → Access Tokens → Generate New Token
   - Note the token for use in the next steps

### 1.3 Configure Azure Key Vault

Store your API keys and tokens in Azure Key Vault:

```bash
# Store Databricks token
az keyvault secret set --vault-name "juicer-insights-kv" \
  --name "DATABRICKS-TOKEN" --value "<your-token>"

# Store LLM API keys
az keyvault secret set --vault-name "juicer-insights-kv" \
  --name "CLAUDE-API-KEY" --value "<your-api-key>"

az keyvault secret set --vault-name "juicer-insights-kv" \
  --name "OPENAI-API-KEY" --value "<your-api-key>"
```

### 1.4 Set Up Storage Mounts

1. Upload the `databricks_mount_config.py` script to your Databricks workspace
2. Run the script to mount the storage containers

## 2. Deploy Databricks Notebooks

### 2.1 Upload Notebooks

Upload the Juicer notebooks to your Databricks workspace:

```bash
# Using Databricks CLI
databricks workspace import notebooks/juicer_gold_insights.py /Shared/InsightPulseAI/Juicer/juicer_gold_insights -l PYTHON -o
databricks workspace import notebooks/juicer_setup_insights_tables.sql /Shared/InsightPulseAI/Juicer/juicer_setup_insights_tables -l SQL -o
databricks workspace import notebooks/juicer_enrich_silver.py /Shared/InsightPulseAI/Juicer/juicer_enrich_silver -l PYTHON -o
databricks workspace import notebooks/juicer_ingest_bronze.sql /Shared/InsightPulseAI/Juicer/juicer_ingest_bronze -l SQL -o
databricks workspace import notebooks/juicer_setup_storage.py /Shared/InsightPulseAI/Juicer/juicer_setup_storage -l PYTHON -o
```

### 2.2 Create Platinum Layer Schema

Run the `juicer_setup_insights_tables.sql` notebook to create the Platinum layer schema:

1. Navigate to the notebook in Databricks
2. Set parameters:
   - `env`: `dev`
   - `create_sample_data`: `true`
3. Run the notebook

## 3. Generate and Load Test Data

### 3.1 Generate Sample Data

Use the `generate_test_data.py` script to create sample transcript data:

```bash
# Generate 100 sample transcripts
./generate_test_data.py --count 100 --output test_transcripts.csv

# To upload directly to Azure Storage
./generate_test_data.py --count 100 --output test_transcripts.csv \
  --upload --connection-string "<storage-connection-string>" \
  --container bronze
```

### 3.2 Load Data into Bronze Layer

Run the `juicer_ingest_bronze.sql` notebook to load the sample data into the Bronze layer:

1. Navigate to the notebook in Databricks
2. Set parameters as needed
3. Run the notebook

## 4. Set Up GitHub Secrets for CI/CD

Configure GitHub repository secrets for automated deployment:

1. Follow the instructions in `GITHUB_SECRETS_SETUP.md`
2. Add all required secrets to your repository
3. Verify secrets are correctly set up

## 5. Deploy Dashboard

### 5.1 Manual Deployment

Deploy the dashboard to Azure Static Web App:

```bash
# Using Azure CLI
az staticwebapp deploy --name "juicer-insights-dashboard" \
  --source-location "dashboards" \
  --resource-group "insightpulseai-rg"
```

### 5.2 Automated Deployment

Alternatively, use the GitHub Actions workflow:

1. Go to Actions tab in your repository
2. Select "Deploy Juicer GenAI Insights" workflow
3. Click "Run workflow"
4. Select environment (dev, staging, or prod)
5. Click "Run workflow"

## 6. Execute Test Plan

Follow the testing plan in `TESTING_PLAN.md` to validate the deployment:

1. Execute end-to-end pipeline tests
2. Test LLM integration
3. Validate dashboard functionality
4. Run quality validation tests
5. Perform performance testing
6. Document all test results

## 7. Schedule Databricks Jobs

Create scheduled jobs for regular insights generation:

```bash
# Create daily job
databricks jobs create --json-file - << EOF
{
  "name": "Juicer Daily Insights Generation",
  "existing_cluster_id": "<cluster-id>",
  "schedule": {
    "quartz_cron_expression": "0 0 6 * * ?",
    "timezone_id": "UTC"
  },
  "notebook_task": {
    "notebook_path": "/Shared/InsightPulseAI/Juicer/juicer_gold_insights",
    "base_parameters": {
      "date": "1d",
      "env": "prod",
      "model": "claude",
      "generate_dashboard": "true"
    }
  }
}
EOF

# Create weekly job
databricks jobs create --json-file - << EOF
{
  "name": "Juicer Weekly Insights Summary",
  "existing_cluster_id": "<cluster-id>",
  "schedule": {
    "quartz_cron_expression": "0 0 7 ? * MON",
    "timezone_id": "UTC"
  },
  "notebook_task": {
    "notebook_path": "/Shared/InsightPulseAI/Juicer/juicer_gold_insights",
    "base_parameters": {
      "date": "7d",
      "env": "prod",
      "model": "auto",
      "generate_dashboard": "true"
    }
  }
}
EOF
```

## 8. Configure Monitoring and Alerting

Set up monitoring for the deployed system:

1. Configure Azure Monitor for Databricks and Storage
2. Set up alerts for job failures
3. Implement logging for insights quality metrics
4. Create a dashboard for system health monitoring

## 9. Documentation and Training

1. Compile all documentation into a comprehensive guide
2. Create user manuals for different roles:
   - Administrators
   - Data Engineers
   - Business Analysts
3. Conduct training sessions for team members

## 10. Production Rollout

Once testing is complete and all issues are resolved:

1. Update configuration for production environment
2. Execute final deployment to production
3. Monitor the system closely during initial operation
4. Collect feedback from early users

## Resources

- Azure Resources Setup Script: `setup_azure_resources.sh`
- GitHub Secrets Setup Guide: `GITHUB_SECRETS_SETUP.md`
- Testing Plan: `TESTING_PLAN.md`
- Test Data Generator: `generate_test_data.py`
- Implementation Plan: `IMPLEMENTATION_PLAN.md`
- Developer Guide: `DEVELOPER.md`
- Deployment Guide: `DEPLOYMENT.md`