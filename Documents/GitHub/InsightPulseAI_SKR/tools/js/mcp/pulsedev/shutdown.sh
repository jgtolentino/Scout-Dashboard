#!/bin/bash
# PulseDev Shutdown Script
# Stops all PulseDev servers and cleans up resources

echo "Shutting down PulseDev..."

# Make sure logs directory exists
mkdir -p logs

# Kill backend process
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    echo "Stopping backend server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
    rm logs/backend.pid
else
    echo "Backend PID file not found. Trying to find process..."
    pkill -f "dummy_server.py" || true
fi

# Kill frontend process
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    echo "Stopping frontend server (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || true
    rm logs/frontend.pid
else
    echo "Frontend PID file not found. Trying to find process..."
    pkill -f "dummy_server.js" || true
fi

# Stop Claude MCP bridge if running
if [ -f "logs/claude_bridge.pid" ]; then
    echo "Stopping Claude MCP bridge..."
    ./stop_claude_bridge.sh
fi

# Cleanup any Docker containers
echo "Cleaning up Docker containers..."
docker ps -q --filter "name=pulsedev-*" | xargs -r docker stop >/dev/null 2>&1

echo "PulseDev has been shut down."