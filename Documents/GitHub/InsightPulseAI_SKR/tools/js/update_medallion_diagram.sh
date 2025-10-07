#!/bin/bash
# update_medallion_diagram.sh - Updates Project Scout diagram with new medallion architecture

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔═════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Project Scout Medallion Architecture - Draw.io Update Tool  ║${RESET}"
echo -e "${BOLD}${BLUE}╚═════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}" && pwd)"
INPUT_DIAGRAM="${1:-${PROJECT_ROOT}/juicer-stack/docs/diagrams/project_scout_with_genai.drawio}"
OUTPUT_DIAGRAM="${2:-${PROJECT_ROOT}/juicer-stack/docs/diagrams/project_scout_with_genai_updated.drawio}"

# Check if input file exists
if [ ! -f "$INPUT_DIAGRAM" ]; then
    echo -e "${RED}Error: Input diagram not found at ${INPUT_DIAGRAM}${RESET}"
    echo -e "${YELLOW}Please provide a valid path to the input diagram:${RESET}"
    echo -e "${YELLOW}  ./update_medallion_diagram.sh <input_path> <output_path>${RESET}"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${RESET}"
    echo -e "${YELLOW}Please install Node.js to use this tool:${RESET}"
    echo -e "   https://nodejs.org/en/download/"
    exit 1
fi

# Install required dependencies if not already installed
if ! node -e "require('xmldom')" 2>/dev/null; then
    echo -e "${YELLOW}Installing required dependencies (xmldom)...${RESET}"
    cd "${SCRIPT_DIR}" && npm install xmldom
fi

# Run the diagram updater
echo -e "${BLUE}Updating Project Scout diagram with new medallion architecture...${RESET}"
echo -e "${BLUE}Input diagram: ${INPUT_DIAGRAM}${RESET}"
echo -e "${BLUE}Output diagram: ${OUTPUT_DIAGRAM}${RESET}"

node "${SCRIPT_DIR}/update_medallion_drawio.js" "${INPUT_DIAGRAM}" "${OUTPUT_DIAGRAM}"

# Check result
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Diagram updated successfully!${RESET}"
    echo -e "The updated diagram has been saved to: ${OUTPUT_DIAGRAM}"
    
    # Check for draw.io CLI for export
    if command -v drawio &> /dev/null; then
        echo -e "${BLUE}Exporting diagram as SVG and PNG...${RESET}"
        SVG_PATH="${OUTPUT_DIAGRAM%.*}.svg"
        PNG_PATH="${OUTPUT_DIAGRAM%.*}.png"
        
        drawio --export --format svg --output "${SVG_PATH}" "${OUTPUT_DIAGRAM}"
        drawio --export --format png --output "${PNG_PATH}" "${OUTPUT_DIAGRAM}"
        
        echo -e "${GREEN}Exported as SVG: ${SVG_PATH}${RESET}"
        echo -e "${GREEN}Exported as PNG: ${PNG_PATH}${RESET}"
    else
        echo -e "${YELLOW}Note: draw.io CLI not found. Manual export required.${RESET}"
        echo -e "${YELLOW}To create exports, open the diagram in draw.io and use File > Export${RESET}"
    fi
    
    echo -e "\n${GREEN}Would you like to open the updated diagram? (y/n)${RESET}"
    read -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "${OUTPUT_DIAGRAM}"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "${OUTPUT_DIAGRAM}"
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            start "${OUTPUT_DIAGRAM}"
        else
            echo -e "${YELLOW}Could not automatically open the diagram.${RESET}"
            echo -e "${YELLOW}Please open it manually at: ${OUTPUT_DIAGRAM}${RESET}"
        fi
    fi
else
    echo -e "${RED}Error updating diagram. Please check the error messages above.${RESET}"
    exit 1
fi

echo -e "\n${GREEN}Project Scout medallion diagram update completed!${RESET}"