#!/bin/bash
# run-dev.sh - Run frontend and backend in development mode

echo "🚀 TBWA Dashboard Development Mode"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Start backend
echo -e "${YELLOW}Starting backend on port 8080...${NC}"
cd /Users/tbwa/Documents/GitHub/client
node server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend dev server
echo -e "${YELLOW}Starting frontend dev server on port 5173...${NC}"
cd /Users/tbwa/Documents/GitHub/retail-insight-pilot-project

# Update .env to point to local backend
echo "VITE_API_URL=http://localhost:8080/api" > .env

npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo -e "\n${GREEN}✅ Development servers running!${NC}"
echo "================================"
echo -e "Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "Backend API: ${BLUE}http://localhost:8080/api${NC}"
echo -e "Health Check: ${BLUE}http://localhost:8080/api/health${NC}"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
wait