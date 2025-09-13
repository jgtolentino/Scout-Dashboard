#!/bin/bash
# Script to run the JuicyChat API

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_FILE="$BASE_DIR/api/juicer_query_api.py"

# Check if python3 is available
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Error: Python is not installed or not in the PATH.${NC}"
    exit 1
fi

# Check if port is specified
PORT=${1:-8000}

echo -e "${BLUE}Starting JuicyChat API on port ${PORT}...${NC}"
echo -e "${GREEN}API will be available at http://localhost:${PORT}/api/juicer/query${NC}"
echo -e "${GREEN}API docs will be available at http://localhost:${PORT}/docs${NC}"
echo -e "${GREEN}Press Ctrl+C to stop the server${NC}"

cd "$BASE_DIR" && $PYTHON_CMD -m uvicorn demo_endpoint:app --host 0.0.0.0 --port $PORT
