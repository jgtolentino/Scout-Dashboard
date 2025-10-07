#!/bin/bash
# run_tbwa_theme_validator.sh - Validate TBWA brand theme on dashboards
# Ensures dashboards follow TBWA brand guidelines while maintaining Power BI visual style

# Set colors for readable output
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  TBWA Brand Theme Validator                                ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Default paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DASHBOARD_URL="${1:-http://localhost:8000}"
OUTPUT_DIR="${2:-${PROJECT_ROOT}/docs/images}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/tbwa_theme_validation_${TIMESTAMP}.log"

# Ensure output and log directories exist
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${LOG_DIR}"

echo -e "${BLUE}Running TBWA theme validator on:${RESET} ${DASHBOARD_URL}"
echo -e "${BLUE}Output directory:${RESET} ${OUTPUT_DIR}"
echo -e "${BLUE}Log file:${RESET} ${LOG_FILE}"

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: node is required but not installed${RESET}"
  exit 1
fi

# Check for required npm packages
REQUIRED_PACKAGES=("puppeteer" "pixelmatch" "pngjs")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
  if ! npm list --depth=0 "$package" &> /dev/null; then
    MISSING_PACKAGES+=("$package")
  fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
  echo -e "${YELLOW}Warning: Missing required npm packages:${RESET} ${MISSING_PACKAGES[*]}"
  echo -e "${BLUE}Installing missing packages...${RESET}"
  npm install --quiet "${MISSING_PACKAGES[@]}"
fi

# Run theme validator
echo -e "${BLUE}Running TBWA theme validator...${RESET}"
node "${SCRIPT_DIR}/tbwa_theme_validator.js" "${DASHBOARD_URL}" "${OUTPUT_DIR}" | tee "${LOG_FILE}"
VALIDATOR_EXIT_CODE=${PIPESTATUS[0]}

# Check for results file
RESULTS_FILE=$(find "${OUTPUT_DIR}" -name "tbwa_theme_results_*.json" | sort -r | head -n 1)
REPORT_FILE=$(find "${OUTPUT_DIR}" -name "tbwa_theme_report_*.md" | sort -r | head -n 1)

if [ -f "${RESULTS_FILE}" ]; then
  # Extract summary from results
  PASSES=$(grep -o '"passes":\[[^]]*\]' "${RESULTS_FILE}" | grep -o '\[.*\]' | grep -o '"check"' | wc -l)
  WARNINGS=$(grep -o '"warnings":\[[^]]*\]' "${RESULTS_FILE}" | grep -o '\[.*\]' | grep -o '"check"' | wc -l)
  FAILURES=$(grep -o '"failures":\[[^]]*\]' "${RESULTS_FILE}" | grep -o '\[.*\]' | grep -o '"check"' | wc -l)
  
  echo -e "\n${BOLD}TBWA Theme Validation Results Summary:${RESET}"
  echo -e "${GREEN}Passes:${RESET} ${PASSES} checks"
  echo -e "${YELLOW}Warnings:${RESET} ${WARNINGS} checks"
  echo -e "${RED}Failures:${RESET} ${FAILURES} checks"
  
  if [ ${FAILURES} -gt 0 ]; then
    echo -e "\n${BOLD}${RED}❌ FAILED${RESET} - Dashboard doesn't meet TBWA brand guidelines"
    echo -e "${BLUE}Detailed report:${RESET} ${REPORT_FILE}"
    exit 1
  elif [ ${WARNINGS} -gt 0 ]; then
    echo -e "\n${BOLD}${YELLOW}⚠️ PASSED WITH WARNINGS${RESET} - Review warnings for improvements"
    echo -e "${BLUE}Detailed report:${RESET} ${REPORT_FILE}"
    exit 0
  else
    echo -e "\n${BOLD}${GREEN}✅ PASSED${RESET} - Dashboard meets TBWA brand guidelines"
    echo -e "${BLUE}Detailed report:${RESET} ${REPORT_FILE}"
    exit 0
  fi
else
  echo -e "\n${BOLD}${RED}❌ ERROR${RESET} - No results file found"
  exit ${VALIDATOR_EXIT_CODE}
fi