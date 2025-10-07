#!/bin/bash
# run_quick_diagram_qa.sh - Quick Architecture Diagram QA
# Performs fast validation on architecture diagrams

# Set colors for readable output
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Quick Architecture Diagram QA                             ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Default paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIAGRAM_NAME="${1:-project_scout_with_genai}"
DIAGRAM_PATH="${2:-${PROJECT_ROOT}/docs/diagrams/${DIAGRAM_NAME}.drawio}"
OUTPUT_DIR="${3:-${PROJECT_ROOT}/docs/images}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/diagram_qa_${TIMESTAMP}.log"

# Ensure output and log directories exist
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${LOG_DIR}"

echo -e "${BLUE}Running quick diagram QA on:${RESET} ${DIAGRAM_PATH}"
echo -e "${BLUE}Output directory:${RESET} ${OUTPUT_DIR}"
echo -e "${BLUE}Log file:${RESET} ${LOG_FILE}"

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: node is required but not installed${RESET}"
  exit 1
fi

# Check if file exists
if [ ! -f "${DIAGRAM_PATH}" ]; then
  echo -e "${RED}Error: Diagram file not found: ${DIAGRAM_PATH}${RESET}"
  echo -e "${YELLOW}Available diagrams:${RESET}"
  find "${PROJECT_ROOT}" -name "*.drawio" | grep -v "node_modules" | sort
  exit 1
fi

# Make quick_diagram_qa.js executable if it isn't already
chmod +x "${SCRIPT_DIR}/quick_diagram_qa.js" 2>/dev/null

# Run QA and capture output
echo -e "${BLUE}Running diagram QA...${RESET}"
node "${SCRIPT_DIR}/quick_diagram_qa.js" "${DIAGRAM_PATH}" "${OUTPUT_DIR}" | tee "${LOG_FILE}"
QA_EXIT_CODE=${PIPESTATUS[0]}

# Copy results to logs directory if generated
if [ -f "${OUTPUT_DIR}/quick_qa_results.md" ]; then
  cp "${OUTPUT_DIR}/quick_qa_results.md" "${LOG_DIR}/quick_qa_${TIMESTAMP}.md"
  echo -e "${BLUE}Results also saved to:${RESET} ${LOG_DIR}/quick_qa_${TIMESTAMP}.md"
fi

# Final status
echo ""
if [ ${QA_EXIT_CODE} -eq 0 ]; then
  echo -e "${BOLD}${GREEN}✅ QA COMPLETED SUCCESSFULLY${RESET}"
  echo -e "${YELLOW}Next steps:${RESET}"
  echo -e "1. Run full QA with: ${BOLD}run_complete_diagram_qa.sh ${DIAGRAM_NAME}${RESET}"
  echo -e "2. Check detailed results in: ${BOLD}${OUTPUT_DIR}/quick_qa_results.md${RESET}"
else
  echo -e "${BOLD}${RED}❌ QA COMPLETED WITH ISSUES${RESET}"
  echo -e "${YELLOW}Next steps:${RESET}"
  echo -e "1. Fix critical issues listed in: ${BOLD}${OUTPUT_DIR}/quick_qa_results.md${RESET}"
  echo -e "2. Run quick QA again with: ${BOLD}run_quick_diagram_qa.sh ${DIAGRAM_NAME}${RESET}"
fi

exit ${QA_EXIT_CODE}