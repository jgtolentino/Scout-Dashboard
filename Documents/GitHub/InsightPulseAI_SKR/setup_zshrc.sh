#!/bin/bash
#
# setup_zshrc.sh - Add Pulser aliases to ~/.zshrc
#
# This script adds the Pulser aliases to your ~/.zshrc file
# so they're available in every terminal session.

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALIASES_FILE="${SCRIPT_DIR}/pulser_aliases.sh"
ZSHRC_FILE="${HOME}/.zshrc"

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up Pulser aliases in ~/.zshrc${NC}"

# Check if .zshrc exists
if [ ! -f "$ZSHRC_FILE" ]; then
    echo -e "${YELLOW}~/.zshrc doesn't exist. Creating it...${NC}"
    touch "$ZSHRC_FILE"
fi

# Check if aliases are already in .zshrc
if grep -q "source.*pulser_aliases.sh" "$ZSHRC_FILE"; then
    echo -e "${YELLOW}Pulser aliases are already in ~/.zshrc${NC}"
else
    # Add source line to .zshrc
    echo -e "\n# Pulser CLI aliases" >> "$ZSHRC_FILE"
    echo "source \"${ALIASES_FILE}\"" >> "$ZSHRC_FILE"
    echo -e "${GREEN}✓ Added Pulser aliases to ~/.zshrc${NC}"
fi

# Source the .zshrc in the current shell
echo -e "${BLUE}Sourcing ~/.zshrc...${NC}"
source "$ZSHRC_FILE"

echo -e "${GREEN}✓ Done! Pulser aliases are now available.${NC}"
echo 
echo -e "Try running these commands:"
echo -e "  ${YELLOW}pulser-free \"What is InsightPulseAI?\"${NC}"
echo -e "  ${YELLOW}pulser-models${NC}"
echo
echo -e "${BLUE}The aliases will be available in all new terminal windows.${NC}"