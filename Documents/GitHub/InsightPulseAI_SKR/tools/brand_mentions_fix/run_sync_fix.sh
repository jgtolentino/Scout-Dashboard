#!/bin/bash
# Claudia Sync Fix Runner
# Identifies and fixes YAML files that are skipped during sync

# ANSI color codes for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Claudia Sync Fix Utility${NC}"
echo "=========================="
echo ""

# Check for dependencies
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required but not found${NC}"
    exit 1
fi

# Check for PyYAML
python3 -c "import yaml" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}PyYAML not found. Installing...${NC}"
    pip install pyyaml
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install PyYAML. Please install manually: pip install pyyaml${NC}"
        exit 1
    fi
    echo -e "${GREEN}PyYAML installed successfully${NC}"
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Find the SKR root directory
SKR_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo -e "${YELLOW}Looking for Claudia sync log...${NC}"

# Try to find the sync log file
SYNC_LOG=""
POSSIBLE_LOGS=(
    "$HOME/claudia_sync.log"
    "$SKR_ROOT/claudia_sync.log"
    "$HOME/.claudia/sync.log"
)

for log in "${POSSIBLE_LOGS[@]}"; do
    if [ -f "$log" ]; then
        SYNC_LOG="$log"
        echo -e "${GREEN}Found sync log: $SYNC_LOG${NC}"
        break
    fi
done

if [ -z "$SYNC_LOG" ]; then
    echo -e "${YELLOW}No sync log found. Will scan for common skipped files.${NC}"
fi

# Run the fixer script
echo -e "${BLUE}Running fix script...${NC}"
if [ -n "$SYNC_LOG" ]; then
    python3 "$SCRIPT_DIR/fix_sync_skips.py" --skr "$SKR_ROOT" --log "$SYNC_LOG"
else
    python3 "$SCRIPT_DIR/fix_sync_skips.py" --skr "$SKR_ROOT"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Fix completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Run Claudia sync again to verify fixed files are syncing"
    echo "2. Check .bak files if you need to restore originals"
    echo ""
    echo -e "For more information, see ${BLUE}README_SYNC_FIX.md${NC}"
else
    echo -e "${RED}Fix process encountered errors. See output above for details.${NC}"
    exit 1
fi