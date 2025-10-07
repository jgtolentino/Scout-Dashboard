#!/bin/bash
#
# run_insights_monitor.sh
#
# Shell script to launch the GenAI Insights Monitor dashboard
#

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

# Default configuration
PORT=3400
LOG_LEVEL="info"
HISTORY_DAYS=7
OPEN_DASHBOARD=true
WATCH_MODE=true
DATA_DIR="../data/insights"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --log-level=*)
      LOG_LEVEL="${1#*=}"
      shift
      ;;
    --history=*)
      HISTORY_DAYS="${1#*=}"
      shift
      ;;
    --no-dashboard)
      OPEN_DASHBOARD=false
      shift
      ;;
    --no-watch)
      WATCH_MODE=false
      shift
      ;;
    --data-dir=*)
      DATA_DIR="${1#*=}"
      shift
      ;;
    --help)
      echo -e "${BOLD}GenAI Insights Monitor${RESET}"
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --port=PORT         Set server port (default: 3400)"
      echo "  --log-level=LEVEL   Set log level (debug, info, warn, error)"
      echo "  --history=DAYS      Number of days of history to display"
      echo "  --no-dashboard      Don't open the dashboard in browser"
      echo "  --no-watch          Don't poll for changes (disable watch mode)"
      echo "  --data-dir=DIR      Set data directory (default: ../data/insights)"
      echo "  --help              Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $1${RESET}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Ensure data directory exists
mkdir -p "${SCRIPT_DIR}/${DATA_DIR}"

# Display configuration
echo -e "${BOLD}${CYAN}GenAI Insights Monitor${RESET}"
echo -e "${BLUE}Configuration:${RESET}"
echo -e "  Port:          ${PORT}"
echo -e "  Log Level:     ${LOG_LEVEL}"
echo -e "  History Days:  ${HISTORY_DAYS}"
echo -e "  Open Dashboard:${OPEN_DASHBOARD}"
echo -e "  Watch Mode:    ${WATCH_MODE}"
echo -e "  Data Directory:${DATA_DIR}"
echo ""

# Build command arguments
ARGS="--port=${PORT} --log-level=${LOG_LEVEL} --history=${HISTORY_DAYS}"

if [ "$OPEN_DASHBOARD" = true ]; then
  ARGS="${ARGS} --dashboard"
fi

if [ "$WATCH_MODE" = true ]; then
  ARGS="${ARGS} --watch"
fi

# Launch the node script
echo -e "${YELLOW}Starting Insights Monitor...${RESET}"
echo ""

cd "${SCRIPT_DIR}"
node insights_monitor.js ${ARGS}