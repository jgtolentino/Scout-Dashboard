#!/bin/bash
# Install Real Pulser CLI with API Integration

# Text formatting
BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

# Banner
echo -e "${BOLD}${CYAN}"
cat << "EOF"
   ___         __                  ___   __    ____
  / _ \ __ __ / /  ___ ___  ____  / _ \ / /   /  _/
 / ___// // // _ \(_-</ -_)/ __/ / // // /__ _/ /  
/_/    \_,_//_.__//___/\__//_/   /____//____//___/  
EOF
echo -e "${RESET}"
echo -e "${BOLD}${CYAN}Real Pulser CLI Installation with API Integration${RESET}\n"

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${RESET}"
mkdir -p ~/.pulser
mkdir -p ~/.pulser/bin
mkdir -p ~/.pulser/config
mkdir -p ~/.pulser/history
mkdir -p ~/.pulser/temp
mkdir -p ~/.pulser/scripts
mkdir -p ~/.pulser/docs

# Copy core files
echo -e "${YELLOW}Installing core files...${RESET}"
cp ~/pulser_input_handler_debranded.js ~/.pulser/bin/pulser_input_handler.js
cp ~/pulser_api_connector.js ~/.pulser/bin/pulser_api_connector.js
cp ~/pulser_cli_real.js ~/.pulser/bin/pulser_cli.js
cp ~/package.json ~/.pulser/
cp ~/demo_paste_handling.js ~/.pulser/scripts/

# Make scripts executable
chmod +x ~/.pulser/bin/pulser_cli.js
chmod +x ~/.pulser/scripts/demo_paste_handling.js

# Create shell script wrapper
echo -e "${YELLOW}Creating shell wrapper...${RESET}"
cat > ~/.pulser/bin/pulser << EOF
#!/bin/bash
# Pulser CLI Wrapper

# Set environment variables
export PULSER_CLI_HOME=~/.pulser
export PULSER_DARK_MODE=1
export PULSER_RICH_UI=1

# Run the CLI
node \$PULSER_CLI_HOME/bin/pulser_cli.js "\$@"
EOF

# Make wrapper executable
chmod +x ~/.pulser/bin/pulser

# Create symlinks
echo -e "${YELLOW}Creating symlinks...${RESET}"
if [ -w /usr/local/bin ]; then
  ln -sf ~/.pulser/bin/pulser /usr/local/bin/pulser
  ln -sf ~/.pulser/scripts/demo_paste_handling.js /usr/local/bin/pulser-demo
else
  echo -e "${YELLOW}Adding to PATH in shell config...${RESET}"
  # Determine shell
  SHELL_NAME=$(basename "$SHELL")
  
  if [ "$SHELL_NAME" = "zsh" ]; then
    CONFIG_FILE=~/.zshrc
  elif [ "$SHELL_NAME" = "bash" ]; then
    CONFIG_FILE=~/.bashrc
  else
    echo -e "${RED}Unsupported shell: $SHELL_NAME${RESET}"
    echo -e "${YELLOW}Please add the following to your shell config manually:${RESET}"
    echo 'export PATH="$HOME/.pulser/bin:$PATH"'
    exit 1
  fi
  
  # Add to PATH 
  if ! grep -q "pulser/bin" "$CONFIG_FILE"; then
    echo '' >> "$CONFIG_FILE"
    echo '# Pulser CLI' >> "$CONFIG_FILE"
    echo 'export PATH="$HOME/.pulser/bin:$PATH"' >> "$CONFIG_FILE"
    echo 'alias pulser-demo="$HOME/.pulser/scripts/demo_paste_handling.js"' >> "$CONFIG_FILE"
  fi
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${RESET}"
cd ~/.pulser && npm install ora log-update boxen chalk

# Create API keys directory structure
echo -e "${YELLOW}Setting up API keys structure...${RESET}"
mkdir -p ~/.anthropic
mkdir -p ~/.openai
mkdir -p ~/.pulser/config

# Create API keys template file
cat > ~/.pulser/config/api_keys.json.template << EOF
{
  "anthropic": "YOUR_ANTHROPIC_API_KEY_HERE",
  "openai": "YOUR_OPENAI_API_KEY_HERE"
}
EOF

# Check for existing API keys
if [ -f ~/.pulser/config/api_keys.json ]; then
  echo -e "${GREEN}✓ ${RESET}API keys configuration already exists"
else
  echo -e "${YELLOW}Creating API keys configuration template...${RESET}"
  cp ~/.pulser/config/api_keys.json.template ~/.pulser/config/api_keys.json
  echo -e "${GREEN}✓ ${RESET}API keys template created at ~/.pulser/config/api_keys.json - please edit this file with your API keys"
