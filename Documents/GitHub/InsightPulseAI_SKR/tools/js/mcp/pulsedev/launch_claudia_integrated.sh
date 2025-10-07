#!/bin/bash
# launch_claudia_integrated.sh - Start PulseDev with Claudia and Kalaw integration
# 
# This script launches PulseDev with full agent-layer integration via Claudia and
# SKR knowledge tagging via Kalaw.

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
LOG_DIR="$SCRIPT_DIR/logs"
BACKEND_PID_FILE="$LOG_DIR/backend.pid"
FRONTEND_PID_FILE="$LOG_DIR/frontend.pid"
MCP_BRIDGE_PID_FILE="$LOG_DIR/mcp_bridge.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
MCP_BRIDGE_LOG="$LOG_DIR/mcp_bridge.log"
CLAUDIA_LOG="$LOG_DIR/claudia_mcp.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Check if PulseDev is already running
if [ -f "$BACKEND_PID_FILE" ]; then
    PID=$(cat "$BACKEND_PID_FILE")
    if ps -p $PID > /dev/null; then
        echo -e "${YELLOW}PulseDev backend is already running (PID: $PID)${NC}"
        echo -e "${YELLOW}Run ./shutdown.sh to stop it first${NC}"
        exit 1
    fi
fi

# Check if frontend is already running
if [ -f "$FRONTEND_PID_FILE" ]; then
    PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p $PID > /dev/null; then
        echo -e "${YELLOW}PulseDev frontend is already running (PID: $PID)${NC}"
        echo -e "${YELLOW}Run ./shutdown.sh to stop it first${NC}"
        exit 1
    fi
fi

# Check if MCP bridge is already running
if [ -f "$MCP_BRIDGE_PID_FILE" ]; then
    PID=$(cat "$MCP_BRIDGE_PID_FILE")
    if ps -p $PID > /dev/null; then
        echo -e "${YELLOW}MCP bridge is already running (PID: $PID)${NC}"
        echo -e "${YELLOW}Run ./stop_claude_bridge.sh to stop it first${NC}"
        exit 1
    fi
fi

echo -e "${BOLD}Starting PulseDev with Claudia and Kalaw Integration${NC}"
echo

# Register with Kalaw
echo -e "${BOLD}Step 1: Registering with Kalaw knowledge system${NC}"
$SCRIPT_DIR/register_with_kalaw.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to register with Kalaw${NC}"
    echo -e "${YELLOW}Continuing without Kalaw registration...${NC}"
fi
echo

# Start backend server
echo -e "${BOLD}Step 2: Starting backend server${NC}"
cd "$SCRIPT_DIR/backend"

# Activate virtual environment if available
if [ -d "venv" ]; then
    source venv/bin/activate
    echo -e "${GREEN}Virtual environment activated${NC}"
fi

# Use the updated main.py with Claudia integration
echo -e "${YELLOW}Using main_updated.py with Claudia integration...${NC}"
cp main_updated.py main.py

# Start the backend server
python main.py > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"
echo -e "${GREEN}Backend server started (PID: $BACKEND_PID)${NC}"
echo -e "Logs: $BACKEND_LOG"
echo

# Start frontend server
echo -e "${BOLD}Step 3: Starting frontend server${NC}"
cd "$SCRIPT_DIR/frontend"

# Run development server if package.json exists
if [ -f "package.json" ]; then
    npm run dev > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    echo -e "${GREEN}Frontend server started (PID: $FRONTEND_PID)${NC}"
    echo -e "Logs: $FRONTEND_LOG"
else
    echo -e "${YELLOW}No package.json found in frontend directory${NC}"
    echo -e "${YELLOW}Skipping frontend server start${NC}"
fi
echo

# Start MCP bridge
echo -e "${BOLD}Step 4: Starting MCP bridge${NC}"
cd "$SCRIPT_DIR"

# Run MCP bridge
python -m backend.services.claudia_mcp_bridge > "$MCP_BRIDGE_LOG" 2>&1 &
MCP_BRIDGE_PID=$!
echo $MCP_BRIDGE_PID > "$MCP_BRIDGE_PID_FILE"
echo -e "${GREEN}MCP bridge started (PID: $MCP_BRIDGE_PID)${NC}"
echo -e "Logs: $MCP_BRIDGE_LOG"
echo

# Check if services started successfully
sleep 2

# Check backend
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend server running (PID: $BACKEND_PID)"
else
    echo -e "${RED}✗${NC} Backend server failed to start"
    echo -e "${YELLOW}Check logs: $BACKEND_LOG${NC}"
fi

# Check frontend
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${GREEN}✓${NC} Frontend server running (PID: $FRONTEND_PID)"
    else
        echo -e "${RED}✗${NC} Frontend server failed to start"
        echo -e "${YELLOW}Check logs: $FRONTEND_LOG${NC}"
    fi
fi

# Check MCP bridge
if ps -p $MCP_BRIDGE_PID > /dev/null; then
    echo -e "${GREEN}✓${NC} MCP bridge running (PID: $MCP_BRIDGE_PID)"
else
    echo -e "${RED}✗${NC} MCP bridge failed to start"
    echo -e "${YELLOW}Check logs: $MCP_BRIDGE_LOG${NC}"
fi

echo
echo -e "${BOLD}PulseDev with Claudia Integration is now running!${NC}"
echo -e "${BOLD}Access URLs:${NC}"
echo -e "- Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "- API: ${BLUE}http://localhost:8000/api${NC}"
echo -e "- Claudia API: ${BLUE}http://localhost:8000/api/claudia${NC}"
echo -e "- MCP Prompts Status: ${BLUE}http://localhost:8000/api/claudia/status${NC}"
echo
echo -e "Use ${GREEN}./shutdown.sh${NC} to stop all services"