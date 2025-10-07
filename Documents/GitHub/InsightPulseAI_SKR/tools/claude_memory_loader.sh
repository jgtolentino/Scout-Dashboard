#!/bin/bash
# Script to create and initialize Claude memory context for Pulser workflows

set -e

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  Claude Memory Context Loader for Pulser                  ${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Set paths
PULSER_ROOT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR"
LOG_DIR="$PULSER_ROOT/claude_logs"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/pulser_session.log"
PRIMER_FILE="/Users/tbwa/pulser_claude_primer.txt"

# Function to log messages
log() {
  local message="$1"
  local level="$2"
  local color="$NC"
  
  case "$level" in
    "INFO") color="$BLUE" ;;
    "SUCCESS") color="$GREEN" ;;
    "WARNING") color="$YELLOW" ;;
    "ERROR") color="$RED" ;;
  esac
  
  echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message${NC}"
}

# Check if primer file exists
if [ ! -f "$PRIMER_FILE" ]; then
  log "Claude primer file not found at $PRIMER_FILE" "ERROR"
  exit 1
fi

# Create or update session log
if [ ! -f "$LOG_FILE" ]; then
  log "Creating new Claude session log at $LOG_FILE" "INFO"
  echo "[SESSION START] $(date +'%Y-%m-%d %H:%M:%S')" > "$LOG_FILE"
  echo "[DOCKET] LinkedIn ads system docket initialized" >> "$LOG_FILE"
  echo "[AGENT] claudia: assigned to linkedin_ads_system_update.yaml" >> "$LOG_FILE"
  echo "[AGENT] iggy: assigned to linkedin_campaign_deployment.yaml" >> "$LOG_FILE"
  echo "[TASK] linkedin_ads_system_update.yaml: status=pending" >> "$LOG_FILE"
  echo "[TASK] linkedin_campaign_deployment.yaml: status=pending" >> "$LOG_FILE"
else
  log "Updating existing Claude session log at $LOG_FILE" "INFO"
  echo "[SESSION CONTINUE] $(date +'%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
fi

# Display memory context summary
log "Generating Claude memory context summary..." "INFO"
echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}  Claude Memory Context Ready                              ${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo ""
echo -e "${BLUE}Primer file location:${NC}"
echo -e "$PRIMER_FILE"
echo ""
echo -e "${BLUE}Session log location:${NC}"
echo -e "$LOG_FILE"
echo ""
echo -e "${YELLOW}Instructions:${NC}"
echo -e "1. Copy the content of the primer file"
echo -e "2. Paste it as the first message to Claude in a new session"
echo -e "3. After that, you can issue Pulser commands like:"
echo -e "   - :verify-docket"
echo -e "   - :task \"Start execution based on docket linkedin_ads_system_update\""
echo -e "   - :pulseops"
echo ""

# Display primer file content
echo -e "${YELLOW}Primer file content:${NC}"
echo -e "${BLUE}-------------------------------------------------------------${NC}"
cat "$PRIMER_FILE"
echo -e "${BLUE}-------------------------------------------------------------${NC}"

# Create helper functions for .zshrc or .bashrc
RC_FUNCTIONS=$(cat << 'EOF'
# Pulser helper functions for Claude
pulser-log() {
  echo "[COMMAND] $(date +'%Y-%m-%d %H:%M:%S') $*" >> ~/Documents/GitHub/InsightPulseAI_SKR/claude_logs/pulser_session.log
  echo "$*"
}

alias :task='pulser-log :task'
alias :verify-docket='pulser-log :verify-docket'
alias :pulseops='pulser-log :pulseops'
EOF
)

# Save helper functions to a separate file
FUNCTIONS_FILE="$PULSER_ROOT/tools/pulser_shell_functions.sh"
echo "$RC_FUNCTIONS" > "$FUNCTIONS_FILE"
log "Shell helper functions saved to $FUNCTIONS_FILE" "SUCCESS"
echo -e "${YELLOW}Add these functions to your shell profile:${NC}"
echo -e "${BLUE}source $FUNCTIONS_FILE${NC}"

# Make this script executable
chmod +x "$0"
log "Memory context loader setup complete" "SUCCESS"

exit 0