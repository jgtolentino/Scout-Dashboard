#!/bin/bash
# Setup Real Pulser CLI API Integration
# This script helps you quickly set up your API keys for Pulser CLI

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

echo -e "${BLUE}
   ___         __                  ___   __    ____
  / _ \\ __ __ / /  ___ ___  ____  / _ \\ / /   /  _/
 / ___// // // _ \\(_-</ -_)/ __/ / // // /__ _/ /  
/_/    \\_,_//_.__//___/\\__//_/   /____//____//___/  
${RESET}"
echo -e "${BLUE}Pulser CLI API Setup${RESET}\n"

# Create directories
mkdir -p ~/.anthropic
mkdir -p ~/.openai
mkdir -p ~/.pulser/config

# Function to set up Anthropic API key
setup_anthropic() {
    echo -e "\n${YELLOW}Setting up Anthropic API Key${RESET}"
    echo -e "Get your API key from: ${GREEN}https://console.anthropic.com/${RESET}"
    
    read -p "Enter your Anthropic API key (sk-ant-...) or press Enter to skip: " ANTHROPIC_KEY
    
    if [ -n "$ANTHROPIC_KEY" ]; then
        echo "$ANTHROPIC_KEY" > ~/.anthropic/api_key
        chmod 600 ~/.anthropic/api_key
        
        # Update JSON file as well
        if [ -f ~/.pulser/config/api_keys.json ]; then
            # Create a temp file
            TMP_FILE=$(mktemp)
            cat ~/.pulser/config/api_keys.json | sed "s/\"anthropic\": \"[^\"]*\"/\"anthropic\": \"$ANTHROPIC_KEY\"/" > "$TMP_FILE"
            mv "$TMP_FILE" ~/.pulser/config/api_keys.json
            chmod 600 ~/.pulser/config/api_keys.json
        else
            # Create the file
            echo "{
  \"anthropic\": \"$ANTHROPIC_KEY\",
  \"openai\": \"YOUR_OPENAI_API_KEY_HERE\"
}" > ~/.pulser/config/api_keys.json
            chmod 600 ~/.pulser/config/api_keys.json
        fi
        
        echo -e "${GREEN}✓ Anthropic API key saved${RESET}"
    else
        echo -e "${YELLOW}Skipped Anthropic API key setup${RESET}"
    fi
}

# Function to set up OpenAI API key
setup_openai() {
    echo -e "\n${YELLOW}Setting up OpenAI API Key${RESET}"
    echo -e "Get your API key from: ${GREEN}https://platform.openai.com/${RESET}"
    
    read -p "Enter your OpenAI API key (sk-...) or press Enter to skip: " OPENAI_KEY
    
    if [ -n "$OPENAI_KEY" ]; then
        echo "$OPENAI_KEY" > ~/.openai/api_key
        chmod 600 ~/.openai/api_key
        
        # Update JSON file as well
        if [ -f ~/.pulser/config/api_keys.json ]; then
            # Create a temp file
            TMP_FILE=$(mktemp)
            cat ~/.pulser/config/api_keys.json | sed "s/\"openai\": \"[^\"]*\"/\"openai\": \"$OPENAI_KEY\"/" > "$TMP_FILE"
            mv "$TMP_FILE" ~/.pulser/config/api_keys.json
            chmod 600 ~/.pulser/config/api_keys.json
        else
            # Create the file
            echo "{
  \"anthropic\": \"YOUR_ANTHROPIC_API_KEY_HERE\",
  \"openai\": \"$OPENAI_KEY\"
}" > ~/.pulser/config/api_keys.json
            chmod 600 ~/.pulser/config/api_keys.json
        fi
        
        echo -e "${GREEN}✓ OpenAI API key saved${RESET}"
    else
        echo -e "${YELLOW}Skipped OpenAI API key setup${RESET}"
    fi
}

# Function to set default provider preference
setup_default_provider() {
    echo -e "\n${YELLOW}Setting Default Provider${RESET}"
    echo -e "1) Anthropic (Claude models)"
    echo -e "2) OpenAI (GPT models)"
    echo -e "3) Local (via Ollama)"
    
    read -p "Select default provider [1-3, default: 1]: " PROVIDER_CHOICE
    
    case "$PROVIDER_CHOICE" in
        2)
            PROVIDER="openai"
            ;;
        3)
            PROVIDER="deepseek"
            ;;
        *)
            PROVIDER="anthropic"
            ;;
    esac
    
    # Set environment variable in .zshrc
    if grep -q "export PULSER_DEFAULT_PROVIDER" ~/.zshrc; then
        # Update existing setting
        sed -i '' "s/export PULSER_DEFAULT_PROVIDER=.*/export PULSER_DEFAULT_PROVIDER=\"$PROVIDER\"/" ~/.zshrc
    else
        # Add new setting
        echo "# Pulser default provider" >> ~/.zshrc
        echo "export PULSER_DEFAULT_PROVIDER=\"$PROVIDER\"" >> ~/.zshrc
    fi
    
    echo -e "${GREEN}✓ Default provider set to ${PROVIDER}${RESET}"
}

# Main setup process
echo -e "${YELLOW}This script will help you set up API keys for Pulser CLI.${RESET}"
echo -e "You can skip any step by pressing Enter.\n"

# Ask user which setup they want to do
echo -e "Choose setup options:"
echo -e "1) Set up Anthropic API key"
echo -e "2) Set up OpenAI API key"
echo -e "3) Set default provider preference"
echo -e "4) All of the above"
echo -e "5) Exit"

read -p "Enter your choice [1-5]: " SETUP_CHOICE

case "$SETUP_CHOICE" in
    1)
        setup_anthropic
        ;;
    2)
        setup_openai
        ;;
    3)
        setup_default_provider
        ;;
    4)
        setup_anthropic
        setup_openai
        setup_default_provider
        ;;
    *)
        echo -e "${YELLOW}Exiting setup without changes${RESET}"
        exit 0
        ;;
esac

# Final instructions
echo -e "\n${GREEN}Setup Complete!${RESET}"
echo -e "To apply changes, either:"
echo -e "1) Restart your terminal"
echo -e "2) Run: ${BLUE}source ~/.zshrc${RESET}"
echo -e "\nTo test Pulser CLI, run: ${BLUE}pulser \"Hello, world!\"${RESET}"
echo -e "For more information, see: ${BLUE}cat ~/PULSER_CLI_GUIDE.md${RESET}"