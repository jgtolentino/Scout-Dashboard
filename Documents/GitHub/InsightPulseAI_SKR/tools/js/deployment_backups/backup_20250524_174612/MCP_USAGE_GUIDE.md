# Complete Guide to Using Your MCP Integration with Claude

Now that your MCP integration is set up, here's how to use it effectively:

## 1. Activating and Using the Integration

1. **Access the Integration Tool**:
   - When chatting with Claude, look for the tool/integration icon in the message input area
   - This is typically shown as a small icon near where you type your messages
   - Click this to see available integrations, including your newly added "Local MCP"

2. **Triggering MCP Commands**:
   - Select "Local MCP" from the integrations menu
   - You'll be presented with the available tools from your MCP server
   - Select the specific capability you want to use
   - Fill in any required parameters
   - Submit to have Claude execute the command

## 2. Available MCP Capabilities

Your MCP server offers these capabilities (based on the implementation):

- **Example Tool**: Basic demonstration tool with a query parameter
- **File System Access**: If implemented, allows Claude to read/write local files
- **Command Execution**: If implemented, allows Claude to run local terminal commands
- **Custom APIs**: Any additional APIs you've implemented in your MCP server

## 3. Example Usage Scenarios

### Example 1: Using Local Files
```
User: Can you analyze a local file for me?
Claude: I'd be happy to. Let me access that file for you.
[Claude uses MCP integration to access local file system]
Claude: I've analyzed the file. Here are my findings...
```

### Example 2: Running Local Commands
```
User: Can you check what Python packages I have installed?
Claude: Let me check that for you.
[Claude uses MCP integration to run "pip list"]
Claude: Here are your installed Python packages...
```

### Example 3: Custom API Integration
```
User: Can you get the latest data from our analytics system?
Claude: I'll retrieve that information.
[Claude uses MCP integration to call your custom API endpoint]
Claude: Based on the latest analytics data...
```

## 4. Advanced Usage Tips

1. **Chaining Commands**:
   - Claude can execute multiple MCP commands in sequence
   - This enables complex workflows combining multiple tools

2. **Error Handling**:
   - If an MCP command fails, Claude will report the error
   - You can ask Claude to retry with modified parameters

3. **Context Awareness**:
   - Claude maintains context from MCP results in your conversation
   - You can refer back to previously retrieved information

4. **Customizing Your MCP Server**:
   - Add new endpoints to `mcp-protocol-compliant.js` to expand capabilities
   - Restart the server after making changes

## 5. Monitoring and Debugging

1. **Checking Logs**:
   - The MCP server logs activity to `~/.mcp/mcp.log`
   - Check these logs if you encounter issues

2. **Connection Status**:
   - Use `curl http://localhost:8010/proxy/health` to verify proxy connection
   - Use `curl -H "Authorization: Bearer mock-token-1234" http://localhost:8010/proxy/status` to test authenticated endpoints

3. **Restarting Services**:
   - If issues arise, restart the MCP server with `./start-compliant-mcp.sh`
   - Restart the CORS proxy with `npx local-cors-proxy --proxyUrl http://127.0.0.1:9315 --port 8010`

## 6. Security Considerations

1. **Authentication Token**:
   - Your token (`mock-token-1234`) controls access to your MCP server
   - Keep this secure and change it if needed

2. **Command Execution**:
   - If you've enabled command execution, be aware Claude can run commands with your user permissions
   - Consider implementing restrictions for sensitive operations

3. **Data Access**:
   - The MCP server can access files in permitted directories
   - Configure proper access controls in your MCP implementation

## 7. Further Customization

To extend your MCP server's capabilities:

1. Add new endpoints to `mcp-protocol-compliant.js`:
   ```javascript
   app.post('/api/new-feature', authenticateToken, (req, res) => {
     // Implementation
     res.json({ result: "Success" });
   });
   ```

2. Register new capabilities in the `/capabilities` endpoint
3. Restart your server after changes

## 8. Connection Methods

Your MCP server can be accessed in multiple ways:

1. **Direct Connection** (Claude Desktop):
   - MCP Host URL: `http://127.0.0.1:9315`
   - Authentication Token: `mock-token-1234`

2. **CORS Proxy** (Claude Web Interface):
   - MCP Host URL: `http://localhost:8010/proxy`
   - Authentication Token: `mock-token-1234`

3. **Ngrok Tunnel** (Remote Access):
   - Install ngrok: `npm install -g ngrok`
   - Create tunnel: `ngrok http 9315`
   - Use generated URL in Claude settings
   - Authentication Token: `mock-token-1234`

## 9. Troubleshooting Common Issues

1. **Connection Timeout**:
   - Verify MCP server is running: `ps aux | grep mcp`
   - Check logs for errors: `cat ~/.mcp/mcp-server.log`

2. **Authentication Failures**:
   - Ensure token matches exactly: `mock-token-1234` 
   - Check auth header format: `Authorization: Bearer mock-token-1234`

3. **CORS Errors** (in browser console):
   - Ensure CORS proxy is running
   - Use ngrok for more reliable cross-origin access

4. **Missing Capabilities**:
   - Verify capabilities endpoint is working: `curl -H "Authorization: Bearer mock-token-1234" http://127.0.0.1:9315/capabilities`
   - Check that tools are properly registered