#!/bin/bash

echo "🚀 Starting Transaction Trends PoC"
echo ""

# Kill any existing processes
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:7071 | xargs kill -9 2>/dev/null || true

# Start API
echo "Starting API server..."
cd api && npm run dev &
API_PID=$!

# Wait a bit
sleep 2

# Start Frontend
echo "Starting Frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servers starting..."
echo ""
echo "API: http://127.0.0.1:7071/api/transactions"
echo "Frontend: http://127.0.0.1:5173"
echo ""
echo "Press Ctrl+C to stop"

# Wait
wait