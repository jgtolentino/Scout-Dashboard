#!/bin/bash
# Script to run smoke tests on deployed Client360 Dashboard

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get environment from command line argument
ENVIRONMENT=${1:-"development"}

# Set URLs based on environment
case $ENVIRONMENT in
  "development")
    BASE_URL="https://gray-pond-0f9ac4803-dev.azurestaticapps.net"
    ;;
  "qa")
    BASE_URL="https://blue-coast-0acb6880f-qa.azurestaticapps.net"
    ;;
  "production")
    BASE_URL="https://blue-coast-0acb6880f.azurestaticapps.net"
    ;;
  *)
    echo -e "${RED}Invalid environment: $ENVIRONMENT. Must be development, qa, or production.${NC}"
    exit 1
    ;;
esac

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/smoke_test_${ENVIRONMENT}_${TIMESTAMP}.log"
REPORT_FILE="reports/smoke_test_${ENVIRONMENT}_${TIMESTAMP}.md"

# Create logs directory if it doesn't exist
mkdir -p logs
mkdir -p reports

echo -e "${YELLOW}Running smoke tests on $ENVIRONMENT environment: $BASE_URL${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Test timestamp: $(date)${NC}" | tee -a "$LOG_FILE"

# Function to test a URL
test_url() {
  local url=$1
  local expected_status=$2
  local description=$3
  
  echo -e "${YELLOW}Testing: $description${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}URL: $url${NC}" | tee -a "$LOG_FILE"
  
  # Get HTTP status code
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✅ PASS: $description - Got expected status $status${NC}" | tee -a "$LOG_FILE"
    return 0
  else
    echo -e "${RED}❌ FAIL: $description - Expected status $expected_status but got $status${NC}" | tee -a "$LOG_FILE"
    return 1
  fi
}

# Function to check if content exists
test_content() {
  local url=$1
  local pattern=$2
  local description=$3
  
  echo -e "${YELLOW}Testing content: $description${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}URL: $url${NC}" | tee -a "$LOG_FILE"
  
  # Get content
  local content=$(curl -s "$url")
  
  if echo "$content" | grep -q "$pattern"; then
    echo -e "${GREEN}✅ PASS: $description - Found expected content${NC}" | tee -a "$LOG_FILE"
    return 0
  else
    echo -e "${RED}❌ FAIL: $description - Expected content not found${NC}" | tee -a "$LOG_FILE"
    return 1
  fi
}

# Run tests
TEST_FAILURES=0

# Test 1: Check if the root URL redirects to dashboard
test_url "$BASE_URL" 200 "Root URL redirects to dashboard" || TEST_FAILURES=$((TEST_FAILURES+1))

# Test 2: Check if static assets load
test_url "$BASE_URL/theme.css" 200 "Theme CSS loads" || TEST_FAILURES=$((TEST_FAILURES+1))
test_url "$BASE_URL/js/dashboard.js" 200 "Dashboard JS loads" || TEST_FAILURES=$((TEST_FAILURES+1))

# Test 3: Check if 404 handler works correctly
test_url "$BASE_URL/non-existent-page" 200 "404 handler redirects to dashboard" || TEST_FAILURES=$((TEST_FAILURES+1))

# Test 4: Check main content loads
test_content "$BASE_URL" "Client360 Dashboard" "Main page title exists" || TEST_FAILURES=$((TEST_FAILURES+1))
test_content "$BASE_URL" "rollback-dashboard" "Rollback component exists" || TEST_FAILURES=$((TEST_FAILURES+1))

# Test 5: Check theme file has correct color definitions
test_content "$BASE_URL/theme.css" "#002B80" "TBWA Navy color exists in theme" || TEST_FAILURES=$((TEST_FAILURES+1))
test_content "$BASE_URL/theme.css" "#00C3EC" "TBWA Cyan color exists in theme" || TEST_FAILURES=$((TEST_FAILURES+1))

# Check version.json
if [ -n "$(curl -s "$BASE_URL/version.json" 2>/dev/null)" ]; then
  echo -e "${GREEN}✅ PASS: version.json exists and returns content${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${YELLOW}⚠️ WARNING: version.json does not exist or returns no content${NC}" | tee -a "$LOG_FILE"
  # Don't fail the test for this, just warn
fi

# Generate test report
cat > "$REPORT_FILE" << EOF
# Smoke Test Report: $ENVIRONMENT

## Summary
- **Environment**: $ENVIRONMENT
- **Base URL**: $BASE_URL
- **Test Date**: $(date)
- **Test Result**: ${TEST_FAILURES} failed tests out of 8 tests

## Detailed Results

### Root URL Test
- **Test**: Root URL redirects to dashboard
- **URL**: $BASE_URL
- **Expected Status**: 200
- **Result**: $(if test_url "$BASE_URL" 200 "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

### Static Assets Tests
- **Test**: Theme CSS loads
- **URL**: $BASE_URL/theme.css
- **Expected Status**: 200
- **Result**: $(if test_url "$BASE_URL/theme.css" 200 "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

- **Test**: Dashboard JS loads
- **URL**: $BASE_URL/js/dashboard.js
- **Expected Status**: 200
- **Result**: $(if test_url "$BASE_URL/js/dashboard.js" 200 "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

### 404 Handler Test
- **Test**: 404 handler redirects to dashboard
- **URL**: $BASE_URL/non-existent-page
- **Expected Status**: 200
- **Result**: $(if test_url "$BASE_URL/non-existent-page" 200 "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

### Content Tests
- **Test**: Main page title exists
- **URL**: $BASE_URL
- **Expected Content**: "Client360 Dashboard"
- **Result**: $(if test_content "$BASE_URL" "Client360 Dashboard" "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

- **Test**: Rollback component exists
- **URL**: $BASE_URL
- **Expected Content**: "rollback-dashboard"
- **Result**: $(if test_content "$BASE_URL" "rollback-dashboard" "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

### Theme Tests
- **Test**: TBWA Navy color exists in theme
- **URL**: $BASE_URL/theme.css
- **Expected Content**: "#002B80"
- **Result**: $(if test_content "$BASE_URL/theme.css" "#002B80" "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

- **Test**: TBWA Cyan color exists in theme
- **URL**: $BASE_URL/theme.css
- **Expected Content**: "#00C3EC"
- **Result**: $(if test_content "$BASE_URL/theme.css" "#00C3EC" "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

## Next Steps
$(if [ $TEST_FAILURES -eq 0 ]; then
  echo "- All smoke tests passed. No immediate action needed."
else
  echo "- Fix the failed tests before proceeding to further testing."
fi)

EOF

echo -e "${YELLOW}===================================${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Smoke Test Results: $ENVIRONMENT ${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}===================================${NC}" | tee -a "$LOG_FILE"

if [ $TEST_FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All smoke tests passed!${NC}" | tee -a "$LOG_FILE"
  echo -e "${GREEN}Report saved to: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"
  exit 0
else
  echo -e "${RED}❌ $TEST_FAILURES smoke tests failed!${NC}" | tee -a "$LOG_FILE"
  echo -e "${RED}Report saved to: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"
  exit 1
fi