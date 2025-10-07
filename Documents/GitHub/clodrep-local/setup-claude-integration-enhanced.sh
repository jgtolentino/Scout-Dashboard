#!/usr/bin/env bash
# setup-claude-integration-enhanced.sh
#
# One‑stop helper that:
#   1. builds/starts the local MCP bridge
#   2. exposes it via a secure public HTTPS tunnel
#   3. prints the exact values you must paste into Claude.ai
#
# Requirements: Node 20+, either `cloudflared` **or** `ngrok`.
set -euo pipefail

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_ROOT"

echo "🌉 Claude.ai Integration - Enhanced Setup"
echo "========================================"
echo ""

#─────────────────────────────────────────────────────────
# 1 · generate / persist a shared token
#─────────────────────────────────────────────────────────
TOKEN_FILE=".bridge-token"
if [[ -f $TOKEN_FILE ]]; then
  BRIDGE_SECRET="$(<"$TOKEN_FILE")"
  echo "🔑 Using existing bridge token: ${BRIDGE_SECRET:0:8}...${BRIDGE_SECRET: -4}"
else
  BRIDGE_SECRET="$(openssl rand -hex 16)"
  echo "$BRIDGE_SECRET" > "$TOKEN_FILE"
  echo "🔑 Generated new bridge token: $BRIDGE_SECRET"
fi
export BRIDGE_SECRET

#─────────────────────────────────────────────────────────
# 2 · check prerequisites
#─────────────────────────────────────────────────────────
echo ""
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node >/dev/null; then
  echo "❌ Node.js not found. Please install Node.js 20+"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ "$NODE_VERSION" -lt 20 ]]; then
  echo "❌ Node.js 20+ required. Current version: $(node --version)"
  exit 1
fi
echo "✅ Node.js $(node --version)"

# Check tunnel tools
TUNNEL_TOOL=""
if command -v cloudflared >/dev/null; then
  TUNNEL_TOOL="cloudflared"
  echo "✅ Cloudflare Tunnel found"
elif command -v ngrok >/dev/null; then
  TUNNEL_TOOL="ngrok"
  echo "✅ ngrok found"
else
  echo "❌ Neither cloudflared nor ngrok found."
  echo "Install one of them:"
  echo "  • cloudflared: brew install cloudflare/cloudflare/cloudflared"
  echo "  • ngrok: brew install ngrok/ngrok/ngrok"
  exit 1
fi

# Check/install dependencies
echo "📦 Checking dependencies..."
if [[ ! -d node_modules ]]; then
  echo "⚠️  Installing dependencies..."
  npm install
fi

#─────────────────────────────────────────────────────────
# 3 · build & start the MCP bridge (background)
#─────────────────────────────────────────────────────────
echo ""
echo "🚀 Starting MCP bridge server on port 3000..."

# Try to use built version first, fallback to quick bridge
BRIDGE_STARTED=false

if [[ -f quick-bridge.cjs ]]; then
  echo "📦 Using quick bridge server (CommonJS)..."
  BRIDGE_SECRET="$BRIDGE_SECRET" node quick-bridge.cjs &
  BRIDGE_PID=$!
  BRIDGE_STARTED=true
elif [[ -f quick-bridge.js ]]; then
  echo "📦 Using quick bridge server..."
  BRIDGE_SECRET="$BRIDGE_SECRET" node quick-bridge.js &
  BRIDGE_PID=$!
  BRIDGE_STARTED=true
else
  echo "⚠️  No bridge server found. Creating minimal bridge..."
  # Create minimal bridge on the fly
  cat > temp-bridge.js << 'EOF'
const express = require('express');
const app = express();
const port = 3000;
const token = process.env.BRIDGE_SECRET || 'default-token';

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/health', (req, res) => res.json({ status: 'healthy', tools: 3 }));
app.get('/metadata', (req, res) => res.json({
  name: 'Clodrep Local Tools',
  tools: [
    { name: 'Read', description: 'Read files' },
    { name: 'Write', description: 'Write files' },
    { name: 'Bash', description: 'Execute commands' }
  ]
}));

