#!/bin/bash
# deploy_genai_insights.sh - Deploy GenAI insights integration across all dashboards
# This script is a wrapper for the Node.js deployment script

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/tools/deploy_genai_insights_integration.js"

# Header
echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  GenAI Insights Integration Deployment for Juicer Stack       ║${RESET}"
echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed${RESET}"
  echo "Please install Node.js: https://nodejs.org/"
  exit 1
fi

# Check if deployment script exists
if [ ! -f "$NODE_SCRIPT" ]; then
  echo -e "${RED}Error: Deployment script not found: $NODE_SCRIPT${RESET}"
  exit 1
fi

# Make script executable
chmod +x "$NODE_SCRIPT"

# Parse command line arguments
ENV="dev"
GENERATE_INSIGHTS=false
SKIP_CAPTURE=false
AZURE_DEPLOY=false
FORCE=false

# Process arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env)
      ENV="$2"
      shift 2
      ;;
    --generate-insights)
      GENERATE_INSIGHTS=true
      shift
      ;;
    --skip-capture)
      SKIP_CAPTURE=true
      shift
      ;;
    --azure-deploy)
      AZURE_DEPLOY=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --help)
      node "$NODE_SCRIPT" --help
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option $key${RESET}"
      node "$NODE_SCRIPT" --help
      exit 1
      ;;
  esac
done

# Build command
CMD="node \"$NODE_SCRIPT\" --env $ENV"

if [ "$GENERATE_INSIGHTS" = true ]; then
  CMD="$CMD --generate-insights"
fi

if [ "$SKIP_CAPTURE" = true ]; then
  CMD="$CMD --skip-capture"
fi

if [ "$AZURE_DEPLOY" = true ]; then
  CMD="$CMD --azure-deploy"
fi

if [ "$FORCE" = true ]; then
  CMD="$CMD --force"
fi

# Print command
echo -e "${BLUE}Executing: $CMD${RESET}"
echo ""

# Run the Node.js script
eval $CMD

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}Deployment completed successfully!${RESET}"
else
  echo ""
  echo -e "${RED}Deployment failed. See error messages above.${RESET}"
  exit 1
fi