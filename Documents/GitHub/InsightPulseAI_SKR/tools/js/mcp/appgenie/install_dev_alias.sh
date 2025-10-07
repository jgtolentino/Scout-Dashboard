#!/bin/bash

# AppGenie Installation Script
# This script sets up the 'appgenie' alias in the user's shell profile

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the absolute path to the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Display banner
echo -e "${BLUE}"
echo "    _                  _____            _      "
echo "   / \   _ __  _ __   / ___| ___ _ __  (_) ___ "
echo "  / _ \ | '_ \| '_ \ | |  _ / _ \ '_ \ | |/ _ \\"
echo " / ___ \| |_) | |_) || |_| |  __/ | | || |  __/"
echo "/_/   \_\ .__/| .__/  \____|\___|_| |_|/ |\___|"
echo "        |_|   |_|                    |__/      "
echo -e "${NC}"
echo -e "${GREEN}Installing AppGenie development alias...${NC}"
echo

# Determine shell profile
SHELL_NAME=$(basename "$SHELL")
PROFILE_PATH=""

case $SHELL_NAME in
  bash)
    if [ -f "$HOME/.bash_profile" ]; then
      PROFILE_PATH="$HOME/.bash_profile"
    else
      PROFILE_PATH="$HOME/.bashrc"
    fi
    ;;
  zsh)
    PROFILE_PATH="$HOME/.zshrc"
    ;;
  *)
    echo -e "${RED}Unsupported shell: $SHELL_NAME${NC}"
    echo "Please manually add the alias to your shell profile:"
    echo "  alias appgenie='$SCRIPT_DIR/dev.sh'"
    exit 1
    ;;
esac

echo -e "${BLUE}Detected shell:${NC} $SHELL_NAME"
echo -e "${BLUE}Profile path:${NC} $PROFILE_PATH"

# Check if the alias already exists
if grep -q "alias appgenie=" "$PROFILE_PATH"; then
  echo -e "${YELLOW}Alias 'appgenie' already exists in $PROFILE_PATH${NC}"
  echo -e "Updating it to point to the current location..."
  # Update the existing alias
  sed -i.bak "s|alias appgenie=.*|alias appgenie='$SCRIPT_DIR/dev.sh'|g" "$PROFILE_PATH"
else
  # Add the alias
  echo "" >> "$PROFILE_PATH"
  echo "# AppGenie alias - Added by installer" >> "$PROFILE_PATH"
  echo "alias appgenie='$SCRIPT_DIR/dev.sh'" >> "$PROFILE_PATH"
  echo "alias :appgenie='$SCRIPT_DIR/dev.sh'" >> "$PROFILE_PATH"
  echo "alias :genie='$SCRIPT_DIR/dev.sh'" >> "$PROFILE_PATH"
fi

echo -e "${GREEN}Installation complete!${NC}"
echo "Aliases added to $PROFILE_PATH:"
echo "  - appgenie"
echo "  - :appgenie"
echo "  - :genie"
echo
echo -e "${YELLOW}Please run the following command to activate the alias:${NC}"
echo "  source $PROFILE_PATH"
echo
echo -e "${BLUE}Usage examples:${NC}"
echo "  appgenie init \"Build a habit tracker app\""
echo "  :appgenie edit habit-tracker"
echo "  :genie preview habit-tracker --device=iphone"
echo
echo -e "${GREEN}Happy app building!${NC}"