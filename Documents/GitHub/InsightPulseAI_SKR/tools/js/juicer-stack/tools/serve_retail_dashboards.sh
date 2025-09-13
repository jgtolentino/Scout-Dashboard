#!/bin/bash
# serve_retail_dashboards.sh
# Serves the retail dashboards locally using Python's HTTP server
# Author: InsightPulseAI Team

# Color constants for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==== Retail Dashboards Local Server ====${NC}"

# Define paths to dashboard directories
EDGE_DASHBOARD_DIR="$(pwd)/../dashboards/retail_edge"
PERFORMANCE_DASHBOARD_DIR="$(pwd)/../dashboards/retail_performance"

# Check for dashboard directories
if [ ! -d "$EDGE_DASHBOARD_DIR" ] || [ ! -d "$PERFORMANCE_DASHBOARD_DIR" ]; then
  echo -e "${RED}Error: Dashboard directories not found.${NC}"
  echo "Expected:"
  echo "  $EDGE_DASHBOARD_DIR"
  echo "  $PERFORMANCE_DASHBOARD_DIR"
  exit 1
fi

# Check if Python is available
if command -v python3 &> /dev/null; then
  PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
  PYTHON_CMD="python"
else
  echo -e "${RED}Error: Python not found. Please install Python to use this script.${NC}"
  exit 1
fi

# Create a temporary directory to serve both dashboards
TMP_DIR="/tmp/retail_dashboards_$(date +%s)"
mkdir -p "$TMP_DIR"

# Copy dashboard files to the temp directory
echo -e "${BLUE}Copying dashboard files to temporary directory...${NC}"
cp -r "$EDGE_DASHBOARD_DIR"/* "$TMP_DIR"
cp -r "$PERFORMANCE_DASHBOARD_DIR"/* "$TMP_DIR"

# Create an index.html file that links to both dashboards
cat > "$TMP_DIR/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Retail Dashboards</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background-color: #f5f5f5;
      padding: 2rem;
    }
    .card {
      border-radius: 10px;
      transition: transform 0.2s;
      margin-bottom: 20px;
      border: none;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 15px rgba(0,0,0,0.15);
    }
    .card-header {
      background-color: #002b49;
      color: white;
      border-radius: 10px 10px 0 0 !important;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="mb-4">Retail Dashboards</h1>
    <div class="row">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h5 class="mb-0">Retail Edge Interaction Dashboard</h5>
          </div>
          <div class="card-body">
            <p>Visualizes customer interactions from edge devices (Raspberry Pi 5) in physical retail environments.</p>
            <ul>
              <li>STT + face detection events per hour/day</li>
              <li>Brand mention tracking (per camera node)</li>
              <li>Interaction quality score (per session)</li>
              <li>Conversion proxy via dwell time vs CTA triggers</li>
            </ul>
            <div class="text-center mt-3">
              <a href="retail_edge_dashboard.html" class="btn btn-primary">Launch Dashboard</a>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h5 class="mb-0">Retail Performance Uplift Dashboard</h5>
          </div>
          <div class="card-body">
            <p>Campaign-level uplift tracking across in-store AI deployments.</p>
            <ul>
              <li>Before/after campaign uplift by SKU</li>
              <li>Real-time pricing effect (via smart shelf)</li>
              <li>Sentiment and voice tone correlation to action</li>
              <li>Aggregated brand lift metrics</li>
            </ul>
            <div class="text-center mt-3">
              <a href="retail_performance_dashboard.html" class="btn btn-primary">Launch Dashboard</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
EOF

# Determine port to use (8000 by default, but try others if occupied)
PORT=8000

# Function to check if port is in use
port_in_use() {
  # Try a few different methods to check port usage
  if command -v netstat &> /dev/null; then
    netstat -tuln | grep -q ":$1 "
    return $?
  elif command -v lsof &> /dev/null; then
    lsof -i:"$1" &> /dev/null
    return $?
  else
    # Just try to bind to the port in Python
    python3 -c "import socket; s=socket.socket(); s.bind(('', $1)); s.close()" &> /dev/null
    # Invert the return code (0 means available, 1 means in use)
    if [ $? -eq 0 ]; then
      return 1
    else
      return 0
    fi
  fi
}

# Find an available port
while port_in_use $PORT; do
  PORT=$((PORT+1))
  if [ $PORT -gt 8020 ]; then
    echo -e "${RED}Error: Could not find an available port in range 8000-8020.${NC}"
    echo "Please close some applications and try again."
    exit 1
  fi
done

# If we made it here, PORT should be available
echo -e "${BLUE}Found available port: $PORT${NC}"

# Start the HTTP server
echo -e "${GREEN}Starting server on port $PORT...${NC}"
echo -e "${GREEN}Access the dashboards at:${NC}"
echo -e "${BLUE}http://localhost:$PORT/${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"

# Create a redirecting index.html that accounts for the dynamic port
cat > "$TMP_DIR/redirect.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=http://localhost:$PORT/">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="http://localhost:$PORT/">http://localhost:$PORT/</a>...</p>
</body>
</html>
EOF

# Save port to a file for the CLI commands to use
echo $PORT > "$TMP_DIR/server_port.txt"

# Change to the temp directory and start the server
cd "$TMP_DIR"
"$PYTHON_CMD" -m http.server $PORT

# Cleanup on exit
function cleanup {
  echo -e "${BLUE}Cleaning up temporary files...${NC}"
  rm -rf "$TMP_DIR"
  echo -e "${GREEN}Server stopped.${NC}"
}

trap cleanup EXIT