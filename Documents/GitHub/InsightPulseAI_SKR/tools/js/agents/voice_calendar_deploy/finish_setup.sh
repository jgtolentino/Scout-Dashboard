#!/bin/bash
# Finish setup script for Voice Calendar Agent

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE} Voice Calendar Agent Final Setup  ${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CREDENTIALS_DIR="$HOME/.credentials/google_calendar"

# Ensure credentials directory exists
mkdir -p "$CREDENTIALS_DIR"

# Check if credentials.json exists
if [ ! -f "$CREDENTIALS_DIR/credentials.json" ]; then
    echo -e "${YELLOW}Checking for credentials.json in Downloads folder...${NC}"
    
    # Try to find credentials file in Downloads
    DOWNLOADS_CREDENTIALS=$(find ~/Downloads -maxdepth 1 -name "*credentials*.json" -o -name "client_secret*.json" | head -n 1)
    
    if [ -n "$DOWNLOADS_CREDENTIALS" ]; then
        echo -e "${GREEN}Found credentials file at:${NC} $DOWNLOADS_CREDENTIALS"
        echo -e "${YELLOW}Copying to $CREDENTIALS_DIR/credentials.json${NC}"
        cp "$DOWNLOADS_CREDENTIALS" "$CREDENTIALS_DIR/credentials.json"
        echo -e "${GREEN}✅ Credentials file copied successfully!${NC}"
    else
        echo -e "${YELLOW}⚠️ Could not find credentials file in Downloads folder${NC}"
        echo -e "Please manually move your credentials file to: $CREDENTIALS_DIR/credentials.json"
        echo -e "You can do this with this command:"
        echo -e "${BLUE}mv ~/Downloads/your_credentials_file.json $CREDENTIALS_DIR/credentials.json${NC}"
        
        read -p "Press Enter to continue after moving the file, or Ctrl+C to cancel..." dummy
    fi
fi

# Check if credentials.json exists now
if [ -f "$CREDENTIALS_DIR/credentials.json" ]; then
    echo -e "${GREEN}✅ Found credentials.json${NC}"
    
    # Check for dependencies
    echo -e "${BLUE}Checking for Python dependencies...${NC}"
    pip3 install --user google-auth google-auth-oauthlib google-api-python-client python-dotenv
    
    # Run the authorization script
    echo -e "${BLUE}Running Google Calendar authorization script...${NC}"
    python3 "$SCRIPT_DIR/authorize_google_calendar.py"
    
    # Check for token.pickle
    if [ -f "$CREDENTIALS_DIR/token.pickle" ]; then
        echo -e "${GREEN}✅ Google Calendar authorization complete!${NC}"
    else
        echo -e "${RED}❌ Google Calendar authorization failed${NC}"
        echo -e "Please try running the script manually:"
        echo -e "${BLUE}python3 $SCRIPT_DIR/authorize_google_calendar.py${NC}"
    fi
else
    echo -e "${RED}❌ Google Calendar credentials file not found.${NC}"
    echo -e "Please make sure you've downloaded the credentials file from Google Cloud Console"
    echo -e "and moved it to: $CREDENTIALS_DIR/credentials.json"
    exit 1
fi

# Check for ElevenLabs API key
echo -e "${BLUE}Checking for ElevenLabs API key...${NC}"

ENV_FILE="$HOME/Documents/GitHub/InsightPulseAI_SKR/.env"
if [ -f "$ENV_FILE" ]; then
    if grep -q "ELEVEN_API_KEY=" "$ENV_FILE"; then
        ELEVEN_API_KEY=$(grep "ELEVEN_API_KEY=" "$ENV_FILE" | cut -d '=' -f2)
        if [[ "$ELEVEN_API_KEY" == "your_elevenlabs_api_key_here" || -z "$ELEVEN_API_KEY" ]]; then
            echo -e "${YELLOW}⚠️ ElevenLabs API key not set in .env file${NC}"
            echo -e "Please update your .env file with your ElevenLabs API key"
            echo -e "Visit https://elevenlabs.io/ to get your API key"
        else
            echo -e "${GREEN}✅ ElevenLabs API key found in .env file${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ ElevenLabs API key not found in .env file${NC}"
        echo -e "Please add your ElevenLabs API key to your .env file:"
        echo -e "${BLUE}echo 'ELEVEN_API_KEY=your_key_here' >> $ENV_FILE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ .env file not found${NC}"
    echo -e "Please create an .env file at $ENV_FILE and add your ElevenLabs API key"
fi

echo ""
echo -e "${GREEN}Voice Calendar Agent setup steps complete!${NC}"
echo -e "${YELLOW}Remember to:${NC}"
echo -e "1. Start a new shell session or run: source $HOME/.zshrc"
echo -e "2. Update your .env file with any missing API keys"
echo -e "3. Test the agent with: ${BLUE}:voice_calendar \"Schedule a meeting with Jake tomorrow at 10 AM\"${NC}"
echo ""