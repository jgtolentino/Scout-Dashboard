#!/bin/bash

# Simple API test script

echo "🧪 Testing Transaction Trends API"
echo ""
echo "Starting API server..."

# Start API in background
cd api && func start &
API_PID=$!

# Wait for API to start
echo "Waiting for API to start..."
sleep 5

# Test the endpoint
echo ""
echo "Testing /api/transactions endpoint..."
echo "URL: http://127.0.0.1:7071/api/transactions"
echo ""

# Make request and format with jq
curl -s http://127.0.0.1:7071/api/transactions | jq '.[0:3]'

echo ""
echo "✅ API test complete"

# Kill the API server
kill $API_PID 2>/dev/null

echo "API server stopped"