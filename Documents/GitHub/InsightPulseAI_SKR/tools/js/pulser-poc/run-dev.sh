#!/bin/bash

# Development runner script - starts both frontend and API

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Transaction Trends PoC...${NC}"

# Kill any existing processes on our ports
echo "Cleaning up any existing processes..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:7071 | xargs kill -9 2>/dev/null || true

# Start API in background
echo -e "${BLUE}Starting API on http://localhost:7071...${NC}"
cd api && func start &
API_PID=$!

# Wait for API to start
sleep 3

# Start frontend
echo -e "${BLUE}Starting Frontend on http://localhost:5173...${NC}"
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}✓ PoC is starting...${NC}"
echo ""
echo "Frontend: http://localhost:5173"
echo "API: http://localhost:7071/api/transactions"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Stopping servers...${NC}"
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    lsof -ti:7071 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓ Servers stopped${NC}"
}

# Set up trap to cleanup on Ctrl+C
trap cleanup EXIT INT TERM

# Wait for both processes
wait $API_PID
wait $FRONTEND_PID