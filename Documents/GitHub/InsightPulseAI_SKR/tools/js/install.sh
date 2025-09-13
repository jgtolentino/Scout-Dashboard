#!/bin/bash

# Install script for Pulser CLI
# Installs the CLI globally and sets up configuration

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==========================================${NC}"
echo -e "${YELLOW}       Pulser CLI Installation          ${NC}"
echo -e "${YELLOW}==========================================${NC}"

# Ensure we have npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Create config directory if needed
CONFIG_DIR="$HOME/.pulser"
mkdir -p "$CONFIG_DIR"

# Install the package
echo -e "${BLUE}Installing Pulser CLI...${NC}"
npm install -g

if [ $? -ne 0 ]; then
    echo -e "${RED}Installation failed. Please check the error messages above.${NC}"
    exit 1
fi

# Create default config file if it doesn't exist
CONFIG_FILE="$HOME/.pulser_config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${BLUE}Creating default configuration...${NC}"
    cat > "$CONFIG_FILE" <<EOF
{
  "api": {
    "endpoint": "http://localhost:8000/v1/chat/completions",
    "timeout": 60000
  },
  "model": {
    "name": "deepseekr1-8k",
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
EOF
    echo -e "${GREEN}Created default configuration at $CONFIG_FILE${NC}"
fi

# Create symlink to make it accessible from anywhere
SYMLINK_PATH="/usr/local/bin/pulser"
if [ -f "$SYMLINK_PATH" ]; then
    echo -e "${BLUE}Removing existing symlink...${NC}"
    sudo rm "$SYMLINK_PATH"
fi

echo -e "${BLUE}Creating symlink to make 'pulser' accessible from anywhere...${NC}"
SCRIPT_PATH="$(npm bin -g)/pulser"
sudo ln -s "$SCRIPT_PATH" "$SYMLINK_PATH"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create symlink. You may need to run:${NC}"
    echo -e "  sudo ln -s \"$SCRIPT_PATH\" \"$SYMLINK_PATH\""
    echo -e "${RED}manually.${NC}"
else
    echo -e "${GREEN}Symlink created successfully at $SYMLINK_PATH${NC}"
fi

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${BLUE}You can now run the CLI by typing 'pulser' in your terminal.${NC}"
echo -e "${YELLOW}==========================================${NC}"
echo -e "To get started, try: ${GREEN}pulser --help${NC}"