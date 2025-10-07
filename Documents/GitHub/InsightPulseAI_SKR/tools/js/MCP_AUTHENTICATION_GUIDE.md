# MCP Authentication Guide

This guide explains how to properly configure authentication between Claude Desktop and your MCP daemon.

## Current Authentication Configuration

Your MCP daemon is using token-based authentication with the following configuration:

```yaml
pulser_api:
  host: "http://localhost:8080"
  token: "new-test-token"
```

## Step-by-Step Authentication Setup

### 1. Configure Claude Desktop

1. **Open Claude Desktop** application
2. **Navigate to Settings → Integrations**
3. **Enter MCP connection details**:
   - MCP Host URL: `http://127.0.0.1:9315`
   - Authentication Token: `new-test-token` (must match exactly what's in config.yaml)
   - Authentication Type: "Token" or "Bearer Token" (if available)
4. **Save settings and restart** Claude Desktop

### 2. For Advanced Configuration (if needed)

If Claude Desktop uses a configuration file:

1. Locate the Claude Desktop config file (typically `~/.claude/config.json` or similar)
2. Ensure it contains MCP server configuration with proper authentication:

```json
{
  "mcpServers": {
    "local-mcp": {
      "url": "http://127.0.0.1:9315",
      "auth": {
        "type": "token",
        "token": "new-test-token"
      }
    }
  }
}
```

### 3. Verify Authentication with Log Check

After configuring Claude Desktop, check the MCP daemon logs to see authentication attempts:

```bash
# Watch MCP logs for authentication attempts
tail -f ~/.mcp/mcp.log
```

Look for entries containing `Authorization` or `auth` to verify the token is being sent correctly.

## Authentication Methods Reference

The MCP protocol supports several authentication methods:

1. **Bearer Token** (most common):
   - Token is sent in HTTP header: `Authorization: Bearer your-token-here`
   - Most secure and recommended approach

2. **API Key**:
   - Token is sent as a query parameter: `?api_key=your-token-here`
   - Less secure but sometimes easier to configure

3. **No Authentication**:
   - Not recommended for production environments
   - Can be useful for testing on localhost

## Troubleshooting Authentication Issues

### Common Problems:

1. **Token Mismatch**:
   - Ensure the token in Claude Desktop exactly matches the token in `~/.mcp/config.yaml`
   - Check for case sensitivity, whitespace, and special characters

2. **Header Format**:
   - Claude Desktop might be sending the token in a different format than expected
   - MCP daemon might expect `Bearer ` prefix before the token

3. **Token Expiration**:
   - If you're using temporary tokens, they may have expired
   - Generate a new token with `./update_mcp_config.sh --token "new-token" --restart`

4. **Protocol Mismatch**:
   - Ensure both Claude Desktop and MCP daemon are using the same authentication protocol

### Debugging with curl:

Test authentication manually to see if the token works:

```bash
# Test with Bearer token
curl -v -H "Authorization: Bearer new-test-token" http://127.0.0.1:9315/health

# Alternative format if needed
curl -v -H "X-API-Key: new-test-token" http://127.0.0.1:9315/health
```

## Special Considerations

1. **Localhost Restrictions**:
   - Some applications cannot connect to localhost URLs due to security restrictions
   - Claude Desktop desktop application should not have this limitation

2. **Network Interface**:
   - Ensure the MCP daemon is bound to the correct network interface
   - `127.0.0.1` only allows connections from the same machine

3. **Firewall Settings**:
   - Check if your firewall allows connections to port 9315
   - May require allowing inbound connections to this port

4. **Claude Desktop Permissions**:
   - Ensure Claude Desktop has network permissions to connect to local services
   - Some security software may block these connections