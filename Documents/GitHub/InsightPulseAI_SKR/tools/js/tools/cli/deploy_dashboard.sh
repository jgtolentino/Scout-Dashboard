#!/bin/bash
# deploy_dashboard.sh - Main entry point for optimized dashboard deployments
# Usage: ./deploy_dashboard.sh <route> [--hot] [--dry-run] [--prod|--test]

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
OPTIMIZE_DIR="$SCRIPT_DIR/deploy_optimize"

# Check if toolkit is installed
if [ ! -d "$OPTIMIZE_DIR" ]; then
  echo "❌ Deploy optimization toolkit not found at $OPTIMIZE_DIR"
  echo "Run: git clone https://github.com/tbwa/deploy-optimize $OPTIMIZE_DIR"
  exit 1
fi

# Forward to the hot_redeploy.sh script
if [[ "$*" == *"--hot"* ]]; then
  exec "$OPTIMIZE_DIR/hot_redeploy.sh" "$@"
else
  exec node "$OPTIMIZE_DIR/dash.deploy.js" "$@"
fi