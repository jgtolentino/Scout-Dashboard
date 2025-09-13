#!/bin/bash

# Stop Claude MCP Bridge for PulseDev
#
# This script stops the Claude MCP bridge service.

# Check if PID file exists
if [ -f "logs/claude_bridge.pid" ]; then
    PID=$(cat logs/claude_bridge.pid)
    
    # Check if process is running
    if ps -p $PID > /dev/null; then
        echo "Stopping Claude MCP Bridge (PID: $PID)..."
        kill $PID
        
        # Wait for process to stop
        for i in {1..5}; do
            if ! ps -p $PID > /dev/null; then
                echo "Claude MCP Bridge stopped"
                rm logs/claude_bridge.pid
                exit 0
            fi
            sleep 1
        done
        
        # Force kill if still running
        echo "Force stopping Claude MCP Bridge (PID: $PID)..."
        kill -9 $PID
        rm logs/claude_bridge.pid
        echo "Claude MCP Bridge force stopped"
    else
        echo "Claude MCP Bridge is not running (PID: $PID not found)"
        rm logs/claude_bridge.pid
    fi
else
    echo "Claude MCP Bridge is not running (PID file not found)"
fi