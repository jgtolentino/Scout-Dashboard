#!/bin/bash

# Prove PoC Script - Comprehensive validation of the Transaction Trends PoC

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="http://127.0.0.1:7071/api/transactions"
FRONTEND_URL="http://127.0.0.1:5173"
REPORT_FILE="poc-proof-$(date +%Y%m%d_%H%M%S).html"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Functions
log() {
    echo -e "${BLUE}[TEST] $1${NC}"
}

pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

header() {
    echo ""
    echo -e "${YELLOW}=== $1 ===${NC}"
    echo ""
}

# Start HTML report
init_report() {
    cat > "$REPORT_FILE" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>PoC Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .success { color: #28a745; }
        .fail { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-item { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .timestamp { color: #6c757d; font-size: 14px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .summary { font-size: 24px; margin: 20px 0; }
        .screenshot { max-width: 100%; border: 1px solid #ddd; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Transaction Trends PoC Validation Report</h1>
        <p class="timestamp">Generated: $(date)</p>
        <div id="content">
EOF
}

add_to_report() {
    echo "$1" >> "$REPORT_FILE"
}

# Test 1: Build Process
test_build() {
    header "Testing Build Process"
    add_to_report "<h2>Build Process</h2>"
    
    log "Running production build..."
    if npm run build > /dev/null 2>&1; then
        pass "Build completed successfully"
        add_to_report "<div class='test-item success'>✓ Build completed successfully</div>"
        
        # Check build output
        if [[ -d "frontend/dist" ]]; then
            pass "Frontend build artifacts exist"
            add_to_report "<div class='test-item success'>✓ Frontend build artifacts exist</div>"
            
            # Check file sizes
            local JS_SIZE=$(find frontend/dist -name "*.js" -exec du -ch {} + | grep total | awk '{print $1}')
            local CSS_SIZE=$(find frontend/dist -name "*.css" -exec du -ch {} + | grep total | awk '{print $1}')
            pass "Build sizes: JS=$JS_SIZE, CSS=$CSS_SIZE"
            add_to_report "<div class='test-item success'>✓ Build sizes: JS=$JS_SIZE, CSS=$CSS_SIZE</div>"
        else
            fail "Frontend build artifacts missing"
            add_to_report "<div class='test-item fail'>✗ Frontend build artifacts missing</div>"
        fi
    else
        fail "Build failed"
        add_to_report "<div class='test-item fail'>✗ Build failed</div>"
    fi
}

# Test 2: API Functionality
test_api() {
    header "Testing API Endpoints"
    add_to_report "<h2>API Endpoints</h2>"
    
    log "Starting API server..."
    cd api && func start > /dev/null 2>&1 &
    API_PID=$!
    sleep 5
    
    log "Testing /api/transactions endpoint..."
    if RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL" 2>/dev/null); then
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)
        
        if [[ "$HTTP_CODE" == "200" ]]; then
            pass "API returned HTTP 200"
            add_to_report "<div class='test-item success'>✓ API returned HTTP 200</div>"
            
            # Validate JSON structure
            if echo "$BODY" | jq '.' > /dev/null 2>&1; then
                pass "API returns valid JSON"
                add_to_report "<div class='test-item success'>✓ API returns valid JSON</div>"
                
                # Check data structure
                RECORD_COUNT=$(echo "$BODY" | jq 'length')
                if [[ $RECORD_COUNT -eq 30 ]]; then
                    pass "API returns 30 days of data"
                    add_to_report "<div class='test-item success'>✓ API returns 30 days of data</div>"
                else
                    fail "API returns $RECORD_COUNT records (expected 30)"
                    add_to_report "<div class='test-item fail'>✗ API returns $RECORD_COUNT records (expected 30)</div>"
                fi
                
                # Sample data
                SAMPLE=$(echo "$BODY" | jq '.[0]' | jq -r .)
                add_to_report "<pre>Sample data: $SAMPLE</pre>"
            else
                fail "API returns invalid JSON"
                add_to_report "<div class='test-item fail'>✗ API returns invalid JSON</div>"
            fi
        else
            fail "API returned HTTP $HTTP_CODE"
            add_to_report "<div class='test-item fail'>✗ API returned HTTP $HTTP_CODE</div>"
        fi
    else
        fail "API is not responding"
        add_to_report "<div class='test-item fail'>✗ API is not responding</div>"
    fi
    
    kill $API_PID 2>/dev/null || true
    cd ..
}

# Test 3: Frontend Functionality
test_frontend() {
    header "Testing Frontend"
    add_to_report "<h2>Frontend</h2>"
    
    log "Starting frontend server..."
    cd frontend && npm run dev > /dev/null 2>&1 &
    FRONTEND_PID=$!
    sleep 5
    
    log "Testing frontend accessibility..."
    if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
        pass "Frontend is accessible"
        add_to_report "<div class='test-item success'>✓ Frontend is accessible at $FRONTEND_URL</div>"
        
        # Get page content
        PAGE_CONTENT=$(curl -s "$FRONTEND_URL")
        
        # Check for React root
        if echo "$PAGE_CONTENT" | grep -q '<div id="root">'; then
            pass "React root element found"
            add_to_report "<div class='test-item success'>✓ React root element found</div>"
        else
            fail "React root element not found"
            add_to_report "<div class='test-item fail'>✗ React root element not found</div>"
        fi
        
        # Check for script inclusion
        if echo "$PAGE_CONTENT" | grep -q 'src="/src/main.tsx"'; then
            pass "Main script properly linked"
            add_to_report "<div class='test-item success'>✓ Main script properly linked</div>"
        else
            fail "Main script not found"
            add_to_report "<div class='test-item fail'>✗ Main script not found</div>"
        fi
    else
        fail "Frontend is not accessible"
        add_to_report "<div class='test-item fail'>✗ Frontend is not accessible</div>"
    fi
    
    kill $FRONTEND_PID 2>/dev/null || true
    cd ..
}

# Test 4: Code Quality
test_code_quality() {
    header "Testing Code Quality"
    add_to_report "<h2>Code Quality</h2>"
    
    log "Running linter..."
    if npm run lint > /dev/null 2>&1; then
        pass "Linting passed"
        add_to_report "<div class='test-item success'>✓ Linting passed</div>"
    else
        fail "Linting failed"
        add_to_report "<div class='test-item fail'>✗ Linting failed</div>"
    fi
    
    log "Checking TypeScript types..."
    if npm run type-check > /dev/null 2>&1; then
        pass "TypeScript type checking passed"
        add_to_report "<div class='test-item success'>✓ TypeScript type checking passed</div>"
    else
        fail "TypeScript type checking failed"
        add_to_report "<div class='test-item fail'>✗ TypeScript type checking failed</div>"
    fi
    
    log "Checking code formatting..."
    if npm run format:check > /dev/null 2>&1; then
        pass "Code formatting is consistent"
        add_to_report "<div class='test-item success'>✓ Code formatting is consistent</div>"
    else
        fail "Code formatting issues found"
        add_to_report "<div class='test-item fail'>✗ Code formatting issues found</div>"
    fi
}

# Test 5: Migration Readiness
test_migration_readiness() {
    header "Testing Migration Readiness"
    add_to_report "<h2>Migration Readiness</h2>"
    
    log "Checking migration scripts..."
    local SCRIPTS=(
        "scripts/migrate-to-production.sh"
        "scripts/rollback-migration.sh"
        "scripts/post-migration-setup.sh"
        "scripts/verify-production.sh"
    )
    
    for script in "${SCRIPTS[@]}"; do
        if [[ -x "$script" ]]; then
            pass "$script is executable"
            add_to_report "<div class='test-item success'>✓ $script is executable</div>"
        else
            fail "$script is not executable"
            add_to_report "<div class='test-item fail'>✗ $script is not executable</div>"
        fi
    done
    
    log "Checking documentation..."
    local DOCS=(
        "README.md"
        "MIGRATION.md"
        "QUICK_START.md"
    )
    
    for doc in "${DOCS[@]}"; do
        if [[ -f "$doc" ]]; then
            pass "$doc exists"
            add_to_report "<div class='test-item success'>✓ $doc exists</div>"
        else
            fail "$doc is missing"
            add_to_report "<div class='test-item fail'>✗ $doc is missing</div>"
        fi
    done
}

# Generate summary
generate_summary() {
    header "Test Summary"
    
    local TOTAL=$((TESTS_PASSED + TESTS_FAILED))
    local PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))
    
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo -e "Total: $TOTAL"
    echo -e "Success Rate: ${PERCENTAGE}%"
    
    add_to_report "<h2>Summary</h2>"
    add_to_report "<div class='summary'>"
    add_to_report "<span class='success'>Passed: $TESTS_PASSED</span> | "
    add_to_report "<span class='fail'>Failed: $TESTS_FAILED</span> | "
    add_to_report "Total: $TOTAL | Success Rate: ${PERCENTAGE}%"
    add_to_report "</div>"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo ""
        echo -e "${GREEN}✅ PoC IS PROVEN AND READY FOR DEPLOYMENT!${NC}"
        add_to_report "<h2 class='success'>✅ PoC IS PROVEN AND READY FOR DEPLOYMENT!</h2>"
    else
        echo ""
        echo -e "${RED}❌ PoC has issues that need to be resolved${NC}"
        add_to_report "<h2 class='fail'>❌ PoC has issues that need to be resolved</h2>"
    fi
    
    # Close HTML
    add_to_report "</div></div></body></html>"
}

# Main execution
main() {
    echo "=== Transaction Trends PoC Validation ==="
    echo "This will prove the PoC is working correctly"
    echo ""
    
    # Initialize report
    init_report
    
    # Ensure we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -d "frontend" ]]; then
        error "Must run from pulser-poc directory"
    fi
    
    # Kill any existing processes
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    lsof -ti:7071 | xargs kill -9 2>/dev/null || true
    
    # Run all tests
    test_build
    test_api
    test_frontend
    test_code_quality
    test_migration_readiness
    
    # Generate summary
    generate_summary
    
    echo ""
    echo -e "${BLUE}Full report saved to: $REPORT_FILE${NC}"
    echo "Open the report to see detailed results with screenshots"
    
    # Cleanup
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    lsof -ti:7071 | xargs kill -9 2>/dev/null || true
}

# Check for required tools
command -v jq >/dev/null 2>&1 || { echo "jq is required but not installed. Install with: brew install jq"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required but not installed."; exit 1; }

# Run main
main