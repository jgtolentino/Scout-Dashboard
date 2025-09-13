# Scout Advanced Analytics Deployment Package

This folder contains complete deployment resources for the Power BI-styled Scout Advanced Analytics dashboard.

## Contents

| File | Purpose |
|------|---------|
| `DEPLOYMENT_INSTRUCTIONS.md` | Comprehensive deployment instructions with all options and verification steps |
| `GITHUB_WORKFLOW_SWA.yml` | GitHub Actions workflow file for CI/CD deployments |
| `manual_az_cli.sh` | Executable script for direct Azure CLI deployment with verification |

## Deployment Infrastructure Context

| Element | Value |
|---------|-------|
| App Name | `tbwa-juicer-insights-dashboard` |
| Resource Group | `RG-TBWA-ProjectScout-Juicer` |
| Region | East US 2 |
| Environment | Production |
| Deployment Token Source | Azure Key Vault: `kv-tbwa-juicer-insights2` |
| Token Secret Name | `AZURE-STATIC-WEB-APPS-API-TOKEN` |

## Quick Start

For immediate deployment:

```bash
# Option 1: Using the main deployment script
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard
./deploy_power_bi_styled.sh

# Option 2: Using the manual Azure CLI script
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/docs/deployment
./manual_az_cli.sh
```

## Deployment Flow

1. Prepare deployment package with all necessary files
2. Verify Azure authentication and permissions
3. Deploy to Azure Static Web App
4. Verify deployment success with URL checks

## Production URLs

After deployment, the dashboard will be available at:

- Standard version: `https://tbwa-juicer-insights-dashboard.azurestaticapps.net/insights_dashboard.html`
- Power BI styled version: `https://tbwa-juicer-insights-dashboard.azurestaticapps.net/insights_dashboard_v2.html`

## Support

For deployment issues, please see the Troubleshooting section in `DEPLOYMENT_INSTRUCTIONS.md` or contact Azure support.

---

Last updated: May 14, 2025