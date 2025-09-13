#!/bin/bash

echo "🧪 Testing MCP Bridge Endpoints"
echo "=============================="
echo ""

# Start the bridge in background
echo "Starting bridge server..."
BRIDGE_SECRET="test-token-123" node quick-bridge.cjs &
BRIDGE_PID=$!

# Wait for it to start
sleep 2

echo "Testing endpoints:"
echo ""

# Test health (no auth needed)
echo "1. GET /health (no auth):"
curl -s http://localhost:3000/health
echo -e "\n"

# Test metadata (no auth needed)
echo "2. GET /metadata (no auth):"
curl -s http://localhost:3000/metadata | python3 -m json.tool
echo -e "\n"

# Test MCP without auth (should fail)
echo "3. POST /mcp (no auth) - should return 401:"
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"ping"}' \
  -w "\nHTTP Status: %{http_code}\n"
echo ""

# Test MCP with auth (should work)
echo "4. POST /mcp (with auth):"
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "X-Bridge-Token: test-token-123" \
  -d '{"jsonrpc":"2.0","id":1,"method":"ping"}' | python3 -m json.tool
echo ""

# Cleanup
echo "Stopping bridge server..."
kill $BRIDGE_PID 2>/dev/null
echo "✅ Tests complete"