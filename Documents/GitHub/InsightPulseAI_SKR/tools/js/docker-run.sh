#!/bin/bash

# Run script for Pulser CLI Docker container

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Create pulser config directory if it doesn't exist
mkdir -p "$HOME/.pulser"

# Default mode
MODE="api"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --api)
      MODE="api"
      shift
      ;;
    --local)
      MODE="local"
      shift
      ;;
    --demo)
      MODE="demo"
      shift
      ;;
    --debug)
      DEBUG="--debug"
      shift
      ;;
    *)
      EXTRA_ARGS="$EXTRA_ARGS $1"
      shift
      ;;
  esac
done

echo -e "${YELLOW}==========================================${NC}"
echo -e "${YELLOW}     Running Pulser CLI (${MODE} mode)      ${NC}"
echo -e "${YELLOW}==========================================${NC}"

# Run the Docker container
echo -e "${BLUE}Starting Pulser CLI...${NC}"
docker run -it --rm \
  -v "$HOME/.pulser:/root/.pulser" \
  --name pulser-session \
  pulser-cli --"${MODE}" ${DEBUG} ${EXTRA_ARGS}

# Check exit status
if [ $? -ne 0 ]; then
    echo -e "${RED}Error running Pulser CLI container${NC}"
    exit 1
fi