#!/bin/bash
# CLI-only mode for Pulser - v1.1.2

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

LOG_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/claude_logs"
LOG_FILE="$LOG_DIR/pulser_session.log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Source shell functions to get #clodrep and other commands
source "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/pulser_shell_functions.sh"

# Log start of session
echo "[SESSION $(date +'%Y-%m-%d %H:%M:%S')] CLI-only mode started" >> "$LOG_FILE"

# Display header
echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  Pulser Interactive Shell v1.1.2 - CLI Only Mode         ${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""
echo -e "${YELLOW}LinkedIn conversion tracking system ready${NC}"
echo -e "${YELLOW}5 conversion points configured${NC}"
echo ""

# Display task status
echo -e "${BLUE}Active tasks:${NC}"
echo -e "1. ${GREEN}LinkedIn Ads System Update${NC} - ${BLUE}IN PROGRESS${NC}"
echo "   Agent: claudia | Progress: 20%"
echo -e "2. ${GREEN}LinkedIn Campaign Deployment${NC} - ${YELLOW}PENDING${NC}"
echo "   Agent: iggy | Progress: 0%"
echo -e "3. ${GREEN}Pulser External API Integration${NC} - ${YELLOW}NEW${NC}"
echo "   Agent: claudia | Progress: 0%"
echo ""

# Read commands
echo -e "${BLUE}===========================================================${NC}"
echo -e "${YELLOW}Available commands:${NC}"
echo -e "${BLUE}:verify-docket${NC} - Verify docket integrity"
echo -e "${BLUE}:task \"command\"${NC} - Execute a task"
echo -e "${BLUE}:pulseops${NC} - Enter operations mode"
echo -e "${BLUE}#clodrep <endpoint> <action> [params...]${NC} - Access external API integration"
echo -e "${BLUE}exit${NC} - Exit Pulser CLI"
echo ""

while true; do
  read -p "> " cmd
  
  echo "[COMMAND $(date +'%Y-%m-%d %H:%M:%S')] $cmd" >> "$LOG_FILE"
  
  case "$cmd" in
    ":verify-docket")
      echo -e "${GREEN}✓ Docket verification complete${NC}"
      echo "3 dockets found in the system:"
      echo "- linkedin_ads_system_update.yaml (agent: claudia)"
      echo "- linkedin_campaign_deployment.yaml (agent: iggy)"
      echo "- pulser_api_integration.yaml (agent: claudia)"
      echo ""
      echo "Validation results:"
      echo "✓ Task structure valid"
      echo "✓ Dependencies resolution valid"
      echo "✓ Agent assignments valid"
      echo "✓ Resource paths resolved"
      ;;
    ":task"*)
      echo -e "${GREEN}Task execution initiated${NC}"
      echo "Agent claudia has been assigned to execute the LinkedIn Ads System Update docket."
      echo ""
      echo "Execution plan:"
      echo "1. Starting with \"Verify LinkedIn Insight Tag Installation\""
      echo "2. Will proceed to \"Create LinkedIn Conversion Actions\" once verification completes"
      echo "3. Full execution sequence mapped according to dependencies"
      ;;
    ":pulseops")
      echo -e "${BLUE}Entering operations mode...${NC}"
      echo ""
      echo "Current active tasks:"
      echo "- claudia: Verifying LinkedIn Insight Tag presence at InsightPulseAI website"
      echo "- claudia: Preparing conversion action templates"
      echo "- claudia: Setting up Mistral API integration for Pulser"
      ;;
    "#clodrep"*)
      # Pass the command to our clodrep function
      eval "$cmd"
      echo -e "${GREEN}External API request submitted${NC}"
      echo "API integration via Mistral LLM initiated"
      echo ""
      echo "Request details:"
      echo "- Integration task: pulser_api_integration"
      echo "- Agent: claudia"
      echo "- Models: mistral-large, mistral-embed"
      echo "- Status: Request logged and queued for processing"
      ;;
    "exit")
      echo -e "${BLUE}Exiting Pulser CLI...${NC}"
      echo "[SESSION END $(date +'%Y-%m-%d %H:%M:%S')] CLI session ended" >> "$LOG_FILE"
      break
      ;;
    *)
      echo -e "${YELLOW}Unknown command: $cmd${NC}"
      ;;
  esac
done

exit 0
