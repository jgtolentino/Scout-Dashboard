#!/bin/bash
# Script to execute LinkedIn ad system updates via Pulser
# Run this script to trigger the Pulser system to process the LinkedIn ad system tasks

set -e

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  LinkedIn Ads System Update Automation via Pulser         ${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Set paths
PULSER_ROOT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR"
TASK_DIR="$PULSER_ROOT/tasks"
LOG_DIR="$PULSER_ROOT/logs"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/linkedin_ads_update_$TIMESTAMP.log"

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
  
  echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message${NC}" | tee -a "$LOG_FILE"
}

# Check if Pulser CLI is available
if ! command -v pulser &> /dev/null; then
  log "Pulser CLI not found. Please ensure it's installed and in your PATH." "ERROR"
  exit 1
fi

# Verify task files exist
if [ ! -f "$TASK_DIR/linkedin_ads_system_update.yaml" ] || [ ! -f "$TASK_DIR/linkedin_campaign_deployment.yaml" ]; then
  log "Task files not found. Please ensure they exist in $TASK_DIR" "ERROR"
  exit 1
fi

# Verify Pulser docket
log "Verifying Pulser docket integrity..." "INFO"
VERIFY_RESULT=$(pulser <<< ":verify-docket" 2>&1)
if [[ $VERIFY_RESULT == *"ERROR"* ]]; then
  log "Docket verification failed: $VERIFY_RESULT" "ERROR"
  exit 1
fi
log "Docket verification successful" "SUCCESS"

# Execute LinkedIn ads system update task
log "Initiating LinkedIn ads system update tasks..." "INFO"
TASK_OUTPUT=$(pulser <<< ":task \"Start execution based on docket linkedin_ads_system_update\"" 2>&1)
echo "$TASK_OUTPUT" >> "$LOG_FILE"

if [[ $TASK_OUTPUT == *"ERROR"* ]] || [[ $TASK_OUTPUT == *"FAILED"* ]]; then
  log "Task execution failed. See log for details." "ERROR"
  exit 1
fi
log "LinkedIn ads system update tasks initiated successfully" "SUCCESS"

# Execute LinkedIn campaign deployment task
log "Initiating LinkedIn campaign deployment tasks..." "INFO"
TASK_OUTPUT=$(pulser <<< ":task \"Start execution based on docket linkedin_campaign_deployment\"" 2>&1)
echo "$TASK_OUTPUT" >> "$LOG_FILE"

if [[ $TASK_OUTPUT == *"ERROR"* ]] || [[ $TASK_OUTPUT == *"FAILED"* ]]; then
  log "Task execution failed. See log for details." "ERROR"
  exit 1
fi
log "LinkedIn campaign deployment tasks initiated successfully" "SUCCESS"

# QA check with Caca
log "Initiating QA validation with Caca..." "INFO"
if [ -f "$PULSER_ROOT/tools/ping_caca.py" ]; then
  QA_OUTPUT=$(python "$PULSER_ROOT/tools/ping_caca.py" --task linkedin_ads_system_update 2>&1)
  echo "$QA_OUTPUT" >> "$LOG_FILE"
  if [[ $QA_OUTPUT == *"PASS"* ]]; then
    log "QA validation passed" "SUCCESS"
  else
    log "QA validation returned warnings. Check log for details." "WARNING"
  fi
else
  log "QA validation script not found. Skipping QA check." "WARNING"
fi

# Log execution in Claudia
log "Logging execution in Claudia..." "INFO"
TIMESTAMP_NOW=$(date +"%Y-%m-%d %H:%M:%S")
echo "$TIMESTAMP_NOW - LinkedIn ads system update initiated" >> "$PULSER_ROOT/claudia_sync.log"
echo "$TIMESTAMP_NOW - LinkedIn campaign deployment initiated" >> "$PULSER_ROOT/claudia_sync.log"
log "Execution logged in Claudia" "SUCCESS"

# Generate status report
log "Generating status report..." "INFO"
if [ -f "$PULSER_ROOT/scripts/notify_claudia.sh" ]; then
  NOTIFY_OUTPUT=$(bash "$PULSER_ROOT/scripts/notify_claudia.sh" --task linkedin_ads_system_update --status started 2>&1)
  echo "$NOTIFY_OUTPUT" >> "$LOG_FILE"
  log "Status report generated and notifications sent" "SUCCESS"
else
  log "Notification script not found. Skipping notifications." "WARNING"
fi

echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}  LinkedIn ads system update tasks initiated successfully  ${NC}"
echo -e "${GREEN}  Log file: $LOG_FILE                                      ${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}1. Monitor task progress using PulseUP dashboard${NC}"
echo -e "${BLUE}2. Check claudia_sync.log for status updates${NC}"
echo -e "${BLUE}3. Review completed tasks in Pulser task manager${NC}"
echo ""

# Make this script executable
chmod +x "$PULSER_ROOT/tools/pulser_run_linkedin_tasks.sh"

exit 0