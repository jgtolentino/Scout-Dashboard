#!/bin/bash
# MCP Bridge Startup Script

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MCP_DIR="$SCRIPT_DIR"

echo "Starting MCP Bridge at $(date)"
echo "MCP Directory: $MCP_DIR"

# Ensure the results directory exists
mkdir -p "$MCP_DIR/results"

# Check if a dispatch_queue.json file exists and is potentially stale
if [ -f "$MCP_DIR/dispatch_queue.json" ]; then
    echo "Warning: dispatch_queue.json already exists. It might be stale."
    echo "Backing it up and moving it to dispatch_queue.json.bak"
    mv "$MCP_DIR/dispatch_queue.json" "$MCP_DIR/dispatch_queue.json.bak"
fi

# Function to handle script exit
cleanup() {
    echo "Stopping MCP Bridge at $(date)"
    
    # Kill any background processes
    if [ ! -z "$BRIDGE_PID" ]; then
        echo "Stopping bridge process ($BRIDGE_PID)"
        kill $BRIDGE_PID 2>/dev/null
    fi
    
    if [ ! -z "$MONITOR_PID" ]; then
        echo "Stopping monitor process ($MONITOR_PID)"
        kill $MONITOR_PID 2>/dev/null
    fi
    
    echo "MCP Bridge shutdown complete"
    exit 0
}

# Set up trap for clean exit
trap cleanup SIGINT SIGTERM

# Start the bridge in the background
python "$MCP_DIR/bridge/claude_mcp_bridge.py" &
BRIDGE_PID=$!
echo "Started MCP Bridge (PID: $BRIDGE_PID)"

# Start the status monitor in watch mode if requested
if [ "$1" == "--monitor" ]; then
    python "$MCP_DIR/bridge/status_monitor.py" --watch --interval 3 &
    MONITOR_PID=$!
    echo "Started Status Monitor (PID: $MONITOR_PID)"
else
    # Just display status once
    python "$MCP_DIR/bridge/status_monitor.py"
fi

echo "MCP Bridge is running. Press Ctrl+C to stop."

# Keep the script running
while true; do
    sleep 1
    
    # Check if bridge is still running
    if ! kill -0 $BRIDGE_PID 2>/dev/null; then
        echo "Error: MCP Bridge process has stopped unexpectedly"
        echo "Attempting to restart..."
        python "$MCP_DIR/bridge/claude_mcp_bridge.py" &
        BRIDGE_PID=$!
        echo "Restarted MCP Bridge (PID: $BRIDGE_PID)"
    fi
    
    # If monitor was started, check if it's still running
    if [ ! -z "$MONITOR_PID" ]; then
        if ! kill -0 $MONITOR_PID 2>/dev/null; then
            echo "Error: Status Monitor process has stopped unexpectedly"
            echo "Attempting to restart..."
            python "$MCP_DIR/bridge/status_monitor.py" --watch --interval 3 &
            MONITOR_PID=$!
            echo "Restarted Status Monitor (PID: $MONITOR_PID)"
        fi
    fi
done