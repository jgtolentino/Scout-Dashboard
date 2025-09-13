#!/bin/bash
# PulseDev Setup Script
# This script sets up the entire PulseDev environment

echo "=================================="
echo "     PulseDev Setup Script        "
echo "=================================="
echo "This script will set up the entire PulseDev environment"
echo "including MCP server, backend, frontend, and Docker container."
echo ""

# Create required directories
mkdir -p logs
mkdir -p workspaces

# 1. Build Docker container
echo "Building Docker container for code execution..."
if command -v docker >/dev/null 2>&1; then
    cd docker/code_executor
    docker build -t pulsedev-executor:latest .
    cd ../..
    echo "✅ Docker container built successfully"
else
    echo "⚠️  Docker not installed. Skipping container build."
    echo "   Some features will not work without Docker."
fi

# 2. Set up backend
echo "Setting up backend..."
cd backend

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "Installing Python dependencies..."
source venv/bin/activate
pip install fastapi uvicorn websockets aiofiles python-multipart docker

# Create requirements.txt file
cat > requirements.txt << EOF
fastapi>=0.95.1
uvicorn>=0.22.0
websockets>=11.0.2
aiofiles>=23.1.0
python-multipart>=0.0.6
docker>=6.0.1
pydantic>=1.10.7
EOF

echo "✅ Backend setup complete"
cd ..

# 3. Set up frontend
echo "Setting up frontend..."
cd frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

echo "✅ Frontend setup complete"
cd ..

# 4. Create settings file
echo "Creating settings file..."
cat > .env << EOF
# PulseDev Settings
MCP_HOST=localhost
MCP_PORT=8765
BACKEND_HOST=localhost
BACKEND_PORT=8000
FRONTEND_HOST=localhost
FRONTEND_PORT=3000
WORKSPACE_ROOT=$(pwd)/workspaces
EOF

echo "✅ Settings file created"

# 5. Create backend log directory
echo "Creating log directories..."
mkdir -p logs/backend
mkdir -p logs/frontend
mkdir -p logs/mcp

echo "✅ Log directories created"

# Make launch and shutdown scripts executable
chmod +x launch.sh shutdown.sh

echo ""
echo "PulseDev setup complete! 🚀"
echo ""
echo "To start PulseDev:"
echo "  1. Start MCP server: cd .. && ./start_mcp.sh"
echo "  2. Start PulseDev:   ./launch.sh"
echo ""
echo "Access the PulseDev interface at: http://localhost:3000"
echo ""