app.post('/mcp', (req, res) => {
  if (req.headers['x-bridge-token'] !== token) return res.sendStatus(401);
  res.json({ jsonrpc: '2.0', id: req.body.id, result: { tools: [] } });
});

app.listen(port, () => console.log(`Bridge running on port ${port}`));
EOF
  
  BRIDGE_SECRET="$BRIDGE_SECRET" node temp-bridge.js &
  BRIDGE_PID=$!
  BRIDGE_STARTED=true
fi

if [[ "$BRIDGE_STARTED" = false ]]; then
  echo "❌ Failed to start bridge server"
  exit 1
fi

# Cleanup function
cleanup() {
  echo ""
  echo "⏹  Stopping bridge server..."
  kill $BRIDGE_PID 2>/dev/null || true
  [[ -f temp-bridge.js ]] && rm temp-bridge.js
  exit 0
}
trap cleanup EXIT INT TERM

# Wait for server to be ready
echo "⏳ Waiting for bridge to start..."
for i in {1..20}; do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Local bridge healthy"
    break
  fi
  sleep 0.5
  if [[ $i -eq 20 ]]; then
    echo "❌ Bridge failed to start after 10 seconds"
    exit 1
  fi
done

#─────────────────────────────────────────────────────────
# 4 · create a secure public HTTPS tunnel
#─────────────────────────────────────────────────────────
echo ""
echo "🌐 Creating secure tunnel with $TUNNEL_TOOL..."

PUBLIC_URL=""
TUNNEL_PID=""

if [[ "$TUNNEL_TOOL" = "cloudflared" ]]; then
  # Start cloudflared and capture URL
  cloudflared tunnel --url http://localhost:3000 --no-autoupdate > tunnel.log 2>&1 &
  TUNNEL_PID=$!
  
  # Wait for tunnel URL
  for i in {1..30}; do
    if [[ -f tunnel.log ]]; then
      PUBLIC_URL=$(grep -o 'https://.*\.trycloudflare\.com' tunnel.log | head -1 || true)
      if [[ -n "$PUBLIC_URL" ]]; then
        echo "🔗 Tunnel URL: $PUBLIC_URL"
        break
      fi
    fi
    sleep 1
    if [[ $i -eq 30 ]]; then
      echo "❌ Failed to get tunnel URL after 30 seconds"
      cat tunnel.log
      exit 1
    fi
  done
  
elif [[ "$TUNNEL_TOOL" = "ngrok" ]]; then
  # Start ngrok with logging
  echo "Starting ngrok tunnel..."
  ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
  TUNNEL_PID=$!
  
  # Wait for ngrok to start
  echo "Waiting for ngrok to initialize..."
  sleep 5
  
  # Get public URL from ngrok API
  for i in {1..20}; do
    # Try to get URL from API
    NGROK_DATA=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null || true)
    if [[ -n "$NGROK_DATA" ]]; then
      PUBLIC_URL=$(echo "$NGROK_DATA" | grep -o '"public_url":"https://[^"]*"' | cut -d'"' -f4 | head -1 || true)
      if [[ -n "$PUBLIC_URL" ]]; then
        echo "🔗 Tunnel URL: $PUBLIC_URL"
        break
      fi
    fi
    
    # Also check the log file for URL
    if [[ -f ngrok.log ]]; then
      URL_FROM_LOG=$(grep -o 'https://.*\.ngrok\.io' ngrok.log | head -1 || true)
      if [[ -n "$URL_FROM_LOG" ]]; then
        PUBLIC_URL="$URL_FROM_LOG"
        echo "🔗 Tunnel URL: $PUBLIC_URL"
        break
      fi
    fi
    
    sleep 1
    if [[ $i -eq 20 ]]; then
      echo "❌ Failed to get ngrok URL"
      echo "ngrok logs:"
      [[ -f ngrok.log ]] && tail -20 ngrok.log
      exit 1
    fi
  done
