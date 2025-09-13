# Scout Advisor Dashboard Rollback Guide

## Overview

This guide provides instructions for rolling back the Scout Advisor Dashboard to a known working version tagged as `golden-20250519`. Use this process when encountering critical issues with the dashboard that require immediate resolution.

## Prerequisites

- Git access to the repository
- Azure CLI installed (for deployment)
- Appropriate permissions to deploy to Azure Static Web Apps

## Rollback Process

### Automated Rollback

1. Navigate to the repository root directory:
   ```bash
   cd /path/to/InsightPulseAI_SKR/tools/js
   ```

2. Run the rollback script:
   ```bash
   ./final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/scripts/rollback_dashboard.sh
   ```

3. Follow the prompts to confirm deployment to Azure.

4. Complete the verification checklist created at `DASHBOARD_ROLLBACK_VERIFICATION.md`.

### Manual Rollback

If the automated script doesn't work, follow these manual steps:

1. Checkout the golden tag for the specific directory:
   ```bash
   git checkout golden-20250519 -- deploy-advisor-fixed
   ```

2. Create a deployment package:
   ```bash
   cd deploy-advisor-fixed
   zip -r ../output/scout_advisor_rollback.zip .
   ```

3. Deploy using Azure CLI:
   ```bash
   az staticwebapp deploy --name scout-dashboard --resource-group InsightPulseAI-RG --source-path deploy-advisor-fixed
   ```

4. Or deploy using SWA CLI:
   ```bash
   swa deploy deploy-advisor-fixed --deployment-token <your-token>
   ```

## Post-Rollback Verification

1. Access the dashboard at:
   - [https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor](https://delightful-glacier-03349aa0f.6.azurestaticapps.net/advisor)

2. Verify all components are functioning correctly:
   - Dashboard loads without errors
   - All styles are correctly applied
   - All JavaScript functionality works properly
   - All visualizations render correctly
   - Geospatial store map displays properly with store locations
   - Map interactivity (zoom, pan, tooltips) functions correctly
   - Navigation, filters, and interactive elements work as expected

3. Document the verification results using the checklist.

4. For detailed verification of the geospatial store map component, refer to the [Geospatial Map Verification Guide](./GEOSPATIAL_MAP_VERIFICATION.md).

## Troubleshooting

### Common Issues

1. **Deployment Failure**
   - Check Azure credentials and permissions
   - Verify the resource group and app name are correct
   - Check network connectivity to Azure

2. **Missing Golden Tag**
   - Verify tag exists using `git tag -l`
   - If missing, restore from backup at `deploy-advisor-fixed_backup_<timestamp>`

3. **Styling Issues After Rollback**
   - Clear browser cache
   - Check browser console for loading errors
   - Verify CSS files were properly included in the rollback

### Additional Resources

- Azure Static Web Apps documentation: [https://learn.microsoft.com/en-us/azure/static-web-apps/](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- SWA CLI documentation: [https://github.com/Azure/static-web-apps-cli](https://github.com/Azure/static-web-apps-cli)

## Contact

For additional assistance, contact the Scout Dashboard Team or create an issue in the repository.

---

*Last Updated: May 19, 2025*