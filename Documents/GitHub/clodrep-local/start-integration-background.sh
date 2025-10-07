#!/usr/bin/env bash
# start-integration-background.sh - Start Claude integration in background

# Check if already running
if pgrep -f "quick-bridge.cjs" > /dev/null; then
    echo "⚠️  Bridge is already running!"
    echo "Run: pkill -f quick-bridge.cjs   to stop it"
    exit 1
fi

# Get or create token
TOKEN_FILE=".bridge-token"
if [[ -f $TOKEN_FILE ]]; then
  BRIDGE_SECRET="$(<"$TOKEN_FILE")"
else
  BRIDGE_SECRET="$(openssl rand -hex 16)"
  echo "$BRIDGE_SECRET" > "$TOKEN_FILE"
fi

echo "🌉 Starting Claude.ai Integration in Background"
echo "=============================================="
echo ""
echo "🔑 Token: $BRIDGE_SECRET"
echo ""

# Start bridge (use WebSocket version if available)
echo "🚀 Starting bridge server..."
if [[ -f quick-bridge-ws.cjs ]]; then
  echo "   Using WebSocket-enabled bridge"
  BRIDGE_SECRET="$BRIDGE_SECRET" nohup node quick-bridge-ws.cjs > bridge.log 2>&1 &
else
  BRIDGE_SECRET="$BRIDGE_SECRET" nohup node quick-bridge.cjs > bridge.log 2>&1 &
fi
BRIDGE_PID=$!
echo "Bridge PID: $BRIDGE_PID"

# Wait for bridge
sleep 2
if ! curl -sf http://localhost:3000/health >/dev/null; then
    echo "❌ Bridge failed to start!"
    exit 1
fi
echo "✅ Bridge is running"

# Start ngrok with 127.0.0.1 instead of localhost
echo ""
echo "🌐 Starting ngrok tunnel..."
nohup ngrok http 127.0.0.1:3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!
echo "Ngrok PID: $NGROK_PID"

# Wait for tunnel
echo "⏳ Getting tunnel URL..."
sleep 5

# Get URL
PUBLIC_URL=""
for i in {1..10}; do
  NGROK_DATA=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null || true)
  if [[ -n "$NGROK_DATA" ]]; then
    PUBLIC_URL=$(echo "$NGROK_DATA" | grep -o '"public_url":"https://[^"]*"' | cut -d'"' -f4 | head -1 || true)
    if [[ -n "$PUBLIC_URL" ]]; then
      break
    fi
  fi
  sleep 1
done

if [[ -z "$PUBLIC_URL" ]]; then
    echo "❌ Failed to get tunnel URL"
    kill $BRIDGE_PID $NGROK_PID 2>/dev/null
    exit 1
fi

# Save info
cat > .integration-info << EOF
BRIDGE_PID=$BRIDGE_PID
NGROK_PID=$NGROK_PID
PUBLIC_URL=$PUBLIC_URL
BRIDGE_SECRET=$BRIDGE_SECRET
EOF

# Display integration info
cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CLAUDE.AI INTEGRATION READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Integration name:  Clodrep Local Tools
Integration URL :  $PUBLIC_URL/mcp
Custom headers  :  X-Bridge-Token: $BRIDGE_SECRET

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 Test URLs:
   Health: $PUBLIC_URL/health
   Metadata: $PUBLIC_URL/metadata

📝 Logs:
   Bridge: tail -f bridge.log
   Ngrok: tail -f ngrok.log

🛑 To stop:
   ./stop-integration.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF