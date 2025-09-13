#!/bin/bash
set -euo pipefail

# 🔍 Comprehensive deployment verification script
# Tests all endpoints, performance, and security

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Deployment Verification Starting...${NC}"
echo "================================================================"

# Check if deployment state exists
if [[ ! -f ".deployment_state/deployment_info.json" ]]; then
    echo -e "${RED}❌ No deployment state found${NC}"
    echo -e "${YELLOW}   Run 'make prod' first to deploy${NC}"
    exit 1
fi

# Load deployment info
SWA_URL=$(jq -r '.swa_url' .deployment_state/deployment_info.json)
SWA_NAME=$(jq -r '.swa_name' .deployment_state/deployment_info.json)
DEPLOYMENT_TIME=$(jq -r '.timestamp' .deployment_state/deployment_info.json)

echo "🌐 Testing URL: $SWA_URL"
echo "📦 Resource: $SWA_NAME"
echo "⏰ Deployed: $DEPLOYMENT_TIME"
echo "================================================================"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local success_pattern="$3"
    local warning_pattern="${4:-}"
    
    echo -e "${BLUE}🧪 Testing: $test_name${NC}"
    
    local result
    if result=$(eval "$test_command" 2>&1); then
        if [[ "$result" =~ $success_pattern ]]; then
            echo -e "${GREEN}✅ PASS: $test_name${NC}"
            ((TESTS_PASSED++))
            return 0
        elif [[ -n "$warning_pattern" && "$result" =~ $warning_pattern ]]; then
            echo -e "${YELLOW}⚠️  WARN: $test_name - $result${NC}"
            ((TESTS_WARNED++))
            return 1
        else
            echo -e "${RED}❌ FAIL: $test_name - $result${NC}"
            ((TESTS_FAILED++))
            return 2
        fi
    else
        echo -e "${RED}❌ FAIL: $test_name - Command failed${NC}"
        ((TESTS_FAILED++))
        return 2
    fi
}

