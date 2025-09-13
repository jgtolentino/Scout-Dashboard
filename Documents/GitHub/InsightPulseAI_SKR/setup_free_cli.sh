#!/bin/bash
#
# setup_free_cli.sh - Set up the 'free' command for global access
#
# This script adds the cli directory to your PATH for easy access to 'free'

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory and repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="${SCRIPT_DIR}/cli"

# Determine the shell config file
if [ -f "${HOME}/.zshrc" ]; then
    SHELL_CONFIG="${HOME}/.zshrc"
    SHELL_NAME="zsh"
elif [ -f "${HOME}/.bash_profile" ]; then
    SHELL_CONFIG="${HOME}/.bash_profile"
    SHELL_NAME="bash"
elif [ -f "${HOME}/.bashrc" ]; then
    SHELL_CONFIG="${HOME}/.bashrc"
    SHELL_NAME="bash"
else
    # Create .zshrc if no config files exist
    SHELL_CONFIG="${HOME}/.zshrc"
    SHELL_NAME="zsh"
    touch "$SHELL_CONFIG"
fi

echo -e "${BLUE}Setting up 'free' command for global access${NC}"
echo -e "${YELLOW}Shell config: ${SHELL_CONFIG}${NC}"

# Check if PATH modification already exists
if grep -q "InsightPulseAI_SKR/cli" "$SHELL_CONFIG"; then
    echo -e "${YELLOW}CLI path already added to ${SHELL_CONFIG}${NC}"
else
    # Add the CLI directory to PATH
    echo "" >> "$SHELL_CONFIG"
    echo "# InsightPulseAI_SKR CLI Tools" >> "$SHELL_CONFIG"
    echo "export PATH=\"${CLI_DIR}:\$PATH\"" >> "$SHELL_CONFIG"
    echo -e "${GREEN}✓ Added CLI directory to PATH in ${SHELL_CONFIG}${NC}"
fi

# Display instructions
echo
echo -e "${GREEN}✓ Setup complete!${NC}"
echo
echo -e "${BLUE}To start using 'free' immediately, run:${NC}"
echo -e "${YELLOW}source ${SHELL_CONFIG}${NC}"
echo
echo -e "${BLUE}After reloading your shell, you can simply type:${NC}"
echo -e "${YELLOW}free${NC}"
echo -e "${BLUE}...to launch the Pulser interactive shell.${NC}"