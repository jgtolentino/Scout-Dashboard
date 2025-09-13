#!/bin/bash
# Script to create the Pulser Robot in 3D via the MCP system

# Check if Blender is installed
if ! command -v blender &> /dev/null; then
    echo "Error: Blender is not installed or not in the PATH."
    echo "Please install Blender to create the 3D Pulser robot."
    exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROBOT_SCRIPT="$SCRIPT_DIR/pulser_robot_3d.py"

# Install required Python packages for Blender
echo "Installing required Python packages for Blender..."
python3 -m pip install pillow websocket-client

# Start MCP server if not already running
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

# Choose between methods
METHOD=${1:-"direct"}

case $METHOD in
    "direct")
        echo "Creating Pulser Robot directly in Blender..."
        blender --background --python "$ROBOT_SCRIPT"
        echo "Pulser Robot created! Check $SCRIPT_DIR/pulser_robot.png"
        ;;
    "mcp")
        echo "Creating Pulser Robot via MCP..."
        python3 "$SCRIPT_DIR/pulser_robot_cmd.py" --render --output "$SCRIPT_DIR/pulser_robot_mcp.png"
        ;;
    *)
        echo "Unknown method: $METHOD"
        echo "Available methods: direct, mcp"
        exit 1
        ;;
esac

# View the result if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ "$METHOD" == "direct" ]; then
        open "$SCRIPT_DIR/pulser_robot.png"
    else
        open "$SCRIPT_DIR/pulser_robot_mcp.png"
    fi
fi

echo "Done!"