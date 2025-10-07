#!/bin/bash
# Setup script for ElevenLabs integration with Voice Calendar Agent

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  ElevenLabs Setup for Voice Calendar  ${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Get the environment file path
ENV_FILE="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/.env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    touch "$ENV_FILE"
fi

# Prompt for ElevenLabs API key
echo -e "${YELLOW}Please enter your ElevenLabs API key:${NC}"
read -p "> " ELEVEN_API_KEY

# Check if the API key was provided
if [ -z "$ELEVEN_API_KEY" ]; then
    echo -e "${RED}No API key provided. Exiting...${NC}"
    exit 1
fi

# Update the .env file
if grep -q "ELEVEN_API_KEY=" "$ENV_FILE"; then
    # Key exists, update it
    sed -i '' "s/ELEVEN_API_KEY=.*/ELEVEN_API_KEY=$ELEVEN_API_KEY/" "$ENV_FILE"
else
    # Key doesn't exist, add it
    echo "" >> "$ENV_FILE"
    echo "# ElevenLabs API key for Voice Calendar Agent" >> "$ENV_FILE"
    echo "ELEVEN_API_KEY=$ELEVEN_API_KEY" >> "$ENV_FILE"
fi

echo -e "${GREEN}✅ ElevenLabs API key has been saved to $ENV_FILE${NC}"

# Test the ElevenLabs API key with a basic request
echo -e "${BLUE}Testing ElevenLabs API key...${NC}"

# Use Python to test the API key
python3 -c "
import sys
try:
    from elevenlabs import generate, set_api_key, voices
    set_api_key('$ELEVEN_API_KEY')
    
    # Try to get voices as a simple test
    available_voices = voices()
    if available_voices:
        print('\\n${GREEN}✅ ElevenLabs API key is valid and working!${NC}')
        print('\\n${BLUE}Available voices:${NC}')
        for voice in available_voices:
            print(f'- {voice.name}')
    else:
        print('\\n${YELLOW}⚠️ No voices found. Check your ElevenLabs subscription.${NC}')
except Exception as e:
    print(f'\\n${RED}❌ Error testing ElevenLabs API key: {str(e)}${NC}')
    sys.exit(1)
"

# Check the result
if [ $? -eq 0 ]; then
    echo -e "${GREEN}ElevenLabs setup complete!${NC}"
    
    # Prompt for voice selection
    echo -e "\n${YELLOW}Would you like to set a specific voice for the Voice Calendar Agent? (y/n)${NC}"
    read -p "> " SET_VOICE
    
    if [[ "$SET_VOICE" == "y" || "$SET_VOICE" == "Y" ]]; then
        echo -e "${YELLOW}Enter the name of the voice you want to use:${NC}"
        read -p "> " VOICE_NAME
        
        if [ -n "$VOICE_NAME" ]; then
            echo -e "${BLUE}Setting voice to: $VOICE_NAME${NC}"
            if grep -q "ELEVEN_VOICE=" "$ENV_FILE"; then
                sed -i '' "s/ELEVEN_VOICE=.*/ELEVEN_VOICE=$VOICE_NAME/" "$ENV_FILE"
            else
                echo "ELEVEN_VOICE=$VOICE_NAME" >> "$ENV_FILE"
            fi
            echo -e "${GREEN}✅ Voice preference saved to .env file${NC}"
        fi
    fi
else
    echo -e "${RED}❌ ElevenLabs setup failed. Please check your API key and try again.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}ElevenLabs Integration Summary:${NC}"
echo -e "✅ API key configured in .env file"
echo -e "✅ API connection tested successfully"
if [[ "$SET_VOICE" == "y" || "$SET_VOICE" == "Y" ]]; then
    echo -e "✅ Voice preference set to: $VOICE_NAME"
fi

echo ""
echo -e "${GREEN}Setup for ElevenLabs text-to-speech is now complete!${NC}"
echo -e "${YELLOW}You can now continue with the Voice Calendar Agent testing:${NC}"
echo -e "${BLUE}:voice_calendar \"Schedule a meeting with Jake tomorrow at 10 AM\"${NC}"
echo ""