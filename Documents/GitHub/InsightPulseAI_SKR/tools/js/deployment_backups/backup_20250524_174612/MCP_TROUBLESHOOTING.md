# MCP Connection Troubleshooting Guide

If you encounter errors connecting Claude Desktop to the Pulser MCP Daemon, follow this comprehensive troubleshooting guide.

## 1. Verify the Pulser MCP Daemon Server

First, ensure the Pulser MCP Daemon server is:

- **Properly installed and running**
  ```bash
  # Check if process is running
  ps aux | grep "mcp start"
  
  # Check if port is open and listening
  lsof -i :9315
  ```

- **Test basic connectivity**
  ```bash
  curl -v http://localhost:9315/health
  ```

## 2. Check Server URL Configuration

In Claude Desktop's settings:

- Navigate to **Settings → Integrations**
- Verify the MCP server URL is correct:
  - Format should be `http://localhost:9315` (or your custom port)
  - Include the correct protocol (`http://` or `https://`)
  - Don't add trailing slashes or paths

## 3. Authentication Settings

The error specifically mentions authentication issues:

- **Check token validity**
  ```bash
  # View your current config
  cat ~/.mcp/config.yaml
  ```

- **Test token authentication**
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:9315/health
  ```

- **Reset token if needed**
  ```bash
  ./update_mcp_config.sh --token "your-new-token"
  ```

## 4. Firewall and Network Settings

- **Check local firewall settings**
  ```bash
  # macOS
  sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
  
  # Linux
  sudo iptables -L | grep 9315
  ```

- **If using a corporate network:**
  - Ensure necessary ports are open (typically 9315)
  - Check if proxy settings are affecting connection

## 5. Server Logs

Examine Pulser MCP Daemon logs:

```bash
# View the latest logs
tail -f ~/.mcp/mcp.log

# Filter for error messages
grep -i "error\|fail" ~/.mcp/mcp.log
```

## 6. Claude Code CLI Configuration

If specifically using Claude Code CLI:

- **Verify installation**
  ```bash
  claude --version
  ```

- **Check MCP server configuration**
  ```bash
  claude mcp list
  ```

- **Manually start MCP server mode**
  ```bash
  claude mcp serve --port 9315
  ```

## 7. Restart Services

Sometimes a simple restart resolves connection issues:

- **Restart MCP daemon**
  ```bash
  pkill -f "mcp start"
  ./setup_mcp_claude_integration.sh
  ```

- **Restart Claude Desktop**
  - Close and reopen the application
  - Clear application cache if needed

## 8. Advanced: Debug Connection Flow

For detailed debugging:

```bash
# Enable verbose logging
export MCP_DEBUG=true
mcp start --verbose > mcp_debug.log 2>&1

# Watch connection attempts in real-time
tail -f mcp_debug.log
```

## 9. Compatibility Check

- **Verify version compatibility**
  - MCP CLI requires Python 3.12+
  - Claude Desktop requires v1.2+
  - Ensure Pulser Core is running at correct URL

## 10. Common Error Messages and Solutions

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Failed to connect to MCP server" | Server not running | Restart MCP daemon |
| "Authentication failed" | Invalid token | Update token in config |
| "Connection refused" | Wrong port/host | Check network settings |
| "Timeout connecting to server" | Network issues | Check firewall settings |
| "Unsupported protocol version" | Version mismatch | Update software versions |

---

If you've tried all these steps and still encounter issues, you may need to contact support or check the official documentation for updates.