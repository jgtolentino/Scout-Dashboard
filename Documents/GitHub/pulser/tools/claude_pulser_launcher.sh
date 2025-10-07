#!/bin/bash
# Claude-Compatible Pulser Launcher

# ANSI colors
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
BOLD="\033[1m"
RESET="\033[0m"

# Process command-line arguments
MEMORY_MODE=0
THINK_MODE=0

for arg in "$@"; do
  case $arg in
    --memory)
      MEMORY_MODE=1
      shift
      ;;
    --think)
      THINK_MODE=1
      shift
      ;;
    *)
      # Unknown option
      ;;
  esac
done

echo -e "${BOLD}${BLUE}Claude-Compatible Pulser${RESET}"

# Set environment variables
export PULSER_USE_CLAUDE_CONFIG=true
export PULSER_COMMAND_STYLE=claude

# If memory mode is enabled
if [ $MEMORY_MODE -eq 1 ]; then
  echo -e "${YELLOW}Memory context enabled${RESET}"
  export PULSER_MEMORY_MODE=1
fi

# If think mode is enabled
if [ $THINK_MODE -eq 1 ]; then
  echo -e "${YELLOW}Thinking mode enabled${RESET}"
  export PULSER_THINK_MODE=1
fi

# Launch the Enhanced Terminal UI
cd ~/Documents/GitHub/InsightPulseAI_SKR/tools/brand_mentions_fix/
echo -e "${GREEN}✓ Running Pulser with Claude compatibility${RESET}"
echo -e "${YELLOW}Type /help to see available commands${RESET}"
echo -e "${YELLOW}Use @file.txt to reference files${RESET}"
python3 pulser_shell_enhancement.py
