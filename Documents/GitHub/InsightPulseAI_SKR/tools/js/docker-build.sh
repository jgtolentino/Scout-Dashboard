#!/bin/bash

# Build script for Pulser CLI Docker image

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}==========================================${NC}"
echo -e "${YELLOW}    Building Pulser CLI Docker Image     ${NC}"
echo -e "${YELLOW}==========================================${NC}"

# Create pulser config directory if it doesn't exist
mkdir -p "$HOME/.pulser"

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Navigate to the directory
cd "$SCRIPT_DIR" || exit 1

# Build the Docker image
echo -e "${BLUE}Building Docker image...${NC}"
docker build -t pulser-cli .

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}Docker image built successfully!${NC}"
echo -e "${YELLOW}==========================================${NC}"
echo -e "${BLUE}You can now run the Pulser CLI with:${NC}"
echo -e "${GREEN}./docker-run.sh${NC}"
echo -e ""
echo -e "${BLUE}Or using Docker directly:${NC}"
echo -e "${GREEN}docker run -it --rm -v $HOME/.pulser:/root/.pulser pulser-cli${NC}"
echo -e ""
echo -e "${BLUE}To run with specific flags:${NC}"
echo -e "${GREEN}docker run -it --rm -v $HOME/.pulser:/root/.pulser pulser-cli --demo${NC}"
echo -e "${YELLOW}==========================================${NC}"