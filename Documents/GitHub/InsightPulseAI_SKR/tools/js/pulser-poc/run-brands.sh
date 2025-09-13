#!/bin/bash

echo "🚀 Starting Brand Performance Dashboard"
echo ""

# Kill any existing processes
lsof -ti:7072 | xargs kill -9 2>/dev/null || true

# Start Brands API
echo "Starting Brands API server..."
cd api && node brands-server.js &
API_PID=$!

# Wait a bit
sleep 2

echo ""
echo "✅ Brands API running at:"
echo "   http://127.0.0.1:7072/api/brands/kpis"
echo "   http://127.0.0.1:7072/api/brands/market-share"
echo "   http://127.0.0.1:7072/api/brands/movers"
echo "   http://127.0.0.1:7072/api/brands/leaderboard"
echo "   http://127.0.0.1:7072/api/brands/insights"
echo ""
echo "To use with frontend:"
echo "1. Update frontend/src/main.tsx to import BrandsDashboard"
echo "2. Run: cd frontend && npm run dev"
echo ""
echo "Press Ctrl+C to stop"

# Wait
wait