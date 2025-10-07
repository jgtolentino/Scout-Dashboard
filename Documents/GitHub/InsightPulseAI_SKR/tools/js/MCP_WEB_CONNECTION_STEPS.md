# How to Connect Claude Web Interface to Your MCP Server

Here's a step-by-step guide to connect Claude web interface to your MCP server:

## Option 1: Connect via CORS Proxy (Recommended)

1. **Ensure Services Are Running**:
   - Verify MCP server is running: `curl http://127.0.0.1:9315/health`
   - Verify CORS proxy is running: `curl http://localhost:8010/proxy/health`
   - If either is not running, restart them:
     ```bash
     # Restart MCP server
     cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js
     ./start-compliant-mcp.sh
     
     # Restart CORS proxy
     npx local-cors-proxy --proxyUrl http://127.0.0.1:9315 --port 8010
     ```

2. **Open Claude Web Interface**:
   - Go to https://claude.ai in your browser
   - Log in if necessary

3. **Access Settings**:
   - Click on your profile icon or "Settings" link
   - Look for "Custom integrations" section
   - Click "Add new" or a similar option to add an integration

4. **Configure the Integration**:
   - **Name**: Enter "Local MCP" (or any name you prefer)
   - **URL**: Enter `http://localhost:8010/proxy`
   - **Token**: Enter `mock-token-1234`
   - Click "Add" to save

## Option 2: Connect via Ngrok Tunnel (For Sharing or Testing)

1. **Install and Start Ngrok**:
   ```bash
   npm install -g ngrok
   ngrok http 9315
   ```

2. **Note the Ngrok URL**:
   - Ngrok will display a URL like `https://abcd1234.ngrok.io`
   - Copy this URL

3. **Configure in Claude Web Interface**:
   - Follow steps 2-3 above to access the integration settings
   - **Name**: Enter "MCP Tunnel"
   - **URL**: Enter the ngrok URL (e.g., `https://abcd1234.ngrok.io`)
   - **Token**: Enter `mock-token-1234`
   - Click "Add" to save

## Option 3: Direct Connection with Query Parameter

1. **Configure in Claude Web Interface**:
   - Follow steps 2-3 from Option 1
   - **Name**: Enter "MCP Direct"
   - **URL**: Enter `http://127.0.0.1:9315?token=mock-token-1234`
   - Leave token field empty (it's in the URL)
   - Click "Add" to save

## Verifying the Connection

1. **Check for Integration Icon**:
   - After adding the integration, you should see it available in the message input area
   - Look for a tool/integration icon, hammer icon, or similar
   - Click it to see if your MCP integration appears in the list

2. **Test the Connection**:
   - Select your MCP integration from the list
   - If available capabilities appear, the connection is working

## Troubleshooting Connection Issues

If you encounter connection problems:

1. **Check Integration Status**:
   - Look for error messages in the Claude interface
   - Check if the integration appears as "Connected" or similar

2. **Verify Services**:
   - Test MCP health: `curl http://127.0.0.1:9315/health`
   - Test proxy health: `curl http://localhost:8010/proxy/health`
   - Test authenticated endpoint: `curl -H "Authorization: Bearer mock-token-1234" http://localhost:8010/proxy/status`

3. **Browser Issues**:
   - Try a different browser
   - Clear browser cache and cookies
   - Try disabling any privacy extensions

4. **Check Logs**:
   - Review MCP server logs: `cat ~/.mcp/mcp.log`
   - Check browser console for any error messages (F12 to open DevTools)