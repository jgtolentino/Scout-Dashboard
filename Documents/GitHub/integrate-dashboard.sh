#!/bin/bash
# integrate-dashboard.sh - Integrate retail-insight-pilot frontend with client backend

echo "🔧 TBWA Dashboard Integration Script"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Paths
FRONTEND_DIR="/Users/tbwa/Documents/GitHub/retail-insight-pilot-project"
BACKEND_DIR="/Users/tbwa/Documents/GitHub/client"

# 1. Build the frontend
echo -e "\n${YELLOW}📦 Building retail-insight-pilot frontend...${NC}"
cd "$FRONTEND_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build the frontend
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# 2. Copy built files to backend
echo -e "\n${YELLOW}📋 Copying frontend to backend...${NC}"

# Clean old public directory
rm -rf "$BACKEND_DIR/public"
mkdir -p "$BACKEND_DIR/public"

# Copy the built files
cp -r "$FRONTEND_DIR/dist/"* "$BACKEND_DIR/public/"

echo -e "${GREEN}✅ Frontend files copied${NC}"

# 3. Test the integration locally
echo -e "\n${YELLOW}🧪 Testing integration...${NC}"
cd "$BACKEND_DIR"

# Start the backend server in background
echo "Starting backend server..."
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test the endpoints
echo -e "\n${YELLOW}Testing endpoints...${NC}"

# Test health endpoint
echo -n "Health check: "
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Test dashboard endpoint
echo -n "Dashboard API: "
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/dashboard)
if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Test frontend
echo -n "Frontend: "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
fi

# Kill the test server
kill $SERVER_PID 2>/dev/null

# 4. Summary
echo -e "\n${GREEN}🎉 Integration Complete!${NC}"
echo "========================"
echo ""
echo "To run locally:"
echo "  cd $BACKEND_DIR"
echo "  npm start"
echo ""
echo "Then visit: http://localhost:8080"
echo ""
echo "To deploy to Azure:"
echo "  cd $BACKEND_DIR"
echo "  npm run deploy:smart"
echo ""
echo "The frontend will automatically connect to the backend API!"