# Dashboard Deployment Troubleshooting Guide

This guide provides steps to troubleshoot and resolve issues with the dashboard deployment to Azure Static Web Apps.

## 404 Error Troubleshooting

If you're experiencing a 404 "Not Found" error when accessing the dashboard, follow these steps:

### 1. Verify File Existence

First, verify that the dashboard files exist in the repository:

```bash
./verify_dashboard_files.sh
```

This script checks that all required files exist and have proper permissions.

### 2. Direct Deployment Method

If GitHub Actions deployment isn't working, you can use the direct deployment method:

```bash
./direct_deploy.sh
```

This script deploys the dashboard files directly to Azure Blob Storage with CDN support, bypassing GitHub Actions entirely.

### 3. Manual Azure Portal Steps

If the above methods don't work, you can manually deploy through the Azure Portal:

1. Go to your Azure Portal
2. Navigate to "Static Web Apps"
3. Select your static web app
4. Go to "Configuration" 
5. Verify the following settings:
   - App location: `/dashboards`
   - API location: leave empty
   - Output location: leave empty
6. Go to "Deployment" > "Deployment Details"
7. Check for any error messages in the build logs

### 4. Access Alternative Test Page

A test page has been created to verify Azure deployment is working correctly:

```
/test_project_scout_dashboard.html
```

This simple page should load even if the main dashboard has issues.

### 5. Common Issues and Solutions

#### Path Case Sensitivity

Azure Static Web Apps is case-sensitive. Ensure your file paths match exactly:

```
✅ project_scout_dashboard.html
❌ Project_Scout_Dashboard.html
```

#### Missing Configuration File

Ensure `staticwebapp.config.json` is in the root of your app location and contains proper routing configuration.

#### MIME Type Issues

Verify the MIME types in `staticwebapp.config.json` are correctly set for all file extensions.

#### Cross-Origin Resource Sharing (CORS)

If loading resources from different domains, ensure CORS headers are properly configured.

## Alternative Hosting Options

If Azure Static Web Apps continues to have issues, consider these alternatives:

1. **Azure Blob Storage with CDN**: The `direct_deploy.sh` script implements this approach
2. **GitHub Pages**: Simple static site hosting directly from your repository
3. **Vercel**: Offers simple deployment of static sites with good performance

## Getting Help

If you've tried all these steps and still have issues:

1. Check the Azure Static Web Apps documentation
2. Submit an issue in the GitHub repository
3. Contact Azure support if it's an Azure-specific issue