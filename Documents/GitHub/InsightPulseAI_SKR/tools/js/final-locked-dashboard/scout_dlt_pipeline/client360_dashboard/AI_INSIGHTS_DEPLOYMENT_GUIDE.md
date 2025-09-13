# Client360 Dashboard v2.3.3 - AI Insights Panel Deployment Guide

This document provides instructions for deploying and verifying the Client360 Dashboard v2.3.3, with significant enhancements to the AI Insights Panel and the introduction of real Azure OpenAI API integration.

## Overview

Version 2.3.3 of the Client360 Dashboard includes the following key enhancements:

1. **Azure OpenAI API Integration** - Live AI-generated insights using real data
2. **Simulation/Live Toggle** - Dynamic switching between simulated and real data
3. **Enhanced Map Component** - Improved GeoJSON support and interactivity
4. **Fallback Data Mechanisms** - Parquet support for offline operation
5. **Improved Error Handling** - Graceful degradation and user feedback

## Deployment Steps

### Prerequisites

1. Azure CLI installed and authenticated
2. Access to the Azure subscription containing the tbwa-client360-dashboard resource group
3. Proper permissions to deploy to Azure Static Web Apps
4. Azure OpenAI resource provisioned with appropriate model deployment

### Step 1: Configure Azure OpenAI

Before deployment, ensure your Azure OpenAI resource is properly configured:

1. Create an Azure OpenAI resource if not already available
2. Deploy a text model with appropriate throughput (recommended: GPT-3.5-Turbo or newer)
3. Note the endpoint URL, API key, and deployment name

```bash
# Create Azure OpenAI resource (if not already created)
az cognitiveservices account create \
  --name tbwa-client360-openai \
  --resource-group tbwa-client360-dashboard \
  --kind OpenAI \
  --sku S0 \
  --location eastus \
  --yes

# Get the API key
API_KEY=$(az cognitiveservices account keys list \
  --name tbwa-client360-openai \
  --resource-group tbwa-client360-dashboard \
  --query key1 -o tsv)

# Store API key in Key Vault
az keyvault secret set \
  --vault-name tbwa-client360-keyvault \
  --name client360-openai-key \
  --value $API_KEY
```

### Step 2: Prepare the deployment

The deployment files are available in the `deploy_v2.3.3` directory. Key files include:

- `index.html` - Main dashboard with embedded AI Insights Panel
- `js/dashboard.js` - Updated core dashboard with AI component loader
- `js/components/ai/azure_openai_client.js` - Azure OpenAI integration
- `js/components/ai/ai_insights_provider.js` - Data source switching logic
- `js/components/ai/ai_insights.js` - AI Insights component code
- `js/components/ai/parquet_reader.js` - Parquet file fallback support
- `js/components/store_map.js` - Enhanced map with GeoJSON support
- `data/simulated/ai/insights/all_insights_latest.json` - Sample data for AI-generated insights

### Step 3: Execute the deployment

Run the diff-aware deployment script to minimize deployment time:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard
./patch-deploy-diff-aware.sh --from-tag v2.3.2 --to-tag v2.3.3
```

This script will:
- Compare v2.3.2 and v2.3.3 to identify changed files
- Package only the modified files for faster deployment
- Deploy to the tbwa-client360-dashboard-production Azure Static Web App
- Update Azure App Configuration with new settings
- Create a deployment report in the `reports` directory

### Step 4: Configure App Settings

Set the required environment variables for the Azure Static Web App:

```bash
# Set API connection details
az staticwebapp appsettings set \
  --name tbwa-client360-dashboard-production \
  --resource-group tbwa-client360-dashboard \
  --setting-names \
  AZURE_OPENAI_ENDPOINT="https://tbwa-client360-openai.openai.azure.com" \
  AZURE_OPENAI_DEPLOYMENT_NAME="client360-insights" \
  AZURE_OPENAI_API_VERSION="2023-05-15" \
  ENABLE_SIMULATION_MODE="false" \
  ENABLE_PARQUET_FALLBACK="true"

# Configure Key Vault reference for API key
az staticwebapp appsettings set \
  --name tbwa-client360-dashboard-production \
  --resource-group tbwa-client360-dashboard \
  --setting-names \
  AZURE_OPENAI_API_KEY="@Microsoft.KeyVault(SecretUri=https://tbwa-client360-keyvault.vault.azure.net/secrets/client360-openai-key/)"
```

### Step 5: Verify the deployment

After deployment completes, run the enhanced verification script:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard
./verify_v2.3.3_deployment.sh
```

This script will:
- Verify all required files are present
- Check for proper version references
- Generate file integrity checksums
- Create a comprehensive verification report
- Provide a diff report comparing v2.3.2 to v2.3.3

## AI Insights Enhancements

### Live/Simulated Data Toggle

The dashboard now includes a toggle switch that allows switching between:

- **Simulated** - Uses pre-generated JSON insights
- **Live** - Connects to Azure OpenAI to generate real-time insights

The toggle changes the `window.isSimulatedData` flag, which the `AIInsightsProvider` uses to determine the data source.

### Azure OpenAI Integration

When in "Live" mode, the dashboard:

1. Collects relevant data from the dashboard's data sources
2. Formats prompts for different insight types (sales, brand, recommendations)
3. Sends requests to Azure OpenAI API
4. Processes and formats the responses into insight cards
5. Updates the UI with the generated insights

### Fallback Mechanisms

The system now includes multiple fallback levels:

1. If Azure OpenAI API calls fail, fall back to simulation mode
2. If JSON files aren't available, attempt to load from parquet files
3. If all data sources fail, display placeholder insights with error information

### Key Verification Points

When verifying the deployment, ensure:

1. The dashboard displays version 2.3.3 in the version badge and footer
2. The data source toggle switches between Simulated and Live modes
3. The AI Insights panel refreshes when the toggle is changed
4. All three insight categories are present and cards expand properly
5. The enhanced map loads and displays GeoJSON data correctly
6. The application handles errors gracefully with user feedback

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| AI Insights don't load | Missing API key | Check Azure Key Vault and app settings |
| Toggle doesn't change mode | JavaScript error | Check browser console, verify dashboard.js |
| Map doesn't display | Missing Mapbox token | Check for proper token in store_map.js |
| API timeout errors | Rate limiting | Increase model throughput or adjust timeout settings |

### Diagnostic Steps

```bash
# Check Azure Static Web App logs
az staticwebapp log tail \
  --name tbwa-client360-dashboard-production \
  --resource-group tbwa-client360-dashboard

# Test Azure OpenAI connectivity
curl -X POST "https://tbwa-client360-openai.openai.azure.com/openai/deployments/client360-insights/completions?api-version=2023-05-15" \
  -H "Content-Type: application/json" \
  -H "api-key: $API_KEY" \
  -d '{"prompt": "Test prompt", "max_tokens": 5}'

# Run file integrity check
./verify_v2.3.3_deployment.sh --integrity-only
```

## Rollback Procedure

If issues are detected, you can roll back to v2.3.2:

```bash
./rollback.sh --to-version v2.3.2
```

This will:
1. Restore the v2.3.2 files from backup
2. Deploy the previous version
3. Update app settings to disable Azure OpenAI integration
4. Generate a rollback report

## References

- PRD Requirement 5.1.3 - Azure OpenAI Integration
- PRD Requirement 5.1.4 - Fallback Data Mechanisms
- PRD Requirement 7.3 - Enhanced Map Visualization
- TBWA Design System requirements
- Azure OpenAI Documentation
- Azure Static Web Apps documentation

For additional support, contact the development team.