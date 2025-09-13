#!/bin/bash
# Start the Pulser Robot webapp

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WEBAPP_DIR="$SCRIPT_DIR/webapp"
SERVER_SCRIPT="$SCRIPT_DIR/webapp_server.js"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required to run the webapp"
    echo "Please install Node.js and try again"
    exit 1
fi

# Install dependencies
echo "Installing webapp dependencies..."
cd "$WEBAPP_DIR" || exit
npm install

# Build the React app
echo "Building React app..."
npm run build

# Install server dependencies
echo "Installing server dependencies..."
cd "$SCRIPT_DIR" || exit
npm install express ws body-parser

# Check if MCP server is running
if ! nc -z localhost 9090 2>/dev/null; then
    echo "Starting MCP server..."
    nohup python3 "$SCRIPT_DIR/pulser_mcp_server.py" --host localhost --port 9090 > "$SCRIPT_DIR/mcp_server.log" 2>&1 &
    MCP_PID=$!
    echo $MCP_PID > "$SCRIPT_DIR/mcp_server.pid"
    echo "MCP server started with PID $MCP_PID"
    
    # Wait for server to start
    echo "Waiting for server to start..."
    sleep 2
fi

# Start the webapp server
echo "Starting webapp server..."
DIRECT_MODE=true node "$SERVER_SCRIPT"