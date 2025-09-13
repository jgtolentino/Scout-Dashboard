# Power BI Parity Audit App for Client 360 Dashboard

This application provides a side-by-side comparison between Power BI dashboards and Plotly Dash equivalents, enabling visual parity auditing for the Client 360 Dashboard project.

## Overview

The Power BI Parity Audit App is designed to:

1. Fetch data from the same sources as Power BI dashboards
2. Render equivalent visualizations using Plotly Dash
3. Allow side-by-side comparison of visual elements
4. Track design discrepancies and improvements
5. Provide a mechanism for continuous parity checking

## Quick Start

### Running Locally

1. Ensure Python 3.9+ is installed
2. Run the local startup script:

```bash
./run_local.sh
```

3. Open your browser and navigate to http://localhost:8080

### Deploying to Azure

Use the provided deployment script:

```bash
./deployment.sh
```

This will:
- Create necessary Azure resources (Resource Group, ACR, App Service)
- Build and push the Docker image
- Deploy the application to Azure Web App
- Configure continuous deployment

## Directory Structure

```
/audit/
│
├── app.py                    # Basic Dash application
├── enhanced_app.py           # Full-featured Dash application
├── requirements.txt          # Python dependencies
├── Dockerfile                # Container definition
├── deployment.sh             # Azure deployment script
├── azure-pipelines.yml       # Azure DevOps pipeline definition
├── run_local.sh              # Local execution script
└── assets/                   # Images and static files
    ├── powerbi_kpi_snapshot.png
    ├── powerbi_sales_snapshot.png
    └── powerbi_brand_snapshot.png
```

## Features

### KPI Comparison
- Side-by-side comparison of KPI tiles
- Matches visual styling, colors, and trends
- Verifies data consistency between platforms

### Sales by Region
- Interactive line charts
- Regional performance metrics
- Tooltip and legend parity

### Brand Performance
- Progress bar visualizations
- Color-coded status indicators
- Consistent data representation

### Settings
- Connect to Power BI workspaces
- Configure data sources
- Schedule automated audits

## Azure DevOps Integration

The `azure-pipelines.yml` file defines a CI/CD pipeline that:

1. Builds the Docker image
2. Pushes it to Azure Container Registry
3. Deploys to Azure Web App

To set up the pipeline:

1. Create a new pipeline in Azure DevOps
2. Select "Existing Azure Pipelines YAML file"
3. Point to `azure-pipelines.yml`
4. Configure the following variables:
   - `ACR_LOGIN_SERVER`
   - `ACR_USERNAME`
   - `ACR_PASSWORD`

## Integrating with Client 360 Dashboard

To integrate this audit app with your main Client 360 Dashboard, add one of the following options:

### Option 1: Add a link in the dashboard menu

```html
<a href="https://app-client360-audit.azurewebsites.net" target="_blank" rel="noopener" 
   class="flex items-center text-blue-600 hover:text-blue-800">
  <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
  </svg>
  Launch Parity Audit
</a>
```

### Option 2: Embed in an iframe

```html
<div class="w-full h-96 border border-gray-300 rounded-lg overflow-hidden">
  <iframe src="https://app-client360-audit.azurewebsites.net" 
    class="w-full h-full" 
    title="Power BI Parity Audit">
  </iframe>
</div>
```

## Technical Implementation Notes

### Data Sources

The app can connect to multiple data sources:

1. **Sample Data**: Generated within the app for demonstration
2. **Azure SQL Database**: Direct connection to the Client 360 database
3. **Databricks SQL**: Connection to Scout DLT pipelines

### Authentication

For production deployment, configure the following authentication:

1. **Power BI Service**: Service Principal authentication
2. **Azure SQL**: Managed Identity or connection string
3. **Databricks**: Access token

### Visual Compliance Testing

The app automatically checks for:

- Color matching between Power BI and Dash
- Font styles and sizes
- Layout proportions
- Interactive behavior parity

## Maintenance and Updates

To update the audit app:

1. Modify `enhanced_app.py` with new visual comparisons
2. Update snapshot images in the `assets` directory
3. Rebuild and deploy using the provided scripts

## Troubleshooting

Common issues:

1. **Connection errors**: Check data source configuration
2. **Missing snapshots**: Ensure Power BI snapshot images are placed in the assets folder
3. **Deployment failures**: Verify Azure credentials and resource availability

For additional help, contact the Client 360 Dashboard team.