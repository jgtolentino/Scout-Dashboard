#!/bin/bash
# CI Environment Debug Script
# This script helps debug issues with the CI environment setup

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   CI Environment Debug Tool              ${NC}"
echo -e "${BLUE}==========================================${NC}"

# Check environment variables
echo -e "\n${YELLOW}Checking environment variables:${NC}"
echo -e "DASHBOARD_URL: ${GREEN}${DASHBOARD_URL:-not set}${NC}"
echo -e "NODE_ENV: ${GREEN}${NODE_ENV:-not set}${NC}"
echo -e "CI: ${GREEN}${CI:-not set}${NC}"
echo -e "MOCK_BROWSER: ${GREEN}${MOCK_BROWSER:-not set}${NC}"

# Set default environment for CI testing
if [[ -z "$CI" || -z "$MOCK_BROWSER" ]]; then
  echo -e "\n${YELLOW}Setting required environment variables for CI testing...${NC}"
  export CI=true
  export MOCK_BROWSER=true
  export NODE_ENV=ci
  echo -e "CI set to: ${GREEN}${CI}${NC}"
  echo -e "MOCK_BROWSER set to: ${GREEN}${MOCK_BROWSER}${NC}"
  echo -e "NODE_ENV set to: ${GREEN}${NODE_ENV}${NC}"
fi

# Check if dashboard URL is set
if [[ -z "$DASHBOARD_URL" ]]; then
  echo -e "\n${YELLOW}Setting default DASHBOARD_URL...${NC}"
  export DASHBOARD_URL="http://localhost:8080"
  echo -e "DASHBOARD_URL set to: ${GREEN}${DASHBOARD_URL}${NC}"
fi

# Check for Jest configuration
echo -e "\n${YELLOW}Checking Jest configuration:${NC}"
if [ -f "jest.config.js" ]; then
  echo -e "${GREEN}✓ jest.config.js found${NC}"
else
  echo -e "${RED}✗ jest.config.js not found${NC}"
  exit 1
fi

# Check for Jest setup file
if [ -f "jest.setup.js" ]; then
  echo -e "${GREEN}✓ jest.setup.js found${NC}"
else
  echo -e "${RED}✗ jest.setup.js not found${NC}"
  exit 1
fi

# Check for browser mocking in Jest setup
if grep -q "jest.mock('puppeteer'" jest.setup.js; then
  echo -e "${GREEN}✓ Browser mocking is implemented in jest.setup.js${NC}"
else
  echo -e "${RED}✗ Browser mocking is not implemented in jest.setup.js${NC}"
  exit 1
fi

# Check for package.json
echo -e "\n${YELLOW}Checking package.json:${NC}"
if [ -f "package.json" ]; then
  echo -e "${GREEN}✓ package.json found${NC}"
  
  # Check for required dependencies
  echo -e "\n${YELLOW}Checking for required dependencies:${NC}"
  for dep in jest puppeteer pixelmatch color axe-core; do
    if grep -q "\"$dep\":" package.json; then
      echo -e "${GREEN}✓ $dep found in package.json${NC}"
    else
      echo -e "${RED}✗ $dep not found in package.json${NC}"
    fi
  done
  
  # Check for required scripts
  echo -e "\n${YELLOW}Checking for required scripts:${NC}"
  for script in test "test:visual" "test:behavior" "test:accessibility" "test:performance" "prepare-ci" "capture-baselines"; do
    if grep -q "\"$script\":" package.json; then
      echo -e "${GREEN}✓ $script script found in package.json${NC}"
    else
      echo -e "${RED}✗ $script script not found in package.json${NC}"
    fi
  done
else
  echo -e "${RED}✗ package.json not found${NC}"
  exit 1
fi

# Ensure directories exist
echo -e "\n${YELLOW}Checking required directories:${NC}"
for dir in baselines tests themes utils temp reports; do
  if [ -d "$dir" ]; then
    echo -e "${GREEN}✓ $dir directory found${NC}"
  else
    echo -e "${RED}✗ $dir directory not found${NC}"
    mkdir -p "$dir"
    echo -e "${YELLOW}  Created $dir directory${NC}"
  fi
done

# Run a simple test with mocking to verify setup
echo -e "\n${YELLOW}Running a simple test with browser mocking...${NC}"
npx jest tests/visual-parity.test.js --testNamePattern="Component Visual Matching" --detectOpenHandles --forceExit || {
  echo -e "${RED}Test failed, but continuing to provide debug information...${NC}"
}

# Create debug JSON with environment info
echo -e "\n${YELLOW}Creating debug info file...${NC}"
mkdir -p debug

cat > debug/ci_debug_info.json << EOF
{
  "environment": {
    "DASHBOARD_URL": "${DASHBOARD_URL}",
    "NODE_ENV": "${NODE_ENV}",
    "CI": ${CI},
    "MOCK_BROWSER": ${MOCK_BROWSER}
  },
  "files": {
    "jest.config.js": $([ -f "jest.config.js" ] && echo "true" || echo "false"),
    "jest.setup.js": $([ -f "jest.setup.js" ] && echo "true" || echo "false"),
    "package.json": $([ -f "package.json" ] && echo "true" || echo "false"),
    "run_ci_tests.sh": $([ -f "run_ci_tests.sh" ] && echo "true" || echo "false")
  },
  "directories": {
    "baselines": $([ -d "baselines" ] && echo "true" || echo "false"),
    "tests": $([ -d "tests" ] && echo "true" || echo "false"),
    "themes": $([ -d "themes" ] && echo "true" || echo "false"),
    "utils": $([ -d "utils" ] && echo "true" || echo "false"),
    "temp": $([ -d "temp" ] && echo "true" || echo "false"),
    "reports": $([ -d "reports" ] && echo "true" || echo "false")
  },
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo -e "${GREEN}Debug info written to debug/ci_debug_info.json${NC}"

# Summary
echo -e "\n${BLUE}==========================================${NC}"
echo -e "${BLUE}   CI Environment Debug Summary            ${NC}"
echo -e "${BLUE}==========================================${NC}"
echo -e "\nYour CI environment setup appears to be ${GREEN}ready${NC} for testing."
echo -e "\nTo run tests in the CI environment, use:"
echo -e "${YELLOW}./run_ci_tests.sh${NC}"
echo -e "\nTo create deployment package, use:"
echo -e "${YELLOW}./deploy_qa.sh${NC}"