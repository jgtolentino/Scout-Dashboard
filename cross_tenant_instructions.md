# Working with QA Bots Across Multiple Azure Environments

This guide explains how to create and manage QA bots across different Azure directories, subscriptions, and resource groups.

## Table of Contents
1. [Understanding Azure Hierarchy](#understanding-azure-hierarchy)
2. [Prerequisites](#prerequisites)
3. [Using the Multi-tenant Setup Script](#using-the-multi-tenant-setup-script)
4. [Command Line Arguments](#command-line-arguments)
5. [Scenario: Development vs. Production](#scenario-development-vs-production)
6. [Scenario: Multiple Client Projects](#scenario-multiple-client-projects)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Understanding Azure Hierarchy

Azure resources are organized in a hierarchy:

```
Azure Directory (Tenant)
└── Subscriptions
    └── Resource Groups
        └── Resources (Language Service, Search Service, etc.)
```

- **Azure Directory/Tenant**: The top-level container representing your organization
- **Subscription**: A billing and management container within a tenant
- **Resource Group**: A logical container for related resources
- **Resources**: The actual services (Language Service, Search Service)

## Prerequisites

To work with multiple environments, you need:

1. **Azure CLI** installed and updated
2. **Appropriate permissions** in the target tenants/subscriptions
3. **Python 3.6+** for running the setup script

## Using the Multi-tenant Setup Script

The script at `/Users/tbwa/multi_tenant_qna_setup.py` handles the entire process:

1. **List and select** Azure tenants
2. **Switch** to the selected tenant
3. **List and select** subscriptions
4. **Create** resource group
5. **Create** Language Service
6. **Create** Search Service
7. **Generate** a configuration file for future reference

Run the script with:

```bash
python /Users/tbwa/multi_tenant_qna_setup.py
```

The script will guide you through each step interactively.

## Command Line Arguments

For automation or repeated use, you can provide parameters:

```bash
python /Users/tbwa/multi_tenant_qna_setup.py \
  --tenant "your-tenant-id" \
  --subscription "your-subscription-id" \
  --resource-group "QnABot-Production" \
  --location "eastus" \
  --language-name "prod-language-service" \
  --search-name "prod-search-service"
```

| Argument | Description |
|----------|-------------|
| `--tenant` | Azure Tenant/Directory ID |
| `--subscription` | Azure Subscription ID |
| `--resource-group` | Resource Group name |
| `--location` | Azure region (default: australiaeast) |
| `--language-name` | Language service name |
| `--search-name` | Search service name (will be converted to lowercase) |

## Scenario: Development vs. Production

Common scenario: Maintaining separate development and production environments.

### Development Environment

```bash
python /Users/tbwa/multi_tenant_qna_setup.py \
  --resource-group "QnABot-Dev" \
  --language-name "dev-language-service" \
  --search-name "dev-search-service"
```

### Production Environment

```bash
python /Users/tbwa/multi_tenant_qna_setup.py \
  --resource-group "QnABot-Prod" \
  --language-name "prod-language-service" \
  --search-name "prod-search-service"
```

### Deployment Workflow

1. Develop and test in the development environment
2. Export QA pairs from development environment
3. Import to production environment
4. Train and deploy in production

## Scenario: Multiple Client Projects

For agencies or consultancies managing multiple client projects:

### Client A

```bash
python /Users/tbwa/multi_tenant_qna_setup.py \
  --tenant "client-a-tenant-id" \
  --subscription "client-a-subscription-id" \
  --resource-group "ClientA-QnABot" \
  --language-name "clienta-language-service" \
  --search-name "clienta-search-service"
```

### Client B

```bash
python /Users/tbwa/multi_tenant_qna_setup.py \
  --tenant "client-b-tenant-id" \
  --subscription "client-b-subscription-id" \
  --resource-group "ClientB-QnABot" \
  --language-name "clientb-language-service" \
  --search-name "clientb-search-service"
```

## Troubleshooting Common Issues

### "You do not have permission to perform this operation"

- **Cause**: Insufficient permissions in the target tenant/subscription
- **Solution**: Request appropriate permissions from the tenant administrator

### "The subscription is not registered to use namespace 'Microsoft.Search'"

- **Cause**: The subscription needs to register the resource provider
- **Solution**: Run `az provider register --namespace Microsoft.Search`

### "The resource with name 'xyz' already exists"

- **Cause**: Resource name is already taken (globally unique)
- **Solution**: Choose a different name, especially for search services

### "400 Client Error: Bad Request"

- **Cause**: Incorrectly formatted request, often due to invalid characters in names
- **Solution**: Use only lowercase letters, numbers, and hyphens for search service names

### Switching Between Projects

To switch between different projects, you can use the saved configuration:

```bash
# Load the configuration
config_file="qna_config_20250405_123456.json"
config=$(cat "$config_file")

# Extract values
tenant_id=$(echo $config | jq -r '.tenant_id')
subscription_id=$(echo $config | jq -r '.subscription_id')
resource_group=$(echo $config | jq -r '.resource_group')

# Switch to the correct tenant and subscription
az login --tenant "$tenant_id"
az account set --subscription "$subscription_id"

# Now you can work with this project's resources
echo "Now working with resource group: $resource_group"
```

### Creating a QA Bot in a Specific Environment

Once your environment is set up, follow these steps:

1. Go to Azure Portal and link the search service to your language service
2. Create your QA project in Language Studio (https://language.azure.com/)
3. Select the correct subscription and language service
4. Upload your QA dataset
5. Train and deploy your bot