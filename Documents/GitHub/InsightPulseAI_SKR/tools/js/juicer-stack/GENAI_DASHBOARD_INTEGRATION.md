# GenAI Dashboard Integration Guide

This guide provides instructions for integrating GenAI insights across all three dashboards in the Juicer stack:
1. Main Insights Dashboard
2. Retail Edge Dashboard
3. Operations Dashboard

## Overview

The GenAI insights integration allows AI-generated insights from Databricks to appear consistently across all visualization dashboards in the Juicer stack. This enables users to access valuable insights from multiple entry points in the system.

![Integration Diagram](docs/images/integration_diagram.png)

## Prerequisites

- Node.js 14+ installed
- Access to Databricks (for insights generation)
- Azure CLI installed (for Azure deployment)
- Valid Azure Static Web App deployment token (for deployment)

## Getting Started

The integration scripts automate the entire process of embedding GenAI insights into all dashboards. You can use either the shell script or the Node.js script directly.

### Quick Start (Using Shell Script)

To deploy the integration with default settings:

```bash
chmod +x deploy_genai_insights.sh
./deploy_genai_insights.sh
```

This will:
1. Validate dashboard templates
2. Create a deployment structure
3. Integrate GenAI insights into all dashboards
4. Capture screenshots (if supported)
5. Deploy locally to `/deploy` directory

### Deployment Environments

You can deploy to different environments:

```bash
# Deploy to development environment (default)
./deploy_genai_insights.sh --env dev

# Deploy to staging environment
./deploy_genai_insights.sh --env staging

# Deploy to production environment
./deploy_genai_insights.sh --env prod
```

### Advanced Options

The deployment script supports several advanced options:

```bash
# Generate insights using Databricks before deployment
./deploy_genai_insights.sh --generate-insights

# Skip screenshot capture (useful for CI/CD environments)
./deploy_genai_insights.sh --skip-capture

# Deploy to Azure Static Web Apps
./deploy_genai_insights.sh --azure-deploy

# Force deployment even if validation fails
./deploy_genai_insights.sh --force
```

You can combine options as needed:

```bash
# Full production deployment with insights generation
./deploy_genai_insights.sh --env prod --generate-insights --azure-deploy
```

## Using the Node.js Script Directly

For more control, you can use the Node.js script directly:

```bash
node tools/deploy_genai_insights_integration.js --env staging --azure-deploy
```

## Integration Details

### Main Insights Dashboard

The main insights dashboard already contains the GenAI visualization components. The integration script ensures that this dashboard is properly deployed and linked from other dashboards.

### Retail Edge Dashboard

The script adds a GenAI insights section to the Retail Edge dashboard that shows the top 4 most relevant insights. The section includes:

- Dynamic insights cards based on retail data
- Confidence scoring and visualization
- Link to the full insights dashboard

### Operations Dashboard

The Operations dashboard receives a similar insights section positioned above the system health monitoring area, focusing on operational insights that:

- Highlight system performance patterns
- Show user engagement trends
- Identify potential operational issues

## Customization

You can customize the integration by modifying the Node.js deployment script. The key aspects you might want to customize include:

1. **Insights Widget**: Edit the `insightsWidget` variable in the `integrateInsights()` function
2. **Widget Placement**: Adjust the insertion logic to place the widget in different positions
3. **Custom Styling**: Modify the CSS styles to match your design requirements

## Troubleshooting

### Common Issues

1. **Dashboard validation fails**: Ensure all dashboard templates exist and have valid HTML
   ```
   # Force deployment even if validation fails
   ./deploy_genai_insights.sh --force
   ```

2. **Azure deployment fails**: Check that you have:
   - Azure CLI installed and logged in
   - Valid deployment token (set AZURE_STATIC_WEB_APPS_API_TOKEN environment variable)
   - Proper permissions to the resource group and Static Web App

3. **Screenshots fail to capture**: The screenshot capture requires:
   - Puppeteer or Chrome installed
   - Proper permissions to write to the output directories

## CI/CD Integration

### GitHub Actions

To integrate with GitHub Actions, add the following job to your workflow:

```yaml
jobs:
  deploy-insights:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Deploy GenAI insights integration
        run: |
          chmod +x tools/js/juicer-stack/deploy_genai_insights.sh
          ./tools/js/juicer-stack/deploy_genai_insights.sh --env ${{ github.ref == 'refs/heads/main' && 'prod' || 'staging' }} --skip-capture --azure-deploy
        env:
          AZURE_STATIC_WEB_APPS_API_TOKEN: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
```

## Data Flow

The GenAI insights integration follows this data flow:

1. Databricks processes transcript data using the `juicer_gold_insights.py` notebook
2. Insights are stored in the Platinum layer tables
3. Dashboard queries load insights from the Platinum layer or sample data
4. The InsightsVisualizer component renders insights in all dashboards

## Future Enhancements

Planned future enhancements include:

- Dynamic sorting and filtering of insights based on dashboard context
- Real-time insight generation and updates
- Interactive insights with drill-down capabilities
- Mobile-responsive dashboards
- User feedback mechanism on insight quality

## Support

For questions or issues, please contact the data analytics team or open an issue in the GitHub repository.

---

*This integration was developed as part of Project Scout's Juicer enhancement initiative.*