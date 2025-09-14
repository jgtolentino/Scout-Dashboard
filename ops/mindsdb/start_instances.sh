#!/bin/bash
# Scout Analytics - MindsDB Instances Startup
# Starts two isolated MindsDB instances with health checks
# Usage: ./ops/mindsdb/start_instances.sh

set -euo pipefail

echo "🐳 Starting MindsDB instances (Desktop + Code)..."

cd "$(dirname "$0")"

# Create necessary directories
mkdir -p mdb_data_desktop mdb_data_code config_desktop config_code

# Start both instances
docker compose -f docker-compose.mcp.yml up -d

echo "⏳ Waiting for instances to be ready..."

# Wait for desktop instance
echo "  🖥️  Waiting for mindsdb-desktop (47334)..."
for i in {1..30}; do
    if curl -sf http://127.0.0.1:47334/api/status >/dev/null 2>&1; then
        echo "    ✅ Desktop instance ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "    ❌ Desktop instance failed to start"
        exit 1
    fi
    sleep 2
done

# Wait for code instance
echo "  💻 Waiting for mindsdb-code (57334)..."
for i in {1..30}; do
    if curl -sf http://127.0.0.1:57334/api/status >/dev/null 2>&1; then
        echo "    ✅ Code instance ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "    ❌ Code instance failed to start"
        exit 1
    fi
    sleep 2
done

echo ""
echo "🎯 MindsDB instances started successfully!"
echo "📊 Status:"
docker compose -f docker-compose.mcp.yml ps

echo ""
echo "🌐 Access URLs:"
echo "  Desktop instance: http://127.0.0.1:47334"
echo "  Code instance:    http://127.0.0.1:57334"
echo "  MCP SSE endpoints: /sse"

echo ""
echo "💡 Next steps:"
echo "  1. Run: ./register_datasources.sh"
echo "  2. Run: ./configure_claude.sh"