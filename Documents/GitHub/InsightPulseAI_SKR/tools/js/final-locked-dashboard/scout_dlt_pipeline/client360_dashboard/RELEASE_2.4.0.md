# Client360 Dashboard Deployment Guide - Version 2.4.0

![Client360 Dashboard](./assets/client360_dashboard_header.png)

## Overview

This guide details the deployment process for Client360 Dashboard v2.4.0, a comprehensive update that builds upon the Azure OpenAI integration introduced in v2.3.3 with enhanced AI capabilities, performance optimizations, and improved user experience.

## What's New in v2.4.0

### Key Features

- **Advanced AI Insights Engine**: Completely redesigned AI insights generation with multi-model support
- **Real-time Data Processing**: Streaming data integration for up-to-the-minute analytics
- **Enhanced GeoSpatial Analytics**: Additional map layers and improved region selection
- **Personalized Dashboard Views**: User-specific dashboard configurations and saved preferences
- **Performance Optimizations**: 40% faster loading times and reduced resource consumption
- **Extended Export Options**: New export formats including PowerBI integration

### Technical Improvements

- **Multi-model AI Framework**: Support for multiple AI models (Azure OpenAI, local models, specialized models)
- **Incremental Data Loading**: Progressive data loading for large datasets
- **Component-level Caching**: Intelligent caching for improved performance
- **Advanced Error Recovery**: Enhanced resilience with multi-stage fallbacks
- **Accessibility Enhancements**: WCAG 2.1 AA compliance improvements

## Deployment Prerequisites

### System Requirements

- Azure subscription with access to Azure OpenAI Service
- Azure Storage Account (Standard v2) with hierarchical namespace enabled
- Azure Static Web App configured for deployment
- Node.js 16+ for build and deployment scripts

### Required Access

- Resource Group Contributor role for tbwa-client360-dashboard resource group
- Static Web Apps Contributor role
- Key Vault Secrets User role
- Cognitive Services User role (for Azure OpenAI)

## Pre-Deployment Steps

### 1. Provision Required Azure Resources

```bash
# Check if resources exist or need to be provisioned
az group show --name tbwa-client360-dashboard

# Create Azure OpenAI resource if needed (now with additional model deployment)
az cognitiveservices account create \
  --name tbwa-client360-openai \
  --resource-group tbwa-client360-dashboard \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Deploy both models required for v2.4.0
az cognitiveservices account deployment create \
  --name tbwa-client360-openai \
  --resource-group tbwa-client360-dashboard \
  --deployment-name "client360-insights" \
  --model-name "gpt-35-turbo" \
  --model-version "0613" \
  --model-format OpenAI \
  --scale-settings-scale-type "Standard"

az cognitiveservices account deployment create \
  --name tbwa-client360-openai \
  --resource-group tbwa-client360-dashboard \
  --deployment-name "client360-embedding" \
  --model-name "text-embedding-ada-002" \
  --model-version "2" \
  --model-format OpenAI \
  --scale-settings-scale-type "Standard"
```

### 2. Update API Keys and Secure Configuration

```bash
# Get the API key
API_KEY=$(az cognitiveservices account keys list \
  --name tbwa-client360-openai \
  --resource-group tbwa-client360-dashboard \
  --query key1 -o tsv)

# Store API key in Key Vault (update if exists)
az keyvault secret set \
  --vault-name tbwa-client360-keyvault \
  --name client360-openai-key \
  --value $API_KEY
```

### 3. Prepare Environment Variables

Create or update the `.env.production` file with the following configuration:

```
AZURE_OPENAI_API_ENDPOINT=https://tbwa-client360-openai.openai.azure.com
AZURE_OPENAI_API_KEY=@Microsoft.KeyVault(SecretUri=https://tbwa-client360-keyvault.vault.azure.net/secrets/client360-openai-key/)
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_OPENAI_DEPLOYMENT_PRIMARY=client360-insights
AZURE_OPENAI_DEPLOYMENT_EMBEDDING=client360-embedding
ENABLE_AI_STREAMING=true
ENABLE_MULTI_MODEL=true
ENABLE_ADVANCED_CACHING=true
DASHBOARD_VERSION=2.4.0
```

## Deployment Process

### 1. Get the Deployment Package

The deployment package for v2.4.0 is available in the `deploy_v2.4.0` directory:

```bash
# Verify the package contents
ls -la deploy_v2.4.0/

# Ensure version references are correct
grep -r "2.4.0" deploy_v2.4.0/
```

### 2. Execute Diff-Aware Deployment

The enhanced diff-aware deployment system now supports multi-component deployment:

