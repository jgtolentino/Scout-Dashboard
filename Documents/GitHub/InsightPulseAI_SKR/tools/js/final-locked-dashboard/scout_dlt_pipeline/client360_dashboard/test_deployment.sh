#!/bin/bash
# Test script for verifying the deployment with sample data

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Testing Client360 Dashboard deployment with sample data...${NC}"

# 1. First, ensure the sample data exists
if [ ! -d "data/sample_data" ]; then
  mkdir -p data/sample_data
  echo -e "${YELLOW}Sample data directory not found, creating it...${NC}"
fi

# 2. Check if minimal sample data exists, create it if not
if [ ! -f "data/sample_data/minimal_sample.json" ]; then
  echo -e "${YELLOW}Creating minimal sample data...${NC}"
  # Copy from the one we created if it exists
  if [ -f "data/minimal_sample.json" ]; then
    cp data/minimal_sample.json data/sample_data/minimal_sample.json
  else
    # Create a minimal sample data file
    cat > data/sample_data/minimal_sample.json << EOF
{
  "metadata": {
    "simulated": true,
    "version": "1.0.0",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "source": "test_deployment.sh"
  },
  "data": {
    "kpis": {
      "total_sales": 5824350,
      "sales_change": 12.3,
      "conversion_rate": 4.8,
      "conversion_change": 0.7,
      "marketing_roi": 3.2,
      "roi_change": 0.2,
      "brand_sentiment": 78.5,
      "sentiment_change": 2.1
    }
  }
}
EOF
  fi
fi

# 3. Run the sample data test script
echo -e "${YELLOW}Running sample data test script...${NC}"
if node test_sample_data.js; then
  echo -e "${GREEN}✅ Sample data test script ran successfully${NC}"
else
  echo -e "${RED}❌ Sample data test script failed${NC}"
  echo -e "${YELLOW}The dashboard deployment may still work, but SQL queries using sample data might not function correctly.${NC}"
fi

# 4. Test the deployment scripts
echo -e "${YELLOW}Testing the deploy_tbwa_theme.sh script (dry run)...${NC}"
TBWA_DIR="test_tbwa_deployment"
mkdir -p "$TBWA_DIR"

# Modify the script to run in test mode
TEST_SCRIPT="${TBWA_DIR}/deploy_tbwa_theme_test.sh"
cat scripts/deploy_tbwa_theme.sh | sed "s|CLIENT360_DIR=\"client360\"|CLIENT360_DIR=\"${TBWA_DIR}/client360\"|g" > "$TEST_SCRIPT"
chmod +x "$TEST_SCRIPT"

# Run the test script in dry-run mode
echo -e "${YELLOW}Running deploy_tbwa_theme.sh in test mode...${NC}"
if "$TEST_SCRIPT"; then
  echo -e "${GREEN}✅ deploy_tbwa_theme.sh test run successful${NC}"
  
  # Check if sample data was copied
  if [ -d "${TBWA_DIR}/client360/public/data/sample_data" ]; then
    echo -e "${GREEN}✅ Sample data was correctly copied to the deployment directory${NC}"
    
    # Check if the sample data file exists
    if [ -f "${TBWA_DIR}/client360/public/data/sample_data/minimal_sample.json" ]; then
      echo -e "${GREEN}✅ Sample data file was correctly copied${NC}"
    else
      echo -e "${RED}❌ Sample data file was not copied correctly${NC}"
    fi
  else
    echo -e "${RED}❌ Sample data directory was not created in the deployment directory${NC}"
  fi
else
  echo -e "${RED}❌ deploy_tbwa_theme.sh test run failed${NC}"
fi

# Clean up test files
echo -e "${YELLOW}Cleaning up test files...${NC}"
rm -rf "$TBWA_DIR"

echo -e "${GREEN}Deployment test completed!${NC}"
echo -e "${YELLOW}If all tests passed, the deployment should work correctly with sample data.${NC}"
echo -e "${YELLOW}To deploy to Azure, run:${NC}"
echo -e "  ./deploy_to_azure.sh"