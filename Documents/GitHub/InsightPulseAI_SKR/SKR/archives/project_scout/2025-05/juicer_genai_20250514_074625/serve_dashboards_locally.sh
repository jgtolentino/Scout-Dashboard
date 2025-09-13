#!/bin/bash
# Script to serve dashboards locally using Python's HTTP server

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARDS_DIR="$BASE_DIR/dashboards/deploy"

# Check if Python is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Error: Python is not installed or not in the PATH.${NC}"
    exit 1
fi

# Check if port is specified
PORT=${1:-8080}

# Test for port availability
if lsof -Pi :$PORT -sTCP:LISTEN -t &> /dev/null ; then
    echo -e "${RED}Error: Port $PORT is already in use.${NC}"
    echo -e "${YELLOW}Please choose a different port:${NC}"
    echo -e "${BLUE}./serve_dashboards_locally.sh [PORT]${NC}"
    exit 1
fi

# Ensure the API is running
echo -e "${BLUE}Checking if JuicyChat API is running...${NC}"
curl -s "http://localhost:8889/health" > /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Warning: JuicyChat API does not seem to be running on port 8889.${NC}"
    echo -e "${YELLOW}You should start the API before serving dashboards:${NC}"
    echo -e "${BLUE}./run_juicychat_api.sh 8889${NC}"
    
    # Ask if we should continue anyway
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}JuicyChat API is running on port 8889.${NC}"
fi

# Serve the dashboards
echo -e "${BLUE}Starting HTTP server on port ${PORT}...${NC}"
echo -e "${GREEN}Dashboards will be available at: http://localhost:${PORT}/${NC}"
echo -e "${YELLOW}Available dashboards:${NC}"

# List available dashboards
for file in "$DASHBOARDS_DIR"/*.html; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo -e "  ${BLUE}http://localhost:${PORT}/${filename}${NC}"
    fi
done

echo -e "${GREEN}Press Ctrl+C to stop the server${NC}"

# Move to the dashboards directory and start the server
cd "$DASHBOARDS_DIR" && $PYTHON_CMD -m http.server $PORT