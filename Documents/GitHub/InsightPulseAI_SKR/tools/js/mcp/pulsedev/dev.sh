#!/bin/bash
# Global PulseDev launcher script

PULSEDEV_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/mcp/pulsedev"
MCP_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/mcp"

# Create required directories if they don't exist
mkdir -p "$PULSEDEV_DIR/logs"
mkdir -p "$PULSEDEV_DIR/backend"
mkdir -p "$PULSEDEV_DIR/frontend"

# Check for dummy server files, create if not present
if [ ! -f "$PULSEDEV_DIR/backend/dummy_server.py" ]; then
    echo 'import time\n\nwhile True:\n    print("Backend server running...")\n    time.sleep(30)' > "$PULSEDEV_DIR/backend/dummy_server.py"
fi

if [ ! -f "$PULSEDEV_DIR/frontend/dummy_server.js" ]; then
    echo 'console.log("Frontend server running...");\nsetInterval(() => console.log("Still running..."), 30000);' > "$PULSEDEV_DIR/frontend/dummy_server.js"
fi

# Check if MCP server is already running
if ! nc -z localhost 8765 2>/dev/null; then
    echo "🚀 Starting MCP server..."
    cd "$MCP_DIR"
    ./start_mcp.sh &
    sleep 2  # Give MCP server time to start
else
    echo "✅ MCP server is already running"
fi

# Launch PulseDev
echo "🚀 Starting PulseDev..."
cd "$PULSEDEV_DIR"
./launch.sh

# This script doesn't need to wait - launch.sh will handle that