#!/usr/bin/env bash
# CREATE_MOCK_MCP_SERVER.sh
# Creates a simple mock MCP server for testing Claude Desktop connectivity

set -euo pipefail

# Color formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MCP_PORT="${MCP_PORT:-9315}"
MOCK_LOG="${HOME}/.mcp/mock_mcp.log"

# Create minimal server function
create_mock_server() {
  mkdir -p "$(dirname "$MOCK_LOG")"
  
  # Python HTTP Mock Server
  cat > /tmp/mock_mcp_server.py << 'EOF'
import http.server
import socketserver
import json
import time
from datetime import datetime
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9315
LOG_FILE = os.path.expanduser("~/.mcp/mock_mcp.log")

class MCPHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        with open(LOG_FILE, "a") as f:
            f.write(f"{timestamp} {args[0]}\n")
        
    def do_GET(self):
        timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        with open(LOG_FILE, "a") as f:
            f.write(f"{timestamp} GET {self.path}\n")
            
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
        elif self.path == '/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok",
                "version": "mock-1.0.0",
                "uptime": 1234,
                "connections": 1
            }).encode())
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": "Not found"}).encode())

print(f"Starting mock MCP server on port {PORT}...")
with open(LOG_FILE, "a") as f:
    f.write(f"{datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]}Z Mock MCP server starting on port {PORT}\n")

with socketserver.TCPServer(("", PORT), MCPHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        with open(LOG_FILE, "a") as f:
            f.write(f"{datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]}Z Mock MCP server shutting down\n")
        print("Server shutting down...")
EOF

  # Kill any existing servers
  pkill -f "python3 /tmp/mock_mcp_server.py" &>/dev/null || true
  
  # Start new server
  nohup python3 /tmp/mock_mcp_server.py "$MCP_PORT" > /dev/null 2>&1 &
  echo -e "${GREEN}Mock MCP server started on port $MCP_PORT${NC}"
  echo -e "PID: $!"
  
  # Wait for server to start
  sleep 1
  
  # Test the server
  if curl -s "http://localhost:$MCP_PORT/health" | grep -q "ok"; then
    echo -e "${GREEN}Mock server is responding correctly${NC}"
  else
    echo -e "${RED}Mock server is not responding correctly${NC}"
    exit 1
  fi
}

echo -e "${BLUE}Creating mock MCP server on port $MCP_PORT...${NC}"
create_mock_server

cat <<EOF

${GREEN}Mock MCP server is running!${NC}

To test Claude Desktop connectivity:
1. Configure Claude Desktop to use URL: ${YELLOW}http://127.0.0.1:$MCP_PORT${NC}
2. Save settings and restart Claude Desktop
3. Check logs at: $MOCK_LOG

To stop the server:
${YELLOW}pkill -f "python3 /tmp/mock_mcp_server.py"${NC}

EOF