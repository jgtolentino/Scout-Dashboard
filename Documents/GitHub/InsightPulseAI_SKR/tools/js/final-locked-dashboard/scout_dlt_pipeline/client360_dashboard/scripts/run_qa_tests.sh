#!/bin/bash
# Comprehensive QA tests for Client360 Dashboard

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get environment from command line argument
ENVIRONMENT=${1:-"qa"}

# Set URLs based on environment
case $ENVIRONMENT in
  "qa")
    BASE_URL="https://blue-coast-0acb6880f-qa.azurestaticapps.net"
    ;;
  "production")
    BASE_URL="https://blue-coast-0acb6880f.azurestaticapps.net"
    ;;
  *)
    echo -e "${RED}Invalid environment: $ENVIRONMENT. Must be qa or production.${NC}"
    exit 1
    ;;
esac

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/qa_test_${ENVIRONMENT}_${TIMESTAMP}.log"
REPORT_FILE="reports/qa_test_${ENVIRONMENT}_${TIMESTAMP}.md"
SCREENSHOT_DIR="screenshots/qa_test_${TIMESTAMP}"

# Create required directories
mkdir -p logs
mkdir -p reports
mkdir -p "$SCREENSHOT_DIR"

echo -e "${YELLOW}Running comprehensive QA tests on $ENVIRONMENT environment: $BASE_URL${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Test timestamp: $(date)${NC}" | tee -a "$LOG_FILE"

# Function to capture a screenshot
capture_screenshot() {
  local url=$1
  local name=$2
  
  echo -e "${YELLOW}Capturing screenshot of $url as $name${NC}" | tee -a "$LOG_FILE"
  
  # Use puppeteer-screenshot-cli if available, otherwise use curl
  if command -v screenshot &> /dev/null; then
    screenshot "$url" --output "$SCREENSHOT_DIR/${name}.png" --width 1280 --height 800
  else
    # Fallback to a message if screenshot tools not available
    echo "Screenshot capture requires puppeteer-screenshot-cli to be installed." > "$SCREENSHOT_DIR/${name}.txt"
    echo "Install with: npm install -g puppeteer-screenshot-cli" >> "$SCREENSHOT_DIR/${name}.txt"
  fi
}

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

# Function to run a simple performance test
test_performance() {
  local url=$1
  local max_time=$2  # in seconds
  local description=$3
  
  echo -e "${YELLOW}Testing performance: $description${NC}" | tee -a "$LOG_FILE"
  echo -e "${YELLOW}URL: $url${NC}" | tee -a "$LOG_FILE"
  
  # Measure load time using curl's time_total
  local time=$(curl -s -o /dev/null -w "%{time_total}" "$url")
  
  echo -e "${YELLOW}Load time: ${time}s${NC}" | tee -a "$LOG_FILE"
  
  if (( $(echo "$time < $max_time" | bc -l) )); then
    echo -e "${GREEN}✅ PASS: $description - Load time ${time}s is less than ${max_time}s${NC}" | tee -a "$LOG_FILE"
    return 0
  else
    echo -e "${RED}❌ FAIL: $description - Load time ${time}s exceeds maximum ${max_time}s${NC}" | tee -a "$LOG_FILE"
    return 1
  fi
}

# Run comprehensive tests
TEST_FAILURES=0

echo -e "${YELLOW}1. Basic Health Checks${NC}" | tee -a "$LOG_FILE"
test_url "$BASE_URL" 200 "Root URL returns 200" || TEST_FAILURES=$((TEST_FAILURES+1))
test_url "$BASE_URL/theme.css" 200 "Theme CSS loads" || TEST_FAILURES=$((TEST_FAILURES+1))
test_url "$BASE_URL/js/dashboard.js" 200 "Dashboard JS loads" || TEST_FAILURES=$((TEST_FAILURES+1))
test_url "$BASE_URL/non-existent-page" 200 "404 handler works" || TEST_FAILURES=$((TEST_FAILURES+1))

echo -e "${YELLOW}2. Content Verification${NC}" | tee -a "$LOG_FILE"
test_content "$BASE_URL" "Client360 Dashboard" "Dashboard title exists" || TEST_FAILURES=$((TEST_FAILURES+1))
test_content "$BASE_URL" "rollback-dashboard" "Rollback component exists" || TEST_FAILURES=$((TEST_FAILURES+1))
test_content "$BASE_URL" "data-freshness" "Data freshness indicator exists" || TEST_FAILURES=$((TEST_FAILURES+1))
test_content "$BASE_URL/theme.css" "#002B80" "TBWA Navy color exists" || TEST_FAILURES=$((TEST_FAILURES+1))
test_content "$BASE_URL/theme.css" "#00C3EC" "TBWA Cyan color exists" || TEST_FAILURES=$((TEST_FAILURES+1))

echo -e "${YELLOW}3. Performance Tests${NC}" | tee -a "$LOG_FILE"
test_performance "$BASE_URL" 3 "Main page loads in under 3 seconds" || TEST_FAILURES=$((TEST_FAILURES+1))
test_performance "$BASE_URL/theme.css" 1 "CSS loads in under 1 second" || TEST_FAILURES=$((TEST_FAILURES+1))
test_performance "$BASE_URL/js/dashboard.js" 1 "JS loads in under 1 second" || TEST_FAILURES=$((TEST_FAILURES+1))

