#!/bin/bash
# Simple HTTP server for QA testing dashboards
# Usage: ./serve_dashboards_qa.sh [port]

PORT="${1:-8888}"
DASHBOARDS_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/dashboards"
QA_DIR="/tmp/dashboard_qa_$USER"

# Set colors for readable output
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BLUE}==== Dashboard QA Server ====${RESET}"

# Check if port is already in use
port_in_use() {
  lsof -i:"$1" >/dev/null 2>&1
}

# Find available port
while port_in_use $PORT; do
  echo -e "${YELLOW}Port $PORT is already in use. Trying next port...${RESET}"
  PORT=$((PORT+1))
  if [ $PORT -gt 9000 ]; then
    echo -e "${RED}Error: Could not find an available port in range 8888-9000.${RESET}"
    exit 1
  fi
done

echo -e "${GREEN}Found available port: $PORT${RESET}"

# Create temporary directory
rm -rf "$QA_DIR"
mkdir -p "$QA_DIR"

# Copy dashboard files
echo -e "${BLUE}Copying dashboard files to temporary directory...${RESET}"
cp -r "$DASHBOARDS_DIR"/* "$QA_DIR"/

# Record port for other scripts
echo "$PORT" > "$QA_DIR/server_port.txt"

# Start HTTP server
echo -e "${GREEN}Starting server on port $PORT...${RESET}"
echo -e "${GREEN}Access the dashboards at:${RESET}"
echo -e "${BLUE}http://localhost:$PORT/${RESET}"
echo -e "${YELLOW}${BOLD}Press Ctrl+C to stop the server${RESET}"

# Change to QA directory and start server
cd "$QA_DIR" || exit 1

# Start server based on available Python version
if command -v python3 &> /dev/null; then
  python3 -m http.server "$PORT"
elif command -v python &> /dev/null; then
  python -m SimpleHTTPServer "$PORT"
else
  echo -e "${RED}Error: Python not found. Cannot start HTTP server.${RESET}"
  exit 1
fi

# Clean up on exit
echo -e "${BLUE}Cleaning up temporary files...${RESET}"
rm -rf "$QA_DIR"
echo -e "${GREEN}Server stopped.${RESET}"