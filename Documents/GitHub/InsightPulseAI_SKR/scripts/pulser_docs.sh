#!/bin/bash
#
# pulser_docs.sh - Open Pulser documentation dashboard
#
# This script opens the InsightPulseAI Agent System documentation dashboard
# in the default browser.

VERSION="1.0.0"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_DIR="${REPO_ROOT}/docs"
HTML_FILE="${DOCS_DIR}/index.html"

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Show help message
function show_help() {
    echo -e "${BLUE}${BOLD}Pulser Documentation Viewer v${VERSION}${NC}"
    echo
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  ${BOLD}pulser_docs.sh${NC} [options]"
    echo
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  ${BOLD}-h, --help${NC}     Show this help message"
    echo -e "  ${BOLD}-v, --version${NC}  Show version information"
    echo
    echo -e "${YELLOW}Description:${NC}"
    echo -e "  Opens the InsightPulseAI Agent System documentation dashboard in your default browser."
    echo
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Check for version flag
if [[ "$1" == "-v" || "$1" == "--version" ]]; then
    echo -e "${BLUE}${BOLD}Pulser Documentation Viewer v${VERSION}${NC}"
    exit 0
fi

# Check if docs exist
if [ ! -f "$HTML_FILE" ]; then
    echo -e "${YELLOW}Documentation file not found at: ${HTML_FILE}${NC}"
    echo -e "${YELLOW}Please ensure the documentation has been generated.${NC}"
    exit 1
fi

# Detect OS and open browser accordingly
echo -e "${GREEN}Opening InsightPulseAI Agent System documentation...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$HTML_FILE"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open > /dev/null; then
        xdg-open "$HTML_FILE"
    else
        echo -e "${YELLOW}Cannot find browser. Please open this file manually:${NC}"
        echo -e "${BOLD}$HTML_FILE${NC}"
    fi
elif [[ "$OSTYPE" == "cygwin" || "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start "$HTML_FILE"
else
    # Unknown OS
    echo -e "${YELLOW}Cannot detect OS. Please open this file manually:${NC}"
    echo -e "${BOLD}$HTML_FILE${NC}"
fi

echo -e "${GREEN}${BOLD}Done!${NC}"
exit 0