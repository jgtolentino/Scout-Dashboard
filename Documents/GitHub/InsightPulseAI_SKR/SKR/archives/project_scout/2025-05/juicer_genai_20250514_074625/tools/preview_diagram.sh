#!/bin/bash
# preview_diagram.sh - Preview Architecture Diagram in Browser
# Creates a simple HTML preview and opens it in the default browser

# Set colors for readable output
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Default paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIAGRAM_NAME="${1:-project_scout_with_genai}"
DIAGRAM_PATH="${2:-${PROJECT_ROOT}/docs/diagrams/${DIAGRAM_NAME}.drawio}"
OUTPUT_DIR="${PROJECT_ROOT}/docs/images"
PREVIEW_DIR="/tmp/diagram_preview_${DIAGRAM_NAME}"
PREVIEW_HTML="${PREVIEW_DIR}/index.html"
PORT=8765

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Architecture Diagram Preview                              ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check if diagram exists
if [ ! -f "${DIAGRAM_PATH}" ]; then
  echo -e "${RED}Error: Diagram file not found: ${DIAGRAM_PATH}${RESET}"
  echo -e "${YELLOW}Available diagrams:${RESET}"
  find "${PROJECT_ROOT}" -name "*.drawio" | grep -v "node_modules" | sort
  exit 1
fi

# Create preview directory
mkdir -p "${PREVIEW_DIR}"

# Check if draw.io CLI is available to generate PNG
if command -v draw.io &> /dev/null; then
  echo -e "${BLUE}Generating PNG preview using draw.io CLI...${RESET}"
  PREVIEW_PNG="${PREVIEW_DIR}/${DIAGRAM_NAME}.png"
  draw.io -x -f png -o "${PREVIEW_PNG}" "${DIAGRAM_PATH}"
  IMAGE_PATH="${DIAGRAM_NAME}.png"
elif [ -f "${OUTPUT_DIR}/${DIAGRAM_NAME}.png" ]; then
  echo -e "${YELLOW}Using existing PNG from output directory...${RESET}"
  cp "${OUTPUT_DIR}/${DIAGRAM_NAME}.png" "${PREVIEW_DIR}/"
  IMAGE_PATH="${DIAGRAM_NAME}.png"
elif [ -f "${OUTPUT_DIR}/AZURE_ARCHITECTURE_PRO.png" ]; then
  echo -e "${YELLOW}Using existing architecture PNG...${RESET}"
  cp "${OUTPUT_DIR}/AZURE_ARCHITECTURE_PRO.png" "${PREVIEW_DIR}/${DIAGRAM_NAME}.png"
  IMAGE_PATH="${DIAGRAM_NAME}.png"
else
  echo -e "${YELLOW}No PNG available. Creating embedable preview from .drawio file...${RESET}"
  # Copy the drawio file for embedding
  cp "${DIAGRAM_PATH}" "${PREVIEW_DIR}/"
  IMAGE_PATH=""
fi

# Create HTML preview page
cat > "${PREVIEW_HTML}" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Architecture Diagram Preview: ${DIAGRAM_NAME}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            color: #212529;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #0078D4;
            color: white;
            padding: 1rem;
            text-align: center;
            margin-bottom: 2rem;
            border-radius: 0 0 5px 5px;
        }
        h1 {
            margin: 0;
            font-size: 1.8rem;
        }
        .diagram-container {
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        .info-panel {
            background-color: #e9ecef;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 1rem;
        }
        .button {
            display: inline-block;
            background-color: #0078D4;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        .button:hover {
            background-color: #005a9e;
        }
        footer {
            text-align: center;
            margin-top: 2rem;
            color: #6c757d;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <header>
        <h1>Architecture Diagram Preview: ${DIAGRAM_NAME}</h1>
    </header>
    
    <div class="container">
        <div class="info-panel">
            <strong>Preview generated:</strong> $(date)
            <br>
            <strong>Source file:</strong> ${DIAGRAM_PATH}
        </div>
        
        <div class="diagram-container">
EOL

# Add different content based on what we have
if [ -n "${IMAGE_PATH}" ]; then
    # We have a PNG image
    echo "            <img src=\"${IMAGE_PATH}\" alt=\"${DIAGRAM_NAME} Architecture Diagram\">" >> "${PREVIEW_HTML}"
else
    # We'll embed the diagram directly
    echo "            <p><strong>Interactive Diagram</strong> - May need to be opened in draw.io</p>" >> "${PREVIEW_HTML}"
    echo "            <iframe src=\"https://viewer.diagrams.net/?highlight=0000ff&edit=_blank&layers=1&nav=1&title=${DIAGRAM_NAME}#${DIAGRAM_NAME}.drawio\" width=\"100%\" height=\"600px\" frameborder=\"0\"></iframe>" >> "${PREVIEW_HTML}"
fi

# Finish the HTML
cat >> "${PREVIEW_HTML}" << EOL
        </div>
        
        <div>
            <a href="https://viewer.diagrams.net/?highlight=0000ff&edit=_blank&layers=1&nav=1&title=${DIAGRAM_NAME}#${DIAGRAM_NAME}.drawio" class="button" target="_blank">Open in draw.io Viewer</a>
            <a href="${DIAGRAM_PATH}" class="button" download>Download Source File</a>
        </div>
    </div>
    
    <footer>
        <p>Generated by Diagram QA Preview Tool</p>
    </footer>
</body>
</html>
EOL

# Start a simple HTTP server
echo -e "${BLUE}Starting preview server on port ${PORT}...${RESET}"
cd "${PREVIEW_DIR}"

# Check if python3 is available
if command -v python3 &> /dev/null; then
    # Try to start the server in the background
    python3 -m http.server ${PORT} &
    SERVER_PID=$!
    echo -e "${GREEN}Server started with PID ${SERVER_PID}${RESET}"
elif command -v python &> /dev/null; then
    # Fallback to python 2 if needed
    python -m SimpleHTTPServer ${PORT} &
    SERVER_PID=$!
    echo -e "${GREEN}Server started with PID ${SERVER_PID}${RESET}"
else
    echo -e "${RED}Error: Neither python3 nor python is available to start a web server${RESET}"
    echo -e "${YELLOW}Please manually open the preview file:${RESET} ${PREVIEW_HTML}"
    exit 1
fi

# Open the browser
echo -e "${BLUE}Opening preview in browser...${RESET}"
PREVIEW_URL="http://localhost:${PORT}"

# Determine the OS and use appropriate command to open the URL
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "${PREVIEW_URL}"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open "${PREVIEW_URL}"
    else
        echo -e "${YELLOW}Could not automatically open browser. Please visit:${RESET} ${PREVIEW_URL}"
    fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start "${PREVIEW_URL}"
else
    echo -e "${YELLOW}Could not automatically open browser. Please visit:${RESET} ${PREVIEW_URL}"
fi

echo -e "${GREEN}Preview server running at:${RESET} ${PREVIEW_URL}"
echo -e "${YELLOW}Press Ctrl+C to stop the server when finished.${RESET}"

# Wait for user to press Ctrl+C
trap "echo -e '${BLUE}Stopping preview server...${RESET}'; kill ${SERVER_PID}; exit 0" INT TERM
wait ${SERVER_PID}