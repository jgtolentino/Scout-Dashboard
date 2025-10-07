# GenAI Insights Integration for All Dashboards

This README explains how we integrated GenAI insights across all dashboards in the Juicer stack.

## Overview

We've successfully created a deployment system that:

1. Processes the three main dashboards:
   - Main Insights Dashboard
   - Retail Edge Dashboard
   - Operations Dashboard

2. Integrates the GenAI insights component into each dashboard

3. Creates a unified deployment package ready for Azure Static Web Apps

## Files Created

- `tools/deploy_insights_all_dashboards.js` - Main Node.js script that handles the integration
- `deploy_insights_all.sh` - Shell script wrapper for easier command-line usage
- `GENAI_DASHBOARD_INTEGRATION.md` - Comprehensive documentation (detailed)
- `README_GENAI_INSIGHTS_INTEGRATION.md` - This quick-start guide

## Quick Start

To deploy the integrated dashboards:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack
./deploy_insights_all.sh
```

You can specify the deployment environment:

```bash
./deploy_insights_all.sh --env staging
./deploy_insights_all.sh --env prod
```

## Deployment Output

The script generates a complete deployment package in:
```
/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy/
```

This directory contains:
- All necessary dashboards with GenAI integration
- Supporting scripts and styles
- Sample data for testing
- Azure Static Web App configuration

## Testing Locally

To test the deployment locally:

1. Navigate to the deployment directory:
   ```bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy
   ```

2. Start a local web server:
   ```bash
   npx http-server
   ```

3. Open your browser at `http://localhost:8080`

## Azure Deployment

To deploy to Azure Static Web Apps:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/deploy

# Get the deployment token from Azure
az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv

# Deploy using the retrieved token
az staticwebapp deploy --name "juicer-insights-dev" --source "." --token "YOUR_DEPLOYMENT_TOKEN" --no-build
```

## Integration Details

### Main Insights Dashboard
The main insights dashboard already had the GenAI integration - we simply ensured it was properly deployed.

### Retail Edge Dashboard
We added a GenAI insights section that:
- Shows the top 4 most relevant insights
- Includes confidence scoring
- Links to the full insights dashboard

### Operations Dashboard
We added a similar insights section above the system health monitoring area, focusing on:
- Operational insights
- System performance patterns
- Potential issues or improvements

### Integration Components
Each dashboard integration consists of:
1. HTML widget for displaying insights
2. JavaScript initialization for the InsightsVisualizer
3. Proper linking between dashboards for navigation

## Next Steps

1. Add authentication to the insights dashboard
2. Implement real-time updates using webhooks
3. Add user feedback mechanism on insights
4. Integrate with analytics for tracking insight usage

---

For complete details on the integration, see `GENAI_DASHBOARD_INTEGRATION.md`.