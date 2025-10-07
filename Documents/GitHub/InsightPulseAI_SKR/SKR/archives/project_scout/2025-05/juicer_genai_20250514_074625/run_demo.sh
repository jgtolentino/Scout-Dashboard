#!/bin/bash
# Script to run the Juicer Chat with Data Demo API

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Juicer Chat with Data Demo API...${NC}"

# Check if python3 is available
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Error: Python is not installed or not in the PATH.${NC}"
    exit 1
fi

echo -e "${GREEN}Using Python: $(which $PYTHON_CMD)${NC}"

# Install core dependencies without virtual environment
echo -e "${YELLOW}Installing core dependencies...${NC}"
$PYTHON_CMD -m pip install --user fastapi uvicorn pydantic

# Check installation status
if [ $? -ne 0 ]; then
    echo -e "${RED}Error installing dependencies. Please check the error messages above.${NC}"
    exit 1
fi

# Check if port is specified
PORT=${1:-8000}

# Run the FastAPI application
echo -e "${GREEN}Running Demo API on port ${PORT}...${NC}"
echo -e "${GREEN}Access the API docs at http://localhost:${PORT}/docs${NC}"
echo -e "${YELLOW}Try these example queries:${NC}"
echo -e "${YELLOW}- Compare sales uplift for Campaign B vs. A in NCR${NC}"
echo -e "${YELLOW}- How many brand mentions did Jollibee get last quarter?${NC}"
echo -e "${YELLOW}- What insights have we gathered about vegetarian menu items?${NC}"
echo -e "${GREEN}Press Ctrl+C to stop the server${NC}"

$PYTHON_CMD demo_endpoint.py $PORT