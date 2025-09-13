#!/bin/bash
# Juicer Installation Script
# Installs all necessary dependencies for Juicer components

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}Juicer Installation Script${RESET}"
echo -e "This script will set up the Juicer AI-BI analytics integration for InsightPulseAI"
echo -e "-------------------------------------------------------------------"

# Check if we're in the right directory
if [[ ! -d "$(pwd)/juicer-stack" ]]; then
  echo -e "${RED}Error: juicer-stack directory not found${RESET}"
  echo -e "Please run this script from the tools/js directory"
  exit 1
fi

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${RESET}"
mkdir -p ~/.pulser
mkdir -p output/sketches
mkdir -p logs

# Install Node.js dependencies
echo -e "${BLUE}Installing Node.js dependencies...${RESET}"
npm install node-fetch@3.3.2 express body-parser morgan

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
  echo -e "${YELLOW}Warning: Python 3 not found. Some features may not work.${RESET}"
  echo -e "Please install Python 3 to use the Juicer CLI"
else
  echo -e "${BLUE}Installing Python CLI dependencies...${RESET}"
  pip3 install -r juicer-stack/cli/requirements.txt
  
  # Make the CLI script executable
  chmod +x juicer-stack/cli/juicer_cli.py
  
  # Create a symlink to make it accessible from anywhere
  mkdir -p ~/bin
  ln -sf "$(pwd)/juicer-stack/cli/juicer_cli.py" ~/bin/juicer
  echo -e "${GREEN}Added 'juicer' command to ~/bin/${RESET}"
  
  # Add to PATH if not already there
  if [[ ! "$PATH" == *"$HOME/bin"* ]]; then
    echo -e "${YELLOW}Consider adding ~/bin to your PATH:${RESET}"
    echo "export PATH=\$PATH:~/bin"
  fi
fi

# Create default configuration
echo -e "${BLUE}Creating default configuration...${RESET}"
cat > ~/.pulser/juicer_config.json << EOF
{
  "workspace_url": "https://adb-123456789.0.azuredatabricks.net",
  "api_token": "",
  "default_cluster_id": "",
  "notebooks_path": "/juicer",
  "local_api_url": "http://localhost:3001/api"
}
EOF

echo -e "${GREEN}Configuration created at ~/.pulser/juicer_config.json${RESET}"
echo -e "${YELLOW}Please edit this file to add your Databricks workspace URL and API token${RESET}"

# Copy Claudia/Maya hook
echo -e "${BLUE}Setting up Pulser integration...${RESET}"
mkdir -p ~/.pulser/hooks
cp juicer-stack/pulser/juicer_hook.yaml ~/.pulser/hooks/

# Finish
echo -e "${GREEN}${BOLD}Installation complete!${RESET}"
echo -e "${BLUE}To get started:${RESET}"
echo -e "1. Run the server:    ${YELLOW}node router/index.js${RESET}"
echo -e "2. Use the CLI:       ${YELLOW}juicer query \"Show brand mentions for last 7 days\"${RESET}"
echo -e "3. View the dashboard: ${YELLOW}open juicer-stack/dashboards/juicer_dash_shell.html${RESET}"
echo -e "4. Debug issues:      ${YELLOW}see juicer-stack/DEBUGGING.md${RESET}"
echo -e ""
echo -e "For more information, see the README.md file in the juicer-stack directory"