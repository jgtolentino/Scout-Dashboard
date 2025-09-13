# Security Setup for ADLS Gen2 Integration

This document outlines the security configuration for connecting dashboards to the ADLS Gen2 data lake.

## Authentication Model

The integration uses Azure Active Directory authentication with managed identities to securely access data without storing credentials in code.

### Authentication Flow

1. Dashboard application runs with an Azure managed identity
2. Azure SDK uses DefaultAzureCredential to acquire token from Azure AD
3. Token is used to authenticate requests to ADLS Gen2
4. Access is controlled by RBAC roles and ACLs

## Required Role Assignments

### Dashboard Application (Read-Only Access)

```bash
# Grant dashboard runtime read-only access to Gold container
az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee <managed-identity-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/tbwa-analytics-rg/providers/Microsoft.Storage/storageAccounts/tbwadata/blobServices/default/containers/gold
```

### ETL Pipelines (Read-Write Access)

```bash
# Grant ETL pipeline read-write access to all containers
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <etl-managed-identity-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/tbwa-analytics-rg/providers/Microsoft.Storage/storageAccounts/tbwadata
```

## Row-Level Security

For granular access control to specific data partitions:

```bash
# Example: Restrict access to a specific brand's data
setfacl -m "group:digital-marketing:r-x" /gold/scout/semantic/brand=ADIDAS
```

This ensures that only members of the "digital-marketing" AAD group can access Adidas brand data. The dashboard UI will automatically hide visualizations that the user doesn't have access to.

## Managed Identity Configuration

### For Azure Functions

1. Enable managed identity in the Azure Function app:

```bash
# Enable system-assigned managed identity
az functionapp identity assign \
  --resource-group tbwa-analytics-rg \
  --name tbwa-analytics-api
```

2. Get the principal ID of the managed identity:

```bash
az functionapp identity show \
  --resource-group tbwa-analytics-rg \
  --name tbwa-analytics-api \
  --query principalId \
  --output tsv
```

3. Assign the Storage Blob Data Reader role using the principal ID:

```bash
az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee <principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/tbwa-analytics-rg/providers/Microsoft.Storage/storageAccounts/tbwadata/blobServices/default/containers/gold
```

### For Static Web App or App Service

Similar steps apply for the dashboard application itself:

1. Enable system-assigned managed identity
2. Assign appropriate RBAC roles
3. Use DefaultAzureCredential in application code

## Client-Side Security

For the browser-based dashboard application:

1. All data requests go through Azure Function API proxy
2. API implements rate limiting to prevent abuse
3. CORS is configured to allow only specific origins
4. Azure Front Door provides WAF protection

## Secrets Management

No storage account keys or connection strings are stored in code. Instead:

1. Managed identities provide authentication
2. App Configuration service stores non-sensitive configuration
3. Key Vault stores any required secrets (API keys, etc.)

## Audit Logging

All data access is logged:

1. Azure Storage Analytics logging is enabled
2. Logs are sent to Log Analytics workspace
3. Alert rules monitor for suspicious access patterns

## Security Validation

To validate the security configuration:

1. Run the `verify-adls-access.js` script to test managed identity access
2. Verify that direct storage account access fails without proper authentication
3. Confirm that row-level security is enforced correctly