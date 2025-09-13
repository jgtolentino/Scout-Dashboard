# Azure Static Web App Deployment Instructions

This document provides automated instructions for deploying the fixed Client360 Dashboard to Azure Static Web App.

## Prerequisites

- Azure CLI installed and authenticated
- Appropriate permissions to deploy to the Azure Static Web App

## Deployment Steps

1. **Log in to Azure (if not already logged in)**:
   ```bash
   az login
   ```

2. **Deploy using Azure CLI**:
   ```bash
   # Set variables
   RESOURCE_GROUP="InsightPulseAI-RG"
   STATIC_WEB_APP_NAME="tbwa-client360-dashboard"
   DEPLOYMENT_PACKAGE="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/output/client360_dashboard_automated_fix_20250519210729.zip"

   # Deploy to Azure Static Web App
   az staticwebapp deploy \
     --name $STATIC_WEB_APP_NAME \
     --resource-group $RESOURCE_GROUP \
     --source-path "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy"
   ```

3. **Alternative: Azure Static Web Apps CLI**:
   If you have the SWA CLI installed, you can use:
   ```bash
   swa deploy "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy" --deployment-token <your-deployment-token>
   ```

4. **Alternative: Manual Upload via Azure Portal**:
   1. Log in to [Azure Portal](https://portal.azure.com)
   2. Navigate to the Static Web App resource
   3. Go to Deployment > Manual Deploy
   4. Upload the deployment package: `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/output/client360_dashboard_automated_fix_20250519210729.zip`

## Verification After Deployment

Run the verification script to check that CSS files are properly served:
```bash
./verify_css_fix_final.sh https://blue-coast-0acb6880f.6.azurestaticapps.net
```

View the verification report in:
`/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/reports/verification_report_20250519210729.md`
