#!/bin/bash
# QA Framework Runner Script
# This script provides an easy way to run various QA tests and utilities

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
  echo -e "${BLUE}Scout Dashboard QA Framework${NC}"
  echo -e "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  test               Run all tests"
  echo "  test:visual        Run visual parity tests"
  echo "  test:behavior      Run behavior parity tests"
  echo "  test:accessibility Run accessibility tests"
  echo "  test:performance   Run performance tests"
  echo "  capture-baselines  Capture baseline images for comparison"
  echo "  create-real-baselines Create real baseline images from current dashboards"
  echo "  baseline:update      Update specific baselines for PR changes"
  echo "  convert-baselines    Convert SVG baselines to PNG format"
  echo "  generate-mock-pngs    Generate mock PNG files for CI testing"
  echo "  debug              Debug CI environment setup"
  echo "  verify             Verify QA framework setup"
  echo "  deploy             Verify, align, and deploy the QA framework"
  echo "  percy              Run Percy visual review tests"
  echo "  playwright         Run Playwright tests with tracing"
  echo "  notify             Send test results to notification channels"
  echo "  help               Show this help message"
  echo ""
  echo -e "Examples:"
  echo -e "  $0 test"
  echo -e "  $0 test:visual"
  echo -e "  $0 deploy"
}

# If no arguments, show usage
if [ $# -eq 0 ]; then
  show_usage
  exit 0
fi

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Parse command
command="$1"

case "$command" in
  test)
    echo -e "${YELLOW}Running all tests...${NC}"
    npm test
    ;;
  test:visual)
    echo -e "${YELLOW}Running visual parity tests...${NC}"
    npm run test:visual
    ;;
  test:behavior)
    echo -e "${YELLOW}Running behavior parity tests...${NC}"
    npm run test:behavior
    ;;
  test:accessibility)
    echo -e "${YELLOW}Running accessibility tests...${NC}"
    npm run test:accessibility
    ;;
  test:performance)
    echo -e "${YELLOW}Running performance tests...${NC}"
    npm run test:performance
    ;;
  capture-baselines)
    echo -e "${YELLOW}Capturing baseline images...${NC}"
    npm run capture-baselines
    ;;
  create-real-baselines)
    echo -e "${YELLOW}Creating real baseline images from current dashboards...${NC}"
    npm run create-real-baselines
    ;;
  baseline:update)
    echo -e "${YELLOW}Updating baselines for visual changes...${NC}"
    npm run baseline:update
    ;;
  convert-baselines)
    echo -e "${YELLOW}Converting SVG baselines to PNG format...${NC}"
    npm run convert-baselines
    ;;
  generate-mock-pngs)
    echo -e "${YELLOW}Generating mock PNG files for CI testing...${NC}"
    npm run generate-mock-pngs
    ;;
  debug)
    echo -e "${YELLOW}Debugging CI environment setup...${NC}"
    ./debug_ci_setup.sh
    ;;
  verify)
    echo -e "${YELLOW}Verifying QA framework setup...${NC}"
    npm run test:verify
    ;;
  deploy)
    echo -e "${YELLOW}Verifying, aligning, and deploying the QA framework...${NC}"
    ./verify_deploy.sh
    ;;
  percy)
    echo -e "${YELLOW}Running Percy visual review tests...${NC}"
    echo -e "${YELLOW}Note: This requires Percy to be configured with an API token${NC}"
    if [ -f "utils/percy_capture.js" ]; then
      npx percy exec -- node utils/percy_capture.js
    else
      echo -e "${RED}Percy capture script not found. Please create utils/percy_capture.js first.${NC}"
      echo -e "${YELLOW}See VISUAL_REVIEW_INTEGRATION.md for details.${NC}"
      exit 1
    fi
    ;;
  playwright)
    echo -e "${YELLOW}Running Playwright tests with tracing...${NC}"
    if [ -f "playwright.config.js" ]; then
      npx playwright test
      echo -e "${GREEN}Traces saved to reports/traces/${NC}"
      echo -e "${YELLOW}To view traces, run: npx playwright show-trace reports/traces/*.zip${NC}"
    else
      echo -e "${RED}Playwright config not found. Please create playwright.config.js first.${NC}"
      echo -e "${YELLOW}See VISUAL_REVIEW_INTEGRATION.md for details.${NC}"
      exit 1
    fi
    ;;
  notify)
    echo -e "${YELLOW}Sending test results to notification channels...${NC}"
    echo -e "${YELLOW}Note: This requires notification channels to be configured${NC}"
    echo -e "${YELLOW}See NOTIFICATIONS.md for details.${NC}"
    node utils/send_notifications.js 2>/dev/null || {
      echo -e "${RED}Notification script not found or failed to run.${NC}"
      echo -e "${YELLOW}Please create utils/send_notifications.js first.${NC}"
      exit 1
    }
    ;;
  help)
    show_usage
    ;;
  *)
    echo -e "${RED}Unknown command: $command${NC}"
    show_usage
    exit 1
    ;;
esac