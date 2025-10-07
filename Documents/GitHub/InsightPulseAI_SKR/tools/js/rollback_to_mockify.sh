#!/bin/bash
# Rollback script to deploy the original mockify-creator code
# Using exact code from https://github.com/jgtolentino/mockify-creator

set -e

echo "🔄 Rolling back to original mockify-creator code"
echo "==============================================="

# Configuration
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
APP_NAME="tbwa-juicer-insights-dashboard"
REPO_URL="https://github.com/jgtolentino/mockify-creator.git"
TEMP_DIR="temp-mockify"
DEPLOY_DIR="deploy-mockify"

# Clean up any previous attempts
rm -rf "$TEMP_DIR" "$DEPLOY_DIR"

echo "1️⃣ Cloning original repository..."
git clone "$REPO_URL" "$TEMP_DIR"

echo "2️⃣ Building the application..."
cd "$TEMP_DIR"
npm install
npm run build
cd ..

echo "3️⃣ Preparing deployment package..."
mkdir -p "$DEPLOY_DIR/advisor"

# Copy the built files to the advisor directory
cp -r "$TEMP_DIR/dist/"* "$DEPLOY_DIR/advisor/"

# Create advisor.html in the root as a redirect
cat > "$DEPLOY_DIR/advisor.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/advisor/" />
  <title>Redirecting to Advisor Dashboard</title>
</head>
<body>
  <p>Redirecting to <a href="/advisor/">Advisor Dashboard</a>...</p>
</body>
</html>
EOF

# Create insights_dashboard.html as a legacy redirect
cat > "$DEPLOY_DIR/insights_dashboard.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/advisor/" />
  <title>Redirecting to Advisor Dashboard</title>
</head>
<body>
  <p>Redirecting to <a href="/advisor/">Advisor Dashboard</a>...</p>
</body>
</html>
EOF

# Create a simple index.html in the root
cat > "$DEPLOY_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Scout Dashboard Hub</title>
    <style>
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 40px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 800px;
        }
        h1 {
            color: #0078d4;
            margin-bottom: 20px;
        }
        .dashboard-links {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 30px;
        }
        .dashboard-link {
            display: inline-block;
            padding: 16px 24px;
            background-color: #0078d4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        .dashboard-link:hover {
            background-color: #106ebe;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Project Scout Dashboard Hub</h1>
        <p>Welcome to the Project Scout Dashboard Hub. Select a dashboard below to get started.</p>
        
        <div class="dashboard-links">
            <a href="/advisor" class="dashboard-link">Retail Advisor Dashboard</a>
        </div>
    </div>
</body>
</html>
EOF

# Create proper Azure Static Web App config
cat > "$DEPLOY_DIR/staticwebapp.config.json" << 'EOF'
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "routes": [
    {
      "route": "/advisor",
      "rewrite": "/advisor/index.html"
    }
  ]
}
EOF

echo "4️⃣ Getting deployment token..."
DEPLOY_TOKEN=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)

echo "5️⃣ Deploying to Azure Static Web App..."
swa deploy "$DEPLOY_DIR" \
  --deployment-token "$DEPLOY_TOKEN" \
  --app-name "$APP_NAME" \
  --env production

echo "6️⃣ Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "✅ Rollback complete!"
echo "🌐 Dashboard URL: https://$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)/advisor/"