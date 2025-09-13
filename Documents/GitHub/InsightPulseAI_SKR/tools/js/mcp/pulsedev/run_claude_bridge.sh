#!/bin/bash

# Run Claude MCP Bridge for PulseDev
#
# This script starts the Claude MCP bridge service which connects Claude API
# to the Model Context Protocol (MCP) server. It allows PulseDev to use Claude's
# capabilities for code assistance, generation, and debugging.

# Default environment variables
export MCP_HOST=${MCP_HOST:-"localhost"}
export MCP_PORT=${MCP_PORT:-8765}

# Check for Claude API key
if [ -z "$CLAUDE_API_KEY" ]; then
    if [ -f ".env" ]; then
        # Load from .env file if exists
        source .env
    fi
    
    # If still not set, prompt user
    if [ -z "$CLAUDE_API_KEY" ]; then
        echo -e "\033[1;33mCLAUDE_API_KEY is not set. Please enter your Claude API key:\033[0m"
        read -s CLAUDE_API_KEY
        export CLAUDE_API_KEY
    fi
fi

# Activate virtual environment if exists
if [ -d "backend/venv" ]; then
    echo "Activating virtual environment..."
    source backend/venv/bin/activate
fi

# Check for required packages
if ! pip list | grep -q "anthropic"; then
    echo "Installing required packages..."
    pip install anthropic websockets httpx
fi

# Start the Claude MCP bridge
echo "Starting Claude MCP Bridge..."
echo "Connecting to MCP server at ${MCP_HOST}:${MCP_PORT}"

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the bridge in the background
python -m backend.services.claude_mcp_bridge > logs/claude_bridge.log 2>&1 &

# Save the PID to a file
echo $! > logs/claude_bridge.pid

echo "Claude MCP Bridge started with PID $(cat logs/claude_bridge.pid)"
echo "Logs available at logs/claude_bridge.log"