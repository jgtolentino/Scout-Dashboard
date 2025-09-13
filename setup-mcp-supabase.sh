#!/bin/bash

echo "Setting up MCP Supabase for Pulser CLI..."

# 1. Apply environment config
echo "Creating .pulser/mcpServers.json ..."
mkdir -p .pulser && tee .pulser/mcpServers.json > /dev/null <<EOF
{
  "supabase-reader": {
    "command": "npx",
    "args": [
      "--package", "@supabase/mcp-server-supabase",
      "supabase-mcp",
      "--project-ref", "cxzllzyxwpyptfretryc",
      "--read-only",
      "--allow", "select,explain",
      "--port", "8888"
    ],
    "env": {
      "SUPABASE_URL": "https://cxzllzyxwpyptfretryc.supabase.co",
      "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g",
      "PORT": "8888"
    }
  }
}
EOF

# 2. Register doer with Supabase MCP
echo "Updating agents/doer.yaml ..."
mkdir -p agents && tee agents/doer.yaml > /dev/null <<EOF
name: doer
codename: doer
description: >
  Automation agent for Pulser CLI tasks, including CLI-native database MCP interaction.
bindings:
  mcp_supabase_clean:
    endpoint: http://localhost:8888
    type: supabase
    role: reader
    schemas:
      - scout
      - ces
      - public
permissions:
  - select
  - explain
  - introspect
memory_tags:
  - pulser
  - mcp
  - supabase
EOF

# 3. Restart MCP and confirm logs
echo "Restarting MCP server on port 8888 ..."
if command -v pnpm &> /dev/null; then
    pnpm mcp supabase-reader restart
else
    echo "Note: pnpm not found. Please restart the MCP server manually."
fi

echo "✅ MCP Supabase setup complete!"