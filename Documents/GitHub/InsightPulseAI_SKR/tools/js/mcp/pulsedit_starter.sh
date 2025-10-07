#!/bin/bash
# PulseEdit Starter Script
# Launches the PulseEdit environment for code editing and execution

# Configuration
MCP_SERVER_PORT=9090
PULSEDIT_PORT=3000
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORKSPACES_DIR="$SCRIPT_DIR/workspaces"
LOGS_DIR="$SCRIPT_DIR/logs"

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Print banner
echo "╭───────────────────────────────────────────────╮"
echo "│                                               │"
echo "│   PulseEdit - MCP-Powered Development         │"
echo "│                                               │"
echo "╰───────────────────────────────────────────────╯"

# Check dependencies
echo "Checking dependencies..."
MISSING_DEPS=0

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 14 or later."
    MISSING_DEPS=1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm."
    MISSING_DEPS=1
fi

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or later."
    MISSING_DEPS=1
fi

if command_exists docker; then
    echo "✅ Docker is installed. Code execution will be isolated."
    DOCKER_AVAILABLE=1
else
    echo "⚠️ Docker is not installed. Code execution will not be isolated (unsafe)."
    DOCKER_AVAILABLE=0
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo "Please install missing dependencies and try again."
    exit 1
fi

# Create required directories
echo "Creating required directories..."
mkdir -p "$WORKSPACES_DIR"
mkdir -p "$LOGS_DIR"

# Install required npm packages
echo "Installing required npm packages..."
npm_packages=("express" "socket.io" "monaco-editor" "xterm" "ws" "uuid" "body-parser")
for package in "${npm_packages[@]}"; do
    npm list --depth=0 "$package" > /dev/null 2>&1 || npm install "$package" --no-save
done

# Install required Python packages
echo "Installing required Python packages..."
pip3 install websockets asyncio aiohttp pyyaml

# Check if MCP server is running
if nc -z localhost $MCP_SERVER_PORT 2>/dev/null; then
    echo "✅ MCP server is already running on port $MCP_SERVER_PORT"
else
    echo "Starting MCP server on port $MCP_SERVER_PORT..."
    nohup python3 "$SCRIPT_DIR/pulser_mcp_server.py" --host localhost --port $MCP_SERVER_PORT > "$LOGS_DIR/mcp_server.log" 2>&1 &
    MCP_PID=$!
    echo $MCP_PID > "$LOGS_DIR/mcp_server.pid"
    echo "✅ MCP server started with PID $MCP_PID"
fi

# Start PulseEdit code execution bridge
echo "Starting PulseEdit code execution bridge..."
export MCP_SERVER="ws://localhost:$MCP_SERVER_PORT/mcp/code_execution"
export WORKSPACE_ROOT="$WORKSPACES_DIR"
export DEBUG="false"

if [ $DOCKER_AVAILABLE -eq 1 ]; then
    export USE_DOCKER="true"
else
    export USE_DOCKER="false"
fi

nohup node "$SCRIPT_DIR/pulsedit_bridge.js" > "$LOGS_DIR/pulsedit_bridge.log" 2>&1 &
BRIDGE_PID=$!
echo $BRIDGE_PID > "$LOGS_DIR/pulsedit_bridge.pid"
echo "✅ PulseEdit bridge started with PID $BRIDGE_PID"

# Open PulseEdit UI concept in browser
echo "Opening PulseEdit UI concept in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$SCRIPT_DIR/pulsedit_ui_concept.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$SCRIPT_DIR/pulsedit_ui_concept.html"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    start "$SCRIPT_DIR/pulsedit_ui_concept.html"
fi

echo ""
echo "╭───────────────────────────────────────────────╮"
echo "│                                               │"
echo "│  PulseEdit is now running!                    │"
echo "│                                               │"
echo "│  - UI Concept: file://$SCRIPT_DIR/pulsedit_ui_concept.html"
echo "│  - MCP Server: localhost:$MCP_SERVER_PORT        │"
echo "│  - Workspaces: $WORKSPACES_DIR"
echo "│                                               │"
echo "│  Press Ctrl+C to stop all services            │"
echo "│                                               │"
echo "╰───────────────────────────────────────────────╯"

# Wait for user to press Ctrl+C
trap "echo 'Shutting down PulseEdit...'; kill $BRIDGE_PID 2>/dev/null; kill $MCP_PID 2>/dev/null" INT
wait