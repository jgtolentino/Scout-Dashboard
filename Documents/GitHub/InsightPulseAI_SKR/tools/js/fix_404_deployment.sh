#!/bin/bash
# Script to fix Azure Static Web App 404 issues
# Created for Project Scout Dashboard

set -e

echo "🔧 Azure Static Web App 404 Error Fixer 🔧"
echo "=========================================="

# Configuration
APP_NAME="tbwa-juicer-insights-dashboard"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
DEPLOY_DIR="deploy-fixed"
MOCKIFY_TEMP="mockify-temp"

# Clean up any previous attempts
rm -rf "$DEPLOY_DIR" "$MOCKIFY_TEMP"
mkdir -p "$DEPLOY_DIR"

echo "1️⃣ Cloning mockify-creator..."
git clone https://github.com/jgtolentino/mockify-creator.git "$MOCKIFY_TEMP"

echo "2️⃣ Building mockify app..."
cd "$MOCKIFY_TEMP"
npm install
npm run build
cd ..

echo "3️⃣ Setting up proper file structure..."
# Copy mockify build to root
cp -r "$MOCKIFY_TEMP"/dist/* "$DEPLOY_DIR"/

# Create additional entry points with HTML redirects
cat > "$DEPLOY_DIR/advisor.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/" />
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to dashboard...</p>
</body>
</html>
EOF

cat > "$DEPLOY_DIR/insights_dashboard.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/" />
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to dashboard...</p>
</body>
</html>
EOF

echo "4️⃣ Creating config with proper routes..."
cat > "$DEPLOY_DIR/staticwebapp.config.json" << 'EOF'
{
  "trailingSlash": "auto",
  "routes": [
    {
      "route": "/insights_dashboard.html",
      "rewrite": "/index.html"
    },
    {
      "route": "/advisor",
      "rewrite": "/index.html"
    },
    {
      "route": "/advisor/*",
      "rewrite": "/index.html"
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*", "/css/*", "/assets/*", "*.js"]
  },
  "mimeTypes": {
    ".json": "text/json"
  }
}
EOF

# Get deployment token
echo "5️⃣ Getting deployment token..."
DEPLOY_TOKEN=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)

echo "6️⃣ Deploying fixed version..."
swa deploy "$DEPLOY_DIR" \
  --deployment-token "$DEPLOY_TOKEN" \
  --app-name "$APP_NAME" \
  --env production

# Clean up
rm -rf "$MOCKIFY_TEMP"

# Get the site URL
HOSTNAME=$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)

echo "✅ Deployment fixed!"
echo "🌐 Dashboard available at: https://$HOSTNAME"
echo "🔗 Also available at: https://$HOSTNAME/advisor"
echo "🔗 Legacy URL: https://$HOSTNAME/insights_dashboard.html"