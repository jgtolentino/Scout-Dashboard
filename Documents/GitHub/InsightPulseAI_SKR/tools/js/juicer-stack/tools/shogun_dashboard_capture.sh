#!/bin/bash
# shogun_dashboard_capture.sh - Captures screenshots of deployed dashboards
# Usage: ./shogun_dashboard_capture.sh [dashboard_url]

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Shogun Dashboard Screenshot Capture Tool                  ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ASSETS_DIR="${PROJECT_ROOT}/assets/screenshots"
DEFAULT_URL="https://gentle-rock-04e54f40f.6.azurestaticapps.net"
TEMP_SCRIPT="${PROJECT_ROOT}/tools/.temp_capture.js"

# Create assets/screenshots directory if it doesn't exist
mkdir -p "${ASSETS_DIR}"

# Handle arguments
DASHBOARD_URL=${1:-$DEFAULT_URL}
OUTPUT_FILE="${ASSETS_DIR}/retail_dashboard_${TIMESTAMP}.png"

echo -e "${BLUE}Dashboard URL: ${DASHBOARD_URL}${RESET}"
echo -e "${BLUE}Output file: ${OUTPUT_FILE}${RESET}"

# Check for Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}Node.js is installed, using Puppeteer for screenshot capture${RESET}"
    
    # Check for Puppeteer
    if ! npm list -g | grep -q puppeteer; then
        echo -e "${YELLOW}Puppeteer not found, installing globally...${RESET}"
        npm install -g puppeteer
    fi
    
    # Create temporary Puppeteer script
    cat > "${TEMP_SCRIPT}" << EOL
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    console.log('Opening new page...');
    const page = await browser.newPage();

    console.log('Setting viewport size...');
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to dashboard...');
    await page.goto('${DASHBOARD_URL}', { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('Waiting for dashboard to render fully...');
    // Using setTimeout instead of waitForTimeout for older Puppeteer versions
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: '${OUTPUT_FILE}', fullPage: true });

    console.log('Closing browser...');
    await browser.close();

    console.log('Screenshot captured successfully!');
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    process.exit(1);
  }
})();
EOL

    # Run the Puppeteer script
    echo -e "${BLUE}Running Puppeteer to capture screenshot...${RESET}"
    node "${TEMP_SCRIPT}"
    
    # Check if screenshot was created successfully
    if [ -f "${OUTPUT_FILE}" ]; then
        echo -e "${GREEN}Screenshot captured successfully: ${OUTPUT_FILE}${RESET}"
        # Clean up temporary script
        rm "${TEMP_SCRIPT}"
    else
        echo -e "${RED}Failed to capture screenshot${RESET}"
        exit 1
    fi

# Fallback to Chrome headless if Node.js is not available
elif command -v google-chrome &> /dev/null || command -v chrome &> /dev/null || command -v chromium &> /dev/null; then
    CHROME_CMD=""
    if command -v google-chrome &> /dev/null; then
        CHROME_CMD="google-chrome"
    elif command -v chrome &> /dev/null; then
        CHROME_CMD="chrome"
    elif command -v chromium &> /dev/null; then
        CHROME_CMD="chromium"
    fi
    
    echo -e "${GREEN}Using ${CHROME_CMD} for screenshot capture${RESET}"
    
    echo -e "${BLUE}Launching headless Chrome to capture screenshot...${RESET}"
    ${CHROME_CMD} --headless --disable-gpu --screenshot="${OUTPUT_FILE}" --window-size=1920,1080 --default-background-color=0 "${DASHBOARD_URL}"
    
    # Check if screenshot was created successfully
    if [ -f "${OUTPUT_FILE}" ]; then
        echo -e "${GREEN}Screenshot captured successfully: ${OUTPUT_FILE}${RESET}"
    else
        echo -e "${RED}Failed to capture screenshot${RESET}"
        exit 1
    fi

else
    echo -e "${RED}Error: Neither Node.js nor Chrome/Chromium is installed${RESET}"
    echo -e "${YELLOW}Please install either Node.js or Chrome/Chromium to use this tool${RESET}"
    exit 1
fi

# Display screenshot info
if [ -f "${OUTPUT_FILE}" ]; then
    echo -e "\n${BLUE}Screenshot Details:${RESET}"
    echo -e "Filename: $(basename "${OUTPUT_FILE}")"
    echo -e "Path: ${OUTPUT_FILE}"
    echo -e "Size: $(du -h "${OUTPUT_FILE}" | cut -f1)"
    echo -e "Dimensions: $(identify -format "%wx%h" "${OUTPUT_FILE}" 2>/dev/null || echo "Unknown (ImageMagick not installed)")"
    echo -e "Dashboard URL: ${DASHBOARD_URL}"
    echo -e "Timestamp: $(date -r "${OUTPUT_FILE}" "+%Y-%m-%d %H:%M:%S")"
fi

echo -e "\n${GREEN}Dashboard capture process complete!${RESET}"