#!/bin/bash
#
# install_pulser.sh - Setup Pulser CLI for easy usage
#
# This script sets up Pulser for convenient command-line usage by:
# 1. Installing required dependencies
# 2. Adding aliases to shell configuration
# 3. Setting up Ollama if needed

VERSION="1.1.0"

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALIASES_FILE="${SCRIPT_DIR}/pulser_aliases.sh"

# Check for shell type
if [ -n "$ZSH_VERSION" ]; then
  SHELL_CONFIG="${HOME}/.zshrc"
  SHELL_TYPE="zsh"
elif [ -n "$BASH_VERSION" ]; then
  SHELL_CONFIG="${HOME}/.bashrc"
  SHELL_TYPE="bash"
else
  # Default to checking for both
  if [ -f "${HOME}/.zshrc" ]; then
    SHELL_CONFIG="${HOME}/.zshrc"
    SHELL_TYPE="zsh"
  elif [ -f "${HOME}/.bashrc" ]; then
    SHELL_CONFIG="${HOME}/.bashrc"
    SHELL_TYPE="bash"
  else
    SHELL_CONFIG="${HOME}/.profile"
    SHELL_TYPE="other"
  fi
fi

# Display banner
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                    Pulser CLI Installer - v${VERSION}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 and try again.${NC}"
    exit 1
fi

# Display current configuration
echo -e "${BLUE}Current Configuration:${NC}"
echo -e "  • Shell type: ${SHELL_TYPE}"
echo -e "  • Shell config: ${SHELL_CONFIG}"
echo -e "  • Python: $(python3 --version 2>&1)"
echo -e "  • Installation directory: ${SCRIPT_DIR}"
echo

# Install required Python packages
echo -e "${BLUE}Installing required Python packages...${NC}"
pip3 install requests rich 
echo -e "${GREEN}✓ Python packages installed${NC}"
echo

# Check for Ollama and install if missing
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Ollama is not installed. Would you like to install it? (y/n)${NC}"
    read -r install_ollama
    if [[ $install_ollama =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Installing Ollama...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install ollama
            else
                echo -e "${YELLOW}Homebrew is not installed. Please install Ollama manually:${NC}"
                echo -e "${YELLOW}Visit: https://ollama.ai/download${NC}"
            fi
        else
            # Linux
            curl -fsSL https://ollama.ai/install.sh | sh
        fi
        
        if command -v ollama &> /dev/null; then
            echo -e "${GREEN}✓ Ollama installed successfully${NC}"
            echo -e "${BLUE}Starting Ollama service...${NC}"
            ollama serve &> /dev/null &
            sleep 2
            echo -e "${GREEN}✓ Ollama service started${NC}"
        else
            echo -e "${RED}Ollama installation failed. Please install manually.${NC}"
        fi
    else
        echo -e "${YELLOW}Skipping Ollama installation.${NC}"
    fi
else
    echo -e "${GREEN}✓ Ollama is already installed: $(ollama --version 2>&1 || echo "unknown version")${NC}"
fi
echo

# Set up shell aliases
echo -e "${BLUE}Setting up shell aliases...${NC}"

# Check if aliases are already set up
if grep -q "source.*pulser_aliases.sh" "$SHELL_CONFIG" 2>/dev/null; then
    echo -e "${GREEN}✓ Pulser aliases are already set up in your shell configuration.${NC}"
else
    # Add source line to shell config
    echo -e "\n# Pulser CLI aliases" >> "$SHELL_CONFIG"
    echo "source \"${ALIASES_FILE}\"" >> "$SHELL_CONFIG"
    echo -e "${GREEN}✓ Added Pulser aliases to ${SHELL_CONFIG}${NC}"
fi

# Source the aliases in the current shell
source "$ALIASES_FILE"
echo -e "${GREEN}✓ Pulser aliases loaded in current shell${NC}"
echo

# Final instructions
echo -e "${BLUE}Installation Complete!${NC}"
echo -e "To use Pulser in new terminal windows, do one of the following:"
echo -e "  1. Restart your terminal"
echo -e "  2. Run: ${YELLOW}source ${SHELL_CONFIG}${NC}"
echo
echo -e "${BLUE}Quick Commands:${NC}"
echo -e "  • ${YELLOW}pulser-free \"What is InsightPulseAI's mission?\"${NC} - Run a query using local Ollama"
echo -e "  • ${YELLOW}pulserc${NC} - Start interactive chat mode"
echo -e "  • ${YELLOW}pulser-search \"topic\"${NC} - Search the SKR database"
echo
echo -e "${GREEN}Enjoy using Pulser CLI!${NC}"