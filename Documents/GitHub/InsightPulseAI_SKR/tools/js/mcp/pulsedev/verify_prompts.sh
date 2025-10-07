#!/bin/bash
# verify_prompts.sh - Bulk verify prompt activation via REST API
# 
# This script tests all MCP prompts to verify they can be activated via the REST API.

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
API_URL="http://localhost:8000"
TEMP_DIR="$SCRIPT_DIR/logs/verification"
REPORT_FILE="$TEMP_DIR/prompt_verification_$(date +"%Y%m%d_%H%M%S").md"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CURL_TIMEOUT=10

# Create temp directory
mkdir -p "$TEMP_DIR"

echo -e "${BOLD}PulseDev MCP Prompts Verification${NC}"
echo -e "API URL: ${BLUE}$API_URL${NC}"
echo -e "Timestamp: ${BLUE}$(date)${NC}"
echo -e "Report File: ${BLUE}$REPORT_FILE${NC}"
echo

# Initialize report file
cat > "$REPORT_FILE" << EOF
# PulseDev MCP Prompts Verification Report

**Generated:** $(date)  
**Environment:** $(hostname)  
**API URL:** $API_URL

## Verification Results

| Prompt | Status | Response Time | Notes |
|--------|--------|---------------|-------|
EOF

# Function to test a specific prompt
test_prompt() {
  local prompt_name="$1"
  local prompt_alias="$2"
  local response_file="$TEMP_DIR/response_${prompt_name//\//_}.json"
  local start_time=$(date +%s.%N)
  
  echo -e "${YELLOW}Testing prompt:${NC} $prompt_name (alias: $prompt_alias)"
  
  # Try to switch to the prompt
  curl -s -X POST "$API_URL/api/claudia/switch" \
    -H "Content-Type: application/json" \
    -m $CURL_TIMEOUT \
    -d "{\"task_description\": \"Verify prompt activation for $prompt_name\", \"session_id\": \"verification_$TIMESTAMP\"}" \
    > "$response_file"
  
  local end_time=$(date +%s.%N)
  local response_time=$(echo "$end_time - $start_time" | bc)
  
  # Check if the response contains the prompt name
  if grep -q "$prompt_name" "$response_file"; then
    echo -e "${GREEN}✓${NC} Prompt $prompt_name activated successfully"
    echo "| \`$prompt_name\` | ${GREEN}✓ Success${NC} | ${response_time}s | Activated successfully |" >> "$REPORT_FILE"
    return 0
  else
    echo -e "${RED}✗${NC} Failed to activate prompt $prompt_name"
    echo "| \`$prompt_name\` | ${RED}✗ Failed${NC} | ${response_time}s | See error details |" >> "$REPORT_FILE"
    return 1
  fi
}

# Function to run a simple task with a prompt
run_test_task() {
  local prompt_name="$1"
  local task="$2"
  local response_file="$TEMP_DIR/task_${prompt_name//\//_}.json"
  
  echo -e "${YELLOW}Running test task with prompt:${NC} $prompt_name"
  echo -e "${YELLOW}Task:${NC} $task"
  
  # Run the task with the prompt
  curl -s -X POST "$API_URL/api/claudia/task" \
    -H "Content-Type: application/json" \
    -m 30 \
    -d "{\"task_description\": \"$task\", \"prompt_name\": \"$prompt_name\", \"session_id\": \"verification_task_$TIMESTAMP\"}" \
    > "$response_file"
  
  # Extract response snippet
  local snippet=$(grep -o '"response":"[^"]*' "$response_file" | sed 's/"response":"//g' | head -c 100)
  
  echo -e "${BLUE}Response snippet:${NC} ${snippet}..."
  echo
}

# Function to verify the MCP bridge is running
verify_bridge() {
  echo -e "${BOLD}Step 1: Verifying MCP bridge${NC}"
  
  local status_file="$TEMP_DIR/status.json"
  
  # Check bridge status
  curl -s "$API_URL/api/claudia/status" > "$status_file"
  
  if grep -q "claudia_bridge" "$status_file"; then
    echo -e "${GREEN}✓${NC} MCP bridge is running"
    return 0
  else
    echo -e "${RED}✗${NC} MCP bridge is not running"
    echo -e "${YELLOW}Make sure to start the PulseDev server with Claudia integration:${NC}"
    echo -e "${YELLOW}./launch_claudia_integrated.sh${NC}"
    return 1
  fi
}

