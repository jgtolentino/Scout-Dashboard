#!/bin/bash
# diff_analyzer.sh - Git diff analyzer to detect files requiring rebuild
# Usage: ./diff_analyzer.sh [--since <commit>] [--route <route_name>]

set -e

SINCE_COMMIT="HEAD~1"
ROUTE=""

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --since) SINCE_COMMIT="$2"; shift ;;
    --route) ROUTE="$2"; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Get the list of changed files
if [ -z "$ROUTE" ]; then
  CHANGED=$(git diff --name-only "$SINCE_COMMIT")
else
  # Filter for specific route if provided
  CHANGED=$(git diff --name-only "$SINCE_COMMIT" | grep -E "$ROUTE")
fi

# Count changed files by type
CHANGED_JS=$(echo "$CHANGED" | grep -cE "\.(js|jsx|ts|tsx)$" || echo 0)
CHANGED_CSS=$(echo "$CHANGED" | grep -cE "\.(css|scss|sass)$" || echo 0)
CHANGED_HTML=$(echo "$CHANGED" | grep -cE "\.(html|htm)$" || echo 0)
CHANGED_ASSETS=$(echo "$CHANGED" | grep -cE "\.(png|jpg|svg|gif|ico)$" || echo 0)
CHANGED_CONFIG=$(echo "$CHANGED" | grep -cE "(vite\.config|package\.json|tsconfig\.json|staticwebapp\.config\.json)$" || echo 0)

# Determine if build is needed
NEEDS_BUILD=0

if [ "$CHANGED_JS" -gt 0 ] || [ "$CHANGED_CSS" -gt 0 ] || [ "$CHANGED_HTML" -gt 0 ] || [ "$CHANGED_CONFIG" -gt 0 ]; then
  NEEDS_BUILD=1
fi

# Output analysis
echo "📊 Changed files analysis:"
echo "- JS/TS: $CHANGED_JS files"
echo "- CSS/SCSS: $CHANGED_CSS files"
echo "- HTML: $CHANGED_HTML files"
echo "- Assets: $CHANGED_ASSETS files"
echo "- Config: $CHANGED_CONFIG files"

if [ "$NEEDS_BUILD" -eq 1 ]; then
  echo "🔄 Code changes detected. Rebuild required."
  if [ "$CHANGED_CONFIG" -gt 0 ]; then
    echo "⚠️ Configuration changes detected. Full rebuild recommended."
  fi
  exit 0
else
  if [ "$CHANGED_ASSETS" -gt 0 ]; then
    echo "🖼️ Only asset changes detected. Skip rebuild, update assets only."
    exit 2
  else
    echo "✅ No relevant changes. Skip build."
    exit 1
  fi
fi