#!/bin/bash
# Launch script for MCP system

echo "Setting up MCP environment..."

# Install required packages
pip install websockets pyyaml asyncio aiohttp

# Set paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
SERVER_SCRIPT="$SCRIPT_DIR/pulser_mcp_server.py"
ROUTER_SCRIPT="$SCRIPT_DIR/agent_router.py"
CONFIG="$SCRIPT_DIR/agent_routing.yaml"

# Launch MCP server
echo "Starting MCP server..."
python3 "$SERVER_SCRIPT" --host localhost --port 9090 --debug &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Launch Blender bridge if Blender is available
if command -v blender &> /dev/null; then
    echo "Starting Blender MCP bridge..."
    blender --background --python "$SCRIPT_DIR/blender_mcp_bridge.py" &
    BLENDER_PID=$!
fi

# Launch VS Code bridge if code extension is available
if [ -d "$HOME/.vscode/extensions" ]; then
    echo "VS Code extension bridge would be activated via VS Code extension"
    echo "To install the extension, run the following in VS Code:"
    echo "  code --install-extension $SCRIPT_DIR/vscode_mcp_bridge.js"
fi

echo "MCP system is running!"
echo "Server PID: $SERVER_PID"
[ -n "$BLENDER_PID" ] && echo "Blender Bridge PID: $BLENDER_PID"
echo ""
echo "To use the system:"
echo "1. Connect with Claudia or Claude using the CLI"
echo "2. Tasks will be automatically routed based on your input"
echo "3. Press Ctrl+C to stop the MCP system"

# Wait for Ctrl+C
trap "echo 'Shutting down MCP system...'; kill $SERVER_PID 2>/dev/null; [ -n \"$BLENDER_PID\" ] && kill $BLENDER_PID 2>/dev/null" INT
wait