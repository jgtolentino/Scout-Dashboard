#!/bin/bash

# Client360 Dashboard Drill-Down E2E Test Runner
# Simplified script for local development and testing

set -e

# Configuration
DEFAULT_PORT=8000
DEFAULT_BROWSER="chromium-desktop"
TEST_TIMEOUT=30000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                Client360 Dashboard E2E Tests                ║"
    echo "║                 Drill-Down Functionality                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Parse command line arguments
BROWSER="$DEFAULT_BROWSER"
PORT="$DEFAULT_PORT"
RUN_MODE="all"
HEADLESS="false"
SHOW_HELP="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -m|--mode)
            RUN_MODE="$2"
            shift 2
            ;;
        --headless)
            HEADLESS="true"
            shift
            ;;
        -h|--help)
            SHOW_HELP="true"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            SHOW_HELP="true"
            shift
            ;;
    esac
done

# Show help if requested
if [ "$SHOW_HELP" = "true" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -b, --browser BROWSER    Browser to test (chromium-desktop, firefox-desktop, webkit-desktop, mobile-chrome)"
    echo "  -p, --port PORT          Port for local server (default: $DEFAULT_PORT)"
    echo "  -m, --mode MODE          Test mode: all, api, e2e, mobile, performance (default: all)"
    echo "      --headless           Run in headless mode"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests with default settings"
    echo "  $0 --browser firefox-desktop         # Test only in Firefox"
    echo "  $0 --mode api                        # Run only API tests"
    echo "  $0 --mode performance --headless     # Run performance tests headlessly"
    echo ""
    exit 0
fi

print_header

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm packages are installed
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Installing dependencies..."
    npm install
fi

# Check if Playwright browsers are installed
print_status "Checking Playwright browsers..."
if ! npx playwright install-deps > /dev/null 2>&1; then
    print_warning "Installing Playwright browser dependencies..."
    npx playwright install-deps
fi

if ! npx playwright install > /dev/null 2>&1; then
    print_warning "Installing Playwright browsers..."
    npx playwright install
fi

# Start local server
print_status "Starting local server on port $PORT..."
python -m http.server $PORT > /dev/null 2>&1 &
SERVER_PID=$!

# Function to cleanup server on exit
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        print_status "Stopping local server..."
        kill $SERVER_PID 2>/dev/null || true
    fi
}
trap cleanup EXIT

# Wait for server to start
sleep 3

# Check if server is responding
if ! curl -f http://localhost:$PORT/test_drilldown.html > /dev/null 2>&1; then
    print_error "Local server is not responding. Please check if port $PORT is available."
    exit 1
fi

print_success "Local server is running at http://localhost:$PORT"

# Set environment variables
export TEST_BASE_URL="http://localhost:$PORT"
export CI="false"

if [ "$HEADLESS" = "true" ]; then
    export PLAYWRIGHT_HEADLESS="true"
fi

# Run tests based on mode
print_status "Running tests in '$RUN_MODE' mode..."

case $RUN_MODE in
    "api")
        print_status "Running API tests..."
        npx playwright test --project=api-tests
        ;;
    "e2e")
        print_status "Running E2E tests with browser: $BROWSER"
        npx playwright test --project="$BROWSER"
        ;;
    "mobile")
        print_status "Running mobile tests..."
        npx playwright test --project=mobile-chrome --project=mobile-safari
        ;;
    "performance")
        print_status "Running performance tests..."
        npx playwright test --project=performance --grep="@performance"
        ;;
    "all")
        print_status "Running all tests..."
        
        # Run API tests first (fast feedback)
        print_status "🔄 Step 1/4: API Tests"
        npx playwright test --project=api-tests
        
        # Run main E2E tests
        print_status "🔄 Step 2/4: E2E Tests ($BROWSER)"
        npx playwright test --project="$BROWSER"
        
        # Run mobile tests
        print_status "🔄 Step 3/4: Mobile Tests"
        npx playwright test --project=mobile-chrome
        
        # Run performance tests
        print_status "🔄 Step 4/4: Performance Tests"
        npx playwright test --project=performance --grep="@performance"
        ;;
    *)
        print_error "Invalid mode: $RUN_MODE"
        print_error "Valid modes: all, api, e2e, mobile, performance"
        exit 1
        ;;
esac

# Test results summary
print_success "🎉 Test execution completed!"

# Show test results if available
if [ -f "test-results/results.json" ]; then
    print_status "📊 Test Results Summary:"
    
    # Parse results (requires jq, but provide fallback)
    if command -v jq &> /dev/null; then
        TOTAL=$(jq -r '.stats.total // "N/A"' test-results/results.json)
        PASSED=$(jq -r '.stats.passed // "N/A"' test-results/results.json)
        FAILED=$(jq -r '.stats.failed // "N/A"' test-results/results.json)
        SKIPPED=$(jq -r '.stats.skipped // "N/A"' test-results/results.json)
        
        echo "   Total tests: $TOTAL"
        echo "   ✅ Passed: $PASSED"
        echo "   ❌ Failed: $FAILED"
        echo "   ⏭️  Skipped: $SKIPPED"
        
        if [ "$FAILED" != "0" ] && [ "$FAILED" != "N/A" ]; then
            print_warning "Some tests failed. Check the HTML report for details."
        fi
    else
        print_status "Install 'jq' for detailed test result parsing"
        echo "   Results file: test-results/results.json"
    fi
fi

# Show HTML report location
if [ -d "playwright-report" ]; then
    print_status "📋 HTML Test Report: playwright-report/index.html"
    
    # Try to open report automatically on macOS
    if [[ "$OSTYPE" == "darwin"* ]] && [ "$HEADLESS" != "true" ]; then
        print_status "Opening test report in browser..."
        open playwright-report/index.html 2>/dev/null || true
    fi
fi

# Show screenshots/videos if any failures occurred
FAILURE_ARTIFACTS=$(find test-results -name "*.png" -o -name "*.webm" 2>/dev/null | wc -l)
if [ "$FAILURE_ARTIFACTS" -gt 0 ]; then
    print_warning "📸 Found $FAILURE_ARTIFACTS failure artifacts in test-results/"
    print_status "Check screenshots and videos for failed test details"
fi

print_success "✨ All done! Drill-down functionality test complete."

# Exit with appropriate code
if [ -f "test-results/results.json" ] && command -v jq &> /dev/null; then
    FAILED=$(jq -r '.stats.failed // 0' test-results/results.json)
    if [ "$FAILED" != "0" ]; then
        exit 1
    fi
fi

exit 0