#!/bin/bash
# Pulser CLI wrapper with MCP integration

# Default config
MCP_HOST="localhost"
MCP_PORT="9090"
CLAUDE_API_KEY=""
MODEL="claude-3-5-sonnet"
START_MCP=false
DEBUG=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mcp-host=*)
      MCP_HOST="${1#*=}"
      shift
      ;;
    --mcp-port=*)
      MCP_PORT="${1#*=}"
      shift
      ;;
    --model=*)
      MODEL="${1#*=}"
      shift
      ;;
    --api-key=*)
      CLAUDE_API_KEY="${1#*=}"
      shift
      ;;
    --start-mcp)
      START_MCP=true
      shift
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
    *)
      # Unknown option or end of options
      break
      ;;
  esac
done

# Determine script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
MCP_SERVER="$SCRIPT_DIR/pulser_mcp_server.py"
AGENT_ROUTER="$SCRIPT_DIR/agent_router.py"
ROUTING_CONFIG="$SCRIPT_DIR/agent_routing.yaml"

# Start MCP server if requested
if [ "$START_MCP" = true ]; then
  echo "Starting MCP server on $MCP_HOST:$MCP_PORT..."
  
  # Check if server is already running
  if nc -z "$MCP_HOST" "$MCP_PORT" 2>/dev/null; then
    echo "MCP server is already running on $MCP_HOST:$MCP_PORT"
  else
    # Start server
    if [ "$DEBUG" = true ]; then
      python3 "$MCP_SERVER" --host "$MCP_HOST" --port "$MCP_PORT" --debug &
    else
      python3 "$MCP_SERVER" --host "$MCP_HOST" --port "$MCP_PORT" > /dev/null 2>&1 &
    fi
    
    MCP_PID=$!
    echo "MCP server started with PID $MCP_PID"
    
    # Wait for server to start
    echo "Waiting for server to start..."
    sleep 2
  fi
fi

# Set up Claude API environment
if [ -n "$CLAUDE_API_KEY" ]; then
  export ANTHROPIC_API_KEY="$CLAUDE_API_KEY"
  echo "Using provided Claude API key"
else
  echo "No API key provided, using existing ANTHROPIC_API_KEY from environment if available"
fi

# Create MCP configuration for Pulser
MCP_CONFIG="{\"host\":\"$MCP_HOST\",\"port\":$MCP_PORT,\"agentConfig\":\"$ROUTING_CONFIG\"}"
export PULSER_MCP_CONFIG="$MCP_CONFIG"

# Display info
echo "╭──────────────────────────────────────────╮"
echo "│   Pulser CLI with MCP Integration         │"
echo "├──────────────────────────────────────────┤"
echo "│ MCP Server: $MCP_HOST:$MCP_PORT              │"
echo "│ Model: $MODEL                 │"
echo "│ Router: ${AGENT_ROUTER##*/}                  │" 
echo "╰──────────────────────────────────────────╯"

# Connect to Claude using curl with MCP integration info
echo "Starting chat with Claude and MCP integration..."
echo "Type your message (press Ctrl+D to submit, Ctrl+C to exit):"
echo ""

# Simple chat loop
while true; do
  # Read multiline input until Ctrl+D
  USER_INPUT=$(cat)
  
  # Exit if empty input (user pressed Ctrl+C)
  if [ -z "$USER_INPUT" ]; then
    break
  fi
  
  # Add MCP routing information
  ROUTING_RESULT=$(python3 -c "
import json, sys
sys.path.append('$SCRIPT_DIR')
from agent_router import AgentRouter
router = AgentRouter('$ROUTING_CONFIG')
result = router.route_task('''$USER_INPUT''')
print(json.dumps(result))
")
  
  # Create request payload with MCP info
  PAYLOAD=$(cat <<EOF
{
  "model": "$MODEL",
  "max_tokens": 4096,
  "messages": [
    {
      "role": "user",
      "content": "$USER_INPUT"
    }
  ],
  "system": "You are Claude, an AI assistant integrated with various environments through the Model Context Protocol (MCP). Based on the user's request, you will be routed to the appropriate environment. You have been routed to: $ROUTING_RESULT"
}
EOF
)

  # Make API call to Claude
  if [ -n "$ANTHROPIC_API_KEY" ]; then
    RESPONSE=$(curl -s "https://api.anthropic.com/v1/messages" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $ANTHROPIC_API_KEY" \
      -H "anthropic-version: 2023-06-01" \
      -d "$PAYLOAD")
    
    # Extract and display the response content
    CONTENT=$(echo "$RESPONSE" | sed -n 's/.*"content":\[{"text":"\(.*\)"}\].*/\1/p' | sed 's/\\n/\n/g' | sed 's/\\"/"/g')
    echo "$CONTENT"
  else
    echo "Error: No Claude API key available. Please provide one with --api-key"
    exit 1
  fi
  
  echo ""
  echo "────────────────────────────────────"
  echo "Type your next message (Ctrl+D to submit, Ctrl+C to exit):"
done

# Cleanup on exit
if [ "$START_MCP" = true ] && [ -n "$MCP_PID" ]; then
  echo "Shutting down MCP server (PID: $MCP_PID)..."
  kill "$MCP_PID" 2>/dev/null
fi

echo "Session ended. Goodbye!"