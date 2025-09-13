#!/bin/bash
#
# pulser_setup_mistral.sh - Download and set up Mistral as the default model
#
# This script ensures Mistral is available for Pulser to use

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Pulser - Setting up Mistral as default model${NC}"
echo

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}Error: Ollama is not installed.${NC}"
    echo -e "${YELLOW}Please install Ollama first:${NC}"
    echo -e "brew install ollama"
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://127.0.0.1:11434/api/tags &> /dev/null; then
    echo -e "${YELLOW}Ollama service is not running. Starting it...${NC}"
    ollama serve &>/dev/null &
    
    # Wait for service to start
    echo -e "${BLUE}Waiting for Ollama service to start...${NC}"
    sleep 5
    
    # Check if it's running now
    if ! curl -s http://127.0.0.1:11434/api/tags &> /dev/null; then
        echo -e "${RED}Error: Failed to start Ollama service.${NC}"
        echo -e "${YELLOW}Please start it manually:${NC}"
        echo -e "ollama serve"
        exit 1
    fi
fi

# Check if Mistral is already installed
if curl -s http://127.0.0.1:11434/api/tags | grep -q "mistral"; then
    echo -e "${GREEN}✓ Mistral model is already installed${NC}"
else
    # Download Mistral
    echo -e "${BLUE}Downloading Mistral model...${NC}"
    if ollama pull mistral; then
        echo -e "${GREEN}✓ Successfully downloaded Mistral model${NC}"
    else
        echo -e "${RED}Error: Failed to download Mistral model${NC}"
        exit 1
    fi
fi

echo
echo -e "${GREEN}✓ Mistral is now set as the default model for Pulser${NC}"
echo
echo -e "${BLUE}Try it out:${NC}"
echo -e "  ${YELLOW}pulser-free \"What is the Pulser framework?\"${NC}"
echo -e "  ${YELLOW}pulser-chat${NC} (for interactive mode)"
echo