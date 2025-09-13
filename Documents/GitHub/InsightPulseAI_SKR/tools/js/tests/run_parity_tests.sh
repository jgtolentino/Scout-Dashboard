#!/bin/bash

# run_parity_tests.sh
# Runs the Claude CLI parity tests with clear formatting

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Path to banner script
BANNER_SCRIPT="$(dirname "$0")/../display_banner.sh"

# Clear the terminal
clear

# Display banner
if [[ -x "$BANNER_SCRIPT" ]]; then
  "$BANNER_SCRIPT"
else
  # Print header (fallback if banner script not found)
  echo -e "${CYAN}=====================================================${NC}"
  echo -e "${BOLD}          CLAUDE CLI PARITY TEST RUNNER${NC}"
  echo -e "${CYAN}=====================================================${NC}"
fi

echo ""
echo -e "${YELLOW}Starting test run for Claude CLI parity features...${NC}"
echo ""

# Execute the tests
NODE_ENV=test node $(dirname "$0")/run_tests.js

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}${BOLD}Parity tests completed successfully!${NC}"
  echo -e "${CYAN}=====================================================${NC}"
  echo -e "${GREEN}All parity features have been implemented correctly.${NC}"
  echo -e "${CYAN}=====================================================${NC}"
else
  echo -e "${RED}${BOLD}Parity tests failed!${NC}"
  echo -e "${CYAN}=====================================================${NC}"
  echo -e "${RED}Some parity features may not be implemented correctly.${NC}"
  echo -e "${CYAN}=====================================================${NC}"
fi

exit $EXIT_CODE