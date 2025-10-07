#!/bin/bash
#
# export_diagram.sh
#
# Helper script for manually exporting the draw.io diagram to PNG and SVG
# This script provides instructions and prepares the destination folder
#

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

# Find script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Set paths
DIAGRAM_PATH="/Users/tbwa/Downloads/Project_Scout_Final_Sanitized.drawio"
IMAGES_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/docs/images"
PNG_PATH="${IMAGES_DIR}/AZURE_ARCHITECTURE_PRO.png"
SVG_PATH="${IMAGES_DIR}/AZURE_ARCHITECTURE_PRO.svg"
THUMBNAIL_PATH="${IMAGES_DIR}/AZURE_ARCHITECTURE_THUMBNAIL.png"

# Create images directory if it doesn't exist
mkdir -p "${IMAGES_DIR}"

echo -e "${BOLD}${CYAN}Project Scout Diagram Export Helper${RESET}"
echo ""
echo -e "${BLUE}This script will guide you through manually exporting the diagram${RESET}"
echo -e "${BLUE}from draw.io to PNG and SVG formats.${RESET}"
echo ""

# Check if diagram exists
if [ ! -f "${DIAGRAM_PATH}" ]; then
  echo -e "${RED}Error: Diagram file not found at:${RESET}"
  echo -e "${RED}${DIAGRAM_PATH}${RESET}"
  echo ""
  echo -e "${YELLOW}Please provide the correct path to the diagram:${RESET}"
  read -p "> " CUSTOM_PATH
  
  if [ -f "${CUSTOM_PATH}" ]; then
    DIAGRAM_PATH="${CUSTOM_PATH}"
    echo -e "${GREEN}Found diagram at: ${DIAGRAM_PATH}${RESET}"
  else
    echo -e "${RED}Error: Could not find diagram file.${RESET}"
    exit 1
  fi
fi

# Open the diagram in the default application
echo -e "${BLUE}Opening the diagram in draw.io...${RESET}"
open "${DIAGRAM_PATH}"

echo ""
echo -e "${YELLOW}=== Manual Export Steps ===${RESET}"
echo -e "${BOLD}1. Export to PNG:${RESET}"
echo "   a. In draw.io, go to File > Export as > PNG..."
echo "   b. Set scale to 2x for high resolution"
echo "   c. Save as: ${PNG_PATH}"
echo ""
echo -e "${BOLD}2. Export to SVG:${RESET}"
echo "   a. In draw.io, go to File > Export as > SVG..."
echo "   b. Save as: ${SVG_PATH}"
echo ""
echo -e "${BOLD}3. Create Thumbnail (Optional):${RESET}"
echo "   a. In draw.io, go to File > Export as > PNG..."
echo "   b. Set width to 800px"
echo "   c. Save as: ${THUMBNAIL_PATH}"
echo ""

echo -e "${BLUE}Waiting for exports to complete...${RESET}"
echo -e "${YELLOW}Press Enter when you have completed all exports${RESET}"
read -p "> " DUMMY

# Check if exports were successful
if [ -f "${PNG_PATH}" ] && [ -f "${SVG_PATH}" ]; then
  echo -e "${GREEN}✓ Exports completed successfully!${RESET}"
  
  # Get file sizes
  PNG_SIZE=$(du -h "${PNG_PATH}" | cut -f1)
  SVG_SIZE=$(du -h "${SVG_PATH}" | cut -f1)
  
  echo ""
  echo -e "${BLUE}Export details:${RESET}"
  echo -e "PNG: ${PNG_PATH} (${PNG_SIZE})"
  echo -e "SVG: ${SVG_PATH} (${SVG_SIZE})"
  
  if [ -f "${THUMBNAIL_PATH}" ]; then
    THUMB_SIZE=$(du -h "${THUMBNAIL_PATH}" | cut -f1)
    echo -e "Thumbnail: ${THUMBNAIL_PATH} (${THUMB_SIZE})"
  fi
  
  echo ""
  echo -e "${GREEN}The diagram exports are now ready to be used in documentation.${RESET}"
  echo -e "${BLUE}You can reference them in Markdown files using:${RESET}"
  echo ""
  echo '![Project Scout Architecture](docs/images/AZURE_ARCHITECTURE_PRO.png)'
  echo ""
  echo '*Click for [full-size diagram](docs/images/AZURE_ARCHITECTURE_PRO.svg)*'
else
  echo -e "${RED}✗ Exports not found. Please export the diagram manually:${RESET}"
  echo -e "PNG: ${PNG_PATH}"
  echo -e "SVG: ${SVG_PATH}"
fi