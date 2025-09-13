#!/bin/bash

echo "🔧 Starting Clodrep Workflow Engine"
echo "=================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🚀 Starting server on port 4000..."
echo ""
echo "📡 API: http://localhost:4000/api"
echo "🎨 Designer: http://localhost:4000"
echo "🔌 WebSocket: ws://localhost:4000/ws"
echo ""

node src/server.js