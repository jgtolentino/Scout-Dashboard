#!/bin/bash

# Run Pulser CLI with Docker Compose

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}==========================================${NC}"
echo -e "${YELLOW}  Running Pulser CLI with Docker Compose  ${NC}"
echo -e "${YELLOW}==========================================${NC}"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed or not in PATH${NC}"
    exit 1
fi

# Create pulser config directory if it doesn't exist
mkdir -p "$HOME/.pulser"

# Navigate to the directory
cd "$SCRIPT_DIR" || exit 1

# Run with docker-compose
echo -e "${BLUE}Starting services with Docker Compose...${NC}"
docker-compose up -d deepseekr1-api
docker-compose run --rm pulser "$@"

# Stop services when done
echo -e "${BLUE}Stopping services...${NC}"
docker-compose down

echo -e "${GREEN}Done!${NC}"