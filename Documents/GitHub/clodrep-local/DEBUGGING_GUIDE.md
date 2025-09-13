# 🔍 Claude Integration Debugging Guide

## Chrome DevTools Workspace Setup

### 1. Enable Workspace
1. Open Chrome DevTools (F12) on Claude.ai
2. Go to **Sources** → **Filesystem** tab
3. Click **"Add folder to workspace"**
4. Select `/Users/tbwa/Documents/GitHub/clodrep-local`
5. Grant permissions when prompted

### 2. Set Strategic Breakpoints

Add breakpoints in these files for debugging:

#### `quick-bridge-ws.cjs`
```javascript
// Line 107: WebSocket connection
wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket connection established'); // 🔴 BREAKPOINT HERE
```

```javascript
// Line 119: Message handling
ws.on('message', async (data) => {
  try {
    const message = JSON.parse(data.toString()); // 🔴 BREAKPOINT HERE
```

#### `quick-bridge.cjs` (HTTP endpoints)
```javascript
// Line 38: Authentication check
const authenticateToken = (req, res, next) => {
  const token = req.headers['x-bridge-token']; // 🔴 BREAKPOINT HERE
```

### 3. Network Monitoring

1. Open **Network** tab in DevTools
2. Filter by `mcp` to see Claude's requests
3. Look for:
   - Preflight OPTIONS requests
   - WebSocket upgrade requests
   - HTTP POST to /mcp

### 4. Console Commands for Testing

Run these in Chrome console while on Claude.ai:

```javascript
// Test if your local bridge is reachable
fetch('https://YOUR-NGROK-URL.ngrok-free.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Test metadata endpoint
fetch('https://YOUR-NGROK-URL.ngrok-free.app/metadata')
  .then(r => r.json())
  .then(console.log);

// Test WebSocket connection
const ws = new WebSocket('wss://YOUR-NGROK-URL.ngrok-free.app/mcp?token=YOUR-TOKEN');
ws.onopen = () => console.log('WebSocket connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onerror = (e) => console.error('WebSocket error:', e);
```

## Using the Debug Dashboard

Open `debug-claude-integration.html` in your browser:

```bash
cd /Users/tbwa/Documents/GitHub/clodrep-local
open debug-claude-integration.html
```

This provides:
- Real-time connection testing
- Endpoint validation
- WebSocket debugging
- MCP tool execution testing

## Common Issues & Solutions

### 1. "Server not found" in Claude.ai

**Check ngrok is running:**
```bash
curl https://YOUR-NGROK-URL.ngrok-free.app/health
```

**Verify in browser console:**
```javascript
// Should return 200 OK
fetch('https://YOUR-NGROK-URL.ngrok-free.app/metadata')
  .then(r => console.log('Status:', r.status))
```

### 2. "Connection closed" immediately

**Check WebSocket authentication:**
- Set breakpoint at line 107 in `quick-bridge-ws.cjs`
- Watch for token validation
- Check if token matches in query params

### 3. Tools don't appear in Claude

**Verify tools/list response:**
```bash
curl -X POST https://YOUR-NGROK-URL.ngrok-free.app/mcp \
  -H "X-Bridge-Token: YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Live Debugging Workflow

1. **Start with debug dashboard** - Test all endpoints
2. **Set breakpoints** in your bridge code
3. **Open Claude.ai** with DevTools open
4. **Watch Network tab** as you connect
5. **Step through** authentication flow
6. **Monitor WebSocket** frames

## Logging Enhancement

Add this to your bridge for better debugging:

```javascript
// Enhanced logging
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log(`[${new Date().toISOString()}]`, ...args);
  }
}

// Use throughout your code
debugLog('🔐 Auth check:', token);
debugLog('📥 Message received:', message.method);
```

## Quick Status Check Script

```bash
#!/bin/bash
# save as check-claude-status.sh

echo "🔍 Checking Claude Integration Status..."
echo ""

# Check local bridge
echo "1. Local bridge:"
curl -s http://localhost:3000/health || echo "❌ Not running"

# Check ngrok
echo -e "\n2. Public tunnel:"
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | cut -d'"' -f4)
if [ -n "$NGROK_URL" ]; then
  echo "✅ $NGROK_URL"
  curl -s "$NGROK_URL/health" || echo "❌ Not accessible"
else
  echo "❌ No tunnel found"
fi

# Check WebSocket
echo -e "\n3. WebSocket test:"
wscat -c "wss://YOUR-NGROK-URL/mcp?token=YOUR-TOKEN" -x '{"jsonrpc":"2.0","id":1,"method":"ping"}' 2>&1 | head -2
```

## Pro Tips

1. **Use conditional breakpoints** to catch specific errors
2. **Log all WebSocket frames** in Network tab
3. **Save HAR files** of failed connections for analysis
4. **Use Postman/Insomnia** to test your bridge independently
5. **Monitor your ngrok dashboard** at http://localhost:4040

Remember: The key is to trace the exact request flow from Claude → ngrok → your bridge → response.