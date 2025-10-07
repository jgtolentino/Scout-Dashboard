#!/bin/bash
# Superset Dashboard Deployment Tool
# Integrated with Surf agent for autonomous dashboard deployments

set -e

# ANSI color codes
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BOLD="\033[1m"
NC="\033[0m" # No Color

# Script arguments
DASHBOARD_DIR=""
SUPERSET_HOST=""
DASHBOARD_JSON=""
SUPERSET_USERNAME="admin"
SUPERSET_PASSWORD="admin"
DRY_RUN=false

# Help text
show_help() {
  echo -e "${BOLD}Superset Dashboard Deployment Tool${NC}"
  echo -e "Integrated with Surf agent for autonomous dashboard deployments"
  echo
  echo -e "Usage: $0 [options]"
  echo
  echo -e "Options:"
  echo -e "  -d, --dir DIR       Dashboard directory (default: current directory)"
  echo -e "  -h, --host URL      Superset host URL (required)"
  echo -e "  -j, --json FILE     Dashboard JSON file (required)"
  echo -e "  -u, --user USER     Superset username (default: admin)"
  echo -e "  -p, --pass PASS     Superset password (default: admin)"
  echo -e "  --dry-run           Validate without uploading"
  echo -e "  --help              Show this help message"
  echo
  echo -e "Example:"
  echo -e "  $0 --host http://localhost:8088 --json brand_analytics_dashboard.json"
  echo
}

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -d|--dir) DASHBOARD_DIR="$2"; shift ;;
    -h|--host) SUPERSET_HOST="$2"; shift ;;
    -j|--json) DASHBOARD_JSON="$2"; shift ;;
    -u|--user) SUPERSET_USERNAME="$2"; shift ;;
    -p|--pass) SUPERSET_PASSWORD="$2"; shift ;;
    --dry-run) DRY_RUN=true ;;
    --help) show_help; exit 0 ;;
    *) echo -e "${RED}Unknown parameter: $1${NC}"; show_help; exit 1 ;;
  esac
  shift
done

# Validate required arguments
if [ -z "$SUPERSET_HOST" ]; then
  echo -e "${RED}Error: Superset host URL is required${NC}"
  show_help
  exit 1
fi

if [ -z "$DASHBOARD_JSON" ]; then
  echo -e "${RED}Error: Dashboard JSON file is required${NC}"
  show_help
  exit 1
fi

# Set dashboard directory
if [ -z "$DASHBOARD_DIR" ]; then
  DASHBOARD_DIR=$(pwd)
else
  # Change to the specified directory
  cd "$DASHBOARD_DIR" || { echo -e "${RED}Error: Could not change to directory $DASHBOARD_DIR${NC}"; exit 1; }
fi

# Validate dashboard JSON file
if [ ! -f "$DASHBOARD_JSON" ]; then
  echo -e "${RED}Error: Dashboard JSON file not found: $DASHBOARD_JSON${NC}"
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}jq is not installed. Checking JSON format may be less reliable.${NC}"
  JSON_VALIDATOR="cat"
else
  # Validate JSON format
  if ! jq empty "$DASHBOARD_JSON" 2>/dev/null; then
    echo -e "${RED}Error: Invalid JSON format in $DASHBOARD_JSON${NC}"
    if [ "$DRY_RUN" = false ]; then
      echo -e "${YELLOW}Attempting to fix JSON format...${NC}"
      if jq '.' "$DASHBOARD_JSON" > "${DASHBOARD_JSON}.fixed" 2>/dev/null; then
        mv "${DASHBOARD_JSON}.fixed" "$DASHBOARD_JSON"
        echo -e "${GREEN}JSON format fixed successfully${NC}"
      else
        echo -e "${RED}Could not fix JSON format${NC}"
        exit 1
      fi
    else
      exit 1
    fi
  else
    echo -e "${GREEN}JSON format is valid${NC}"
  fi
  JSON_VALIDATOR="jq '.'"
fi

echo -e "${BLUE}${BOLD}📊 Superset Dashboard Deployment${NC}"
echo -e "${BOLD}Host:${NC} $SUPERSET_HOST"
echo -e "${BOLD}Dashboard:${NC} $DASHBOARD_JSON"
echo -e "${BOLD}Dry run:${NC} $DRY_RUN"
echo

# In dry run mode, just show the dashboard JSON
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Dry run mode - not uploading to Superset${NC}"
  echo -e "${BLUE}Dashboard JSON preview:${NC}"
  eval "$JSON_VALIDATOR $DASHBOARD_JSON | head -20"
  echo -e "${YELLOW}(truncated)${NC}"
  exit 0
fi

# Authentication
echo -e "${BLUE}Authenticating with Superset...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$SUPERSET_HOST/api/v1/security/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'"$SUPERSET_USERNAME"'",
    "password": "'"$SUPERSET_PASSWORD"'",
    "provider": "db"
  }')

# Extract access token with error handling
if [ -z "$LOGIN_RESPONSE" ]; then
  echo -e "${RED}Error: No response from Superset server${NC}"
  echo -e "${YELLOW}Please check that Superset is running at $SUPERSET_HOST${NC}"
  exit 1
fi

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
  if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo -e "${RED}Error: Could not extract access token${NC}"
    echo -e "${YELLOW}Response: $LOGIN_RESPONSE${NC}"
    exit 1
  fi
  echo -e "${GREEN}Authentication successful${NC}"
else
  echo -e "${RED}Error: Authentication failed${NC}"
  echo -e "${YELLOW}Response: $LOGIN_RESPONSE${NC}"
  exit 1
fi

# Import dashboard
echo -e "${BLUE}Importing dashboard...${NC}"
IMPORT_RESPONSE=$(curl -s -X POST "$SUPERSET_HOST/api/v1/dashboard/import/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "formData=@$DASHBOARD_JSON")

# Check if import was successful
if echo "$IMPORT_RESPONSE" | grep -q "id"; then
  DASHBOARD_ID=$(echo "$IMPORT_RESPONSE" | jq -r '.id')
  echo -e "${GREEN}Dashboard imported successfully${NC}"
  echo -e "${BLUE}Dashboard ID:${NC} $DASHBOARD_ID"
  echo -e "${BLUE}Dashboard URL:${NC} $SUPERSET_HOST/superset/dashboard/$DASHBOARD_ID/"
else
  echo -e "${RED}Error: Dashboard import failed${NC}"
  echo -e "${YELLOW}Response: $IMPORT_RESPONSE${NC}"
  exit 1
fi

echo -e "${GREEN}${BOLD}✅ Deployment complete${NC}"

# Integration with Surf agent
if command -v :surf &> /dev/null; then
  echo -e "${BLUE}Would you like to use Surf agent to enhance the dashboard? (y/n)${NC}"
  read -r USE_SURF
  if [[ "$USE_SURF" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Launching Surf agent...${NC}"
    :surf --goal "Enhance the Superset dashboard: Optimize visualization layout, add descriptive titles, and improve color scheme for dashboard ID: $DASHBOARD_ID" --backend claude
  fi
fi