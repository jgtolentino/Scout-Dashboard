#!/bin/bash

# Run Reverse Snapshot Demo Tool
# This script provides an easy way to run the Reverse Snapshot demo

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ╭─────────────────────────────────────────────────╮    ║"
echo "║   │     🔄 Pulser Reverse Snapshot Demo Tool  🔄     │    ║"
echo "║   ╰─────────────────────────────────────────────────╯    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not installed.${NC}"
    echo "Please install Node.js and try again."
    exit 1
fi

# Set script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create output directory if it doesn't exist
mkdir -p output

# Parse command line arguments
FORMAT="markdown"
SAVE_ONLY=false
VIEW_OUTPUT=false
DEBUG=false

print_help() {
    echo -e "${YELLOW}Usage:${NC} ./run_reverse_snapshot.sh [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help message"
    echo "  -f, --format     Output format (markdown, json, yaml)"
    echo "  -s, --save-only  Generate the output but don't print to console"
    echo "  -v, --view       Open the output file in default viewer after generating"
    echo "  -d, --debug      Enable debug mode with verbose logging"
    echo ""
    exit 0
}

for arg in "$@"; do
    case $arg in
        -h|--help)
        print_help
        ;;
        -f=*|--format=*)
        FORMAT="${arg#*=}"
        ;;
        -s|--save-only)
        SAVE_ONLY=true
        ;;
        -v|--view)
        VIEW_OUTPUT=true
        ;;
        -d|--debug)
        DEBUG=true
        ;;
        *)
        # Unknown option
        echo -e "${RED}Unknown option: $arg${NC}"
        print_help
        ;;
    esac
done

# Build the command
CMD="node demo_integrated_reverse.js"

if [ "$SAVE_ONLY" = true ]; then
    CMD="$CMD --save-only"
fi

if [ "$FORMAT" != "markdown" ]; then
    CMD="$CMD --format=$FORMAT"
fi

# Run the command
echo -e "${GREEN}Running Reverse Snapshot demo...${NC}"
echo -e "${YELLOW}Command:${NC} $CMD"
echo ""

if [ "$DEBUG" = true ]; then
    echo -e "${YELLOW}Debug mode enabled. Full output will be shown.${NC}"
    echo ""
    eval $CMD
else
    if [ "$SAVE_ONLY" = true ]; then
        eval $CMD > /dev/null
    else
        eval $CMD
    fi
fi

# Determine the output file path
OUTPUT_FILE="./output/reverse_snapshot_result"
case $FORMAT in
    markdown)
    OUTPUT_FILE="$OUTPUT_FILE.md"
    ;;
    json)
    OUTPUT_FILE="$OUTPUT_FILE.json"
    ;;
    yaml)
    OUTPUT_FILE="$OUTPUT_FILE.yaml"
    ;;
    *)
    OUTPUT_FILE="$OUTPUT_FILE.md"
    ;;
esac

# Check if output file exists
if [ ! -f "$OUTPUT_FILE" ]; then
    echo -e "${RED}Error: Output file not generated: $OUTPUT_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"

# Open the output file if requested
if [ "$VIEW_OUTPUT" = true ]; then
    echo -e "${GREEN}Opening output file...${NC}"
    case "$(uname)" in
        Darwin)
        # macOS
        open "$OUTPUT_FILE"
        ;;
        Linux)
        # Linux
        xdg-open "$OUTPUT_FILE" > /dev/null 2>&1 &
        ;;
        CYGWIN*|MINGW*|MSYS*)
        # Windows
        start "$OUTPUT_FILE"
        ;;
        *)
        echo -e "${YELLOW}Could not open file automatically on this platform.${NC}"
        echo -e "${YELLOW}Please open manually:${NC} $OUTPUT_FILE"
        ;;
    esac
fi

echo ""
echo -e "${GREEN}Done!${NC}"