#!/bin/bash
# Deploy and test the GenAI insights integration
# Usage: ./deploy_insights.sh [--test-only|--deploy-only]

# Set colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Default options
TEST_ONLY=false
DEPLOY_ONLY=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --test-only)
      TEST_ONLY=true
      shift
      ;;
    --deploy-only)
      DEPLOY_ONLY=true
      shift
      ;;
  esac
done

# Header
echo -e "${BLUE}${BOLD}==============================================${NC}"
echo -e "${BLUE}${BOLD}   GenAI Insights Integration Deployment      ${NC}"
echo -e "${BLUE}${BOLD}==============================================${NC}"
echo

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JUICER_DIR="$(dirname "$SCRIPT_DIR")"

# Verify component paths
DASHBOARD_DIR="$JUICER_DIR/dashboards"
NOTEBOOKS_DIR="$JUICER_DIR/notebooks"
PULSER_DIR="$JUICER_DIR/pulser"
TOOLS_DIR="$JUICER_DIR/tools"

# Check if all required directories exist
if [[ ! -d "$DASHBOARD_DIR" || ! -d "$NOTEBOOKS_DIR" || ! -d "$PULSER_DIR" || ! -d "$TOOLS_DIR" ]]; then
  echo -e "${RED}ERROR: Missing required directories.${NC}"
  echo "Expected the following structure:"
  echo "  - $DASHBOARD_DIR"
  echo "  - $NOTEBOOKS_DIR"
  echo "  - $PULSER_DIR"
  echo "  - $TOOLS_DIR"
  exit 1
fi

# Function to run tests
run_tests() {
  echo -e "${BOLD}Running integration tests...${NC}"
  
  # Check if Node.js is installed
  if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed. Please install Node.js to run tests.${NC}"
    exit 1
  fi
  
  # Run the test script
  node "$TOOLS_DIR/test_insights_integration.js"
  TEST_EXIT_CODE=$?
  
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Tests completed successfully.${NC}"
  else
    echo -e "${RED}Tests failed with exit code $TEST_EXIT_CODE${NC}"
    if [ "$DEPLOY_ONLY" = false ]; then
      echo -e "${YELLOW}Deployment aborted due to test failures.${NC}"
      exit $TEST_EXIT_CODE
    fi
  fi
  
  echo
}

# Function to deploy components
deploy_components() {
  echo -e "${BOLD}Deploying GenAI insights components...${NC}"
  
  # Create any necessary directories
  mkdir -p "$JUICER_DIR/output"
  
  # Copy dashboard components to actual dashboard directory
  echo "Deploying dashboard components..."
  if [[ -d "$DASHBOARD_DIR" ]]; then
    cp -f "$DASHBOARD_DIR/insights_dashboard.html" "$JUICER_DIR/../dashboards/" 2>/dev/null || echo -e "${YELLOW}WARNING: Could not copy dashboard HTML.${NC}"
    cp -f "$DASHBOARD_DIR/insights_visualizer.js" "$JUICER_DIR/../dashboards/" 2>/dev/null || echo -e "${YELLOW}WARNING: Could not copy dashboard JS.${NC}"
  else
    echo -e "${YELLOW}WARNING: Dashboard directory not found.${NC}"
  fi
  
  # Make CLI bridge executable
  echo "Setting up CLI bridge..."
  chmod +x "$TOOLS_DIR/insights_cli_bridge.js" 2>/dev/null || echo -e "${YELLOW}WARNING: Could not make CLI bridge executable.${NC}"
  
  # Create CLI shortcut in /usr/local/bin if running with sudo
  if [ "$EUID" -eq 0 ]; then
    echo "Creating CLI shortcut..."
    ln -sf "$TOOLS_DIR/insights_cli_bridge.js" "/usr/local/bin/juicer-insights" 2>/dev/null || echo -e "${YELLOW}WARNING: Could not create CLI shortcut.${NC}"
  else
    echo -e "${YELLOW}NOTE: Run with sudo to create CLI shortcut in /usr/local/bin${NC}"
  fi
  
  # Set up Pulser integration
  echo "Setting up Pulser integration..."
  
  # Create output directory for visualizations
  mkdir -p "$JUICER_DIR/output/insights"
  
  echo -e "${GREEN}Deployment completed.${NC}"
  echo
}

# Function to display integration information
show_integration_info() {
  echo -e "${BOLD}GenAI Insights Integration Information:${NC}"
  echo -e "${BLUE}----------------------------------------${NC}"
  echo -e "${BOLD}Documentation:${NC} $JUICER_DIR/GENAI_INSIGHTS_INTEGRATION.md"
  echo -e "${BOLD}Guide:${NC} $TOOLS_DIR/insights_integration_guide.md"
  echo -e "${BOLD}Dashboard:${NC} $DASHBOARD_DIR/insights_dashboard.html"
  echo -e "${BOLD}CLI Bridge:${NC} $TOOLS_DIR/insights_cli_bridge.js"
  echo
  echo -e "${BOLD}CLI Usage Examples:${NC}"
  echo -e "${YELLOW}  node $TOOLS_DIR/insights_cli_bridge.js generate --days 7 --model claude${NC}"
  echo -e "${YELLOW}  node $TOOLS_DIR/insights_cli_bridge.js show --type brand --brand \"Jollibee\" --limit 5${NC}"
  echo -e "${YELLOW}  node $TOOLS_DIR/insights_cli_bridge.js dashboard --port 9090${NC}"
  echo -e "${YELLOW}  node $TOOLS_DIR/insights_cli_bridge.js visualize --type heatmap --group brand${NC}"
  echo
  echo -e "${BOLD}Integration in Pulser CLI:${NC}"
  echo -e "${YELLOW}  :juicer insights generate --days 7 --model claude${NC}"
  echo -e "${YELLOW}  :juicer insights show --type brand --brand \"Jollibee\" --limit 5${NC}"
  echo -e "${YELLOW}  :juicer dashboard insights_dashboard${NC}"
  echo -e "${YELLOW}  :juicer insights visualize --type heatmap --group brand${NC}"
  echo
}

# Main execution
if [ "$TEST_ONLY" = false ]; then
  deploy_components
fi

if [ "$DEPLOY_ONLY" = false ]; then
  run_tests
fi

show_integration_info

echo -e "${BLUE}${BOLD}==============================================${NC}"
echo -e "${GREEN}${BOLD}   GenAI Insights Integration Complete!      ${NC}"
echo -e "${BLUE}${BOLD}==============================================${NC}"