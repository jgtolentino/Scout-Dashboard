#!/bin/bash
# Fix Scout Dashboard 404 errors in accordance with CLAUDE.md guidelines
# Creates proper routing structure with both directory/index.html and flat file structures

set -e

echo "🔧 Scout Dashboard URL Structure Fixer 🔧"
echo "=========================================="

# Source directory (adjust as needed)
SOURCE_DIR="deploy-advisor-fixed"
# Target directory for properly structured output
TARGET_DIR="scout-dashboard-fixed"

# Clean up any previous attempts
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
mkdir -p "$TARGET_DIR/advisor"
mkdir -p "$TARGET_DIR/edge"
mkdir -p "$TARGET_DIR/ops"

echo "1️⃣ Creating proper file structure..."

# Copy all assets, CSS, JS, and other resources
echo "   - Copying all assets..."
cp -r "$SOURCE_DIR"/{css,js,assets,images,favicon.ico,og-image.png,placeholder.svg} "$TARGET_DIR"/ 2>/dev/null || true

# Create both types of file structure for advisor
echo "   - Setting up advisor paths..."
if [ -f "$SOURCE_DIR/advisor/index.html" ]; then
  cp "$SOURCE_DIR/advisor/index.html" "$TARGET_DIR/advisor/index.html"
  cp "$SOURCE_DIR/advisor/index.html" "$TARGET_DIR/advisor.html"
elif [ -f "$SOURCE_DIR/advisor.html" ]; then
  cp "$SOURCE_DIR/advisor.html" "$TARGET_DIR/advisor.html"
  cp "$SOURCE_DIR/advisor.html" "$TARGET_DIR/advisor/index.html"
fi

# Create both types of file structure for edge
echo "   - Setting up edge paths..."
if [ -f "$SOURCE_DIR/edge/index.html" ]; then
  cp "$SOURCE_DIR/edge/index.html" "$TARGET_DIR/edge/index.html"
  cp "$SOURCE_DIR/edge/index.html" "$TARGET_DIR/edge.html"
elif [ -f "$SOURCE_DIR/edge.html" ]; then
  cp "$SOURCE_DIR/edge.html" "$TARGET_DIR/edge.html"
  cp "$SOURCE_DIR/edge.html" "$TARGET_DIR/edge/index.html"
fi

# Create both types of file structure for ops
echo "   - Setting up ops paths..."
if [ -f "$SOURCE_DIR/ops/index.html" ]; then
  cp "$SOURCE_DIR/ops/index.html" "$TARGET_DIR/ops/index.html"
  cp "$SOURCE_DIR/ops/index.html" "$TARGET_DIR/ops.html"
elif [ -f "$SOURCE_DIR/ops.html" ]; then
  cp "$SOURCE_DIR/ops.html" "$TARGET_DIR/ops.html"
  cp "$SOURCE_DIR/ops.html" "$TARGET_DIR/ops/index.html"
fi

# Copy index.html
echo "   - Setting up root index..."
if [ -f "$SOURCE_DIR/index.html" ]; then
  cp "$SOURCE_DIR/index.html" "$TARGET_DIR/index.html"
fi

# Create insights_dashboard.html redirect
echo "   - Setting up legacy path redirects..."
cat > "$TARGET_DIR/insights_dashboard.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/advisor" />
  <title>Redirecting to Advisor Dashboard</title>
</head>
<body>
  <p>Redirecting to Advisor dashboard...</p>
  <script>window.location.href = "/advisor";</script>
</body>
</html>
EOF

echo "2️⃣ Creating proper staticwebapp.config.json with routes..."
cat > "$TARGET_DIR/staticwebapp.config.json" << 'EOF'
{
  "routes": [
    { 
      "route": "/advisor", 
      "rewrite": "/advisor.html" 
    },
    { 
      "route": "/edge", 
      "rewrite": "/edge.html" 
    },
    { 
      "route": "/ops", 
      "rewrite": "/ops.html" 
    },
    {
      "route": "/insights_dashboard.html",
      "redirect": "/advisor",
      "statusCode": 301
    },
    {
      "route": "/advisor.html", 
      "rewrite": "/advisor/index.html" 
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/css/*", "/js/*"]
  },
  "globalHeaders": {
    "X-Dashboard-Tag": "scout_dashboards_clean_urls",
    "X-Patch-ID": "dashboard-url-structure-v2",
    "X-Client-Context": "TBWA-direct-only"
  }
}
EOF

echo "3️⃣ Creating swa-cli.config.json file for SWA CLI..."
cat > "$TARGET_DIR/swa-cli.config.json" << EOF
{
  "configurations": {
    "production": {
      "appLocation": "./",
      "outputLocation": "./",
      "appName": "scout-advisor-dashboard",
      "pwaEnabled": false
    }
  }
}
EOF

echo "✅ URL structure fix complete!"
echo "To deploy with SWA CLI, run:"
echo "swa deploy $TARGET_DIR --env production --deployment-token YOUR_TOKEN"
echo ""
echo "To test locally before deployment, run:"
echo "swa start $TARGET_DIR --open"