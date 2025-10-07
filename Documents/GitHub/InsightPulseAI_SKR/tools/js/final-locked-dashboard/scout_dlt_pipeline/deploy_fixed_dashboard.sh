#!/bin/bash
# Deploy fixed dashboard with rollback component to Azure

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}     Client360 Dashboard Deployment with Rollback    ${NC}"
echo -e "${CYAN}=====================================================${NC}\n"

# Create directories for logs
mkdir -p logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/deploy_fixed_${TIMESTAMP}.log"

echo -e "${YELLOW}Step 1: Building TBWA theme with rollback component...${NC}" | tee -a "$LOG_FILE"

# Run the build script
cd client360_dashboard
echo "Building TBWA theme..." | tee -a "../$LOG_FILE"
npx webpack --config webpack.config.js --env theme=tbwa --mode production >> "../$LOG_FILE" 2>&1

# Check if the build was successful
if [ -f "dist/tbwa.css" ]; then
  echo -e "${GREEN}✅ Successfully built TBWA theme${NC}" | tee -a "../$LOG_FILE"
  
  # Verify that rollback styles are in the compiled output
  if grep -q "rollback-dashboard" dist/tbwa.css; then
    echo -e "${GREEN}✅ Verified rollback styles in compiled CSS${NC}" | tee -a "../$LOG_FILE"
  else
    echo -e "${RED}❌ Error: Rollback styles not found in compiled CSS${NC}" | tee -a "../$LOG_FILE"
    exit 1
  fi
else
  echo -e "${RED}❌ Failed to build TBWA theme${NC}" | tee -a "../$LOG_FILE"
  exit 1
fi

echo -e "${YELLOW}Step 2: Preparing deployment package...${NC}" | tee -a "../$LOG_FILE"

# Ensure the deploy directory exists with CSS
mkdir -p deploy/css

# Copy the theme CSS to deployment directory
cp dist/tbwa.css deploy/theme.css
cp dist/tbwa.css deploy/css/tbwa-theme.css

echo -e "${GREEN}✅ Theme CSS copied to deployment directory${NC}" | tee -a "../$LOG_FILE"

echo -e "${YELLOW}Step 3: Deploying to Azure...${NC}" | tee -a "../$LOG_FILE"

# Check if deploy_to_azure.sh exists
if [ -f "./deploy_to_azure.sh" ]; then
  echo "Running deployment script..." | tee -a "../$LOG_FILE"
  
  # Run the deploy script with backup of original
  cp ./deploy_to_azure.sh ./deploy_to_azure.sh.bak-${TIMESTAMP}
  ./deploy_to_azure.sh >> "../$LOG_FILE" 2>&1
  
  DEPLOY_STATUS=$?
  if [ $DEPLOY_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful${NC}" | tee -a "../$LOG_FILE"
  else
    echo -e "${RED}❌ Deployment failed. Check the log file for details: $LOG_FILE${NC}" | tee -a "../$LOG_FILE"
    exit 1
  fi
else
  echo -e "${RED}❌ deploy_to_azure.sh script not found${NC}" | tee -a "../$LOG_FILE"
  exit 1
fi

cd ..
echo -e "\n${GREEN}✅ Dashboard deployment with rollback component completed successfully${NC}" | tee -a "$LOG_FILE"
echo -e "Log file: ${LOG_FILE}"