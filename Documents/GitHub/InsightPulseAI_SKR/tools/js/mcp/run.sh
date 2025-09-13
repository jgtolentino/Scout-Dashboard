#!/bin/bash
# Simple MCP server launch script

cd "$(dirname "$0")" || exit
python3 pulser_mcp_server.py --host localhost --port 9090