#!/bin/bash

# Start a local server to view the dashboard
cd "$(dirname "$0")"

# Set port number
PORT=8080

# Check if the port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "Port $PORT is already in use. Killing process..."
    lsof -Pi :$PORT -sTCP:LISTEN -t | xargs kill -9
    sleep 1
fi

# Start the server in the background
cd client360/public
python3 -m http.server $PORT &
SERVER_PID=$!

echo "Server started on http://localhost:$PORT/ (PID: $SERVER_PID)"
echo "Press Enter to stop the server"

# Store the PID in a file for later use
echo $SERVER_PID > /tmp/dashboard_server_pid.txt

# Open the browser if possible
if command -v open >/dev/null; then
    open "http://localhost:$PORT/"
elif command -v xdg-open >/dev/null; then
    xdg-open "http://localhost:$PORT/"
elif command -v start >/dev/null; then
    start "http://localhost:$PORT/"
fi

# Wait for Enter key press
read

# Kill the server
kill $SERVER_PID
echo "Server stopped"