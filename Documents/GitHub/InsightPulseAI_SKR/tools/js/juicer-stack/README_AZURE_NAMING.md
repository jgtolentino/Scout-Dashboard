# Azure Resource Naming for Project Scout

This document provides information about the naming conventions used for Azure resources in Project Scout, including the JuicyChat integration.

## Project Scout Naming Conventions

All Azure resources related to Project Scout follow these naming conventions:

| Resource Type | Naming Pattern | Example |
|---------------|----------------|---------|
| Resource Group | `RG-TBWA-ProjectScout-{Component}` | `RG-TBWA-ProjectScout-Juicer` |
| Storage Account | `tbwa{component}storage` | `tbwajuicerstorage` |
| Databricks Workspace | `tbwa-{component}-databricks` | `tbwa-juicer-databricks` |
| Static Web App | `tbwa-{component}-{app}` | `tbwa-juicer-insights-dashboard` |
| Key Vault | `kv-tbwa-{component}` | `kv-tbwa-juicer-insights2` |
| Container | Standard function name | `bronze`, `silver`, `gold`, `platinum`, `$web` |

## JuicyChat Resource Mapping

The JuicyChat module uses the following Azure resources:

1. **Resource Group**: `RG-TBWA-ProjectScout-Juicer`
   - All Juicer-related Azure resources are deployed to this group

2. **Storage Account**: `tbwajuicerstorage`
   - Hosts the static web content for dashboards
   - Hosts the medallion architecture containers (bronze, silver, gold, platinum)

3. **Container**: `$web`
   - Standard Azure Storage container name for static website hosting
   - Contains all dashboard HTML, JS, and CSS files

4. **API Endpoint**: 
   - For production deployment, the API would be deployed to Azure App Service
   - Naming convention would be: `tbwa-juicerchat-api`

## Resource Configuration

When deploying JuicyChat to Azure, ensure these resources exist and are properly configured:

1. **Static Website Hosting**:
   ```bash
   # Enable static website hosting
   az storage blob service-properties update --account-name tbwajuicerstorage --static-website --index-document index.html
   ```

2. **CORS Configuration**:
   ```bash
   # Enable CORS for API access
   az storage cors add --account-name tbwajuicerstorage --services b --methods GET POST OPTIONS --origins '*' --allowed-headers '*'
   ```

3. **API Service Principal**:
   ```bash
   # Create service principal for API access
   az ad sp create-for-rbac --name tbwa-juicerchat-api --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/RG-TBWA-ProjectScout-Juicer
   ```

## Authentication & Security

For the JuicyChat API, authentication follows Project Scout standards:

1. **API Keys**: Stored in Azure Key Vault `kv-tbwa-juicer-insights2`
2. **Service-to-Service Auth**: Uses Azure AD service principals
3. **Dashboard Access**: Secured via Static Web App authentication

## Updating Configuration

The deployment scripts in this repository have been updated to use the correct naming conventions. If you need to override the defaults, you can set environment variables:

```bash
RESOURCE_GROUP=RG-TBWA-ProjectScout-Juicer STORAGE_ACCOUNT=tbwajuicerstorage ./deploy_dashboards_with_chat.sh
```

## Related Documentation

- [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md) - Full deployment instructions
- [DEPLOYMENT_COMPLETE.md](./DEPLOYMENT_COMPLETE.md) - Deployment status and verification
- [JUICYCHAT_INTEGRATION.md](./JUICYCHAT_INTEGRATION.md) - JuicyChat implementation details