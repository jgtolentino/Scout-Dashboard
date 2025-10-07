#!/bin/bash

echo "🔍 Integration Status Check"
echo "=========================="
echo ""

# Load current config
if [[ -f .integration-info ]]; then
    source .integration-info
    echo "✅ Integration info found"
    echo ""
else
    echo "❌ No integration info found. Run ./start-integration-background.sh first"
    exit 1
fi

# Check processes
echo "📊 Process Status:"
if kill -0 $BRIDGE_PID 2>/dev/null; then
    echo "✅ Bridge is running (PID: $BRIDGE_PID)"
else
    echo "❌ Bridge is NOT running"
fi

if kill -0 $NGROK_PID 2>/dev/null; then
    echo "✅ Ngrok is running (PID: $NGROK_PID)"
else
    echo "❌ Ngrok is NOT running"
fi
echo ""

# Test endpoints
echo "🧪 Testing endpoints:"
echo ""

echo "1. Local bridge:"
if curl -sf http://localhost:3000/health >/dev/null; then
    echo "   ✅ http://localhost:3000/health - OK"
else
    echo "   ❌ http://localhost:3000/health - FAILED"
fi

echo ""
echo "2. Public tunnel:"
if curl -sf $PUBLIC_URL/health >/dev/null; then
    echo "   ✅ $PUBLIC_URL/health - OK"
else
    echo "   ❌ $PUBLIC_URL/health - FAILED"
fi

echo ""
echo "3. Metadata endpoint:"
METADATA=$(curl -sf $PUBLIC_URL/metadata)
if [[ -n "$METADATA" ]]; then
    echo "   ✅ $PUBLIC_URL/metadata - OK"
    echo "   Response: $(echo $METADATA | jq -c .)"
else
    echo "   ❌ $PUBLIC_URL/metadata - FAILED"
fi

echo ""
echo "4. MCP preflight (HEAD):"
if curl -sf -I $PUBLIC_URL/mcp | grep -q "200"; then
    echo "   ✅ HEAD $PUBLIC_URL/mcp - Returns 200"
else
    echo "   ❌ HEAD $PUBLIC_URL/mcp - FAILED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 CLAUDE.AI INTEGRATION VALUES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Integration URL:  $PUBLIC_URL/mcp"
echo "Header Key:       X-Bridge-Token"
echo "Header Value:     $BRIDGE_SECRET"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"