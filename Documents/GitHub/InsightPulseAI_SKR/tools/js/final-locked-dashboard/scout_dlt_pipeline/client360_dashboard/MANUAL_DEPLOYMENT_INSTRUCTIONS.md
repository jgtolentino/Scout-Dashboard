# Client360 Dashboard Rollback Manual Deployment Instructions

## Overview
This document provides instructions for manually deploying the rollback fix for the Client360 Dashboard to resolve the issue with TBWA CSS and theme styling not being properly applied.

## Prerequisites
- Access to the Azure Portal
- Appropriate permissions to deploy to the Static Web App

## Deployment Steps

1. **Log in to the Azure Portal**
   - Navigate to [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your credentials

2. **Go to the Static Web App**
   - Search for "Static Web Apps" in the search bar
   - Select the "tbwa-client360-dashboard-production" app

3. **Access Deployment Options**
   - In the left navigation menu, select "Deployment" under "Deployment"

4. **Upload the Deployment Package**
   - Click on "Upload" or "Manual deploy" button
   - Browse to locate the latest deployment package:
     ```
     /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/output/client360_dashboard_final_fix_<timestamp>.zip
     ```
   - Click "Upload" to start the deployment

5. **Wait for Deployment to Complete**
   - This typically takes 1-5 minutes
   - You can monitor the deployment status in the portal

## Verification After Deployment

1. **Access the Dashboard**
   - Navigate to the dashboard URL: `https://blue-coast-0acb6880f.6.azurestaticapps.net`

2. **Verify CSS Loading**
   - Open browser developer tools (F12)
   - Go to the Network tab and reload the page
   - Filter for "css" and verify that CSS files have correct content type: `text/css`

3. **Verify Visual Appearance**
   - Confirm TBWA branding is visible (yellow #ffc300 and blue #005bbb)
   - KPI tiles should have yellow borders at the top
   - Charts should use the TBWA color palette

4. **Run Verification Script**
   - After confirming the site is deployed, run the verification script:
     ```bash
     cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard/scout_dlt_pipeline/client360_dashboard
     ./verify_css_fix_final.sh https://blue-coast-0acb6880f.6.azurestaticapps.net
     ```
   - Review the generated verification report in the reports directory

## Troubleshooting

If issues persist after deployment:

1. **Clear Browser Cache**
   - Use Ctrl+F5 or Cmd+Shift+R to force a full reload

2. **Check for Errors**
   - Look for any errors in the browser console
   - Check that all CSS files are loading correctly

3. **Review Configuration**
   - Ensure the `staticwebapp.config.json` file has correct content-type settings
   - Verify MIME types are properly configured
   - Check CSS load order in the HTML: variables.css should load first, then tbwa-theme.css, then dashboard.css

4. **Rollback the Rollback**
   - If the fix introduces new issues, navigate to "Deployments" in the Azure Portal
   - Select a previous working deployment and click "Restore"

5. **Contact Team Lead**
   - If issues persist, reach out to the Dashboard Team Lead

---

*Last Updated: May 19, 2025*