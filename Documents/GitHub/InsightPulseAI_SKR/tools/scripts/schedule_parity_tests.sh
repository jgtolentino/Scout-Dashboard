#!/bin/bash

# schedule_parity_tests.sh
# Script to set up automated Claude parity tests and reporting

# Set text colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$HOME/.pulser/logs"
CONFIG_DIR="$HOME/.pulser/config"
COMPARE_SCRIPT="$TOOLS_DIR/pulser-claude-compare.sh"
JSON_OUTPUT="$LOG_DIR/claude_parity_latest.json"

# Ensure directories exist
mkdir -p "$LOG_DIR"

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}    Claude Parity Test Scheduler    ${NC}"
echo -e "${BLUE}====================================${NC}"
echo

# Verify the compare script exists
if [ ! -f "$COMPARE_SCRIPT" ]; then
  echo -e "${RED}Error: Compare script not found at $COMPARE_SCRIPT${NC}"
  exit 1
fi

# Check if crontab is available
if ! command -v crontab &> /dev/null; then
  echo -e "${RED}Error: crontab command not found. Cannot schedule automated tests.${NC}"
  exit 1
fi

# Function to schedule the tests
schedule_tests() {
  local frequency="$1"
  local cron_schedule=""
  
  case "$frequency" in
    daily)
      cron_schedule="0 0 * * *"
      echo -e "${YELLOW}Scheduling daily tests at midnight${NC}"
      ;;
    weekly)
      cron_schedule="0 0 * * 0"
      echo -e "${YELLOW}Scheduling weekly tests on Sunday at midnight${NC}"
      ;;
    hourly)
      cron_schedule="0 * * * *"
      echo -e "${YELLOW}Scheduling hourly tests${NC}"
      ;;
    *)
      echo -e "${RED}Invalid frequency. Use daily, weekly, or hourly.${NC}"
      exit 1
      ;;
  esac
  
  # Create the cron job command
  local cron_cmd="$cron_schedule $COMPARE_SCRIPT > $LOG_DIR/claude_parity_\$(date +\\%Y\\%m\\%d_\\%H\\%M\\%S).log && $SCRIPT_DIR/generate_parity_json.sh"
  
  # Check if cron job already exists
  if crontab -l 2>/dev/null | grep -q "$COMPARE_SCRIPT"; then
    echo -e "${YELLOW}Parity test cron job already exists. Updating...${NC}"
    (crontab -l 2>/dev/null | grep -v "$COMPARE_SCRIPT"; echo "$cron_cmd") | crontab -
  else
    echo -e "${YELLOW}Adding new parity test cron job...${NC}"
    (crontab -l 2>/dev/null; echo "$cron_cmd") | crontab -
  fi
  
  echo -e "${GREEN}Parity tests scheduled successfully with $frequency frequency.${NC}"
}

# Function to create a script that will generate JSON output
create_json_generator() {
  local json_script="$SCRIPT_DIR/generate_parity_json.sh"
  
  cat > "$json_script" << 'EOF'
#!/bin/bash

# generate_parity_json.sh
# Convert the latest parity test results to JSON for dashboard integration

LOG_DIR="$HOME/.pulser/logs"
CONFIG_DIR="$HOME/.pulser/config"
JSON_OUTPUT="$LOG_DIR/claude_parity_latest.json"
MATRIX_FILE="$CONFIG_DIR/claude_parity_matrix.yaml"
LATEST_LOG=$(ls -t "$LOG_DIR"/claude_parity_*.log | head -n1)

if [ ! -f "$LATEST_LOG" ]; then
  echo "Error: No parity test logs found"
  exit 1
fi

# Extract metrics from the latest log
PASS_COUNT=$(grep -c "✅" "$LATEST_LOG")
PARTIAL_COUNT=$(grep -c "⚠️" "$LATEST_LOG")
FAIL_COUNT=$(grep -c "❌" "$LATEST_LOG")
TOTAL=$((PASS_COUNT + PARTIAL_COUNT + FAIL_COUNT))
PARITY_SCORE=$((PASS_COUNT * 100 / TOTAL))

# Create JSON output
cat > "$JSON_OUTPUT" << JSONEOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "test_log": "$(basename "$LATEST_LOG")",
  "metrics": {
    "pass_count": $PASS_COUNT,
    "partial_count": $PARTIAL_COUNT,
    "fail_count": $FAIL_COUNT,
    "total_features": $TOTAL,
    "parity_score": $PARITY_SCORE
  },
  "status": {
    "is_improved": $([ $PARITY_SCORE -gt 70 ] && echo "true" || echo "false"),
    "goal_reached": $([ $PARITY_SCORE -ge 95 ] && echo "true" || echo "false") 
  },
  "features": {
JSONEOF

# Parse log for feature details
grep -E "✅|⚠️|❌" "$LATEST_LOG" | while IFS= read -r line; do
  # Extract feature name and status
  if [[ $line =~ (✅|⚠️|❌)\ +(.*) ]]; then
    feature="${BASH_REMATCH[2]}"
    if [[ $line == *"✅"* ]]; then
      status="pass"
    elif [[ $line == *"⚠️"* ]]; then
      status="partial" 
    else
      status="fail"
    fi
    
    # Add comma if not the first entry
    if [ "$first_entry" = "false" ]; then
      echo "," >> "$JSON_OUTPUT"
    else
      first_entry="false"
    fi
    
    # Write feature entry
    cat >> "$JSON_OUTPUT" << FEATUREEOF
    "$feature": {
      "status": "$status",
      "last_checked": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    }
FEATUREEOF
  fi
done

# Close the JSON file
cat >> "$JSON_OUTPUT" << JSONEOF
  }
}
JSONEOF

echo "JSON output generated at $JSON_OUTPUT"

# If Kalaw registry exists, copy the JSON there too
KALAW_DIR="$CONFIG_DIR/kalaw_registry"
if [ -d "$KALAW_DIR" ]; then
  cp "$JSON_OUTPUT" "$KALAW_DIR/claude_parity_latest.json"
  echo "JSON also copied to Kalaw registry"
fi
EOF

  chmod +x "$json_script"
  echo -e "${GREEN}JSON generator script created at $json_script${NC}"
}

# Function to run a test immediately
run_test_now() {
  echo -e "${YELLOW}Running parity test now...${NC}"
  "$COMPARE_SCRIPT" > "$LOG_DIR/claude_parity_$(date +%Y%m%d_%H%M%S).log"
  
  if [ -f "$SCRIPT_DIR/generate_parity_json.sh" ]; then
    echo -e "${YELLOW}Generating JSON output...${NC}"
    "$SCRIPT_DIR/generate_parity_json.sh"
  fi
  
  echo -e "${GREEN}Test completed. See logs in $LOG_DIR${NC}"
}

# Create the JSON generator script
create_json_generator

# Parse command line arguments
if [ $# -eq 0 ]; then
  # Default to daily if no arguments
  schedule_tests "daily"
elif [ "$1" == "run" ]; then
  run_test_now
else
  schedule_tests "$1"
fi

echo
echo -e "${BLUE}Claude Parity Test Configuration${NC}"
echo -e "${BLUE}=================================${NC}"
echo -e "Compare Script: ${GREEN}$COMPARE_SCRIPT${NC}"
echo -e "Log Directory:  ${GREEN}$LOG_DIR${NC}"
echo -e "JSON Output:    ${GREEN}$JSON_OUTPUT${NC}"
echo
echo -e "${YELLOW}Use 'crontab -l' to verify the scheduled tests${NC}"
echo -e "${YELLOW}Use '$0 run' to run a test immediately${NC}"
echo