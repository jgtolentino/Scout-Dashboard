#!/bin/bash
# Scout Analytics - Claude MCP Configuration
# Configures Claude Desktop and CLI to use MindsDB instances
# Usage: ./ops/mindsdb/configure_claude.sh

set -euo pipefail

echo "🔧 Configuring Claude MCP connections..."

# Claude Desktop configuration
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
mkdir -p "$(dirname "$CLAUDE_CONFIG")"

echo "🖥️  Configuring Claude Desktop (analyst) -> mindsdb-desktop..."

# Create or update Claude Desktop config
TMP_CONFIG="$(mktemp)"
cat > "$TMP_CONFIG" <<JSON
{
  "mcpServers": {
    "mindsdb-desktop": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://127.0.0.1:47334/sse"]
    }
  }
}
JSON

if [ -f "$CLAUDE_CONFIG" ]; then
    # Merge with existing config if it exists
    if jq empty "$CLAUDE_CONFIG" 2>/dev/null; then
        jq -s '.[0] as $base | .[1] as $new | $base * $new' "$CLAUDE_CONFIG" "$TMP_CONFIG" > "${CLAUDE_CONFIG}.new"
        mv "${CLAUDE_CONFIG}.new" "$CLAUDE_CONFIG"
    else
        # Invalid JSON, backup and replace
        mv "$CLAUDE_CONFIG" "${CLAUDE_CONFIG}.backup"
        mv "$TMP_CONFIG" "$CLAUDE_CONFIG"
    fi
else
    mv "$TMP_CONFIG" "$CLAUDE_CONFIG"
fi

echo "✅ Claude Desktop configured"
echo "📁 Config file: $CLAUDE_CONFIG"

# Claude Code CLI configuration
echo ""
echo "💻 Creating Claude Code CLI environment wrapper..."

cat > ops/mindsdb/claude_code_env.sh <<'SH'
#!/bin/bash
# Scout Analytics - Claude Code CLI MCP Environment
# Wrapper to start Claude Code CLI with MindsDB MCP connection
# Usage: ./ops/mindsdb/claude_code_env.sh

set -euo pipefail

# Get MCP endpoint from Keychain
MCP_URL="$(security find-generic-password -a "$USER" -s SCOUT__MCP__CODE_SSE_URL -w 2>/dev/null || echo "http://127.0.0.1:57334/sse")"

echo "🔗 Claude Code CLI -> MindsDB Code instance"
echo "🌐 MCP endpoint: $MCP_URL"

# Start MCP remote bridge in background
echo "🚀 Starting MCP bridge..."
npx -y mcp-remote "$MCP_URL" > /tmp/mcp-remote.log 2>&1 &
MCP_PID=$!

# Give it a moment to start
sleep 2

if kill -0 "$MCP_PID" 2>/dev/null; then
    echo "✅ MCP bridge started (PID $MCP_PID)"
    echo "📋 Log: tail -f /tmp/mcp-remote.log"
else
    echo "❌ MCP bridge failed to start"
    exit 1
fi

echo ""
echo "💡 Claude Code CLI is now ready with MindsDB MCP access"
echo "🔍 Available datasources:"
echo "  - supabase_ds_code (read: analytics, ref)"  
echo "  - supabase_ds_codew (write: analytics_snap)"
echo ""
echo "🛑 To stop MCP bridge: kill $MCP_PID"

# Keep the bridge running
trap "kill $MCP_PID 2>/dev/null" EXIT
wait $MCP_PID
SH

chmod +x ops/mindsdb/claude_code_env.sh

echo "✅ Claude Code CLI wrapper created"
echo "📁 Wrapper script: ops/mindsdb/claude_code_env.sh"

echo ""
echo "🧪 Testing MCP remote bridge..."

# Test if mcp-remote is available
if command -v npx >/dev/null 2>&1; then
    echo "✅ npx available for mcp-remote"
    # Test mcp-remote package
    if npx -y mcp-remote --help >/dev/null 2>&1; then
        echo "✅ mcp-remote package accessible"
    else
        echo "❌ mcp-remote package not found"
        echo "💡 Will be installed on first use via npx -y"
    fi
else
    echo "❌ npx not found - install Node.js ≥18"
    exit 1
fi

echo ""
echo "🎯 MCP configuration complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Restart Claude Desktop to load MCP server"
echo "  2. For CLI: Run ./ops/mindsdb/claude_code_env.sh"
echo "  3. Test: Ask Claude Desktop to list available tables"
echo ""
echo "🔒 Access isolation:"
echo "  - Desktop: Analytics views only (safest for analysis)"
echo "  - CLI: Analytics + ref tables (broader access for orchestration)"