```bash
# Deploy all v2.4.0 changes
./patch-deploy-diff-aware.sh --from-tag v2.3.3 --to-tag v2.4.0

# Alternatively, deploy specific components
COMPONENT="ai-engine" ./patch-deploy-diff-aware.sh --from-tag v2.3.3 --to-tag v2.4.0
COMPONENT="map-component" ./patch-deploy-diff-aware.sh --from-tag v2.3.3 --to-tag v2.4.0
COMPONENT="ui-framework" ./patch-deploy-diff-aware.sh --from-tag v2.3.3 --to-tag v2.4.0
```

### 3. Update Azure Configuration

```bash
# Configure app settings with new v2.4.0 values
az staticwebapp appsettings set \
  --name tbwa-client360-dashboard-production \
  --resource-group tbwa-client360-dashboard \
  --setting-names \
  AZURE_OPENAI_ENDPOINT="https://tbwa-client360-openai.openai.azure.com" \
  AZURE_OPENAI_DEPLOYMENT_PRIMARY="client360-insights" \
  AZURE_OPENAI_DEPLOYMENT_EMBEDDING="client360-embedding" \
  AZURE_OPENAI_API_VERSION="2023-05-15" \
  ENABLE_AI_STREAMING="true" \
  ENABLE_MULTI_MODEL="true" \
  ENABLE_ADVANCED_CACHING="true" \
  DASHBOARD_VERSION="2.4.0"
```

### 4. Verify the Deployment

Use the new enhanced verification script:

```bash
# Run comprehensive verification
./verify_v2.4.0_deployment.sh

# Generate detailed report
./verify_v2.4.0_deployment.sh --generate-report

# Test AI component specifically
./verify_v2.4.0_deployment.sh --component ai-engine
```

## New Component Architecture

v2.4.0 introduces a modular component architecture with these key components:

### 1. Multi-Model AI Engine

Located in `js/components/ai/engine/`:
- `ai_engine.js` - Core orchestrator that manages multiple AI models
- `model_router.js` - Intelligently routes requests to appropriate models
- `embeddings_service.js` - Handles text embedding for semantic search
- `streaming_client.js` - Manages real-time streaming AI responses
- `model_registry.js` - Tracks available models and their capabilities

### 2. Enhanced Map Services

Located in `js/components/map/`:
- `map_engine.js` - Core map rendering and interaction logic
- `geo_layers.js` - Manages multiple geographical data layers
- `region_selector.js` - Improved region selection with history
- `heat_visualization.js` - Enhanced heatmap generation
- `location_search.js` - Text-based location search and navigation

### 3. User Personalization Framework

Located in `js/components/user/`:
- `preferences.js` - Stores and retrieves user preferences
- `dashboard_layouts.js` - Manages customizable dashboard layouts
- `saved_filters.js` - Handles user-saved filter combinations
- `recent_views.js` - Tracks recently viewed data and reports
- `export_templates.js` - Manages user-defined export templates

## Data Migration Notes

### User Preferences

v2.4.0 introduces a new user preferences system. On first load, the dashboard will:

1. Check for legacy preferences in localStorage
2. Migrate them to the new format if found
3. Create default preferences if none exist

No manual migration steps are required.

### AI Insights Data

The new multi-model AI system uses a different storage format:

1. Previous insights will still be accessible but in read-only mode
2. New insights will use the enhanced format with model attribution
3. The system will automatically convert between formats when needed

## Testing & Validation

After deployment, perform these validation checks:

1. **Version Verification**: Confirm v2.4.0 appears in footer and admin panel
2. **AI Component Test**: Toggle between simulation and live mode
3. **Multi-model Test**: Verify both "Quick" and "Detailed" insight types work
4. **Map Component**: Test new layer toggles and region drill-down
5. **User Preferences**: Create and save custom dashboard layout
6. **Performance**: Verify improved loading times (target: < 2s initial load)

## Rollback Procedure

If issues occur, roll back to v2.3.3:

```bash
# Automated rollback
./rollback.sh --to-version v2.3.3

# Manual component rollback
COMPONENT="ai-engine" ./rollback.sh --to-version v2.3.3
```

This will:
1. Restore v2.3.3 files
2. Reset app settings to v2.3.3 values
3. Generate rollback report

## Post-Deployment Tasks

1. Update documentation links to reflect v2.4.0 features
2. Send announcement to dashboard users
3. Schedule training session for new features
4. Enable monitoring alerts for new components
5. Add version 2.4.0 to the version history log

## Support Contact

For deployment assistance or troubleshooting:
- Email: deployment-support@tbwa-digital.com
- Teams Channel: Client360 Dashboard Support
- On-call engineer: Available 24/7 during deployment window

## References

- [Multi-Model AI Framework Documentation](./docs/MULTI_MODEL_AI_FRAMEWORK.md)
- [Azure OpenAI Service Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)
- [User Personalization Framework](./docs/USER_PERSONALIZATION.md)
- [Performance Optimization Guide](./docs/PERFORMANCE_OPTIMIZATION.md)
- [v2.4.0 PRD Requirements](./docs/PRD_V2.4.0.md)