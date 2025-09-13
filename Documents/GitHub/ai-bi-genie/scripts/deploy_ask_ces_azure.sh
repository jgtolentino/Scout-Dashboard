#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploying Ask CES to Azure Static Web App..."

APP_NAME="ask-ces"
RESOURCE_GROUP="CES-RG"
LOCATION="East Asia"
APP_LOCATION="."
OUTPUT_LOCATION="dist"

# Step 1: Build the frontend
echo "🛠️ Building frontend..."
npm install
npm run build

# Step 2: Deploy to Azure Static Web App
echo "🔄 Deploying to Azure Static Web App..."
az staticwebapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --source "$APP_LOCATION" \
  --app-location "$APP_LOCATION" \
  --output-location "$OUTPUT_LOCATION" \
  --sku Free

echo "✅ Ask CES frontend deployed successfully!"

# Step 3: Set environment variables for AI logic
echo "🔐 Configuring environment settings..."
az staticwebapp appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --setting-names \
    OPENAI_API_KEY=$OPENAI_API_KEY \
    SUPABASE_URL=$SUPABASE_URL \
    SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
    PULSER_AGENT_MODE=cesai

echo "🎉 Deployment complete. Visit your app at:"
echo "🌐 https://$APP_NAME.azurestaticapps.net" 