# 🧭 Scout Dashboard Deployment (Azure Power BI Style)

## 🛠 What's Inside
- Full `insights_dashboard_v2.html` for Azure
- Tailwind-compatible CSS patch
- Unified GenAI JS logic
- Azure SWA deploy script
- GitHub CI/CD YAML (optional)
- All docs for design/style parity

## 🚀 Deploy

```bash
# Using the deployment script
chmod +x deploy_power_bi_styled.sh
./deploy_power_bi_styled.sh
```

## 🌐 Azure CLI Direct Deploy (Optional)

```bash
# Using Azure CLI directly
az staticwebapp deploy \
  --name "tbwa-juicer-insights-dashboard" \
  --resource-group "RG-TBWA-ProjectScout-Juicer" \
  --source ./public
```

## 🤖 GitHub CI/CD (Optional)

```yaml
# .github/workflows/azure-static-web-apps.yml
name: Azure SWA Deploy

on:
  push:
    branches: [main]
    paths:
      - 'tools/js/final-locked-dashboard/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Azure SWA
        uses: Azure/static-web-apps-deploy@v1
        with:
          app_location: "tools/js/final-locked-dashboard/deployment-v2/public"
          output_location: ""
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
```

## 📖 Advanced Usage

### Using Make Commands

The package includes a Makefile with helpful commands:

```bash
# Create deployment package
make package

# Deploy to Azure
make deploy

# Test deployment (dry run)
make deploy-dry-run
```

### Environment Variables

You can customize deployment with environment variables:

```bash
# Set environment variables for custom deployment
export AZURE_SWA_NAME="your-app-name"
export AZURE_RESOURCE_GROUP="your-resource-group"

# Then run deployment
make deploy
```

## 🎯 Azure Deployment Context

| Resource           | Value                           |
|--------------------|----------------------------------|
| App Name           | tbwa-juicer-insights-dashboard   |
| Resource Group     | RG-TBWA-ProjectScout-Juicer      |
| Region             | East US 2                        |
| Key Vault          | kv-tbwa-juicer-insights2         |
| Token Secret Name  | AZURE-STATIC-WEB-APPS-API-TOKEN  |