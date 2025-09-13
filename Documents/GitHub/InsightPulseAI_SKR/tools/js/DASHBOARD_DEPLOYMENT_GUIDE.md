# Dashboard Deployment Guide

This guide explains how to use the `deploy_dashboard.sh` script to build and deploy InsightPulseAI dashboards to Azure Static Web Apps with different themes and configurations.

## Overview

The deployment script provides a streamlined way to:

1. Build dashboards with different themes (TBWA, default, etc.)
2. Create deployment packages
3. Deploy to Azure Static Web Apps
4. Create backups and deployment reports
5. Verify deployment success

## Supported Dashboard Types

- **Client360**: The client analytics dashboard
- **Retail**: Retail Edge dashboard
- **Advisor**: Advisor insights dashboard

## Supported Themes

- **TBWA**: Official TBWA branding with navy, cyan, and red colors
- **default**: Default theme with standard styling
- **sari-sari**: Retail-focused theme with custom styling

## Prerequisites

- Bash shell environment (macOS, Linux, or WSL on Windows)
- Node.js and npm installed (for building Client360 dashboard)
- Azure CLI installed and logged in (for Azure deployment)
- Proper permissions to deploy to Azure Static Web Apps

## Basic Usage

```bash
# Deploy Client360 dashboard with TBWA theme to Azure
./deploy_dashboard.sh --theme tbwa --dashboard client360

# Create a package without deploying
./deploy_dashboard.sh --theme tbwa --dashboard advisor --package-only

# Deploy to a specific Azure resource group and app
./deploy_dashboard.sh --resource-group my-resources --app-name my-dashboard --dashboard retail
```

## Command Line Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-r, --resource-group NAME` | Azure resource group name (default: scout-dashboard) |
| `-a, --app-name NAME` | Azure static web app name (default: insight-pulse-dashboard) |
| `-t, --theme THEME` | Theme to use: tbwa, default, sari-sari (default: tbwa) |
| `-d, --dashboard TYPE` | Dashboard type: client360, retail, advisor (default: client360) |
| `-m, --mode MODE` | Build mode: production, development (default: production) |
| `-b, --no-backup` | Skip creating a backup before deployment |
| `-v, --no-verify` | Skip verification after deployment |
| `-p, --package-only` | Create package without deploying |

## Deployment Process

1. **Build**: The script builds the dashboard with the specified theme
2. **Package**: Creates a deployment package (.zip file)
3. **Deploy**: Deploys to Azure Static Web Apps (unless package-only is specified)
4. **Verify**: Verifies the deployment (unless no-verify is specified)
5. **Report**: Generates a deployment report

## Output Files

- **Deployment Package**: `output/{dashboard-type}_{theme}_dashboard_{timestamp}.zip`
- **Deployment Report**: `reports/deployment_{dashboard-type}_{timestamp}.md`
- **Deployment Log**: `logs/deploy_{dashboard-type}_{timestamp}.log`
- **Backup**: `{dashboard-dir}_backup_{timestamp}/` (unless no-backup is specified)

## Examples

### Deploy Client360 Dashboard with TBWA Theme

```bash
./deploy_dashboard.sh --theme tbwa --dashboard client360 --app-name tbwa-client360
```

### Create Package for Retail Dashboard

```bash
./deploy_dashboard.sh --theme tbwa --dashboard retail --package-only
```

### Deploy Advisor Dashboard to Production

```bash
./deploy_dashboard.sh --theme tbwa --dashboard advisor --mode production --app-name tbwa-advisor-prod
```

## Troubleshooting

- **Access issues**: Ensure you're logged in to Azure CLI with `az login`
- **Build failures**: Check Node.js and npm versions, and ensure dependencies are installed
- **Deployment failures**: Verify resource group and app name are correct
- **Theme issues**: Make sure theme assets are properly created and referenced in HTML files

## Manual Deployment

If you can't deploy directly with the script, you can use the package-only option and then manually deploy:

```bash
# Create package only
./deploy_dashboard.sh --theme tbwa --dashboard client360 --package-only

# Deploy manually with Azure CLI
az staticwebapp deploy --name my-app-name --resource-group my-resource-group --source-path output/client360_tbwa_dashboard_20250520123456.zip
```

## Additional Information

- Deployment reports contain detailed information about the deployment process
- Logs can be found in the `logs/` directory
- Backups are created before any modifications to the dashboard