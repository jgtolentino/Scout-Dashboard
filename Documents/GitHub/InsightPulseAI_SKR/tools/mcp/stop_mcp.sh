#!/bin/bash
# MCP Bridge Stop Script

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MCP_DIR="$SCRIPT_DIR"

echo "Stopping MCP Bridge processes..."

# Find all python processes running the bridge or status monitor
BRIDGE_PIDS=$(ps aux | grep -E "claude_mcp_bridge.py|status_monitor.py" | grep -v grep | awk '{print $2}')

if [ -z "$BRIDGE_PIDS" ]; then
    echo "No MCP Bridge processes found to stop."
    exit 0
fi

# Stop each process
for PID in $BRIDGE_PIDS; do
    echo "Stopping process $PID..."
    kill $PID 2>/dev/null
    
    # Wait a bit to see if it stopped gracefully
    sleep 1
    if kill -0 $PID 2>/dev/null; then
        echo "Process didn't exit gracefully, using SIGKILL..."
        kill -9 $PID 2>/dev/null
    fi
done

echo "All MCP Bridge processes stopped."