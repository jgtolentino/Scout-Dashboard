#!/bin/bash
# fix_advisor_deployment.sh
# Script to fix the advisor dashboard deployment structure
# Based on the patterns in CLAUDE.md and final-locked-dashboard/docs/SOP_DEPLOYMENT.md

echo "📦 Creating fixed advisor dashboard deployment package..."

# Create directory structure
mkdir -p deploy-advisor-fixed/advisor/assets
mkdir -p deploy-advisor-fixed/edge
mkdir -p deploy-advisor-fixed/ops

# Copy the built files
echo "🔄 Copying dashboard files..."
cp -r /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/mockify-advisor-ui/dist/* deploy-advisor-fixed/advisor/

# Fix asset paths in the advisor/index.html
echo "🔧 Fixing asset paths in index.html..."
sed -i.bak 's|src="/assets/|src="./assets/|g' deploy-advisor-fixed/advisor/index.html
sed -i.bak 's|href="/assets/|href="./assets/|g' deploy-advisor-fixed/advisor/index.html
rm deploy-advisor-fixed/advisor/index.html.bak

# Create redirect files
echo "🔄 Creating redirect files..."

# Create advisor.html redirect
cat > deploy-advisor-fixed/advisor.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Project Scout | Retail Advisor</title>
  <meta http-equiv="refresh" content="0;url=/advisor">
</head>
<body>
  <p>Redirecting to advisor dashboard...</p>
  <script>
    window.location.href = '/advisor';
  </script>
</body>
</html>
EOL

# Create edge redirect
cat > deploy-advisor-fixed/edge/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Project Scout | Edge</title>
  <meta http-equiv="refresh" content="0;url=/advisor">
</head>
<body>
  <p>Redirecting to advisor dashboard...</p>
  <script>
    window.location.href = '/advisor';
  </script>
</body>
</html>
EOL

# Create edge.html redirect
cat > deploy-advisor-fixed/edge.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Project Scout | Edge</title>
  <meta http-equiv="refresh" content="0;url=/advisor">
</head>
<body>
  <p>Redirecting to advisor dashboard...</p>
  <script>
    window.location.href = '/advisor';
  </script>
</body>
</html>
EOL

# Create ops redirect
cat > deploy-advisor-fixed/ops/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Project Scout | Ops</title>
  <meta http-equiv="refresh" content="0;url=/advisor">
</head>
<body>
  <p>Redirecting to advisor dashboard...</p>
  <script>
    window.location.href = '/advisor';
  </script>
</body>
</html>
EOL

# Create ops.html redirect
cat > deploy-advisor-fixed/ops.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Project Scout | Ops</title>
  <meta http-equiv="refresh" content="0;url=/advisor">
</head>
<body>
  <p>Redirecting to advisor dashboard...</p>
  <script>
    window.location.href = '/advisor';
  </script>
</body>
</html>
EOL

# Create main index.html that redirects to advisor
cat > deploy-advisor-fixed/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TBWA Project Scout | Dashboard Hub</title>
  <meta http-equiv="refresh" content="0;url=/advisor">
</head>
<body>
  <p>Redirecting to advisor dashboard...</p>
  <script>
    window.location.href = '/advisor';
  </script>
</body>
</html>
EOL

# Create proper staticwebapp.config.json
echo "🔧 Creating staticwebapp.config.json..."
cat > deploy-advisor-fixed/staticwebapp.config.json << 'EOL'
{
  "routes": [
    { "route": "/advisor", "rewrite": "/advisor/index.html" },
    { "route": "/edge", "rewrite": "/edge/index.html" },
    { "route": "/ops", "rewrite": "/ops/index.html" },
    { "route": "/insights_dashboard.html", "redirect": "/advisor", "statusCode": 301 },
    { "route": "/*", "serve": "/index.html", "statusCode": 200 }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/static/*", "/images/*", "/*.css", "/*.js", "/assets/*", "/advisor/assets/*"]
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; img-src 'self' data: blob:; connect-src 'self' https://*.azurestaticapps.net;"
  }
}
EOL

# Create deployment package
echo "📦 Creating deployment package..."
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js
zip -r scout_dashboards_url_structure.zip deploy-advisor-fixed/*

echo "✅ Fixed deployment package created: scout_dashboards_url_structure.zip"
echo "📝 Next steps:"
echo "1. Login to Azure Portal"
echo "2. Navigate to the Static Web App (wonderful-desert-03a292c00)"
echo "3. Click 'Upload' and select scout_dashboards_url_structure.zip"
echo "4. Wait for deployment to complete"
echo "5. Verify the advisor dashboard works at:"
echo "   - https://wonderful-desert-03a292c00.6.azurestaticapps.net/advisor"
echo "   - https://wonderful-desert-03a292c00.6.azurestaticapps.net/edge"
echo "   - https://wonderful-desert-03a292c00.6.azurestaticapps.net/ops"