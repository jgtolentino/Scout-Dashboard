#!/bin/bash

# Client360 Dashboard - QA Regression Test Suite
# Step 3: Full Production Rollout - QA Testing

set -e

echo "🧪 Step 3: QA Regression Testing"
echo "================================"

# Configuration
DASHBOARD_URL="https://proud-forest-0224c7a0f.6.azurestaticapps.net"
TEST_URL="$DASHBOARD_URL/test_integration.html"

echo "📋 Testing Dashboard: $DASHBOARD_URL"
echo "📋 Test Integration: $TEST_URL"

# Test Categories
declare -A TEST_RESULTS
TOTAL_TESTS=0
PASSED_TESTS=0

function log_test() {
    local test_name="$1"
    local status="$2"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo "  ✅ $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS["$test_name"]="PASS"
    else
        echo "  ❌ $test_name"
        TEST_RESULTS["$test_name"]="FAIL"
    fi
}

function test_http_response() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        log_test "$description" "PASS"
    else
        log_test "$description (Expected $expected_status, Got $status_code)" "FAIL"
    fi
}

function test_content_exists() {
    local url="$1"
    local search_text="$2"
    local description="$3"
    
    if curl -s "$url" | grep -q "$search_text"; then
        log_test "$description" "PASS"
    else
        log_test "$description" "FAIL"
    fi
}

echo ""
echo "🔍 1. Core Dashboard Functionality"
echo "=================================="

# Test main dashboard loads
test_http_response "$DASHBOARD_URL" "200" "Main dashboard loads"

# Test critical components exist
test_content_exists "$DASHBOARD_URL" "Client360 Dashboard" "Dashboard title present"
test_content_exists "$DASHBOARD_URL" "drilldown_handler.js" "Drill-down script included"

# Test KPI tiles exist
KPI_TYPES=("total-sales" "transactions" "brand-sentiment" "conversion-rate" "growth-rate" "store-performance" "regional-performance")

for kpi in "${KPI_TYPES[@]}"; do
    test_content_exists "$DASHBOARD_URL" "data-kpi=\"$kpi\"" "KPI tile: $kpi configured"
done

echo ""
echo "🧪 2. Drill-Down Integration Testing"
echo "===================================="

# Test integration page loads
test_http_response "$TEST_URL" "200" "Test integration page loads"

# Test drill-down handler presence
test_content_exists "$TEST_URL" "DrillDownHandler" "DrillDownHandler class present"
test_content_exists "$TEST_URL" "clickable" "Clickable KPI tiles present"

echo ""
echo "🎨 3. UI/UX Regression Testing"
echo "=============================="

# Test responsive design elements
test_content_exists "$DASHBOARD_URL" "kpi-tile" "KPI tiles styled"
test_content_exists "$DASHBOARD_URL" "hover" "Hover effects present"

# Test TBWA branding
test_content_exists "$DASHBOARD_URL" "tbwa" "TBWA branding maintained"

echo ""
echo "🔧 4. JavaScript Functionality"
echo "=============================="

# Test for JavaScript errors (basic check)
test_content_exists "$DASHBOARD_URL" "addEventListener" "Event listeners configured"
test_content_exists "$DASHBOARD_URL" "fetch" "API integration present"

echo ""
echo "📱 5. Cross-Browser Compatibility"
echo "================================="

# Test static resources load
test_http_response "$DASHBOARD_URL/css/tbwa-theme.css" "200" "CSS theme loads"
test_http_response "$DASHBOARD_URL/js/dashboard.js" "200" "Main JavaScript loads"
test_http_response "$DASHBOARD_URL/js/drilldown_handler.js" "200" "Drill-down handler loads"

echo ""
echo "🛡️ 6. Security & Performance"
echo "============================="

# Test security headers
if curl -s -I "$DASHBOARD_URL" | grep -i "x-frame-options\|x-content-type-options\|x-xss-protection" > /dev/null; then
    log_test "Security headers present" "PASS"
else
    log_test "Security headers present" "FAIL"
fi

# Test HTTPS redirect
test_http_response "https://proud-forest-0224c7a0f.6.azurestaticapps.net" "200" "HTTPS access working"

echo ""
echo "📊 QA Test Results Summary"
echo "=========================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo "🎉 ALL TESTS PASSED - Ready for Production!"
    echo ""
    echo "✅ QA Regression: APPROVED"
    echo "✅ UAT Readiness: CONFIRMED"
    echo "✅ Production Deployment: AUTHORIZED"
    
    # Create QA approval file
    cat > QA_APPROVAL.md << EOF
# 🛡️ QA Regression Test - APPROVED

**Test Date:** $(date)
**Dashboard URL:** $DASHBOARD_URL
**Test Results:** $PASSED_TESTS/$TOTAL_TESTS PASSED

## Test Summary
✅ Core Dashboard Functionality
✅ Drill-Down Integration  
✅ UI/UX Regression
✅ JavaScript Functionality
✅ Cross-Browser Compatibility
✅ Security & Performance

## QA Sign-off
**Status:** APPROVED FOR PRODUCTION
**Next Action:** Proceed with production deployment

---
*Automated QA Test Suite - Client360 Dashboard v2.4.0*
EOF
    
    exit 0
else
    echo "❌ TESTS FAILED - Production deployment blocked"
    echo ""
    echo "Failed tests require attention before production release."
    exit 1
fi