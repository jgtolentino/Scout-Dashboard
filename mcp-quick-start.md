# Quick MCP Start Guide

## Start MCP Server
```bash
~/go/bin/mcp-filesystem-server /Users/tbwa/Downloads /Users/tbwa/Documents &
```

## Use with Claude
Option 1: Use the alias (added to your .zshrc)
```bash
cmcp
```

Option 2: Original command
```bash
claude --tools mcp-filesystem-server
```

That's it! Claude can now access your files directly.