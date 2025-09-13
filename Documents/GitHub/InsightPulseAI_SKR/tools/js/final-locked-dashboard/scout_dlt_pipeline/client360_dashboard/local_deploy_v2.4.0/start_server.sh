#!/bin/bash
# Simple HTTP server for testing the dashboard
PORT=${1:-8000}
echo "Starting local server on port $PORT..."
echo "Access the dashboard at: http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"

if command -v python3 &> /dev/null; then
  python3 -m http.server $PORT
elif command -v python &> /dev/null; then
  python -m SimpleHTTPServer $PORT
elif command -v npx &> /dev/null; then
  npx serve -l $PORT
else
  echo "Error: No suitable server found. Please install Python or Node.js."
  exit 1
fi
