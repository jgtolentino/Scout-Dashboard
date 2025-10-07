#!/bin/bash
# Installer for Pulser Shell enhancements

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Pulser Shell Enhancement Installer${NC}"
echo "==============================="
echo ""

# Check if the user has a Pulser installation
echo -e "${YELLOW}Checking for Pulser installation...${NC}"

# This is a placeholder - in a real installation you would verify the actual paths
# and confirm Pulser CLI is installed
PULSER_DIR="$HOME/pulser"
if [ ! -d "$PULSER_DIR" ]; then
    # If not found in the default location, let the user specify
    echo -e "${RED}Pulser installation not found in $PULSER_DIR${NC}"
    echo -e "Please specify your Pulser installation directory:"
    read -p "> " PULSER_DIR
    
    if [ ! -d "$PULSER_DIR" ]; then
        echo -e "${RED}Directory not found. Create it? (y/n)${NC}"
        read -p "> " CREATE_DIR
        if [[ $CREATE_DIR == "y" || $CREATE_DIR == "Y" ]]; then
            mkdir -p "$PULSER_DIR"
            echo -e "${GREEN}Created directory: $PULSER_DIR${NC}"
        else
            echo -e "${RED}Installation cancelled.${NC}"
            exit 1
        fi
    fi
fi

# Copy the script and documentation to the Pulser directory
echo -e "${YELLOW}Installing enhancement files...${NC}"

# Get the path to the current script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy the enhancement files
cp "$SCRIPT_DIR/pulser_shell_enhancement.py" "$PULSER_DIR/"
cp "$SCRIPT_DIR/README_PULSER.md" "$PULSER_DIR/"

echo -e "${GREEN}Files copied to $PULSER_DIR${NC}"

# Make the script executable
chmod +x "$PULSER_DIR/pulser_shell_enhancement.py"

# Create a symlink or alias for easy access
echo -e "${YELLOW}Setting up command...${NC}"

# For bash users, add an alias to .bashrc
if [ -f "$HOME/.bashrc" ]; then
    if ! grep -q "alias pulser-enhanced" "$HOME/.bashrc"; then
        echo "# Pulser enhanced shell alias" >> "$HOME/.bashrc"
        echo "alias pulser-enhanced='$PULSER_DIR/pulser_shell_enhancement.py'" >> "$HOME/.bashrc"
        echo -e "${GREEN}Added alias to .bashrc${NC}"
        echo "Run 'source ~/.bashrc' to activate the alias in your current shell"
    else
        echo -e "${BLUE}Alias already exists in .bashrc${NC}"
    fi
fi

# For zsh users, add an alias to .zshrc
if [ -f "$HOME/.zshrc" ]; then
    if ! grep -q "alias pulser-enhanced" "$HOME/.zshrc"; then
        echo "# Pulser enhanced shell alias" >> "$HOME/.zshrc"
        echo "alias pulser-enhanced='$PULSER_DIR/pulser_shell_enhancement.py'" >> "$HOME/.zshrc"
        echo -e "${GREEN}Added alias to .zshrc${NC}"
        echo "Run 'source ~/.zshrc' to activate the alias in your current shell"
    else
        echo -e "${BLUE}Alias already exists in .zshrc${NC}"
    fi
fi

# Optional: Create a symlink in /usr/local/bin if the user has permission
if [ -d "/usr/local/bin" ] && [ -w "/usr/local/bin" ]; then
    echo -e "${YELLOW}Do you want to create a system-wide command? (y/n)${NC}"
    read -p "> " CREATE_SYSTEM
    if [[ $CREATE_SYSTEM == "y" || $CREATE_SYSTEM == "Y" ]]; then
        ln -sf "$PULSER_DIR/pulser_shell_enhancement.py" "/usr/local/bin/pulser-enhanced"
        echo -e "${GREEN}Created system-wide command: pulser-enhanced${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo -e "${BLUE}Usage:${NC}"
echo "1. Run with: pulser-enhanced"
echo "2. Type :help within the shell for command reference"
echo ""
echo -e "${YELLOW}See $PULSER_DIR/README_PULSER.md for full documentation${NC}"