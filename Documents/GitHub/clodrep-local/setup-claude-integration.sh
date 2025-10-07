#!/bin/bash

echo "🌉 Claude.ai Integration Quick Setup"
echo "===================================="
echo ""

# Set up bridge token
if [ -z "$BRIDGE_SECRET" ]; then
    echo "🔐 Generating bridge token..."
    export BRIDGE_SECRET=$(openssl rand -hex 16)
    echo "Bridge token: $BRIDGE_SECRET"
    echo ""
    echo "💾 To persist this token, add to your shell profile:"
    echo "export BRIDGE_SECRET=$BRIDGE_SECRET"
    echo ""
else
    echo "✅ Using existing bridge token: $BRIDGE_SECRET"
    echo ""
fi

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Check for tunnel tools
TUNNEL_AVAILABLE=false
if command -v cloudflared &> /dev/null; then
    echo "✅ Cloudflare Tunnel found"
    TUNNEL_CMD="cloudflared tunnel --url http://localhost:3000"
    TUNNEL_AVAILABLE=true
elif command -v ngrok &> /dev/null; then
    echo "✅ ngrok found"
    TUNNEL_CMD="ngrok http 3000"
    TUNNEL_AVAILABLE=true
else
    echo "⚠️  No tunnel tool found"
    echo "Install one of these to expose your bridge to the internet:"
    echo "• Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    echo "• ngrok: https://ngrok.com/download"
    echo ""
fi

# Start the quick bridge
echo "🚀 Starting Quick MCP Bridge..."
node quick-bridge.js &
BRIDGE_PID=$!

# Wait for server to start
sleep 2

# Test the bridge
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Bridge server is running on port 3000"
else
    echo "❌ Failed to start bridge server"
    kill $BRIDGE_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🌐 Next Steps:"
echo "=============="
echo ""

if [ "$TUNNEL_AVAILABLE" = true ]; then
    echo "1️⃣  Create a secure tunnel (run in another terminal):"
    echo "    $TUNNEL_CMD"
    echo ""
else
    echo "1️⃣  Install a tunnel tool first:"
    echo "    # Cloudflare Tunnel (recommended)"
    echo "    brew install cloudflare/cloudflare/cloudflared"
    echo "    # OR ngrok"
    echo "    brew install ngrok/ngrok/ngrok"
    echo ""
    echo "    Then run: cloudflared tunnel --url http://localhost:3000"
    echo ""
fi

echo "2️⃣  Copy the HTTPS URL from tunnel output"
echo "    Example: https://abc123.trycloudflare.com"
echo ""

echo "3️⃣  Add Custom Integration in Claude.ai:"
echo "    • Go to Claude.ai → Settings → Custom Integrations (β)"
echo "    • Click 'Add Custom Integration'"
echo "    • Fill in:"
echo "      Integration name: Clodrep Local Tools"
echo "      Integration URL: [TUNNEL_URL]/mcp"
echo "      Custom headers:"
echo "        Key: X-Bridge-Token"
echo "        Value: $BRIDGE_SECRET"
echo ""

echo "4️⃣  Test the connection:"
echo "    • The integration should show 'Connected'"
echo "    • In a chat, ask: 'Can you read my package.json file?'"
echo "    • Claude will use your local tools!"
echo ""

echo "🧪 Test Commands:"
echo "curl http://localhost:3000/health"
echo "curl http://localhost:3000/metadata"
echo ""

echo "🔧 Troubleshooting:"
echo "• URL unreachable → Use HTTPS tunnel URL, not localhost"
echo "• 401 Unauthorized → Check X-Bridge-Token header matches token"
echo "• Tools don't appear → Verify /metadata endpoint returns tools"
echo ""

echo "Bridge server running (PID: $BRIDGE_PID)"
echo "Press Ctrl+C to stop"

# Handle cleanup
trap "echo '🛑 Stopping bridge server...'; kill $BRIDGE_PID 2>/dev/null; exit 0" INT

# Keep script running
wait $BRIDGE_PID