# Dashboard Baselines

This directory contains baselines of successfully deployed dashboard versions that can be used for rollback purposes if needed.

## Available Baselines

| Date | Description | Location | Deployment URL |
|------|-------------|----------|----------------|
| May 19, 2025 | Client 360 Dashboard with Geospatial Map | `client360_dashboard_20250519` | [Dashboard URL](https://blue-coast-0acb6880f-preview.eastus2.6.azurestaticapps.net) |

## Rollback Procedure

To roll back to a baseline version:

1. Copy the desired baseline back to the deployment directory:
   ```bash
   cp -r baselines/client360_dashboard_20250519/* final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy/
   ```

2. Deploy the rolled back version:
   ```bash
   cd final-locked-dashboard/scout_dlt_pipeline/client360_dashboard
   ./scripts/deploy.sh --target azure
   ```

3. Verify the rollback using:
   ```bash
   ./scripts/verify_rollback.sh
   ```

## Creating New Baselines

When a successful deployment is made, create a new baseline by:

1. Copy the deployment files:
   ```bash
   mkdir -p baselines/client360_dashboard_YYYYMMDD
   cp -r final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy/* baselines/client360_dashboard_YYYYMMDD/
   ```

2. Create deployment notes:
   ```bash
   cp templates/DEPLOYMENT_NOTES_TEMPLATE.md baselines/DEPLOYMENT_NOTES_YYYYMMDD.md
   # Edit the file with relevant details
   ```

3. Update this README with the new baseline information

## Baseline Contents

Each baseline directory contains:
- HTML, CSS, and JavaScript files for the dashboard
- Configuration files
- Data files (GeoJSON, etc.)
- Static assets

These files represent a complete, working version of the dashboard that can be directly deployed.

---

*Last updated: May 19, 2025*