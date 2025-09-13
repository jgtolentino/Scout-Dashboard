# Official Claude MCP Integration Guide

This guide explains how to set up a proper MCP (Model Context Protocol) integration between Claude (Web or Desktop) and your local environment, following Anthropic's official documentation.

## What is MCP?

MCP (Model Context Protocol) is Anthropic's protocol for integrating Claude with external tools and services. It allows Claude to access local files, execute commands, and perform other operations on your machine.

## Prerequisites

- Node.js installed on your machine
- Claude Desktop or Claude Web account
- (Optional) ngrok for HTTPS tunneling with Claude Web

## Getting Started

1. **Start the MCP server**:
   ```bash
   cd /path/to/project
   ./start-official-mcp.sh
   ```

2. **For Claude Desktop**:
   - Open Claude Desktop
   - Go to Settings → Integrations
   - Add a new integration:
     - Name: Claude Code CLI
     - URL: http://localhost:9315
     - Token: claude-code-cli-token

3. **For Claude Web**:
   - You'll need an HTTPS tunnel (provided by ngrok)
   - The `start-official-mcp.sh` script will help set this up
   - Once running, configure in Claude Web:
     - Go to Settings → Developer → Add MCP server
     - Name: Claude Code CLI
     - URL: [your ngrok https URL]
     - Token: claude-code-cli-token

## Available Tools

The MCP server provides these tools to Claude:

1. **execute_command** - Run a shell command on your machine
   - Parameter: `command` (string) - The command to execute

2. **read_file** - Read a file from your local filesystem
   - Parameter: `path` (string) - The path to the file to read

## Testing the Integration

Once connected, you can test the integration by asking Claude:

```
Can you read the file at /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/package.json?
```

Or:

```
Can you run the command "ls -la" and show me the output?
```

## Security Considerations

- The MCP server has access to your local filesystem and can execute commands
- Only use it on a trusted network
- Consider customizing the authentication token in `official-mcp-server.js`
- Implement additional security measures for production use

## Troubleshooting

If you encounter issues:

1. **Check server logs**:
   ```bash
   cat ~/.mcp/mcp.log
   cat ~/.mcp/mcp-output.log
   ```

2. **Verify the server is running**:
   ```bash
   curl http://localhost:9315/health
   ```

3. **Test the capabilities endpoint**:
   ```bash
   curl http://localhost:9315/capabilities
   ```

4. **For Claude Web issues**:
   - Ensure ngrok is running and providing an HTTPS URL
   - Check browser console for errors (F12 → Console)
   - Try including the path in the URL: `https://your-ngrok-url/capabilities`

## References

- [Anthropic's official MCP documentation](https://support.anthropic.com/en/articles/11175166-about-custom-integrations-using-remote-mcp)

## Stopping the Server

To stop the MCP server:
```bash
pkill -f "node.*official-mcp-server.js"
pkill -f ngrok  # If using ngrok
```