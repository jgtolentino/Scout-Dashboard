# Connecting Claude Web Interface to MCP Server

This guide addresses the challenges of connecting the Claude web interface (claude.ai) to a local MCP server by solving browser security restrictions, authentication issues, and server configuration problems.

## 🔧 Setup Instructions

1. First, install the required Node.js dependencies and start the compliant MCP server:

   ```bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js
   ./start-compliant-mcp.sh
   ```

2. This will:
   - Install Express and CORS modules if needed
   - Start an MCP server with proper CORS headers
   - Configure flexible authentication methods
   - Test that all endpoints are working correctly

## 🌐 Connecting from Claude Web

### Solution 1: Use a Secure Tunnel (Recommended)

To bypass browser security restrictions that prevent connecting directly to localhost:

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Create a tunnel to your local MCP server:
   ```bash
   ngrok http 9315
   ```

3. Copy the generated ngrok URL (e.g., `https://abc123.ngrok.io`)

4. In Claude Web interface:
   - Navigate to settings
   - Find the MCP integration section
   - Enter the ngrok URL
   - Enter token: `mock-token-1234`
   - Save settings

### Solution 2: Use Query Parameter Authentication

Some browsers may allow connections using query parameters:

1. In Claude Web interface:
   - Navigate to settings
   - Find the MCP integration section
   - Enter URL with token: `http://127.0.0.1:9315?token=mock-token-1234`
   - Save settings

### Solution 3: Browser Extension

If other solutions don't work:

1. Install a CORS-bypassing extension like:
   - "CORS Unblock"
   - "Allow CORS: Access-Control-Allow-Origin"

2. Enable the extension when using Claude.ai

3. Configure Claude with:
   - MCP URL: `http://127.0.0.1:9315`
   - Token: `mock-token-1234`

## 📋 Verification

To verify the server is working correctly:

1. Test the health endpoint:
   ```bash
   curl http://127.0.0.1:9315/health
   ```
   
   Should return: `{"status":"ok"}`

2. Test authenticated endpoints:
   ```bash
   curl -H "Authorization: Bearer mock-token-1234" http://127.0.0.1:9315/status
   ```
   
   Should return: `{"status":"ok","version":"1.0.0",...}`

3. Test query parameter authentication:
   ```bash
   curl "http://127.0.0.1:9315/status?token=mock-token-1234"
   ```
   
   Should return the same result

## 🔍 Troubleshooting

If you encounter issues:

1. **Check server logs**:
   ```bash
   tail -f ~/.mcp/mcp.log         # API logs
   tail -f ~/.mcp/mcp-server.log  # Server logs
   ```

2. **Browser connection issues**:
   - Open browser developer tools (F12)
   - Look at Console tab for CORS errors
   - Check Network tab for failed requests

3. **Authentication problems**:
   - Verify the token matches exactly: `mock-token-1234`
   - Try both header and query parameter methods

4. **Server not responding**:
   - Verify the server is running: `ps aux | grep mcp-protocol`
   - Check if port 9315 is open: `lsof -i :9315`

## 🛑 Stop the Server

When finished, you can stop the server with:

```bash
pkill -f "node.*mcp-protocol-compliant.js"
```