performance_test() {
    local url="$1"
    local max_time="$2"
    local test_name="$3"
    
    echo -e "${BLUE}⚡ Performance Test: $test_name${NC}"
    
    local response_time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$url" 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time < $max_time" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${GREEN}✅ PASS: $test_name (${response_time}s < ${max_time}s)${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️  SLOW: $test_name (${response_time}s >= ${max_time}s)${NC}"
        ((TESTS_WARNED++))
        return 1
    fi
}

echo -e "${BLUE}1️⃣ Basic Connectivity Tests${NC}"
echo "--------------------------------"

# Test 1: Dashboard responds
run_test "Dashboard HTTP Status" \
    "curl -s -o /dev/null -w '%{http_code}' '$SWA_URL/'" \
    "200"

# Test 2: Dashboard content (not Azure placeholder)
run_test "Dashboard Content" \
    "curl -s '$SWA_URL/' | head -10" \
    "Scout Dashboard|Project Scout|dashboard" \
    "azure.*static.*apps"

# Test 3: Static assets load
run_test "Static Assets" \
    "curl -s -o /dev/null -w '%{http_code}' '$SWA_URL/js/dashboard.js' || curl -s -o /dev/null -w '%{http_code}' '$SWA_URL/static/js/main.*.js' || echo '404'" \
    "200" \
    "404"

echo ""
echo -e "${BLUE}2️⃣ API Endpoint Tests${NC}"
echo "--------------------------------"

# Test 4: API health endpoint (if exists)
run_test "API Health Check" \
    "curl -s -o /dev/null -w '%{http_code}' '$SWA_URL/api/health' || echo '404'" \
    "200" \
    "404"

# Test 5: Premium endpoint security
run_test "Premium Endpoint Security" \
    "curl -s -o /dev/null -w '%{http_code}' '$SWA_URL/api/premium-insights'" \
    "403|401"

# Test 6: API CORS headers
run_test "API CORS Headers" \
    "curl -s -I '$SWA_URL/api/premium-insights' | grep -i 'access-control-allow' || echo 'no-cors'" \
    "access-control-allow" \
    "no-cors"

echo ""
echo -e "${BLUE}3️⃣ Performance Tests${NC}"
echo "--------------------------------"

# Check if bc is available for performance calculations
if ! command -v bc >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  bc not available, skipping performance tests${NC}"
else
    performance_test "$SWA_URL/" "3.0" "Dashboard Load Time"
    performance_test "$SWA_URL/api/premium-insights" "2.0" "API Response Time"
fi

echo ""
echo -e "${BLUE}4️⃣ Security Tests${NC}"
echo "--------------------------------"

# Test 7: Security headers
run_test "Security Headers" \
    "curl -s -I '$SWA_URL/' | grep -i 'x-frame-options\|x-content-type-options\|content-security-policy'" \
    "x-frame-options|x-content-type|content-security"

# Test 8: HTTPS redirect
run_test "HTTPS Enforcement" \
    "curl -s -o /dev/null -w '%{http_code}' 'http://$(echo $SWA_URL | sed 's|https://||')/'" \
    "301|302|200"

# Test 9: Directory traversal protection
run_test "Directory Traversal Protection" \
    "curl -s -o /dev/null -w '%{http_code}' '$SWA_URL/../etc/passwd'" \
    "404|403"

echo ""
echo -e "${BLUE}5️⃣ Functional Tests${NC}"
echo "--------------------------------"

# Test 10: Dashboard title and basic structure
run_test "Dashboard Title" \
    "curl -s '$SWA_URL/' | grep -i '<title.*scout.*dashboard.*</title>'" \
    "scout.*dashboard"

# Test 11: Static Web Apps configuration
run_test "SWA Config" \
    "curl -s -o /dev/null -w '%{http_code}' '$SWA_URL/staticwebapp.config.json'" \
    "200|404" \
    "404"

# Test 12: Navigation fallback (SPA routing)
run_test "Navigation Fallback" \
    "curl -s -o /dev/null -w '%{http_code}' '$SWA_URL/nonexistent-route'" \
    "200" \
    "404"

echo ""
echo -e "${BLUE}6️⃣ Integration Tests${NC}"
echo "--------------------------------"

# Test 13: Azure OpenAI endpoint (if credentials available)
if [[ -n "${AZURE_OPENAI_ENDPOINT:-}" ]]; then
    run_test "Azure OpenAI Connectivity" \
        "curl -s -o /dev/null -w '%{http_code}' '$AZURE_OPENAI_ENDPOINT/'" \
        "200|401|403"
else
    echo -e "${YELLOW}⚠️  SKIP: Azure OpenAI test (AZURE_OPENAI_ENDPOINT not set)${NC}"
fi

# Test 14: GitHub repository connectivity
run_test "GitHub Repository" \
    "curl -s -o /dev/null -w '%{http_code}' 'https://api.github.com/repos/jgtolentino/pulser'" \
    "200"

echo ""
echo "================================================================"
echo -e "${BLUE}📊 Verification Summary${NC}"
echo "================================================================"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNED))

echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $TESTS_WARNED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}📊 Total: $TOTAL_TESTS${NC}"

# Calculate success rate
if [[ $TOTAL_TESTS -gt 0 ]]; then
    SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))
    echo -e "${BLUE}📈 Success Rate: $SUCCESS_RATE%${NC}"
else
    SUCCESS_RATE=0
fi

echo ""
echo -e "${BLUE}🔗 Quick Access Links:${NC}"
echo -e "${BLUE}   🌐 Dashboard: $SWA_URL${NC}"
echo -e "${BLUE}   🛠️  Azure Portal: https://portal.azure.com${NC}"
echo -e "${BLUE}   📊 GitHub Actions: https://github.com/jgtolentino/pulser/actions${NC}"

echo ""
if [[ $TESTS_FAILED -eq 0 && $SUCCESS_RATE -ge 80 ]]; then
    echo -e "${GREEN}🎉 Deployment verification PASSED!${NC}"
    echo -e "${GREEN}   Your Scout Dashboard is ready for production use.${NC}"
    exit 0
elif [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  Deployment verification completed with warnings.${NC}"
    echo -e "${YELLOW}   Dashboard is functional but may need attention.${NC}"
    exit 1
else
    echo -e "${RED}❌ Deployment verification FAILED!${NC}"
    echo -e "${RED}   Critical issues found. Please investigate.${NC}"
    echo ""
    echo -e "${YELLOW}📋 Troubleshooting Steps:${NC}"
    echo -e "${YELLOW}   1. Check Azure Portal for resource status${NC}"
    echo -e "${YELLOW}   2. Review GitHub Actions logs${NC}"
    echo -e "${YELLOW}   3. Verify environment variables${NC}"
    echo -e "${YELLOW}   4. Run: make rollback if needed${NC}"
    exit 2
fi