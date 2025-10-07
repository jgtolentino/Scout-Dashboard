#!/bin/bash
# brand_detection_test_runner.sh - Automate brand detection testing in production
# For Echo (STT Parsing) and Basher (SQL Execution)
# Created: 2025-05-12

set -e

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SQL_SCRIPT="${SCRIPT_DIR}/../sql/test_brand_detection_prod.sql"
BRAND_SCRIPT="${SCRIPT_DIR}/brand_explode.py"
RUN_SCRIPT="${SCRIPT_DIR}/run_brand_extraction.sh"
TEST_ID="TEST_BRAND_001"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Header
echo -e "\n${CYAN}===============================================${NC}"
echo -e "${CYAN}   PRODUCTION BRAND DETECTION TEST RUNNER       ${NC}"
echo -e "${CYAN}===============================================${NC}\n"

# Check if SQL script exists
if [ ! -f "${SQL_SCRIPT}" ]; then
    echo -e "${RED}ERROR: SQL test script not found at ${SQL_SCRIPT}${NC}"
    exit 1
fi

# Function to connect to SQL Server and run a query
function run_sql() {
    local sql_command="$1"
    local description="$2"
    
    echo -e "${YELLOW}Executing SQL: ${description}${NC}"
    
    # In production, this would use actual credentials
    # sqlcmd -S <server> -d <database> -U <username> -P <password> -Q "$sql_command"
    
    # For testing, we'll use a placeholder
    echo "[SQL would execute]: $sql_command"
    echo -e "${GREEN}✅ SQL execution successful (simulated)${NC}"
}

# Step 1: Run Part 1 of SQL script to create test data
echo -e "\n${BLUE}Step 1: Creating test data in SalesInteractionTranscripts table${NC}"
run_sql "$(head -n 35 "${SQL_SCRIPT}")" "Create test transcript chunks"

# Step 2: Run brand extraction against test data
echo -e "\n${BLUE}Step 2: Running brand extraction on test data${NC}"
echo -e "${YELLOW}Command: ${RUN_SCRIPT} --prod --test-id ${TEST_ID}${NC}"

# Simulate the extraction process
if [ -x "${RUN_SCRIPT}" ]; then
    echo -e "${GREEN}Brand extraction script would run here with test ID: ${TEST_ID}${NC}"
    # Uncomment to actually run in production:
    # "${RUN_SCRIPT}" --prod --test-id "${TEST_ID}"
else
    echo -e "${YELLOW}Warning: ${RUN_SCRIPT} is not executable. Would run script here.${NC}"
fi

# Step 3: Run Part 2 of SQL script to verify results
echo -e "\n${BLUE}Step 3: Verifying brand detection results${NC}"
run_sql "$(sed -n '40,71p' "${SQL_SCRIPT}")" "Check detected brands"

# Step 4: Display cleaning instructions
echo -e "\n${BLUE}Step 4: Cleanup instructions${NC}"
echo -e "${YELLOW}To clean up test data, run:${NC}"
echo -e "${CYAN}$(sed -n '73,85p' "${SQL_SCRIPT}")${NC}"

# Summary
echo -e "\n${GREEN}===============================================${NC}"
echo -e "${GREEN}   BRAND DETECTION TEST COMPLETED               ${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "${YELLOW}Execute this test in production by:${NC}"
echo -e "1. Connect to the production database"
echo -e "2. Run test_brand_detection_prod.sql to create test data"
echo -e "3. Run brand_explode.py with --test-id ${TEST_ID}"
echo -e "4. Run the verification queries"
echo -e "5. Clean up test data with cleanup queries"
echo -e "\n${CYAN}Test script location: ${SQL_SCRIPT}${NC}"
echo -e "${CYAN}Brand extraction script: ${BRAND_SCRIPT}${NC}"