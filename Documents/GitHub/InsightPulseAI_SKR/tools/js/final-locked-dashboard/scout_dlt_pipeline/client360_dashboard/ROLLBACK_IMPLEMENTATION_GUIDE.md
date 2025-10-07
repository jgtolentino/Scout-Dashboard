# Client360 Dashboard Rollback Implementation Guide

## Overview

This guide provides detailed instructions for rolling back the Client360 Dashboard to a known working state. Use this process when encountering issues with the current dashboard deployment that require immediate resolution.

## 1. Rollback Options

The Client360 Dashboard supports two rollback methods:

1. **Automated Rollback**: Using the provided rollback scripts
2. **Manual Rollback**: Using a previously saved backup

## 2. Automated Rollback Process

### Prerequisites

- Access to the repository
- Permission to modify files in the `/deploy` directory
- Bash shell environment
- (Optional) Azure CLI for deployment to Azure Static Web Apps

### Step 1: Run the Rollback Implementation Script

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard
chmod +x scripts/implement_rollback_dashboard.sh
./scripts/implement_rollback_dashboard.sh
```

This script will:
- Create a backup of the current deployment
- Restore files from a known working version
- Create a new deployment package
- Offer to deploy to Azure Static Web Apps

### Step 2: Verify the Rollback

```bash
chmod +x scripts/verify_rollback_implementation.sh
./scripts/verify_rollback_implementation.sh
```

This script will:
- Check all essential files exist locally
- Verify remote deployment if a URL is provided
- Create a comprehensive verification report
- Generate an HTML page to access the report

### Step 3: Complete Manual Verification

Follow the verification checklist to ensure all aspects of the dashboard are working:

1. Visual appearance and TBWA branding
2. Store map functionality and GeoJSON data
3. Interactive elements and charts
4. Documentation links and content
5. Responsive design on different devices

## 3. Manual Rollback Process

If the automated scripts don't work, follow these manual steps:

### Step 1: Locate a Backup

Navigate to the `output` directory to find backup packages:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/output
ls -l *.zip
```

### Step 2: Create a Backup of Current Files

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard
mkdir -p deploy_backup_$(date +"%Y%m%d%H%M%S")
cp -r deploy/* deploy_backup_$(date +"%Y%m%d%H%M%S")/
```

### Step 3: Clean and Restore Files

```bash
# Clean deploy directory
rm -rf deploy/*

# Extract backup zip
unzip output/tbwa_client360_dashboard_v2.3.0_20250519_191948.zip -d deploy/
```

### Step 4: Deploy to Azure Static Web Apps

Using Azure CLI:
```bash
az staticwebapp deploy --name tbwa-client360-dashboard --resource-group InsightPulseAI-RG --source-path deploy
```

Using SWA CLI:
```bash
swa deploy deploy --deployment-token <your-token>
```

### Step 5: Manual Verification

1. Access the dashboard at its deployed URL
2. Verify all components are functioning correctly
3. Check browser console for any errors
4. Test on multiple devices and browsers

## 4. Critical Files Checklist

The following files are essential for the dashboard to function properly:

### HTML Files
- `index.html` - Main dashboard page
- `direct_url_links.html` - Documentation hub
- `guide.html` - User guide
- `prd.html` - Product requirements document

### CSS Files
- `css/dashboard.css` - Main dashboard styles
- `css/tbwa-theme.css` - TBWA theming
- `css/variables.css` - CSS variables and theming

### JavaScript Files
- `js/dashboard.js` - Core dashboard functionality
- `js/store_map.js` - Geospatial store map component
- `js/tbwa-charts.js` - Chart theming for visualizations

### Data Files
- `data/philippines_outline.geojson` - Philippines map outline
- `data/stores.geojson` - Store location data

### Configuration Files
- `staticwebapp.config.json` - Azure Static Web App configuration

## 5. Troubleshooting

### Missing Files
If essential files are missing after rollback:
1. Check backup directories for the missing files
2. Restore them manually if found
3. If not found, check git history for previous versions

### Deployment Failures
If deployment to Azure fails:
1. Check Azure credentials and permissions
2. Verify the resource group and app name are correct
3. Try deploying via the Azure Portal by uploading the zip file

### Styling Issues
If the dashboard appears unstyled after rollback:
1. Verify CSS files are correctly included in the deployment
2. Check browser console for 404 errors related to CSS files
3. Clear browser cache and reload

### Geospatial Map Problems
If the store map doesn't display correctly:
1. Verify GeoJSON files are included in the deployment
2. Check browser console for Leaflet library errors
3. Ensure network connectivity to Leaflet CDN resources

## 6. Post-Rollback Actions

After successfully rolling back the dashboard:

1. Document the reason for the rollback
2. Create an issue in the tracking system
3. Plan for fixing the issues in the problematic version
4. Communicate the rollback to stakeholders

## Contact Information

For assistance with the rollback process, contact:

- **Dashboard Team**: dashboard-team@example.com
- **DevOps Support**: devops@example.com
- **Emergency Contact**: emergency-support@example.com

---

*Last Updated: May 19, 2025*