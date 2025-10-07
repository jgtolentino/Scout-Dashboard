#!/bin/bash
# launch_backend.sh
# Launches the backend webhook listener for Pulser Web Interface

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PULSER_DIR="${HOME}/.pulser"
LOG_FILE="${PULSER_DIR}/backend.log"

# Create necessary directories
mkdir -p "${PULSER_DIR}"
mkdir -p "${PULSER_DIR}/context"
mkdir -p "${PULSER_DIR}/screenshots"

# Make scripts executable
chmod +x "${SCRIPT_DIR}/claude_router.py"
chmod +x "${SCRIPT_DIR}/shogun_runner.py"

# Install required Node.js packages
echo "Installing required packages..."
cd "${SCRIPT_DIR}"
npm install express cors body-parser 

# Start the webhook listener
echo "Starting webhook listener..."
echo "Logs will be written to ${LOG_FILE}"
echo ""
echo "==== Pulser Backend ====="
echo "Webhook endpoint: http://localhost:3333/api/message"
echo "Health check: http://localhost:3333/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================="

# Launch the server
node "${SCRIPT_DIR}/webhook_listener.js" > "${LOG_FILE}" 2>&1 &

# Save the PID for later cleanup
echo $! > "${PULSER_DIR}/backend.pid"

echo "Backend started with PID: $(cat ${PULSER_DIR}/backend.pid)"
echo "To stop the server, run: kill $(cat ${PULSER_DIR}/backend.pid)"

# Wait for the server to start
sleep 2

# Check if the server is running
if curl -s http://localhost:3333/health > /dev/null; then
    echo "Backend is running successfully!"
    echo "You can now use the Pulser Web Interface at https://pulser-ai.app"
else
    echo "Backend failed to start. Check logs at ${LOG_FILE}"
    exit 1
fi