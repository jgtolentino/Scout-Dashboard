#!/bin/bash
# Script to start the official MCP server following Anthropic's documentation

# Color formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create .mcp directory if it doesn't exist
mkdir -p ~/.mcp

# First, kill any existing MCP processes
echo -e "${BLUE}Stopping any existing MCP processes...${NC}"
pkill -f "node.*official-mcp-server.js" 2>/dev/null || true
pkill -f ngrok 2>/dev/null || true
sleep 1

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed.${NC}"
  echo -e "Please install Node.js from https://nodejs.org/"
  exit 1
fi

# Make the script executable
chmod +x official-mcp-server.js

# Start the MCP server
echo -e "${BLUE}Starting official MCP server...${NC}"
node official-mcp-server.js > ~/.mcp/mcp-output.log 2>&1 &
MCP_PID=$!

# Give the server a moment to start
sleep 2

# Check if the server started successfully
if ! ps -p $MCP_PID > /dev/null; then
  echo -e "${RED}Failed to start MCP server. Check logs at ~/.mcp/mcp-output.log${NC}"
  exit 1
fi

# Check if server is responding
HEALTH_CHECK=$(curl -s http://localhost:9315/health || echo "failed")
if [[ "$HEALTH_CHECK" != *'"status":"ok"'* ]]; then
  echo -e "${RED}MCP server not responding correctly to health check: $HEALTH_CHECK${NC}"
  echo -e "Check logs at ~/.mcp/mcp-output.log"
  exit 1
fi

# If ngrok is installed, offer to start it
if command -v ngrok &> /dev/null; then
  echo -e "${YELLOW}Would you like to start an HTTPS tunnel using ngrok for Claude Web? (y/n)${NC}"
  read -r use_ngrok
  
  if [[ "$use_ngrok" =~ ^[Yy]$ ]]; then
    # Check if ngrok is authenticated
    if ! ngrok config check 2>/dev/null | grep -q "authtoken"; then
      echo -e "${YELLOW}Ngrok requires authentication. Please enter your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken${NC}"
      read -r ngrok_token
      ngrok config add-authtoken "$ngrok_token"
    fi
    
    # Start ngrok in a new terminal window (macOS specific)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS approach
      osascript -e "tell app \"Terminal\" to do script \"cd $(pwd) && ngrok http 9315\"" &
      echo -e "${GREEN}Started ngrok in a new terminal window.${NC}"
      sleep 5
      
      # Try to get the ngrok URL
      NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | grep -o 'https://[^"]*' || echo "unknown")
      
      if [[ "$NGROK_URL" != "unknown" ]]; then
        echo -e "${GREEN}Ngrok tunnel established:${NC} $NGROK_URL"
      else
        echo -e "${YELLOW}Ngrok tunnel started, but couldn't retrieve URL.${NC}"
        echo -e "Check the ngrok terminal window for the HTTPS URL."
      fi
    else
      # Linux/other approach
      echo -e "${YELLOW}Starting ngrok. Check the output below for your HTTPS URL:${NC}"
      ngrok http 9315 &
      sleep 5
    fi
  fi
fi

# Print success message
echo -e "\n${GREEN}MCP server is running successfully!${NC}"
echo -e "Health check endpoint: ${GREEN}http://localhost:9315/health${NC}"
echo -e "Capabilities endpoint: ${GREEN}http://localhost:9315/capabilities${NC}"
echo -e "Authentication token: ${GREEN}claude-code-cli-token${NC}\n"

echo -e "${BLUE}To connect Claude Desktop:${NC}"
echo -e "1. Open Claude Desktop"
echo -e "2. Go to Settings → Integrations"
echo -e "3. Add integration with these details:"
echo -e "   ${YELLOW}Name:${NC} Claude Code CLI"
echo -e "   ${YELLOW}URL:${NC}  http://localhost:9315"
echo -e "   ${YELLOW}Token:${NC} claude-code-cli-token"

if [[ -n "$NGROK_URL" && "$NGROK_URL" != "unknown" ]]; then
  echo -e "\n${BLUE}To connect Claude Web:${NC}"
  echo -e "1. Open Claude Web (https://claude.ai)"
  echo -e "2. Go to Settings → Developer → Add MCP server"
  echo -e "3. Add with these details:"
  echo -e "   ${YELLOW}Name:${NC} Claude Code CLI"
  echo -e "   ${YELLOW}URL:${NC}  $NGROK_URL"
  echo -e "   ${YELLOW}Token:${NC} claude-code-cli-token"
elif [[ "$use_ngrok" =~ ^[Yy]$ ]]; then
  echo -e "\n${BLUE}To connect Claude Web:${NC}"
  echo -e "1. Open Claude Web (https://claude.ai)"
  echo -e "2. Go to Settings → Developer → Add MCP server"
  echo -e "3. Add with these details:"
  echo -e "   ${YELLOW}Name:${NC} Claude Code CLI"
  echo -e "   ${YELLOW}URL:${NC}  [Copy the HTTPS URL from the ngrok terminal]"
  echo -e "   ${YELLOW}Token:${NC} claude-code-cli-token"
fi

echo -e "\n${BLUE}To stop the server:${NC}"
echo -e "${YELLOW}pkill -f \"node.*official-mcp-server.js\"${NC}"
echo -e "${YELLOW}pkill -f ngrok${NC} (if using ngrok)\n"