#!/bin/bash
# Script to install the Zoho Mail integration for Pulser

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║            PULSER ZOHO MAIL INTEGRATION INSTALLER             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TOOLS_DIR="$PROJECT_ROOT/tools"
MAIL_DIR="$TOOLS_DIR/mail"
AGENT_DIR="$PROJECT_ROOT/agents"

# Check for existing files and create directories if needed
echo -e "${YELLOW}Checking for required directories...${NC}"
mkdir -p "$MAIL_DIR"
mkdir -p "$AGENT_DIR"

# Copy test scripts to home directory for easier access
echo -e "${YELLOW}Copying test scripts to home directory...${NC}"
cp "$MAIL_DIR/test_zoho_mail.sh" "$HOME/" 2>/dev/null || true
cp "$MAIL_DIR/get_zoho_token.py" "$HOME/" 2>/dev/null || true
cp "$MAIL_DIR/test_zoho_credentials.py" "$HOME/" 2>/dev/null || true

# Make sure scripts are executable
chmod +x "$HOME/test_zoho_mail.sh" 2>/dev/null || true
chmod +x "$HOME/get_zoho_token.py" 2>/dev/null || true
chmod +x "$HOME/test_zoho_credentials.py" 2>/dev/null || true
chmod +x "$MAIL_DIR/setup_zoho_mail.sh" 2>/dev/null || true

# Copy README to home directory
echo -e "${YELLOW}Copying documentation to home directory...${NC}"
cp "$PROJECT_ROOT/README_zoho_mail_cli.md" "$HOME/" 2>/dev/null || true

# Run setup script
echo -e "${YELLOW}Running Zoho Mail setup script...${NC}"
bash "$MAIL_DIR/setup_zoho_mail.sh"

# Register with Pulser agent system
echo -e "${YELLOW}Registering with Pulser agent system...${NC}"
AGENT_REGISTRY="$HOME/.pulser/agent_registry.yaml"

# Create agent registry if it doesn't exist
if [ ! -f "$AGENT_REGISTRY" ]; then
  echo -e "${YELLOW}Creating agent registry...${NC}"
  mkdir -p "$(dirname "$AGENT_REGISTRY")"
  cat > "$AGENT_REGISTRY" << EOF
# Pulser Agent Registry
version: "1.0"
last_updated: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
agents: []
EOF
fi

# Check if zoho_mail agent is already registered
if grep -q "name: zoho_mail" "$AGENT_REGISTRY"; then
  echo -e "${YELLOW}Updating existing zoho_mail agent registration...${NC}"
  # Complex update logic would go here, but for simplicity we'll just indicate it's already registered
  echo -e "${GREEN}zoho_mail agent is already registered${NC}"
else
  echo -e "${YELLOW}Adding zoho_mail agent to registry...${NC}"
  
  # This is a simplified approach - a real implementation would parse the YAML correctly
  # and update it, but for demonstration purposes, we'll just append the agent
  TMP_FILE=$(mktemp)
  cat "$AGENT_REGISTRY" | sed '/agents:/d' > "$TMP_FILE"
  
  echo "agents:" >> "$TMP_FILE"
  grep -q "^ *- " "$AGENT_REGISTRY" && grep "^ *- " "$AGENT_REGISTRY" >> "$TMP_FILE"
  
  echo "  - name: zoho_mail" >> "$TMP_FILE"
  echo "    version: \"1.0\"" >> "$TMP_FILE"
  echo "    config_path: \"$AGENT_DIR/zoho_mail.mcp.yaml\"" >> "$TMP_FILE"
  echo "    enabled: true" >> "$TMP_FILE"
  echo "    last_updated: \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" >> "$TMP_FILE"
  
  mv "$TMP_FILE" "$AGENT_REGISTRY"
  
  echo -e "${GREEN}Added zoho_mail agent to registry${NC}"
fi

# Update shell auto-completion
echo -e "${YELLOW}Updating shell auto-completion...${NC}"
COMPLETION_FILE="$HOME/.pulser_completion"

if [ -f "$COMPLETION_FILE" ]; then
  if ! grep -q "mail:" "$COMPLETION_FILE"; then
    echo -e "${YELLOW}Adding mail commands to auto-completion...${NC}"
    cat >> "$COMPLETION_FILE" << EOF

# Zoho Mail commands
mail:internal
mail:external
mail:vacation
mail:test
mail:setup
EOF
    echo -e "${GREEN}Added mail commands to auto-completion${NC}"
  else
    echo -e "${GREEN}Mail commands already in auto-completion${NC}"
  fi
fi

# Completion message
echo -e "\n${GREEN}✅ Zoho Mail Integration installed successfully!${NC}"
echo -e "${YELLOW}To complete setup:${NC}"
echo "1. Source your shell configuration:"
echo "   source ~/.zshrc"
echo ""
echo "2. Follow the setup instructions in README_zoho_mail_cli.md"
echo "   or run the following command for interactive setup:"
echo "   python3 ~/get_zoho_token.py"
echo ""
echo "3. Test your configuration with:"
echo "   ~/test_zoho_mail.sh --send-email --to your.email@example.com"
echo ""