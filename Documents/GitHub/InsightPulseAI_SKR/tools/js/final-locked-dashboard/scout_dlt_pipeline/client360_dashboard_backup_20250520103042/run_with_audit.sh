#!/bin/bash

# Start the audit app in the background
echo "Starting the Dash Audit App..."
(cd audit && ./run_local.sh) &
AUDIT_PID=$!

# Start a simple HTTP server for the static dashboard
echo "Starting the Static Dashboard server..."
python3 -m http.server 8000 --directory static &
DASHBOARD_PID=$!

echo ""
echo "🚀 Services started!"
echo "Dashboard: http://localhost:8000"
echo "Audit App: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "kill $AUDIT_PID $DASHBOARD_PID; exit 0" INT
wait