# Function to get all available prompts
get_all_prompts() {
  echo -e "${BOLD}Step 2: Getting all available prompts${NC}"
  
  local prompts_file="$TEMP_DIR/prompts.json"
  
  # Get all prompts
  curl -s "$API_URL/api/ai/prompts?include_metadata=true" > "$prompts_file"
  
  if [ $? -ne 0 ] || [ ! -s "$prompts_file" ]; then
    echo -e "${RED}✗${NC} Failed to get prompts list"
    return 1
  fi
  
  # Extract prompt names and aliases using jq if available, otherwise use grep
  if command -v jq &> /dev/null; then
    jq -r '.prompts[] | "\(.name)|\(.metadata.aliases[0] // "none")"' "$prompts_file" > "$TEMP_DIR/prompt_list.txt"
  else
    grep -o '"name":"[^"]*"' "$prompts_file" | sed 's/"name":"//g' | sed 's/"//g' > "$TEMP_DIR/prompt_list.txt"
    echo -e "${YELLOW}Note: Install jq for better prompt metadata extraction${NC}"
  fi
  
  local prompt_count=$(wc -l < "$TEMP_DIR/prompt_list.txt" | tr -d ' ')
  echo -e "${GREEN}✓${NC} Found $prompt_count prompts"
  return 0
}

# Function to run test tasks
run_verification_tasks() {
  echo -e "${BOLD}Step 4: Running verification tasks${NC}"
  
  # Define test tasks for specific prompt types
  local test_tasks=(
    "cursor/chat_prompt|Write a function that calculates the Fibonacci sequence in JavaScript."
    "replit/command_runner|List all JavaScript files in the current directory and count the lines of code."
    "vscode/code_assistant|Help me understand how React Context API works."
    "lovable/ux_designer|Design a user-friendly login form for a mobile banking app."
    "gamma/presentation_creator|Create an outline for a presentation on AI prompt engineering."
    "claude/haiku|Provide a concise explanation of how quantum computing works."
    "claude/sonnet|Write a detailed analysis of the impact of AI on software development."
    "claude/opus|Design a complex algorithm for efficient path finding in a large graph."
  )
  
  for task_pair in "${test_tasks[@]}"; do
    IFS="|" read -r prompt_name task <<< "$task_pair"
    run_test_task "$prompt_name" "$task"
  done
}

# Main verification process
main() {
  echo -e "${BOLD}Starting Prompt Verification Process${NC}"
  echo
  
  # Verify the MCP bridge is running
  if ! verify_bridge; then
    echo -e "${RED}Verification aborted due to MCP bridge issues${NC}"
    exit 1
  fi
  echo
  
  # Get all available prompts
  if ! get_all_prompts; then
    echo -e "${RED}Verification aborted due to prompt listing issues${NC}"
    exit 1
  fi
  echo
  
  # Test each prompt
  echo -e "${BOLD}Step 3: Testing prompt activation${NC}"
  local success_count=0
  local failure_count=0
  
  while IFS="|" read -r prompt_name prompt_alias; do
    if test_prompt "$prompt_name" "$prompt_alias"; then
      ((success_count++))
    else
      ((failure_count++))
    fi
    echo
  done < "$TEMP_DIR/prompt_list.txt"
  
  echo -e "${BOLD}Prompt Activation Results:${NC}"
  echo -e "${GREEN}✓${NC} Successfully activated: $success_count prompts"
  if [ $failure_count -gt 0 ]; then
    echo -e "${RED}✗${NC} Failed to activate: $failure_count prompts"
  fi
  echo
  
  # Run verification tasks
  run_verification_tasks
  
  # Add summary to report
  cat >> "$REPORT_FILE" << EOF

## Summary

- **Total Prompts:** $((success_count + failure_count))
- **Successfully Activated:** $success_count
- **Failed to Activate:** $failure_count
- **Verification Date:** $(date)

## System Information

- **OS:** $(uname -s)
- **Hostname:** $(hostname)
- **PulseDev Version:** 1.0.0
- **Verification Script:** verify_prompts.sh
EOF
  
  echo -e "${BOLD}Verification Complete!${NC}"
  echo -e "Report saved to: ${BLUE}$REPORT_FILE${NC}"
  echo -e "To view the report: ${YELLOW}cat $REPORT_FILE${NC}"
}

# Run the main verification process
main