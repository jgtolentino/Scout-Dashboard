#!/bin/bash
# Voice Calendar Agent Installation Script

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  Voice Calendar Agent Installation   ${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AGENT_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(cd "$AGENT_DIR/../../.." && pwd)"

echo -e "${YELLOW}Installation directories:${NC}"
echo -e "Script directory: ${SCRIPT_DIR}"
echo -e "Agent directory: ${AGENT_DIR}"
echo -e "Project root: ${ROOT_DIR}"
echo ""

# Check for required tools
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check for Python 3.6+
if command -v python3 &>/dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo -e "✅ Python detected: ${PYTHON_VERSION}"
else
    echo -e "${RED}❌ Python 3.6+ is required but not found${NC}"
    echo -e "Please install Python 3.6 or higher and try again."
    exit 1
fi

# Check for pip
if command -v pip3 &>/dev/null; then
    echo -e "✅ pip detected"
else
    echo -e "${RED}❌ pip is required but not found${NC}"
    echo -e "Please install pip and try again."
    exit 1
fi

# Check for Pulser
if command -v pulser &>/dev/null; then
    echo -e "✅ Pulser CLI detected"
else
    echo -e "${YELLOW}⚠️ Pulser CLI not found in PATH${NC}"
    echo -e "Will check for local installation..."
    
    if [ -f "$HOME/.pulser/bin/pulser" ]; then
        echo -e "✅ Pulser found at $HOME/.pulser/bin/pulser"
    else
        echo -e "${YELLOW}⚠️ Pulser not found. Installing dependent packages only.${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Installing dependencies...${NC}"

# Install Python dependencies
echo -e "Installing Python packages..."
pip3 install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client elevenlabs anthropic

echo ""
echo -e "${BLUE}Setting up configuration...${NC}"

# Create credential directories
mkdir -p "$HOME/.credentials/google_calendar"
echo -e "✅ Created credential directory at $HOME/.credentials/google_calendar"

# Copy .env template
if [ -f "$ROOT_DIR/.env" ]; then
    echo -e "✅ .env file exists at $ROOT_DIR/.env"
    echo -e "${YELLOW}Adding Voice Calendar configuration to .env file...${NC}"
    
    # Check if Voice Calendar configs already exist
    if grep -q "ELEVEN_API_KEY" "$ROOT_DIR/.env"; then
        echo -e "${YELLOW}ElevenLabs configuration already exists in .env${NC}"
    else
        echo -e "# Voice Calendar Agent Configuration" >> "$ROOT_DIR/.env"
        echo -e "ELEVEN_API_KEY=your_elevenlabs_api_key_here" >> "$ROOT_DIR/.env"
        echo -e "# Google Calendar API (OAuth2)" >> "$ROOT_DIR/.env"
        echo -e "GOOGLE_CLIENT_ID=your_client_id_here" >> "$ROOT_DIR/.env"
        echo -e "GOOGLE_CLIENT_SECRET=your_client_secret_here" >> "$ROOT_DIR/.env"
        echo -e "✅ Added Voice Calendar configurations to .env"
    fi
else
    echo -e "Creating .env file from template..."
    cp "$SCRIPT_DIR/.env.template" "$ROOT_DIR/.env"
    echo -e "✅ Created .env file at $ROOT_DIR/.env"
    echo -e "${YELLOW}⚠️ Please update the .env file with your API keys${NC}"
fi

# Update .pulserrc if it exists
PULSERRC_PATH="$HOME/.pulserrc"
if [ -f "$PULSERRC_PATH" ]; then
    echo -e "✅ .pulserrc found at $PULSERRC_PATH"
    echo -e "${YELLOW}Adding Voice Calendar configuration to .pulserrc${NC}"
    
    # Check if Voice Calendar task already exists
    if grep -q "voice_calendar:" "$PULSERRC_PATH"; then
        echo -e "${YELLOW}Voice Calendar task already exists in .pulserrc${NC}"
    else
        echo -e "# Voice Calendar Agent - Added $(date)" >> "$PULSERRC_PATH"
        cat "$SCRIPT_DIR/pulserrc_patch.yaml" >> "$PULSERRC_PATH"
        echo -e "✅ Added Voice Calendar configuration to .pulserrc"
    fi
else
    echo -e "${YELLOW}⚠️ .pulserrc not found${NC}"
    echo -e "Creating example .pulserrc file in your home directory..."
    cp "$SCRIPT_DIR/pulserrc_patch.yaml" "$HOME/.pulserrc_example"
    echo -e "✅ Created example .pulserrc at $HOME/.pulserrc_example"
    echo -e "${YELLOW}Please copy this to your actual .pulserrc location${NC}"
fi

# Add shell alias if not present
SHELL_RC="$HOME/.zshrc"
if [ -f "$SHELL_RC" ]; then
    if grep -q ":voice_calendar" "$SHELL_RC"; then
        echo -e "✅ Shell alias already exists"
    else
        echo -e "Adding shell alias to $SHELL_RC..."
        echo "" >> "$SHELL_RC"
        echo "# Voice Calendar Agent alias - Added $(date)" >> "$SHELL_RC"
        echo "alias :voice_calendar=\"pulser task run voice_calendar --voice\"" >> "$SHELL_RC"
        echo -e "✅ Added shell alias to $SHELL_RC"
    fi
else
    echo -e "${YELLOW}⚠️ Shell configuration file not found at $SHELL_RC${NC}"
    echo -e "Manual alias creation required:"
    echo -e "alias :voice_calendar=\"pulser task run voice_calendar --voice\""
fi

echo ""
echo -e "${BLUE}Installation complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update your .env file with actual API keys"
echo -e "2. Set up Google Calendar API (see $SCRIPT_DIR/google_calendar_setup.md)"
echo -e "3. Set up ElevenLabs (see $SCRIPT_DIR/elevenlabs_setup.md)"
echo -e "4. Start a new shell session or run: source $SHELL_RC"
echo -e "5. Test the agent with: pulser simulate agents/voice_calendar.agent.yaml --input $SCRIPT_DIR/voice_calendar_test_input.json"
echo ""
echo -e "${GREEN}Thank you for installing the Voice Calendar Agent!${NC}"