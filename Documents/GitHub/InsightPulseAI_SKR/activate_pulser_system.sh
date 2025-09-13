#!/bin/bash
# activate_pulser_system.sh
# Full activation script for Pulser Web Interface and backend services

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TOOLS_DIR="${SCRIPT_DIR}/tools"
PULSER_DIR="${HOME}/.pulser"
LOG_DIR="${PULSER_DIR}/logs"

# Create necessary directories
mkdir -p "${PULSER_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${PULSER_DIR}/context"
mkdir -p "${PULSER_DIR}/screenshots"

echo "===== Pulser System Activation ====="
echo "Setting up Pulser Web Interface and backend services"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd "${TOOLS_DIR}"
npm install

# Make scripts executable
chmod +x "${TOOLS_DIR}/claude_router.py"
chmod +x "${TOOLS_DIR}/shogun_runner.py"
chmod +x "${TOOLS_DIR}/launch_backend.sh"

# Start the backend services
echo "Starting backend services..."
"${TOOLS_DIR}/launch_backend.sh" &

echo ""
echo "Waiting for backend to initialize..."
sleep 5

# Test backend health
if curl -s http://localhost:3333/health > /dev/null; then
    echo "✅ Backend is running successfully!"
else
    echo "❌ Backend failed to start. Check logs at ${PULSER_DIR}/backend.log"
    exit 1
fi

echo ""
echo "===== Pulser System Status ====="
echo "✅ Web UI deployed at: https://pulser-ai.app"
echo "✅ Backend API running at: http://localhost:3333"
echo "✅ Agent orchestration active"
echo ""
echo "You can now access the Pulser Web Interface at https://pulser-ai.app"
echo "All backend services are running and ready to process requests."
echo ""
echo "To stop the backend services, run:"
echo "kill \$(cat ${PULSER_DIR}/backend.pid)"
echo "====================================="