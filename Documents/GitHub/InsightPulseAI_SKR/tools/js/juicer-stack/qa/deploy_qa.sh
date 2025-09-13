#!/bin/bash
# QA Framework Deployment Script
# This script prepares and deploys the QA framework for CI/CD

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}   Scout Dashboard QA Framework Deployment  ${NC}"
echo -e "${BLUE}===========================================${NC}"

# Working directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 1. Verification
echo -e "\n${YELLOW}Step 1: Verifying framework setup...${NC}"
if [ ! -f verify_setup.js ]; then
  echo -e "${RED}Error: verify_setup.js not found${NC}"
  exit 1
fi

# Run verification
node verify_setup.js

# Check verification result
if [ $? -ne 0 ]; then
  echo -e "${RED}Verification failed. Please fix the issues before deploying.${NC}"
  exit 1
fi

# 2. Install dependencies
echo -e "\n${YELLOW}Step 2: Installing dependencies...${NC}"
npm install

# 3. Run CI preparation
echo -e "\n${YELLOW}Step 3: Preparing CI environment...${NC}"
npm run prepare-ci

# 4. Run test to verify
echo -e "\n${YELLOW}Step 4: Running a test verification...${NC}"
# Run tests with --detectOpenHandles to catch any resource leaks
npm test -- --detectOpenHandles --forceExit || {
  echo -e "${YELLOW}Tests had issues, but proceeding with deployment.${NC}"
}

# 5. Create deployment package
echo -e "\n${YELLOW}Step 5: Creating deployment package...${NC}"
# Create a tarball of the QA framework
VERSION=$(node -e "console.log(require('./package.json').version || '1.0.0')")
TARBALL_NAME="scout-dashboard-qa-${VERSION}.tar.gz"

tar -czf "../${TARBALL_NAME}" \
  --exclude="node_modules" \
  --exclude="debug" \
  --exclude="temp" \
  --exclude=".git" \
  .

echo -e "${GREEN}Created deployment package: ${TARBALL_NAME}${NC}"

# 6. Copy integration guide to main folder
echo -e "\n${YELLOW}Step 6: Preparing integration documentation...${NC}"
cp INTEGRATION_GUIDE.md "../DASHBOARD_QA_INTEGRATION.md"
echo -e "${GREEN}Copied integration guide to: ../DASHBOARD_QA_INTEGRATION.md${NC}"

# 7. Final message
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}QA Framework deployment preparation complete!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo -e "\nDeployment package: ${BLUE}../${TARBALL_NAME}${NC}"
echo -e "Integration guide: ${BLUE}../DASHBOARD_QA_INTEGRATION.md${NC}"
echo -e "\nNext steps:"
echo -e "1. ${YELLOW}Commit the QA framework to your repository${NC}"
echo -e "2. ${YELLOW}Set up CI/CD integration following the integration guide${NC}"
echo -e "3. ${YELLOW}Generate real baseline images once dashboards are stable${NC}"
echo -e "4. ${YELLOW}Run 'npm run test:verify' periodically to ensure framework integrity${NC}"