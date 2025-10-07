#!/bin/bash
# deploy_insights_all.sh - Deploy GenAI insights integration across all dashboards
# This script is a wrapper for the deploy_insights_all_dashboards.js script

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Default environment
ENV="dev"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env)
      ENV="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--env dev|staging|prod]"
      echo ""
      echo "Options:"
      echo "  --env ENV    Deployment environment (dev, staging, prod)"
      echo "  --help       Display this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $key${RESET}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Header
echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  GenAI Insights Integration for All Dashboards            ║${RESET}"
echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed${RESET}"
  echo "Please install Node.js: https://nodejs.org/"
  exit 1
fi

# Check for deployment script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_SCRIPT="$SCRIPT_DIR/tools/deploy_insights_all_dashboards.js"

if [ ! -f "$DEPLOYMENT_SCRIPT" ]; then
  echo -e "${RED}Error: Deployment script not found: $DEPLOYMENT_SCRIPT${RESET}"
  exit 1
fi

# Make the script executable
chmod +x "$DEPLOYMENT_SCRIPT"

# Run the deployment script
echo -e "${BLUE}Deploying GenAI insights for ${YELLOW}$ENV${BLUE} environment...${RESET}"
echo ""

node "$DEPLOYMENT_SCRIPT" --env "$ENV"

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}GenAI insights integration successful!${RESET}"
else
  echo ""
  echo -e "${RED}GenAI insights integration failed! See error messages above.${RESET}"
  exit 1
fi