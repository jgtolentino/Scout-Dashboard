# Azure Deployment Guide for Retail Advisor GenAI Insights

This guide outlines how to deploy the complete Retail Advisor (formerly Juicer/InsightPulseAI) GenAI Insights system to Azure using the provided scripts. The deployment will be exclusively on Azure, with no Vercel dependencies.

## Prerequisites

Before starting the deployment, ensure you have the following:

- Azure CLI installed and authenticated
- Python and pip installed
- Appropriate permissions on your Azure subscription
- Databricks CLI (can be installed by the script)
- Access to API keys for Claude and OpenAI (optional for DeepSeek)

## 1. Core Azure Infrastructure Deployment

The first script sets up the basic Azure resources required for the system:

```bash
# Run the custom Azure resource setup script
./setup_azure_resources_custom.sh
```

This script creates:
- Resource Group: `RG-TBWA-ProjectScout-Retail`
- Storage Account: `tbwaretailadvisor`
- Storage Containers: bronze, silver, gold, platinum
- Databricks Workspace: `tbwa-retailadvisor-databricks`
- App Service: `tbwa-retailadvisor-dashboard`
- Key Vault: `kv-tbwa-retailadvisor-insights`

After running, verify deployment with:

```bash
# Verify Azure resources are correctly deployed
./azure_deployment_verification_custom.sh
```

## 2. Databricks Resources Setup

The second script sets up the Databricks environment, including cluster, notebooks, and jobs:

```bash
# Set up Databricks resources
./setup_databricks_resources.sh
```

This script:
1. Configures the Databricks CLI
2. Requests a Databricks access token (visit the provided URL to generate one)
3. Stores the token in Key Vault
4. Creates a cluster named "RetailAdvisorProcessing"
5. Imports notebooks to the Databricks workspace:
   - `juicer_setup_insights_tables.sql` (creates Platinum layer schema)
   - `juicer_gold_insights.py` (LLM-based insights generation)
   - `juicer_ingest_bronze.sql` (Bronze layer ingestion)
   - `juicer_enrich_silver.py` (Silver layer enrichment)
   - `juicer_setup_storage.py` (Storage configuration)
6. Creates scheduled jobs for insights generation:
   - Daily insights generation (6:00 AM)
   - Weekly insights summary (Mondays at 7:00 AM)

## 3. White-Labeling and Dashboard Deployment

Before deploying, ensure all components are properly white-labeled:

```bash
# Apply white-labeling to all components
./whitelabel.sh
```

This script updates references from:
- "InsightPulseAI" to "Retail Advisor"
- "Pulser" to "Analytics"
- "Sunnies" to "Quality"

Then deploy the dashboard to Azure App Service:

```bash
# Deploy the dashboard to Azure App Service
./deploy_dashboard.sh
```

This script:
1. Prepares the dashboard files
2. Updates API endpoints to reference Azure Functions
3. Configures the proper color scheme and branding
4. Deploys to Azure App Service
5. Provides the URL for accessing the dashboard

## 4. API and Backend Configuration

Set up the Azure Functions API:

```bash
# Deploy the backend API
./setup_azure_resources.sh --api-only
```

This creates an Azure Functions app with endpoints for:
- Fetching insights with filtering
- Generating insights on demand
- Retrieving system health metrics

## 5. API Key Configuration

Once the deployment is complete, update the API keys in Key Vault with real values:

```bash
# Update Claude API key
az keyvault secret set --vault-name kv-tbwa-retailadvisor-insights --name CLAUDE-API-KEY --value "your-actual-claude-api-key"

# Update OpenAI API key
az keyvault secret set --vault-name kv-tbwa-retailadvisor-insights --name OPENAI-API-KEY --value "your-actual-openai-api-key"

# Update DeepSeek API key (optional)
az keyvault secret set --vault-name kv-tbwa-retailadvisor-insights --name DEEPSEEK-API-KEY --value "your-actual-deepseek-api-key"
```

## 6. Agent Integration Setup

Configure the agent integration for CLI access:

```bash
# Update and deploy agent configuration
cp pulser/insights_hook.yaml /path/to/deployed/config/
```

Ensure the hook YAML file has been properly white-labeled with Retail Advisor branding.

## 7. Comprehensive Verification

After completing all steps, run the verification script to ensure everything is correctly set up:

```bash
./verify_implementation.sh
```

This script performs comprehensive testing of:
- Azure resource provisioning
- Databricks notebooks and jobs
- Dashboard deployment
- API functionality
- White-labeling consistency
- LLM integration
- Data flow through the medallion layers

## 8. Testing the Deployment

To test the complete system:

1. Log in to the Databricks workspace and run the `juicer_setup_insights_tables` notebook to create the Platinum layer schema
2. Generate test data using the provided script: `python generate_test_data.py --count 100`
3. Run the `juicer_gold_insights` notebook manually to process the test data
4. Access the insights dashboard using the URL provided after dashboard deployment
5. Verify all dashboard components load correctly with proper branding

## 9. Monitoring Setup

Set up monitoring and alerting for the system:

```bash
# Deploy monitoring resources
./setup_azure_resources.sh --monitoring
```

This configures:
- Application Insights for dashboard monitoring
- Azure Monitor metrics and alerts
- Log Analytics workspace for centralized logging
- Dashboard for system health visualization

## 10. Final Documentation

Update documentation to reflect the completed deployment:

```bash
# Generate final documentation
cat > IMPLEMENTATION_COMPLETE.md << EOL
# Implementation Complete

The Retail Advisor GenAI Insights system has been successfully deployed to Azure.

## Deployed Resources
- Dashboard URL: https://tbwa-retailadvisor-dashboard.azurewebsites.net
- API URL: https://tbwa-retailadvisor-api.azurewebsites.net
- Databricks Workspace: https://tbwa-retailadvisor-databricks.azuredatabricks.net

## Verification Status
All verification tests have passed successfully.

## Deployment Date
$(date)
EOL
```

## Troubleshooting

If you encounter issues during deployment:

1. Check the Azure Portal to verify resource creation
2. Review script output for specific error messages
3. Ensure all required permissions are in place
4. Check Databricks workspace access and token validity
5. Verify API keys are correctly configured in Key Vault
6. Review App Service logs for dashboard deployment issues
7. Check Azure Functions logs for API errors

## Next Steps

After successful deployment:

1. Configure the Databricks cluster for optimal performance
2. Customize the scheduled jobs according to your specific requirements
3. Update the dashboard visualizations as needed
4. Implement the monitoring solution using `monitor_insights_quality.py`
5. Integrate with Analytics CLI using the provided `insights_hook.yaml`
6. Set up Azure DevOps pipelines for CI/CD (optional)

## Additional Resources

- [Retail Advisor Documentation](./README.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Testing Plan](./TESTING_PLAN.md)
- [Developer Guide](./DEVELOPER.md)
- [GenAI Insights Integration](./GENAI_INSIGHTS_INTEGRATION.md)