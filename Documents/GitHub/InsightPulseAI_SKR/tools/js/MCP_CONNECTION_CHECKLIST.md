# MCP Connection Checklist

Follow this checklist to resolve connectivity issues between Claude Desktop and the Pulser MCP Daemon.

## 1. Verify Daemon Process

```bash
# Check if the MCP process is running (macOS/Linux)
ps aux | grep "mcp start"

# Alternative process check
lsof -i :9315

# Check the PID file
cat ~/.mcp/mcp.pid
```

✅ **Expected result**: Process should be running with the PID matching the one in the PID file

## 2. Validate URL Configuration

- In Claude Desktop, go to **Settings → Integrations**
- Verify the URL is exactly: `http://127.0.0.1:9315`
- Ensure there are no extra characters (no trailing slash)
- If using a custom port, match it to what's in your setup script

## 3. Direct Connection Test

```bash
# Basic connection test
curl -v http://127.0.0.1:9315/health

# Test with authorization header if needed
curl -v -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:9315/health
```

✅ **Expected result**: `{"status":"ok"}` response with HTTP 200

## 4. Reset Connection

```bash
# Stop the current daemon
pkill -f "mcp start"

# Remove existing logs
rm ~/.mcp/mcp.log

# Start fresh daemon
./setup_mcp_claude_integration.sh

# Verify it's running
./mcp_status.sh
```

Then:
1. Restart Claude Desktop
2. Reconfigure the MCP URL in settings

## 5. Version Compatibility

- Verify Claude Desktop version (should be v1.2+)
- Check Python version (`python3 -V`) - MCP may require 3.12+
- Ensure `mcp-cli` is up to date

## 6. Authentication Issues

```bash
# Check config file for token
cat ~/.mcp/config.yaml

# Update token if needed
./update_mcp_config.sh --token "your-new-token" --restart
```

## 7. Network & Firewall

```bash
# Test if port is blocked
nc -zv 127.0.0.1 9315

# Check for local firewall rules (macOS)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

## 8. Check Logs for Errors

```bash
# View MCP daemon logs
cat ~/.mcp/mcp.log

# Filter for errors
grep -i "error\|fail\|exception" ~/.mcp/mcp.log
```

## 9. Mock MCP Daemon Test

If the real daemon isn't working, try creating a simple mock server to test if Claude Desktop can connect to anything:

```bash
# Using Python to create a simple mock server (in a new terminal)
python3 -m http.server 9315
```

Then configure Claude Desktop to connect to this server.

## 10. Environment Variables

```bash
# Ensure PULSER_API_TOKEN is set
echo $PULSER_API_TOKEN

# Set it if needed
export PULSER_API_TOKEN="your-token"
```

---

## When requesting help, please provide:

1. **MCP Daemon version**:
   - Output of `mcp --version` (if available)

2. **Installation method**:
   - How you installed the MCP daemon (pip, package, etc.)

3. **Connection URL**:
   - The exact URL you're using in Claude Desktop settings

4. **Error messages**:
   - Screenshots or exact text of errors from Claude Desktop
   - Any error messages from the MCP logs

5. **Environment details**:
   - OS version
   - Python version
   - Claude Desktop version