#!/bin/bash
# Script to run the Juicer Chat with Data API (GENIE-equivalent)

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Juicer Chat with Data API (GENIE-equivalent)...${NC}"

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

# Install dependencies locally without virtual environment
echo -e "${YELLOW}Installing dependencies...${NC}"
$PYTHON_CMD -m pip install --user -r requirements.txt

# Check installation status
if [ $? -ne 0 ]; then
    echo -e "${RED}Error installing dependencies. Please check the error messages above.${NC}"
    echo -e "${YELLOW}Trying to continue anyway...${NC}"
fi

# Check if API keys are set
if [ -z "$CLAUDE_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}Warning: No API keys found for Claude or OpenAI.${NC}"
    echo -e "${YELLOW}The system will use mock responses for development.${NC}"
    echo -e "${YELLOW}Set CLAUDE_API_KEY or OPENAI_API_KEY for production use.${NC}"
fi

# Check if Databricks connection is configured
if [ -z "$DATABRICKS_HOST" ] || [ -z "$DATABRICKS_TOKEN" ]; then
    echo -e "${YELLOW}Warning: Databricks connection not fully configured.${NC}"
    echo -e "${YELLOW}The system will use mock data for development.${NC}"
    echo -e "${YELLOW}Set DATABRICKS_HOST, DATABRICKS_TOKEN, and DATABRICKS_WAREHOUSE_ID for production use.${NC}"
fi

# Check if port is specified
PORT=${1:-8000}

# Create an empty __init__.py in the api directory if it doesn't exist
mkdir -p api/utils
touch api/__init__.py
touch api/utils/__init__.py

# Check if API script is correctly wired to serve the static React app
echo -e "${YELLOW}Note: The React UI starter component has been created but requires bundling.${NC}"
echo -e "${YELLOW}For now, you can access the API directly at http://localhost:${PORT}/docs${NC}"

# Run the FastAPI application
echo -e "${GREEN}Running API on port ${PORT}...${NC}"
echo -e "${GREEN}Access the API docs at http://localhost:${PORT}/docs${NC}"
echo -e "${GREEN}Press Ctrl+C to stop the server${NC}"

# Try to run with uvicorn directly if application module cannot be imported
$PYTHON_CMD -m uvicorn api.query_endpoint:router --reload --port $PORT