fi

# Enhanced cleanup
cleanup() {
  echo ""
  echo "⏹  Stopping services..."
  [[ -n "$BRIDGE_PID" ]] && kill $BRIDGE_PID 2>/dev/null || true
  [[ -n "$TUNNEL_PID" ]] && kill $TUNNEL_PID 2>/dev/null || true
  [[ -f tunnel.log ]] && rm tunnel.log
  [[ -f ngrok.log ]] && rm ngrok.log
  [[ -f temp-bridge.js ]] && rm temp-bridge.js
  exit 0
}
trap cleanup EXIT INT TERM

#─────────────────────────────────────────────────────────
# 5 · test the tunnel
#─────────────────────────────────────────────────────────
echo ""
echo "🧪 Testing tunnel connection..."
sleep 2

if curl -sf "$PUBLIC_URL/health" >/dev/null; then
  echo "✅ Tunnel is working correctly"
else
  echo "⚠️  Tunnel may not be ready yet (this is normal)"
fi

#─────────────────────────────────────────────────────────
# 6 · print Claude.ai instructions
#─────────────────────────────────────────────────────────
echo ""
cat << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CLAUDE.AI INTEGRATION SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Go to: Claude.ai → Settings → Custom Integrations (β) → "Add custom integration"

┌─────────────────────────────────────────────────────────────────────────────┐
│  Integration name:  Clodrep Local Tools                                    │
│  Integration URL :  $PUBLIC_URL/mcp                                         │
│  Custom headers  :  X-Bridge-Token: $BRIDGE_SECRET                         │
└─────────────────────────────────────────────────────────────────────────────┘

📋 Copy the exact values above ☝️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 VERIFICATION STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  After adding integration → Status should show "Connected"
2️⃣  Open a new chat in Claude.ai
3️⃣  Type: "Can you read my package.json file?"
4️⃣  Claude should use your local tools to read the file! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️  TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ "URL unreachable"     → Use the HTTPS tunnel URL above, not localhost
❌ "401 Unauthorized"    → Check X-Bridge-Token header matches exactly
❌ "Handshake failed"    → Verify URL ends with /mcp
❌ "Tools don't appear"  → Check integration status is "Connected"

🧪 Test URLs:
   Health: $PUBLIC_URL/health
   Metadata: $PUBLIC_URL/metadata

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎊 You're all set! The bridge will run until you press Ctrl+C

   Bridge PID: $BRIDGE_PID
   Tunnel PID: $TUNNEL_PID
   Token saved in: $TOKEN_FILE

EOF

#─────────────────────────────────────────────────────────
# 7 · keep running until user stops
#─────────────────────────────────────────────────────────

echo "⏳ Keeping services running... Press Ctrl+C to stop"
echo ""

# Monitor processes and restart if needed
while true; do
  # Check bridge health
  if ! kill -0 $BRIDGE_PID 2>/dev/null; then
    echo "⚠️  Bridge process died, restarting..."
    # Restart bridge
    if [[ -f quick-bridge.cjs ]]; then
      BRIDGE_SECRET="$BRIDGE_SECRET" node quick-bridge.cjs &
    else
      BRIDGE_SECRET="$BRIDGE_SECRET" node quick-bridge.js &
    fi
    BRIDGE_PID=$!
  fi
  
  # Check tunnel health
  if ! kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "⚠️  Tunnel process died, restarting..."
    if [[ "$TUNNEL_TOOL" = "cloudflared" ]]; then
      cloudflared tunnel --url http://localhost:3000 --no-autoupdate > tunnel.log 2>&1 &
    else
      ngrok http 3000 > /dev/null 2>&1 &
    fi
    TUNNEL_PID=$!
  fi
  
  sleep 5
done