echo -e "${YELLOW}4. Visual Regression Tests (Screenshots)${NC}" | tee -a "$LOG_FILE"
capture_screenshot "$BASE_URL" "main_dashboard"
capture_screenshot "$BASE_URL/360" "dashboard_360_view"

echo -e "${YELLOW}5. Accessibility Test${NC}" | tee -a "$LOG_FILE"
# If pa11y is installed, use it for accessibility testing
if command -v pa11y &> /dev/null; then
  echo -e "${YELLOW}Running pa11y accessibility tests...${NC}" | tee -a "$LOG_FILE"
  if pa11y "$BASE_URL" > "$SCREENSHOT_DIR/accessibility_results.txt"; then
    echo -e "${GREEN}✅ PASS: Accessibility tests passed${NC}" | tee -a "$LOG_FILE"
  else
    echo -e "${RED}❌ FAIL: Accessibility tests failed${NC}" | tee -a "$LOG_FILE"
    TEST_FAILURES=$((TEST_FAILURES+1))
  fi
else
  echo -e "${YELLOW}⚠️ pa11y not installed, skipping accessibility tests${NC}" | tee -a "$LOG_FILE"
  echo "Accessibility testing requires pa11y to be installed." > "$SCREENSHOT_DIR/accessibility_note.txt"
  echo "Install with: npm install -g pa11y" >> "$SCREENSHOT_DIR/accessibility_note.txt"
fi

# Generate test report
cat > "$REPORT_FILE" << EOF
# Comprehensive QA Test Report: $ENVIRONMENT

## Summary
- **Environment**: $ENVIRONMENT
- **Base URL**: $BASE_URL
- **Test Date**: $(date)
- **Test Result**: ${TEST_FAILURES} failed tests
- **Screenshots**: $SCREENSHOT_DIR/

## Test Categories

### 1. Basic Health Checks
- Root URL returns 200: $(if test_url "$BASE_URL" 200 "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- Theme CSS loads: $(if test_url "$BASE_URL/theme.css" 200 "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- Dashboard JS loads: $(if test_url "$BASE_URL/js/dashboard.js" 200 "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- 404 handler works: $(if test_url "$BASE_URL/non-existent-page" 200 "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

### 2. Content Verification
- Dashboard title exists: $(if test_content "$BASE_URL" "Client360 Dashboard" "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- Rollback component exists: $(if test_content "$BASE_URL" "rollback-dashboard" "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- Data freshness indicator exists: $(if test_content "$BASE_URL" "data-freshness" "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- TBWA Navy color exists: $(if test_content "$BASE_URL/theme.css" "#002B80" "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- TBWA Cyan color exists: $(if test_content "$BASE_URL/theme.css" "#00C3EC" "Silent check" &>/dev/null; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

### 3. Performance Tests
- Main page loads in under 3 seconds: $(TEST=$(test_performance "$BASE_URL" 3 "Silent check" &>/dev/null); if [ $? -eq 0 ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- CSS loads in under 1 second: $(TEST=$(test_performance "$BASE_URL/theme.css" 1 "Silent check" &>/dev/null); if [ $? -eq 0 ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- JS loads in under 1 second: $(TEST=$(test_performance "$BASE_URL/js/dashboard.js" 1 "Silent check" &>/dev/null); if [ $? -eq 0 ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

### 4. Visual Regression Tests
- Screenshots captured in: \`$SCREENSHOT_DIR/\`
- Main dashboard screenshot: $(if [ -f "$SCREENSHOT_DIR/main_dashboard.png" ]; then echo "✅ Captured"; else echo "❌ Failed"; fi)
- Dashboard 360 view screenshot: $(if [ -f "$SCREENSHOT_DIR/dashboard_360_view.png" ]; then echo "✅ Captured"; else echo "❌ Failed"; fi)

### 5. Accessibility Test
$(if command -v pa11y &> /dev/null; then
  if [ -f "$SCREENSHOT_DIR/accessibility_results.txt" ]; then
    if grep -q "Error" "$SCREENSHOT_DIR/accessibility_results.txt"; then
      echo "❌ FAIL: Accessibility issues found"
    else
      echo "✅ PASS: No accessibility issues found"
    fi
  else
    echo "❌ FAIL: Accessibility test results missing"
  fi
else
  echo "⚠️ WARNING: pa11y not installed, accessibility tests not run"
fi)

## Next Steps
$(if [ $TEST_FAILURES -eq 0 ]; then
  echo "- All tests passed. The dashboard is ready for production deployment."
else
  echo "- Fix the $TEST_FAILURES failed tests before proceeding to production deployment."
fi)

EOF

echo -e "${YELLOW}===================================${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}QA Test Results: $ENVIRONMENT ${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}===================================${NC}" | tee -a "$LOG_FILE"

if [ $TEST_FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}" | tee -a "$LOG_FILE"
  echo -e "${GREEN}Report saved to: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"
  echo -e "${GREEN}Screenshots saved to: $SCREENSHOT_DIR/${NC}" | tee -a "$LOG_FILE"
  exit 0
else
  echo -e "${RED}❌ $TEST_FAILURES tests failed!${NC}" | tee -a "$LOG_FILE"
  echo -e "${RED}Report saved to: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"
  echo -e "${RED}Screenshots saved to: $SCREENSHOT_DIR/${NC}" | tee -a "$LOG_FILE"
  exit 1
fi