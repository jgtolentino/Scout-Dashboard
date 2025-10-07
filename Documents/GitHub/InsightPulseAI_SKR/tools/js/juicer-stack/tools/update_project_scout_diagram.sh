#!/bin/bash
# update_project_scout_diagram.sh - Updates Project Scout diagram with GenAI insights

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Project Scout Diagram Update - GenAI Insights Integration  ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_INPUT_DIAGRAM="/Users/tbwa/Downloads/Worked_project_scout_official_icons.drawio"
DEFAULT_OUTPUT_DIAGRAM="/Users/tbwa/Downloads/Updated_project_scout_with_genai.drawio"

# Parse command line arguments
INPUT_DIAGRAM="${1:-$DEFAULT_INPUT_DIAGRAM}"
OUTPUT_DIAGRAM="${2:-$DEFAULT_OUTPUT_DIAGRAM}"

# Check if input file exists
if [ ! -f "$INPUT_DIAGRAM" ]; then
    echo -e "${RED}Error: Input diagram not found at ${INPUT_DIAGRAM}${RESET}"
    echo -e "${YELLOW}Please provide a valid path to the input diagram:${RESET}"
    echo -e "${YELLOW}  ./update_project_scout_diagram.sh <input_path> <output_path>${RESET}"
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
echo -e "${BLUE}Updating Project Scout diagram with GenAI Insights components...${RESET}"
echo -e "${BLUE}Input diagram: ${INPUT_DIAGRAM}${RESET}"
echo -e "${BLUE}Output diagram: ${OUTPUT_DIAGRAM}${RESET}"

node "${SCRIPT_DIR}/update_drawio.js" "${INPUT_DIAGRAM}" "${OUTPUT_DIAGRAM}"

# Check result
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Diagram updated successfully!${RESET}"
    echo -e "The updated diagram has been saved to: ${OUTPUT_DIAGRAM}"
    
    # Copy to project documentation folder
    DOC_DIAGRAMS_DIR="${PROJECT_ROOT}/docs/diagrams"
    if [ ! -d "$DOC_DIAGRAMS_DIR" ]; then
        mkdir -p "$DOC_DIAGRAMS_DIR"
    fi
    
    cp "${OUTPUT_DIAGRAM}" "${DOC_DIAGRAMS_DIR}/project_scout_with_genai.drawio"
    echo -e "${GREEN}A copy of the diagram has been saved to the documentation folder:${RESET}"
    echo -e "${DOC_DIAGRAMS_DIR}/project_scout_with_genai.drawio"
    
    # Generate PNG export if draw.io CLI is available
    if command -v draw.io &> /dev/null; then
        echo -e "${BLUE}Generating PNG export of the diagram...${RESET}"
        draw.io -x -f png -o "${DOC_DIAGRAMS_DIR}/project_scout_with_genai.png" "${OUTPUT_DIAGRAM}"
        echo -e "${GREEN}PNG export created at: ${DOC_DIAGRAMS_DIR}/project_scout_with_genai.png${RESET}"
    else
        echo -e "${YELLOW}Note: draw.io CLI not found. PNG export not created automatically.${RESET}"
        echo -e "${YELLOW}To create PNG export, open the diagram in draw.io and use File > Export as > PNG${RESET}"
    fi
else
    echo -e "${RED}Error updating diagram. Please check the error messages above.${RESET}"
    exit 1
fi

echo -e "\n${GREEN}Project Scout diagram update completed!${RESET}"