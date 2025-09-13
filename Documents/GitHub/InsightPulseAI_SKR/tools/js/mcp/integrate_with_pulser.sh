#!/bin/bash
# Integrate MCP with Pulser CLI

# Configuration
MCP_HOST="localhost"
MCP_PORT="9090"
ZSHRC_PATH="$HOME/.zshrc"
BASHRC_PATH="$HOME/.bashrc"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Display header
echo "╭──────────────────────────────────────────╮"
echo "│   MCP Integration with Pulser CLI         │"
echo "├──────────────────────────────────────────┤"
echo "│ This script will:                         │"
echo "│ 1. Start the MCP server                   │"
echo "│ 2. Add MCP aliases to your shell config   │"
echo "│ 3. Set up integration with Pulser CLI     │"
echo "╰──────────────────────────────────────────╯"

# Check for dependencies
echo "Checking dependencies..."
for cmd in python3 nc curl; do
  if ! command -v $cmd &> /dev/null; then
    echo "Error: $cmd is required but not installed"
    exit 1
  fi
done

# Install Python dependencies
echo "Installing required Python packages..."
pip install websockets pyyaml asyncio aiohttp

# Start MCP server in background
echo "Starting MCP server on $MCP_HOST:$MCP_PORT..."
if nc -z "$MCP_HOST" "$MCP_PORT" 2>/dev/null; then
  echo "MCP server is already running on $MCP_HOST:$MCP_PORT"
else
  nohup python3 "$SCRIPT_DIR/pulser_mcp_server.py" --host "$MCP_HOST" --port "$MCP_PORT" > "$SCRIPT_DIR/mcp_server.log" 2>&1 &
  MCP_PID=$!
  echo $MCP_PID > "$SCRIPT_DIR/mcp_server.pid"
  echo "MCP server started with PID $MCP_PID"
  
  # Wait for server to start
  echo "Waiting for server to start..."
  sleep 2
  
  # Check if server is running
  if ! nc -z "$MCP_HOST" "$MCP_PORT" 2>/dev/null; then
    echo "Warning: MCP server might not have started correctly"
    echo "Check the log at $SCRIPT_DIR/mcp_server.log"
  else
    echo "MCP server is running"
  fi
fi

# Create shell aliases
ALIASES=$(cat <<EOF

# Pulser MCP integration
alias pulser-mcp="$SCRIPT_DIR/run.sh"
alias pulser-mcp-test="$SCRIPT_DIR/test_agent_router.py"
alias pulser-mcp-stop="pkill -f pulser_mcp_server.py"
alias pulser-with-mcp="pulser -r claude --mcp=localhost:9090"

# Function to run Pulser with MCP integration
pulser_mcp() {
  export PULSER_MCP_ENABLED=true
  export PULSER_MCP_HOST="$MCP_HOST"
  export PULSER_MCP_PORT="$MCP_PORT"
  pulser "\$@"
}
EOF
)

# Add aliases to shell config files
echo "Adding aliases to shell config files..."

# Check for zsh
if [ -f "$ZSHRC_PATH" ]; then
  if ! grep -q "Pulser MCP integration" "$ZSHRC_PATH"; then
    echo "$ALIASES" >> "$ZSHRC_PATH"
    echo "Added MCP aliases to $ZSHRC_PATH"
  else
    echo "MCP aliases already exist in $ZSHRC_PATH"
  fi
fi

# Check for bash
if [ -f "$BASHRC_PATH" ]; then
  if ! grep -q "Pulser MCP integration" "$BASHRC_PATH"; then
    echo "$ALIASES" >> "$BASHRC_PATH"
    echo "Added MCP aliases to $BASHRC_PATH"
  else
    echo "MCP aliases already exist in $BASHRC_PATH"
  fi
fi

# Create .pulserrc file with MCP configuration
PULSERRC_PATH="$HOME/.pulserrc"
MCP_CONFIG=$(cat <<EOF
# MCP Configuration
mcp:
  enabled: true
  host: "$MCP_HOST"
  port: $MCP_PORT
  routing_config: "$SCRIPT_DIR/agent_routing.yaml"
  fallback_agent: "Claudia"
EOF
)

if [ -f "$PULSERRC_PATH" ]; then
  if ! grep -q "MCP Configuration" "$PULSERRC_PATH"; then
    echo "$MCP_CONFIG" >> "$PULSERRC_PATH"
    echo "Added MCP configuration to $PULSERRC_PATH"
  else
    echo "MCP configuration already exists in $PULSERRC_PATH"
  fi
else
  echo "$MCP_CONFIG" > "$PULSERRC_PATH"
  echo "Created $PULSERRC_PATH with MCP configuration"
fi

# Create symbolic link to make MCP available to Pulser
PULSER_DIR="$HOME/.pulser"
if [ ! -d "$PULSER_DIR" ]; then
  mkdir -p "$PULSER_DIR"
fi

# Create MCP directory in Pulser
PULSER_MCP_DIR="$PULSER_DIR/mcp"
if [ ! -d "$PULSER_MCP_DIR" ]; then
  mkdir -p "$PULSER_MCP_DIR"
fi

# Link key MCP files to Pulser directory
ln -sf "$SCRIPT_DIR/agent_routing.yaml" "$PULSER_MCP_DIR/agent_routing.yaml"
ln -sf "$SCRIPT_DIR/agent_router.py" "$PULSER_MCP_DIR/agent_router.py"
ln -sf "$SCRIPT_DIR/pulser_mcp_server.py" "$PULSER_MCP_DIR/server.py"
ln -sf "$SCRIPT_DIR/run.sh" "$PULSER_MCP_DIR/run.sh"

# Create indicator file for Pulser to detect MCP
echo "enabled: true" > "$PULSER_MCP_DIR/mcp_enabled.yaml"

echo "╭──────────────────────────────────────────╮"
echo "│   Integration Complete!                   │"
echo "├──────────────────────────────────────────┤"
echo "│ Commands available:                       │"
echo "│                                           │"
echo "│ pulser-mcp        - Start MCP server      │"
echo "│ pulser-mcp-test   - Test routing system   │"
echo "│ pulser-mcp-stop   - Stop MCP server       │"
echo "│ pulser-with-mcp   - Run Pulser with MCP   │"
echo "│                                           │"
echo "│ Important: Restart your shell or run:     │"
echo "│ source ~/.zshrc (or ~/.bashrc)           │"
echo "╰──────────────────────────────────────────╯"