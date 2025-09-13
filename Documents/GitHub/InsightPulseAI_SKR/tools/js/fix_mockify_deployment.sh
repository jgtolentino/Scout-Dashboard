#!/bin/bash
# Script to fix mockify-creator deployment with proper asset paths
# Resolves empty page issue

set -e

echo "🔧 Fixing mockify-creator deployment"
echo "==================================="

# Configuration
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
APP_NAME="tbwa-juicer-insights-dashboard"
REPO_URL="https://github.com/jgtolentino/mockify-creator.git"
TEMP_DIR="temp-mockify-fix"
DEPLOY_DIR="deploy-mockify-fix"

# Clean up any previous attempts
rm -rf "$TEMP_DIR" "$DEPLOY_DIR"

echo "1️⃣ Cloning original repository..."
git clone "$REPO_URL" "$TEMP_DIR"

echo "2️⃣ Modifying build configuration for direct deployment..."
cd "$TEMP_DIR"

# Modify the Vite config to have no base path (needed for deployment in subdirectory)
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: './', // This ensures assets load correctly from any path
})
EOF

echo "3️⃣ Installing dependencies and building..."
npm install
npm run build
cd ..

echo "4️⃣ Preparing deployment package..."
mkdir -p "$DEPLOY_DIR"

# Deploy directly to the root for simplicity
cp -r "$TEMP_DIR/dist/"* "$DEPLOY_DIR/"

# Create a proper routes configuration
cat > "$DEPLOY_DIR/staticwebapp.config.json" << 'EOF'
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html"
    }
  ]
}
EOF

echo "5️⃣ Getting deployment token..."
DEPLOY_TOKEN=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)

echo "6️⃣ Deploying to Azure Static Web App..."
swa deploy "$DEPLOY_DIR" \
  --deployment-token "$DEPLOY_TOKEN" \
  --app-name "$APP_NAME" \
  --env production

echo "7️⃣ Cleaning up temporary files..."
rm -rf "$TEMP_DIR" 

echo "✅ Fix deployment complete!"
echo "🌐 Dashboard URL: https://$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)"