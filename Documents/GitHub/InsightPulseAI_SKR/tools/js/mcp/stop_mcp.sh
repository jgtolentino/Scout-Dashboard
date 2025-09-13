#!/bin/bash
# Stop MCP Server

echo "Stopping MCP server..."
pid=$(lsof -t -i:$MCP_PORT)
if [ -n "$pid" ]; then
    kill $pid
    echo "MCP server stopped."
else
    echo "No MCP server running on port $MCP_PORT."
fi
