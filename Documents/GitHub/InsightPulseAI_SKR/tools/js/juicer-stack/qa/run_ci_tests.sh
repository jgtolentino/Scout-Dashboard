#!/bin/bash
# CI Test Runner for Scout Dashboard QA
# This script runs tests in a mocked browser environment for CI/CD systems

# Set environment for CI
export NODE_ENV=ci
export MOCK_BROWSER=true
export CI=true

# Determine script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   Scout Dashboard QA - CI Test Runner    ${NC}"
echo -e "${BLUE}==========================================${NC}"

# Setup environment
echo -e "\n${YELLOW}Setting up CI test environment...${NC}"
mkdir -p reports temp baselines

# Generate mock PNGs if needed
if [ ! -f "baselines/drilldown-dashboard-header.png" ]; then
  echo -e "${YELLOW}Generating mock PNG files...${NC}"
  node utils/generate_mock_pngs.js
fi

# Run tests with mocked browser
echo -e "\n${YELLOW}Running tests with mocked browser...${NC}"

# Run mock tests in CI environment
echo -e "${YELLOW}Running all mock tests...${NC}"
npx jest tests/mock-visual-parity.test.js tests/mock-behavior-parity.test.js tests/mock-accessibility.test.js tests/mock-performance.test.js --ci

exit_code=$?

# Create summary report
echo -e "\n${YELLOW}Creating test summary...${NC}"

# Create a summary report based on results
summary_file="reports/ci_test_summary.md"
echo "# Scout Dashboard QA Test Summary" > $summary_file
echo "Run Date: $(date)" >> $summary_file
echo "" >> $summary_file

if [ $exit_code -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  echo "## ✅ All Tests Passed" >> $summary_file
else
  echo -e "${RED}Some tests failed. Check test report for details.${NC}"
  echo "## ⚠️ Some Tests Failed" >> $summary_file
  echo "See detailed test report for more information." >> $summary_file
fi

echo "" >> $summary_file
echo "## Test Coverage" >> $summary_file
echo "- Visual Parity: Mock tests executed" >> $summary_file
echo "- Behavior Parity: Mock tests executed" >> $summary_file
echo "- Accessibility: Mock tests executed" >> $summary_file
echo "- Performance: Mock tests executed" >> $summary_file

echo -e "\n${GREEN}Test summary written to: ${BLUE}reports/ci_test_summary.md${NC}"
echo -e "\n${BLUE}==========================================${NC}"
echo -e "${BLUE}   CI Test Run Complete                   ${NC}"
echo -e "${BLUE}==========================================${NC}"

exit $exit_code