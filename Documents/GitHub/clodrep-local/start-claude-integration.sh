#!/usr/bin/env bash
# start-claude-integration.sh - Simple Claude.ai integration launcher

set -euo pipefail

echo "🌉 Claude.ai Integration Launcher"
echo "================================"
echo ""

# Generate or use existing token
TOKEN_FILE=".bridge-token"
if [[ -f $TOKEN_FILE ]]; then
  BRIDGE_SECRET="$(<"$TOKEN_FILE")"
  echo "🔑 Using existing token: ${BRIDGE_SECRET:0:8}...${BRIDGE_SECRET: -4}"
else
  BRIDGE_SECRET="$(openssl rand -hex 16)"
  echo "$BRIDGE_SECRET" > "$TOKEN_FILE"
  echo "🔑 Generated new token: $BRIDGE_SECRET"
fi

# Start bridge server
echo ""
echo "🚀 Starting MCP bridge server..."
BRIDGE_SECRET="$BRIDGE_SECRET" node quick-bridge.cjs &
BRIDGE_PID=$!

# Wait for bridge to be ready
echo "⏳ Waiting for bridge..."
for i in {1..10}; do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Bridge is ready!"
    break
  fi
  sleep 0.5
done

# Start ngrok tunnel
echo ""
echo "🌐 Creating secure tunnel..."
ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
TUNNEL_PID=$!

# Wait for tunnel URL
echo "⏳ Waiting for tunnel URL..."
sleep 3

PUBLIC_URL=""
for i in {1..10}; do
  # Try API first
  NGROK_DATA=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null || true)
  if [[ -n "$NGROK_DATA" ]]; then
    PUBLIC_URL=$(echo "$NGROK_DATA" | grep -o '"public_url":"https://[^"]*"' | cut -d'"' -f4 | head -1 || true)
  fi
  
  # Fallback to log
  if [[ -z "$PUBLIC_URL" ]] && [[ -f ngrok.log ]]; then
    PUBLIC_URL=$(grep -o 'https://.*\.ngrok-free\.app' ngrok.log | head -1 || true)
  fi
  
  if [[ -n "$PUBLIC_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "❌ Failed to get tunnel URL"
  kill $BRIDGE_PID $TUNNEL_PID 2>/dev/null
  exit 1
fi

# Display integration instructions
cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CLAUDE.AI INTEGRATION SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Go to: Claude.ai → Settings → Custom Integrations (β) → "Add custom integration"

┌─────────────────────────────────────────────────────────────────────────────┐
│  Integration name:  Clodrep Local Tools                                     │
│  Integration URL :  $PUBLIC_URL/mcp                                         │
│  Custom headers  :  X-Bridge-Token: $BRIDGE_SECRET                         │
└─────────────────────────────────────────────────────────────────────────────┘

📋 Copy these exact values into Claude.ai

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 TEST YOUR INTEGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  After adding → Status should show "Connected"
2️⃣  Open a new chat in Claude.ai
3️⃣  Ask: "Can you read my package.json file?"
4️⃣  Claude will use your local tools! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 Test URLs:
   Health: $PUBLIC_URL/health
   Metadata: $PUBLIC_URL/metadata

Press Ctrl+C to stop all services

EOF

# Cleanup handler
cleanup() {
  echo ""
  echo "⏹  Stopping services..."
  kill $BRIDGE_PID $TUNNEL_PID 2>/dev/null || true
  rm -f ngrok.log
  echo "✅ All services stopped"
  exit 0
}
trap cleanup EXIT INT TERM

# Keep running
while true; do
  # Check if processes are still alive
  if ! kill -0 $BRIDGE_PID 2>/dev/null; then
    echo "❌ Bridge process died"
    exit 1
  fi
  if ! kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "⚠️  Tunnel process ended (this is normal for ngrok)"
  fi
  sleep 5
done