fi

# Create desktop shortcuts for macOS
if [ "$(uname)" = "Darwin" ]; then
  echo -e "${YELLOW}Creating desktop shortcuts...${RESET}"
  
  # CLI shortcut
  cat > ~/Desktop/Pulser\ CLI.command << EOF
#!/bin/bash
# Launch Pulser CLI
~/.pulser/bin/pulser
EOF
  chmod +x ~/Desktop/Pulser\ CLI.command
fi

# Create configuration file
echo -e "${YELLOW}Creating configuration file...${RESET}"
cat > ~/.pulser/config/config.json << EOF
{
  "version": "2.1.0",
  "theme": "pulser",
  "showThinking": false,
  "richUI": true,
  "darkMode": true,
  "autoComplete": true,
  "historySize": 100,
  "defaultProvider": "anthropic",
  "defaultModel": "opus-20240229",
  "defaultTimeout": 120000,
  "editorPath": "vim",
  "slashCommands": true,
  "pasteDetection": {
    "enabled": true,
    "threshold": 3,
    "interval": 10
  },
  "security": {
    "maskPasswords": true,
    "maskApiKeys": true,
    "warnOnSensitiveCommands": true
  }
}
EOF

# Create aliases file
echo -e "${YELLOW}Creating aliases file...${RESET}"
cat > ~/.pulser/config/aliases.sh << EOF
#!/bin/bash
# Pulser CLI aliases

# Main aliases
alias pulser='~/.pulser/bin/pulser'
alias pulse='pulser'  # Common typo fixed

# Specific mode aliases
alias pulser-dev='PULSER_DEV_MODE=1 pulser'
alias pulser-debug='PULSER_DEBUG=1 pulser'
alias pulser-verbose='PULSER_VERBOSE=1 pulser'

# Feature-specific aliases
alias pulser-thinking='PULSER_SHOW_THINKING=1 pulser'
alias pulser-minimal='PULSER_MINIMAL_UI=1 pulser'
alias pulser-nocolor='PULSER_NO_COLOR=1 pulser'

# Provider-specific aliases
alias pulser-anthropic='pulser --provider anthropic'
alias pulser-openai='pulser --provider openai'
alias pulser-local='pulser --provider deepseek'

# Demo and help
alias pulser-demo='~/.pulser/scripts/demo_paste_handling.js'
alias pulser-help='pulser /help'
EOF

# Make aliases executable and source it
chmod +x ~/.pulser/config/aliases.sh

# Source aliases in shell config if not already done
if ! grep -q "pulser/config/aliases.sh" "$CONFIG_FILE"; then
  echo 'source "$HOME/.pulser/config/aliases.sh"' >> "$CONFIG_FILE"
fi

# Create a new pulser_enforcer.sh
echo -e "${YELLOW}Creating enforcer script...${RESET}"
cat > ~/pulser_enforcer.sh << EOF
#!/bin/bash
# Pulser enforcer
# This script ensures the pulser command is properly set

# Make sure the pulser command uses the real CLI
alias pulser='/Users/tbwa/.pulser/bin/pulser'

# Print status
echo "✅ Pulser CLI enforcer has been activated"
echo "The 'pulser' command now points to the API-connected version"
EOF
chmod +x ~/pulser_enforcer.sh

# Create a simplified .pulser_final_fix
echo -e "${YELLOW}Creating final fix...${RESET}"
cat > ~/.pulser_final_fix << EOF
# Pulser final fix
# This file ensures that pulser always points to the correct binary
alias pulser='/Users/tbwa/.pulser/bin/pulser'
EOF

# Update .zshrc with alias override
echo -e "${YELLOW}Updating shell config...${RESET}"
sed -i '' 's/pulser=.*/pulser="\$HOME\/.pulser\/bin\/pulser"/g' ~/.zshrc

echo -e "\n${BOLD}${GREEN}Installation complete!${RESET}"
echo -e "To start using the real Pulser CLI with API integration, run: ${BOLD}pulser${RESET}"
echo -e "\n${YELLOW}Important:${RESET} You need to set up your API keys by either:"
echo -e "1. Editing ${BOLD}~/.pulser/config/api_keys.json${RESET} file"
echo -e "2. Setting ${BOLD}ANTHROPIC_API_KEY${RESET} or ${BOLD}OPENAI_API_KEY${RESET} environment variables"
echo -e "3. Creating ${BOLD}~/.anthropic/api_key${RESET} or ${BOLD}~/.openai/api_key${RESET} files"
echo -e "\n${CYAN}Restart your terminal or run 'source $CONFIG_FILE' to apply changes.${RESET}"