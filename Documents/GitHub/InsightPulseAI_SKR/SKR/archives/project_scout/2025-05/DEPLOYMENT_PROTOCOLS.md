# Project Scout Deployment Protocols

## Scout Advanced Analytics Dashboard - May 2025 Update

### Deployment Protocol: `v2.0-powerbi-style`

This document outlines the standardized deployment protocol for the Scout Advanced Analytics dashboard with Power BI styling, designed to match the Vercel deployment aesthetic.

## Overview

The Scout Advanced Analytics dashboard has been updated with a Power BI-inspired interface for improved usability and visual consistency with the Vercel deployment. This document details the deployment process, required components, and validation steps.

## Required Components

| Component | Path | Purpose |
|-----------|------|---------|
| HTML Template | `insights_dashboard_v2.html` | Main dashboard with Power BI styling |
| CSS Patch | `css/retail_edge_style_patch.css` | Styling to match Power BI aesthetic |
| Script | `scripts/deploy_dashboard.sh` | Hardened deployment script for Azure |
| Packaging Tool | `scripts/package_dashboard.sh` | Creates deployment package |
| Automation | `Makefile` | Simplifies common deployment tasks |
| Documentation | `docs/SOP_DEPLOYMENT.md` | Standard operating procedures |
| Style Guide | `POWER_BI_STYLE_GUIDE.md` | Details on visual harmonization |

## Deployment Process

### Automated Deployment (Recommended)

```bash
# Navigate to dashboard directory
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard

# Create deployment package
make package

# Deploy to Azure Static Web App
make deploy
```

### Manual Deployment

```bash
# Navigate to dashboard directory
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard

# Create deployment package
./scripts/package_dashboard.sh

# Deploy to Azure Static Web App
./scripts/deploy_dashboard.sh
```

### Pulser Integration

Deployment can also be triggered through the Pulser system:

```bash
# Using Pulser shorthand
:deploy scout

# Using Pulser CLI
pulser deploy_dashboard

# Using full workflow (package, validate, deploy, monitor)
:deploy full
```

## Verification Steps

After deployment, verify the following:

1. Dashboard is accessible at:
   - `https://tbwa-juicer-insights-dashboard.azurestaticapps.net/insights_dashboard.html`
   - `https://tbwa-juicer-insights-dashboard.azurestaticapps.net/insights_dashboard_v2.html`

2. Visual elements match specifications in `POWER_BI_STYLE_GUIDE.md`

3. All interactions function correctly:
   - Chart rendering
   - Navigation
   - Filters
   - GenAI integrations

## Azure Infrastructure

| Resource | Value |
|----------|-------|
| Resource Group | RG-TBWA-ProjectScout-Juicer |
| App Name | tbwa-juicer-insights-dashboard |
| Region | East US 2 |
| Key Vault | kv-tbwa-juicer-insights2 |
| Token Secret | AZURE-STATIC-WEB-APPS-API-TOKEN |

## Cross-References

- [SOP_DEPLOYMENT.md](../../tools/js/final-locked-dashboard/docs/SOP_DEPLOYMENT.md)
- [QA_GUIDELINES_POWERBI_PARITY.md](../../tools/js/final-locked-dashboard/docs/QA_GUIDELINES_POWERBI_PARITY.md)
- [POWER_BI_STYLE_GUIDE.md](../../tools/js/final-locked-dashboard/POWER_BI_STYLE_GUIDE.md)

## Approvals

| Role | Name | Date |
|------|------|------|
| Developer | | |
| QA | | |
| Project Manager | | |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v2.0-powerbi-style | May 14, 2025 | Initial Power BI styled version |