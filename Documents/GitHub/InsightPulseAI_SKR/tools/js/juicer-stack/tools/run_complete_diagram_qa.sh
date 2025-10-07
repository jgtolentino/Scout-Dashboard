#!/bin/bash
# run_complete_diagram_qa.sh - Complete Architecture Diagram QA Suite
# This script runs all diagram QA tools and produces a comprehensive report

# Set colors for readable output
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Complete Architecture Diagram QA Suite                    ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Default paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIAGRAM_NAME="${1:-project_scout_with_genai}"
DIAGRAM_PATH="${2:-${PROJECT_ROOT}/docs/diagrams/${DIAGRAM_NAME}.drawio}"
OUTPUT_DIR="${3:-${PROJECT_ROOT}/docs/images}"
QA_RESULTS="${OUTPUT_DIR}/full_qa_report.md"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Ensure output directory exists
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${PROJECT_ROOT}/docs/architecture_src"
mkdir -p "${PROJECT_ROOT}/logs"

# Initialize results file
cat > "${QA_RESULTS}" << EOL
# Architecture Diagram QA Report

**Diagram:** ${DIAGRAM_NAME}  
**Date:** $(date)  
**QA Run ID:** ${TIMESTAMP}

## QA Tools Run

EOL

echo -e "${BLUE}Running format validation...${RESET}"
node "${SCRIPT_DIR}/validate_diagram_formats.js" "${DIAGRAM_NAME}" "${PROJECT_ROOT}" > "${OUTPUT_DIR}/format_validation_output.txt" 2>&1
FORMAT_EXIT_CODE=$?

echo -e "${BLUE}Running diagram validation...${RESET}"
bash "${SCRIPT_DIR}/diagram_qa_validate.sh" "${DIAGRAM_PATH}" "${OUTPUT_DIR}" > "${OUTPUT_DIR}/diagram_validation_output.txt" 2>&1
DIAGRAM_EXIT_CODE=$?

# Determine overall status
if [ ${FORMAT_EXIT_CODE} -eq 0 ] && [ ${DIAGRAM_EXIT_CODE} -eq 0 ]; then
    OVERALL_STATUS="${GREEN}✅ PASSED${RESET}"
    echo -e "${GREEN}✅ QA PASSED: All checks completed successfully${RESET}"
elif [ ${FORMAT_EXIT_CODE} -eq 0 ] || [ ${DIAGRAM_EXIT_CODE} -eq 0 ]; then
    OVERALL_STATUS="${YELLOW}⚠️ PARTIAL PASS${RESET}"
    echo -e "${YELLOW}⚠️ QA PARTIAL PASS: Some checks failed${RESET}"
else
    OVERALL_STATUS="${RED}❌ FAILED${RESET}"
    echo -e "${RED}❌ QA FAILED: Critical issues detected${RESET}"
fi

# Update the QA report
cat >> "${QA_RESULTS}" << EOL
1. Format Validation: ${FORMAT_EXIT_CODE}
2. Diagram Structure Validation: ${DIAGRAM_EXIT_CODE}

## Summary

EOL

# Extract summary from format validation
if [ -f "${OUTPUT_DIR}/format_validation_output.txt" ]; then
    # Extract summary section from format validation output
    sed -n '/Format Validation Summary/,/Next Steps:/p' "${OUTPUT_DIR}/format_validation_output.txt" | \
        grep -v "Format Validation Summary" | grep -v "Next Steps:" >> "${QA_RESULTS}"
fi

# Add manual QA checklist
cat >> "${QA_RESULTS}" << EOL

## Manual QA Checklist

- [ ] Layer organization is clear and consistent
- [ ] Component spacing follows standards (20px H, 30px V min)
- [ ] Flow direction is logical and consistent 
- [ ] Icons follow Azure standards or fallback policy
- [ ] All components have clear labels
- [ ] Connectors use Manhattan routing
- [ ] Font choice and sizing is consistent
- [ ] Color coding follows Medallion architecture standards

## Next Steps

EOL

# Add next steps based on overall status
if [ "${OVERALL_STATUS}" == "${GREEN}✅ PASSED${RESET}" ]; then
    cat >> "${QA_RESULTS}" << EOL
1. Archive this QA report
2. Update documentation with links to the diagram
3. Create a thumbnail for README usage
EOL
elif [ "${OVERALL_STATUS}" == "${YELLOW}⚠️ PARTIAL PASS${RESET}" ]; then
    cat >> "${QA_RESULTS}" << EOL
1. Address warnings in the report
2. Run QA again to verify improvements
3. If critical features work, proceed with caution
EOL
else
    cat >> "${QA_RESULTS}" << EOL
1. Fix critical issues identified in the report
2. Run QA again to verify all issues are resolved
3. Do not proceed with deployment until issues are fixed
EOL
fi

# Copy report to logs directory
cp "${QA_RESULTS}" "${PROJECT_ROOT}/logs/diagram_qa_${TIMESTAMP}.md"

echo -e "${BLUE}QA completed. Results:${RESET}"
echo -e "- Full report: ${QA_RESULTS}"
echo -e "- Log saved: ${PROJECT_ROOT}/logs/diagram_qa_${TIMESTAMP}.md"

# Final status
echo ""
echo -e "${BOLD}Final QA Status: ${OVERALL_STATUS}${RESET}"

# Exit with appropriate code
if [ "${OVERALL_STATUS}" == "${GREEN}✅ PASSED${RESET}" ]; then
    exit 0
elif [ "${OVERALL_STATUS}" == "${YELLOW}⚠️ PARTIAL PASS${RESET}" ]; then
    exit 1
else
    exit 2
fi