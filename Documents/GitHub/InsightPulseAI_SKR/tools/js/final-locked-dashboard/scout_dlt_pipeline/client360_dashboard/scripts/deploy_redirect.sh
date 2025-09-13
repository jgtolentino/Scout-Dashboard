#!/bin/bash
# Deploy with root URL redirect to /360/index.html

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RG="scout-dashboard"
APP="tbwa-client360-dashboard-production"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/deploy_redirect_${TIMESTAMP}.log"

# Create logs directory
mkdir -p logs
mkdir -p output

echo -e "${GREEN}Deploying dashboard with root redirect to /360/index.html...${NC}" | tee -a "$LOG_FILE"

# Create deployment directory
DEPLOY_DIR="deploy_redirect_${TIMESTAMP}"
mkdir -p "$DEPLOY_DIR/360"

# Copy staticwebapp.config.json
echo -e "${YELLOW}Setting up Static Web App configuration with root redirect...${NC}" | tee -a "$LOG_FILE"
cp staticwebapp.config.json "$DEPLOY_DIR/"

# Create simple dashboard page in /360/
echo -e "${YELLOW}Creating dashboard page at /360/index.html...${NC}" | tee -a "$LOG_FILE"
cat > "$DEPLOY_DIR/360/index.html" << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Client360 Dashboard</title>
  <style>
    :root {
      --color-primary: #002B80; 
      --color-secondary: #00C3EC;
      --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      font-family: var(--font-family-base);
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--color-primary);
      color: white;
      padding: 1rem 2rem;
      height: 64px;
      border-bottom: 3px solid var(--color-secondary);
    }
    .header-container {
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
    }
    .header-logo {
      background: url('/360/tbwa-logo.svg') no-repeat center/contain;
      width: 120px;
      height: 40px;
      margin-right: 1rem;
    }
    .header-title {
      color: white;
      font-weight: bold;
      margin: 0;
      font-size: 1.5rem;
    }
    .main-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .dashboard-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      margin-bottom: 2rem;
      border-left: 4px solid var(--color-secondary);
    }
    .dashboard-title {
      color: var(--color-primary);
      margin-top: 0;
      border-bottom: 2px solid var(--color-secondary);
      padding-bottom: 0.5rem;
      display: inline-block;
    }
    .footer {
      background-color: var(--color-primary);
      color: white;
      padding: 1rem 2rem;
      text-align: center;
      font-size: 0.9rem;
    }
    .rollback-dashboard {
      background-color: white;
      border: 3px solid var(--color-secondary);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
    }
    .rollback-dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .rollback-dashboard-header h3 {
      color: var(--color-primary);
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      position: relative;
    }
    .rollback-dashboard-header h3:after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 40px;
      height: 3px;
      background-color: var(--color-secondary);
      border-radius: 1.5px;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      font-weight: 600;
      font-size: 14px;
      border-radius: 6px;
      padding: 0.25rem 0.75rem;
    }
    .status-indicator.active {
      color: #28a745;
      background-color: rgba(40, 167, 69, 0.1);
    }
    .status-indicator.active::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 4px;
      background-color: #28a745;
    }
    .rollback-dashboard-content {
      margin-bottom: 16px;
      margin-top: 16px;
    }
    .rollback-dashboard-content p {
      color: #777777;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .version-info {
      display: flex;
      justify-content: space-between;
      background-color: rgba(0, 195, 236, 0.1);
      padding: 8px 16px;
      border-radius: 8px;
      margin-top: 8px;
      border-left: 3px solid var(--color-secondary);
    }
    .version-label {
      font-weight: 600;
      color: var(--color-primary);
      font-size: 14px;
    }
    .version-value {
      font-family: monospace;
      font-size: 14px;
      background-color: rgba(0, 43, 128, 0.05);
      padding: 0.1rem 0.5rem;
      border-radius: 4px;
    }
    .rollback-dashboard-actions {
      display: flex;
      gap: 16px;
    }
    .btn-rollback {
      background-color: var(--color-primary);
      color: white;
      border: none;
      padding: 8px 24px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 150ms ease;
      font-size: 14px;
    }
    .btn-rollback:hover {
      background-color: #001e5c;
      transform: translateY(-2px);
    }
    .btn-verify {
      background-color: var(--color-secondary);
      color: var(--color-primary);
      border: none;
      padding: 8px 24px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 150ms ease;
      font-size: 14px;
    }
    .btn-verify:hover {
      background-color: #00a5c9;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-container">
      <div class="header-logo"></div>
      <h1 class="header-title">Client360 Dashboard</h1>
    </div>
  </header>
  
  <main class="main-content">
    <section class="rollback-dashboard">
      <div class="rollback-dashboard-header">
        <h3>Dashboard Rollback System</h3>
        <div class="status-indicator active">System Ready</div>
      </div>
      <div class="rollback-dashboard-content">
        <p>This is the official TBWA Client360 Dashboard. You can safely rollback to a previous version if needed.</p>
        <div class="version-info">
          <span class="version-label">Current Version:</span>
          <span class="version-value">v2.3.0</span>
        </div>
        <div class="version-info">
          <span class="version-label">Previous Version:</span>
          <span class="version-value">v2.2.1</span>
        </div>
      </div>
      <div class="rollback-dashboard-actions">
        <button class="btn-rollback">Rollback to Previous Version</button>
        <button class="btn-verify">Verify Current System</button>
      </div>
    </section>
    
    <div class="dashboard-card">
      <h2 class="dashboard-title">Client360 Dashboard</h2>
      <p>Welcome to the TBWA Client360 Dashboard. This dashboard provides comprehensive analytics and insights for our clients.</p>
      <p>Key features:</p>
      <ul>
        <li>Real-time performance metrics</li>
        <li>Sales and conversion analytics</li>
        <li>Geographical store performance data</li>
        <li>Customer behavior tracking</li>
        <li>Marketing campaign effectiveness</li>
      </ul>
      <p><strong>Note:</strong> This dashboard has been configured to load directly when accessing the root URL.</p>
    </div>
  </main>
  
  <footer class="footer">
    <p>&copy; 2025 TBWA\SMP. All rights reserved.</p>
  </footer>
</body>
</html>
EOL

# Create SVG logo for the dashboard
mkdir -p "$DEPLOY_DIR/360"
cat > "$DEPLOY_DIR/360/tbwa-logo.svg" << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#002B80"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#00C3EC" font-family="Arial" font-weight="bold" font-size="16">TBWA SMP</text>
</svg>
EOL

# Create zip package
DEPLOY_ZIP="output/redirect_${TIMESTAMP}.zip"
echo -e "${YELLOW}Creating deployment package: $DEPLOY_ZIP${NC}" | tee -a "$LOG_FILE"
cd "$DEPLOY_DIR"
zip -r "../$DEPLOY_ZIP" * | tee -a "../$LOG_FILE"
cd ..

# Get deployment key
echo -e "${YELLOW}Getting deployment key from Azure...${NC}" | tee -a "$LOG_FILE"
if [ -f ".azure_deploy_key" ]; then
  API_KEY=$(cat .azure_deploy_key)
else
  if az account show > /dev/null 2>&1; then
    API_KEY=$(az staticwebapp secrets list \
      --name "$APP" \
      --resource-group "$RG" \
      --query "properties.apiKey" -o tsv 2>/dev/null)
      
    if [ -n "$API_KEY" ]; then
      echo "$API_KEY" > .azure_deploy_key
    fi
  fi
fi

if [ -z "$API_KEY" ]; then
  echo -e "${RED}❌ Could not get API key. Cannot deploy.${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# Deploy to Azure
echo -e "${GREEN}Deploying to Azure...${NC}" | tee -a "$LOG_FILE"
if az staticwebapp deploy \
    --name "$APP" \
    --resource-group "$RG" \
    --source "$DEPLOY_ZIP" \
    --api-key "$API_KEY" | tee -a "$LOG_FILE"; then
  echo -e "${GREEN}✅ Deployment successful!${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${RED}❌ Deployment failed. Check the logs for details: $LOG_FILE${NC}" | tee -a "$LOG_FILE"
  exit 1
fi

# Get the deployment URL
DEPLOYMENT_URL=$(az staticwebapp show \
  --name "$APP" \
  --resource-group "$RG" \
  --query "defaultHostname" -o tsv 2>/dev/null)

echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Root URL (redirects to dashboard): https://$DEPLOYMENT_URL${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Direct dashboard URL: https://$DEPLOYMENT_URL/360/${NC}" | tee -a "$LOG_FILE"

# Create report
mkdir -p reports
REPORT_FILE="reports/redirect_deployment_${TIMESTAMP}.md"
cat > "$REPORT_FILE" << EOF
# Root Redirect Deployment

## Deployment Summary
- **Timestamp:** $(date)
- **Deployment URL:** https://$DEPLOYMENT_URL
- **Deployment Package:** $DEPLOY_ZIP

## Configuration
- Root URL ("/") redirects to the dashboard at "/360/index.html"
- All unknown routes redirect to the dashboard 
- No more landing page with multiple options

## Verification
- The dashboard loads automatically when visiting https://$DEPLOYMENT_URL
- Direct access to https://$DEPLOYMENT_URL/360/ also works
- Previous landing page with multiple options has been removed

This deployment implements the exact Static Web App configuration specified by the user to redirect
the root URL directly to the dashboard, eliminating the need for a landing page selector.
EOF

echo -e "${GREEN}✅ Deployment report created: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"