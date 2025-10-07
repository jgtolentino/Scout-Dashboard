#!/bin/bash
# selective_packager.sh - Creates optimized deployment packages by only including changed files
# Usage: ./selective_packager.sh [--route <route_name>] [--since <commit>] [--out <output_zip>]

set -e

ROUTE="advisor"
SINCE_COMMIT="HEAD~1"
OUT_ZIP="route_update.zip"
DEPLOY_DIR="deploy-ready"
VITE_CACHE_DIR=".vite-cache"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --route) ROUTE="$2"; shift ;;
    --since) SINCE_COMMIT="$2"; shift ;;
    --out) OUT_ZIP="$2"; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Run diff analyzer to see what's changed
DIFF_RESULT=$(./diff_analyzer.sh --since "$SINCE_COMMIT" --route "$ROUTE")
DIFF_STATUS=$?

if [ "$DIFF_STATUS" -eq 1 ]; then
  echo "✅ No changes detected for route '$ROUTE'. Skipping packaging."
  exit 0
elif [ "$DIFF_STATUS" -eq 0 ]; then
  echo "🔄 Code changes detected. Packaging full route."
  PACKAGE_TYPE="full"
elif [ "$DIFF_STATUS" -eq 2 ]; then
  echo "🖼️ Only assets changed. Creating assets-only package."
  PACKAGE_TYPE="assets"
fi

# Make sure the deploy directory exists
if [ ! -d "$DEPLOY_DIR" ]; then
  echo "❌ Deployment directory '$DEPLOY_DIR' not found!"
  exit 1
fi

# Create the package
echo "📦 Creating $PACKAGE_TYPE package for route '$ROUTE'..."

# Create a temporary directory for the files to package
TEMP_DIR=$(mktemp -d)
mkdir -p "$TEMP_DIR/$ROUTE"

if [ "$PACKAGE_TYPE" = "full" ]; then
  # Copy the entire route
  cp -r "$DEPLOY_DIR/$ROUTE"/* "$TEMP_DIR/$ROUTE/"
  
  # Copy config files
  cp "$DEPLOY_DIR/staticwebapp.config.json" "$TEMP_DIR/"
  
  # Copy route HTML
  if [ -f "$DEPLOY_DIR/$ROUTE.html" ]; then
    cp "$DEPLOY_DIR/$ROUTE.html" "$TEMP_DIR/"
  fi
  
elif [ "$PACKAGE_TYPE" = "assets" ]; then
  # Only copy asset files that changed
  CHANGED_ASSETS=$(git diff --name-only "$SINCE_COMMIT" | grep -E "\.(png|jpg|svg|gif|ico)$" | grep -E "$ROUTE")
  
  for asset in $CHANGED_ASSETS; do
    relative_path=${asset#*/}
    mkdir -p $(dirname "$TEMP_DIR/$relative_path")
    cp "$asset" "$TEMP_DIR/$relative_path"
  done
fi

# Create the zip package
cd "$TEMP_DIR"
zip -r "$OUT_ZIP" ./*
mv "$OUT_ZIP" "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/$OUT_ZIP"
cd -

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Package created: /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/$OUT_ZIP"
echo "📏 Package size: $(du -h "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/$OUT_ZIP" | cut -f1)"