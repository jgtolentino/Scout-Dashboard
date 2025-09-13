#!/bin/bash
# Dashboard Surf - Integrates Superset dashboard tools with Surf agent

set -e

# ANSI color codes
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BOLD="\033[1m"
NC="\033[0m" # No Color

# Dashboard sources
DASHBOARD_DIR="/Users/tbwa/Downloads/superset"

echo -e "${BLUE}${BOLD}🏄 Dashboard Surf${NC}"
echo -e "Integrates Superset dashboard tools with Surf agent"
echo

# Check if dashboard files exist
if [ ! -d "$DASHBOARD_DIR" ]; then
  echo -e "${RED}Error: Dashboard directory not found: $DASHBOARD_DIR${NC}"
  exit 1
fi

# Count JSON files
JSON_COUNT=$(find "$DASHBOARD_DIR" -name "*.json" -maxdepth 1 -type f | wc -l)
if [ "$JSON_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}No dashboard JSON files found. Running fix script first...${NC}"
  # Run fix script
  if [ -f "$DASHBOARD_DIR/fix_dashboard_export.sh" ]; then
    bash "$DASHBOARD_DIR/fix_dashboard_export.sh"
  else
    echo -e "${RED}Error: fix_dashboard_export.sh not found${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}Found $JSON_COUNT dashboard JSON files${NC}"
fi

# Menu
echo
echo -e "${BOLD}Select an action:${NC}"
echo -e "1) Package dashboard as Docker image"
echo -e "2) Deploy dashboard to Superset server"
echo -e "3) Use Surf agent to enhance dashboard"
echo -e "4) Exit"
echo
read -p "Enter choice [1-4]: " CHOICE

case $CHOICE in
  1)
    echo -e "${BLUE}Packaging dashboard as Docker image...${NC}"
    bash /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/superset_docker_pack.sh --dir "$DASHBOARD_DIR"
    ;;
  2)
    echo -e "${BLUE}Deploy dashboard to Superset server...${NC}"
    echo -e "${YELLOW}Enter Superset server URL (e.g., http://localhost:8088):${NC}"
    read -p "> " SERVER_URL
    
    # Find first JSON file
    FIRST_JSON=$(find "$DASHBOARD_DIR" -name "*.json" -maxdepth 1 -type f | head -1)
    if [ -z "$FIRST_JSON" ]; then
      echo -e "${RED}Error: No JSON file found${NC}"
      exit 1
    fi
    
    bash /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/superset_dashboard_deploy.sh --host "$SERVER_URL" --json "$FIRST_JSON"
    ;;
  3)
    echo -e "${BLUE}Using Surf agent to enhance dashboard...${NC}"
    
    # Find all JSON files
    JSON_FILES=($(find "$DASHBOARD_DIR" -name "*.json" -maxdepth 1 -type f))
    
    # Check if Surf command exists
    if command -v :surf &> /dev/null; then
      JSON_NAMES=""
      for f in "${JSON_FILES[@]}"; do
        JSON_NAMES="$JSON_NAMES $(basename "$f")"
      done
      
      # Run Surf agent
      :surf --goal "Enhance and optimize Superset dashboard files: $JSON_NAMES in directory $DASHBOARD_DIR. Improve visualization layout, add descriptive titles, and enhance color schemes for better readability and user experience. Ensure all JSON is valid and well-structured." --backend claude
    else
      echo -e "${RED}Error: Surf command not found${NC}"
      exit 1
    fi
    ;;
  4)
    echo -e "${GREEN}Exiting...${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac

echo -e "${GREEN}${BOLD}✅ Operation completed!${NC}"