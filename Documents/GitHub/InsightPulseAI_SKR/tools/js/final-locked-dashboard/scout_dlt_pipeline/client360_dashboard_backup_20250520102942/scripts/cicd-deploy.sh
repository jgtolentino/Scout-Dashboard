#!/usr/bin/env bash
set -euo pipefail

RG=scout-dashboard
APP=tbwa-client360-dashboard-production
LOCATION=eastus2
ZIP=client360/build.zip

# Login
az login --identity

# Package
cd client360
zip -r ../build.zip build
cd ..

# Deploy infra
az deployment group create \
  --resource-group $RG \
  --template-file infrastructure/main.bicep

# Deploy app to staging
az staticwebapp deploy \
  --name $APP \
  --resource-group $RG \
  --source client360/build \
  --slot staging

# Run smoke tests
npx cypress run --config baseUrl=https://$APP-staging.azurestaticapps.net

# Swap staging → production
az staticwebapp hostname swap \
  --name $APP \
  --resource-group $RG \
  --slot staging