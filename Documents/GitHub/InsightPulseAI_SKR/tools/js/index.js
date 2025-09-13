#!/bin/bash

# Pulser CLI Launcher
# Supports multiple modes (local, api, adaptive, demo)

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JS_DIR="${SCRIPT_DIR}/js"

# Check if the JS directory exists
if [ ! -d "$JS_DIR" ]; then
    echo -e "${RED}Error: JavaScript directory not found at $JS_DIR${NC}"
    exit 1
fi

# Config directory
CONFIG_DIR="$HOME/.pulser"
mkdir -p "$CONFIG_DIR"

# Handle media flags
MEDIA_FLAGS=""
if [[ "$*" == *"--model="* ]]; then
    # Extract model name
    MODEL_NAME=$(echo "$*" | grep -o '\--model=[^ ]*' | cut -d'=' -f2)
    if [ -n "$MODEL_NAME" ]; then
        export PULSER_MODEL_OVERRIDE="$MODEL_NAME"
        echo -e "${BLUE}Model override set to: ${GREEN}$MODEL_NAME${NC}"
    fi
fi

if [[ "$*" == *"--no-fallback"* ]]; then
    export PULSER_NO_FALLBACK="true"
    echo -e "${BLUE}Model fallback disabled${NC}"
fi

if [[ "$*" == *"--force-local"* ]]; then
    export PULSER_FORCE_LOCAL="true"
    echo -e "${BLUE}Forcing local model usage${NC}"
fi

# Check if we need to configure Claude API key
if [[ "$*" == *"--api"* ]] || [[ "$*" == *"--adaptive"* ]] || [[ "$PULSER_MODEL_OVERRIDE" == *"claude"* ]]; then
    # Check for Claude API key
    API_KEY_FILE="$CONFIG_DIR/claude_api_key.txt"
    
    if [ ! -f "$API_KEY_FILE" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
        echo -e "${BLUE}Claude API key required for API or adaptive mode${NC}"
        echo -e "${BLUE}Please enter your Claude API key (or press Enter to exit):${NC}"
        read -s API_KEY
        
        if [ -z "$API_KEY" ]; then
            echo -e "${RED}No API key provided. Please try again with a valid API key.${NC}"
            exit 1
        fi
        
        # Save API key
        echo "$API_KEY" > "$API_KEY_FILE"
        chmod 600 "$API_KEY_FILE"
        echo -e "${GREEN}API key saved to $API_KEY_FILE${NC}"
    fi
fi

# Execute the updated router-based Pulser CLI 
node "$JS_DIR/pulser-router.js" "$@"