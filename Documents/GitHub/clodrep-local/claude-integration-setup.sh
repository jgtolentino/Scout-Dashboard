#!/bin/bash

echo "🌉 Claude.ai Integration Setup for Clodrep Local CLI"
echo "=================================================="
echo ""

# Check if bridge token exists
if [ -z "$BRIDGE_SECRET" ]; then
    echo "🔐 Generating bridge token..."
    export BRIDGE_SECRET=$(openssl rand -hex 16)
    echo "Bridge token: $BRIDGE_SECRET"
    echo ""
    echo "💾 Save this token! Add to your shell profile:"
    echo "export BRIDGE_SECRET=$BRIDGE_SECRET"
    echo ""
fi

# Check for tunnel tools
echo "🔍 Checking for tunnel tools..."

TUNNEL_CMD=""
if command -v cloudflared &> /dev/null; then
    echo "✓ Cloudflare Tunnel found"
    TUNNEL_CMD="cloudflared"
elif command -v ngrok &> /dev/null; then
    echo "✓ ngrok found"
    TUNNEL_CMD="ngrok"
else
    echo "⚠ No tunnel tool found. Install one of:"
    echo "  • Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    echo "  • ngrok: https://ngrok.com/download"
    echo ""
fi

# Start bridge server in background
echo "🚀 Starting MCP bridge server..."
./bin/run bridge start --port 3000 --token $BRIDGE_SECRET &
BRIDGE_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✓ Bridge server running on port 3000"
else
    echo "✗ Failed to start bridge server"
    kill $BRIDGE_PID 2>/dev/null
    exit 1
fi

# Start tunnel if available
if [ "$TUNNEL_CMD" = "cloudflared" ]; then
    echo "🌐 Starting Cloudflare Tunnel..."
    echo "Run this command in another terminal:"
    echo "cloudflared tunnel --url http://localhost:3000"
    echo ""
elif [ "$TUNNEL_CMD" = "ngrok" ]; then
    echo "🌐 Starting ngrok tunnel..."
    echo "Run this command in another terminal:"
    echo "ngrok http 3000"
    echo ""
fi

# Show integration instructions
echo "📋 Claude.ai Integration Instructions:"
echo "======================================"
echo ""
echo "1. Create a secure tunnel (in another terminal):"
if [ "$TUNNEL_CMD" = "cloudflared" ]; then
    echo "   cloudflared tunnel --url http://localhost:3000"
elif [ "$TUNNEL_CMD" = "ngrok" ]; then
    echo "   ngrok http 3000"
else
    echo "   Install cloudflared or ngrok first"
fi
echo ""

echo "2. Copy the HTTPS URL from the tunnel output"
echo "   Example: https://abc123.trycloudflare.com"
echo ""

echo "3. Add Custom Integration in Claude.ai:"
echo "   • Go to Claude.ai → Settings → Integrations"
echo "   • Click 'Add Custom Integration'"
echo "   • Fill in:"
echo "     Integration name: Clodrep Local Tools"
echo "     Integration URL: [TUNNEL_URL]/mcp"
echo "     Custom headers:"
echo "       Key: X-Bridge-Token"
echo "       Value: $BRIDGE_SECRET"
echo ""

echo "4. Test the integration:"
echo "   • Open a chat in Claude.ai"
echo "   • Type: 'Can you read my package.json file?'"
echo "   • Claude should use your local tools!"
echo ""

echo "🎯 Quick Test Commands:"
echo "curl http://localhost:3000/health"
echo "curl http://localhost:3000/metadata"
echo ""

echo "💡 Troubleshooting:"
echo "• URL unreachable: Use HTTPS tunnel URL, not localhost"
echo "• 401 Unauthorized: Check X-Bridge-Token header matches"
echo "• Tools don't appear: Verify /metadata endpoint returns tools"
echo ""

echo "Press Ctrl+C to stop the bridge server"
echo "Bridge PID: $BRIDGE_PID"

# Wait for user to stop
trap "echo '🛑 Stopping bridge server...'; kill $BRIDGE_PID 2>/dev/null; exit 0" INT
wait $BRIDGE_PID