# Project Scout Dashboard Deployment

This directory contains deployment scripts for the Project Scout dashboards.

## 📋 Available Scripts

| Script                   | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `deploy_retail_advisor.sh` | Deploys the Retail Advisor dashboard to Azure Web App       |
| `apply_retail_theme.sh`    | Applies the unified theme to all dashboards                  |
| `deploy_static_dashboards.sh` | Deploys the QA and Retail Edge dashboards to Azure Static Web |

## 🚀 Deployment Guide

### 1. Retail Advisor Dashboard

The Retail Advisor dashboard is deployed as an Azure Web App:

```bash
# Requirements:
# - Azure CLI installed and logged in
# - Node.js and npm installed
# - Git installed

# Step 1: Create Azure resources (if they don't exist)
az group create \
  --name RG-TBWA-RetailAdvisor \
  --location eastus

az appservice plan create \
  --name AppServicePlan-RG-TBWA-RetailAdvisor \
  --resource-group RG-TBWA-RetailAdvisor \
  --sku B1 \
  --is-linux

# Step 2: Run the deployment script
./deploy_retail_advisor.sh
```

### 2. QA and Retail Edge Dashboards

These dashboards are deployed as Azure Static Web Apps:

```bash
# Requirements:
# - Azure CLI installed and logged in
# - Azure Static Web Apps CLI installed (npm install -g @azure/static-web-apps-cli)

# Run the deployment script
./deploy_static_dashboards.sh
```

## 🔄 Apply Retail Advisor Theme

To apply the Retail Advisor styling to all dashboards:

```bash
./apply_retail_theme.sh
```

This script:
1. Extracts CSS variables and styles from Retail Advisor
2. Creates a shared theme CSS file
3. Updates all dashboards to use the shared theme
4. Applies consistent styling across all dashboards

## 🌐 Environment Configuration

The deployment scripts support multiple environments:

```bash
# Deploy to production
./deploy_retail_advisor.sh --env production

# Deploy to staging
./deploy_retail_advisor.sh --env staging

# Deploy to development
./deploy_retail_advisor.sh --env development
```

## 🔒 Authentication and Security

The deployment scripts include security features:

- Azure Active Directory integration for secure access
- Role-based access control for internal dashboards
- Public access for client-facing dashboards

## 📊 Monitoring and Logging

After deployment, monitor your dashboards:

```bash
# Check Azure Web App logs
az webapp log tail \
  --name retail-advisor-dashboard \
  --resource-group RG-TBWA-RetailAdvisor

# Check Azure Static Web App logs
az staticwebapp logs \
  --name tbwa-project-scout-dashboards \
  --resource-group RG-TBWA-RetailAdvisor
```

## 🔴 Rollback Process

If you need to rollback to a previous version:

```bash
# Rollback Retail Advisor to a specific commit
./deploy_retail_advisor.sh --commit a1b2c3d4

# Rollback static dashboards
./deploy_static_dashboards.sh --version 1.2.3
```

## 📋 Troubleshooting

If you encounter issues during deployment:

1. Check Azure CLI login status: `az account show`
2. Verify resource group existence: `az group show --name RG-TBWA-RetailAdvisor`
3. Check App Service Plan: `az appservice plan show --name AppServicePlan-RG-TBWA-RetailAdvisor --resource-group RG-TBWA-RetailAdvisor`
4. Review deployment logs: `az webapp log tail --name retail-advisor-dashboard --resource-group RG-TBWA-RetailAdvisor`