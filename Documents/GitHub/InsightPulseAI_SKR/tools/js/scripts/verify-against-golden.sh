#!/bin/bash

# Verify Against Golden Baseline Script v2.0
# This script compares the current codebase against a golden baseline
# to detect regressions, compliance issues, or unauthorized changes

set -e

# Configuration (Customizable via environment variables)
GOLDEN_TAG_PREFIX=${GOLDEN_PREFIX:-"golden"}
SECURITY_CHECK=${SECURITY_CHECK:-"true"}
PERFORMANCE_CHECK=${PERFORMANCE_CHECK:-"true"}
TEST_CHECK=${TEST_CHECK:-"true"}
COVERAGE_CHECK=${COVERAGE_CHECK:-"true"}
API_CHECK=${API_CHECK:-"true"}
DETAILED_REPORT=${DETAILED_REPORT:-"true"}

# Color codes for better readability
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Function for logging with timestamp
log() {
    local level=$1
    local message=$2
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $timestamp - $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $timestamp - $message" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $timestamp - $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $timestamp - $message" ;;
        *) echo -e "$timestamp - $message" ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &>/dev/null
}

# Function to display script help
show_help() {
    echo "Usage: $0 [GOLDEN_TAG] [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  -s, --no-security         Skip security checks"
    echo "  -p, --no-performance      Skip performance checks"
    echo "  -t, --no-tests            Skip test verification"
    echo "  -c, --no-coverage         Skip coverage checks"
    echo "  -a, --no-api              Skip API compatibility checks"
    echo "  -d, --no-details          Generate simplified report"
    echo "  -o, --output FILE         Save verification report to FILE"
    echo "  -f, --fix                 Try to fix minor issues automatically"
    echo "  -v, --verbose             Show detailed verification information"
    echo ""
    echo "Environment variables:"
    echo "  GOLDEN_PREFIX             Set the golden tag prefix"
    echo "  SECURITY_CHECK            Set to 'false' to skip security checks"
    echo "  PERFORMANCE_CHECK         Set to 'false' to skip performance checks"
    echo "  TEST_CHECK                Set to 'false' to skip test verification"
    echo "  COVERAGE_CHECK            Set to 'false' to skip coverage checks"
    echo "  API_CHECK                 Set to 'false' to skip API compatibility checks"
    echo "  DETAILED_REPORT           Set to 'false' to generate simplified report"
    echo ""
    echo "Example:"
    echo "  $0 golden-20250510123045 --no-performance --output verification-report.md"
}

# Function to count lines of files matching a pattern
count_lines() {
    local pattern=$1
    find . -name "$pattern" -type f -exec wc -l {} \; 2>/dev/null | awk '{sum += $1} END {print sum}'
}

# Initialize variables
OUTPUT_FILE=""
FIX_MODE="false"
VERBOSE="false"
GOLDEN_TAG=""

# Parse command line arguments
while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--no-security)
            SECURITY_CHECK="false"
            shift
            ;;
        -p|--no-performance)
            PERFORMANCE_CHECK="false"
            shift
            ;;
        -t|--no-tests)
            TEST_CHECK="false"
            shift
            ;;
        -c|--no-coverage)
            COVERAGE_CHECK="false"
            shift
            ;;
        -a|--no-api)
            API_CHECK="false"
            shift
            ;;
        -d|--no-details)
            DETAILED_REPORT="false"
            shift
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -f|--fix)
            FIX_MODE="true"
            shift
            ;;
        -v|--verbose)
            VERBOSE="true"
            shift
            ;;
        -*)
            log "ERROR" "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            if [ -z "$GOLDEN_TAG" ]; then
                GOLDEN_TAG="$1"
                shift
            else
                log "ERROR" "Unknown argument: $1"
                show_help
                exit 1
            fi
            ;;
    esac
done

# Check if a golden tag was specified
if [ -z "$GOLDEN_TAG" ]; then
    # Use the most recent golden tag by default
    GOLDEN_TAG=$(git tag -l "${GOLDEN_TAG_PREFIX}-*" | sort -r | head -n1)
    
    if [ -z "${GOLDEN_TAG}" ]; then
        log "ERROR" "No golden tag found."
        exit 1
    fi
    
    log "INFO" "Using most recent golden tag: ${GOLDEN_TAG}"
else
    # Validate the specified golden tag exists
    if ! git tag -l | grep -q "^${GOLDEN_TAG}$"; then
        log "ERROR" "Golden tag '${GOLDEN_TAG}' does not exist."
        echo "Available golden tags:"
        git tag -l "${GOLDEN_TAG_PREFIX}-*" | sort -r
        exit 1
    fi
fi

# Ensure we're in the right directory
cd "$(dirname "$0")/.."
ROOT_DIR=$(pwd)

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Initialize report content (we'll build this throughout verification)
REPORT_CONTENT="# Verification Report: ${CURRENT_BRANCH} vs ${GOLDEN_TAG}\n\n"
REPORT_CONTENT+="Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")\n\n"
REPORT_CONTENT+="## Summary\n\n"

# Track issues for summary
CRITICAL_ISSUES=0
WARNING_ISSUES=0
INFO_ISSUES=0

# Function to add issues to the report
add_issue() {
    local level=$1
    local message=$2
    
    case $level in
        "CRITICAL")
            CRITICAL_ISSUES=$((CRITICAL_ISSUES+1))
            REPORT_CONTENT+="- ❌ **CRITICAL**: $message\n"
            ;;
        "WARNING")
            WARNING_ISSUES=$((WARNING_ISSUES+1))
            REPORT_CONTENT+="- ⚠️ **WARNING**: $message\n"
            ;;
        "INFO")
            INFO_ISSUES=$((INFO_ISSUES+1))
            REPORT_CONTENT+="- ℹ️ **INFO**: $message\n"
            ;;
    esac
}

# Compare the current state with the golden baseline
log "INFO" "Comparing current state (${CURRENT_BRANCH}) with golden baseline (${GOLDEN_TAG})..."
REPORT_CONTENT+="## Changes Overview\n\n"

# Get the diff stats
DIFF_STATS=$(git diff --stat "${GOLDEN_TAG}" HEAD)
CHANGED_FILES=$(git diff --name-only "${GOLDEN_TAG}" HEAD | wc -l | tr -d ' ')
ADDED_FILES=$(git diff --name-only --diff-filter=A "${GOLDEN_TAG}" HEAD | wc -l | tr -d ' ')
MODIFIED_FILES=$(git diff --name-only --diff-filter=M "${GOLDEN_TAG}" HEAD | wc -l | tr -d ' ')
DELETED_FILES=$(git diff --name-only --diff-filter=D "${GOLDEN_TAG}" HEAD | wc -l | tr -d ' ')

REPORT_CONTENT+="Total changes: ${CHANGED_FILES} files\n"
REPORT_CONTENT+="- Added files: ${ADDED_FILES}\n"
REPORT_CONTENT+="- Modified files: ${MODIFIED_FILES}\n"
REPORT_CONTENT+="- Deleted files: ${DELETED_FILES}\n\n"

if [ "$VERBOSE" = "true" ]; then
    REPORT_CONTENT+="<details>\n<summary>Detailed diff stats</summary>\n\n\`\`\`\n${DIFF_STATS}\n\`\`\`\n</details>\n\n"
fi

# Load golden baseline info if available
GOLDEN_INFO_FILE=".golden-baselines/${GOLDEN_TAG}.json"
if [ -f "${GOLDEN_INFO_FILE}" ]; then
    log "INFO" "Loading golden baseline information..."
    GOLDEN_INFO=$(cat "${GOLDEN_INFO_FILE}")
    GOLDEN_COMMIT=$(echo "${GOLDEN_INFO}" | jq -r '.commit')
    GOLDEN_TIMESTAMP=$(echo "${GOLDEN_INFO}" | jq -r '.timestamp')
    
    REPORT_CONTENT+="Golden baseline info:\n"
    REPORT_CONTENT+="- Commit: \`${GOLDEN_COMMIT}\`\n"
    REPORT_CONTENT+="- Created on: ${GOLDEN_TIMESTAMP}\n"
    
    # Number of commits since golden
    COMMIT_COUNT=$(git rev-list --count "${GOLDEN_TAG}"..HEAD)
    REPORT_CONTENT+="- Commits since golden: ${COMMIT_COUNT}\n\n"
else
    log "WARNING" "Golden baseline info file not found: ${GOLDEN_INFO_FILE}"
    REPORT_CONTENT+="**Note**: Golden baseline info file not found.\n\n"
    add_issue "WARNING" "Golden baseline info file not found: ${GOLDEN_INFO_FILE}"
fi

# Check for specific high-risk files if security check is enabled
if [ "$SECURITY_CHECK" = "true" ]; then
    log "INFO" "Checking for high-risk file changes..."
    REPORT_CONTENT+="## Security Analysis\n\n"
    
    HIGH_RISK_FILES=(
        "staticwebapp.config.json"
        "package.json"
        "*.config.js"
        "azure-pipelines.yml"
        ".github/workflows/*.yml"
        "security/*.js"
        "auth/*.js"
        ".env*"
        "Dockerfile*"
        "docker-compose*.yml"
    )
    
    HIGH_RISK_FOUND=0
    HIGH_RISK_DETAILS=""
    
    for pattern in "${HIGH_RISK_FILES[@]}"; do
        changes=$(git diff --name-only "${GOLDEN_TAG}" HEAD -- "${pattern}" 2>/dev/null || echo "")
        if [ -n "${changes}" ]; then
            HIGH_RISK_FOUND=1
            HIGH_RISK_DETAILS+="### Pattern: ${pattern}\n\n"
            HIGH_RISK_DETAILS+="$(echo "${changes}" | sed 's/^/- /g')\n\n"
            
            # Check for actual content changes
            file_count=$(echo "${changes}" | wc -l | tr -d ' ')
            HIGH_RISK_DETAILS+="<details>\n<summary>View changes in ${file_count} files</summary>\n\n"
            
            IFS=$'\n'
            for file in $changes; do
                if [ -f "$file" ]; then
                    HIGH_RISK_DETAILS+="#### File: ${file}\n\n"
                    diff_content=$(git diff "${GOLDEN_TAG}" HEAD -- "${file}" | grep -v "^@@" | grep -E "^(\+|\-)" | head -n 50)
                    if [ -n "${diff_content}" ]; then
                        HIGH_RISK_DETAILS+="\`\`\`diff\n${diff_content}\n"
                        
                        lines=$(echo "${diff_content}" | wc -l | tr -d ' ')
                        if [ $lines -ge 50 ]; then
                            HIGH_RISK_DETAILS+="... truncated (showing first 50 lines of diff)\n"
                        fi
                        
                        HIGH_RISK_DETAILS+="\`\`\`\n\n"
                    else
                        HIGH_RISK_DETAILS+="_No content changes detected (possibly binary file or permission changes)_\n\n"
                    fi
                fi
            done
            HIGH_RISK_DETAILS+="</details>\n\n"
        fi
    done
    
    if [ $HIGH_RISK_FOUND -eq 1 ]; then
        add_issue "WARNING" "High-risk file changes detected"
        REPORT_CONTENT+="⚠️ **High-risk file changes detected**\n\n"
        
        if [ "$DETAILED_REPORT" = "true" ]; then
            REPORT_CONTENT+="${HIGH_RISK_DETAILS}"
        else
            REPORT_CONTENT+="Use --detailed-report to view specific changes\n\n"
        fi
    else
        REPORT_CONTENT+="✅ No high-risk file changes detected\n\n"
    fi
    
    # Check for security-sensitive changes
    log "INFO" "Checking for security-sensitive changes..."
    SECURITY_PATTERNS=(
        "password"
        "secret"
        "token"
        "key"
        "auth"
        "credentials"
        "cert"
        "ssh"
    )
    
    SECURITY_SENSITIVE_FOUND=0
    SECURITY_SENSITIVE_DETAILS=""
    
    for pattern in "${SECURITY_PATTERNS[@]}"; do
        changes=$(git diff -i "${GOLDEN_TAG}" HEAD | grep -i "${pattern}" | grep "^+" || echo "")
        if [ -n "${changes}" ]; then
            SECURITY_SENSITIVE_FOUND=1
            match_count=$(echo "${changes}" | wc -l | tr -d ' ')
            
            SECURITY_SENSITIVE_DETAILS+="### Sensitive pattern: \"${pattern}\"\n\n"
            SECURITY_SENSITIVE_DETAILS+="Found ${match_count} additions containing this pattern.\n\n"
            
            # Show some examples of matches
            SECURITY_SENSITIVE_DETAILS+="<details>\n<summary>View examples (first 5 matches)</summary>\n\n\`\`\`diff\n"
            SECURITY_SENSITIVE_DETAILS+="$(echo "${changes}" | head -n 5)\n"
            
            if [ $match_count -gt 5 ]; then
                SECURITY_SENSITIVE_DETAILS+="... and $(( match_count - 5 )) more matches\n"
            fi
            
            SECURITY_SENSITIVE_DETAILS+="\`\`\`\n</details>\n\n"
        fi
    done
    
    if [ $SECURITY_SENSITIVE_FOUND -eq 1 ]; then
        add_issue "WARNING" "Potential security-sensitive changes detected"
        REPORT_CONTENT+="⚠️ **Potential security-sensitive changes detected**\n\n"
        
        if [ "$DETAILED_REPORT" = "true" ]; then
            REPORT_CONTENT+="${SECURITY_SENSITIVE_DETAILS}"
        else
            REPORT_CONTENT+="Use --detailed-report to view specific changes\n\n"
        fi
    else
        REPORT_CONTENT+="✅ No security-sensitive changes detected\n\n"
    fi
fi

# Check for performance changes if enabled
if [ "$PERFORMANCE_CHECK" = "true" ]; then
    log "INFO" "Analyzing performance impact..."
    REPORT_CONTENT+="## Performance Impact Assessment\n\n"
    
    # Check if we have build capability
    if command_exists npm && [ -f "package.json" ]; then
        # Check bundle size changes if we can build the app
        if grep -q "\"build\"" package.json; then
            if [ "$VERBOSE" = "true" ]; then
                log "INFO" "Building application for bundle analysis..."
            
                # Try to build with analyze flag if available
                if grep -q "\"build:analyze\"" package.json; then
                    npm run build:analyze > /dev/null 2>&1 || log "WARNING" "Bundle analysis build failed."
                else
                    npm run build > /dev/null 2>&1 || log "WARNING" "Build failed."
                fi
            fi
            
            # Check bundle stats
            if [ -f "bundle-stats.json" ]; then
                CURRENT_BUNDLE_SIZE=$(jq '.totalSize' bundle-stats.json)
                REPORT_CONTENT+="Current bundle size: ${CURRENT_BUNDLE_SIZE} bytes\n\n"
                
                # Check against golden baseline if available
                if [ -f "${GOLDEN_INFO_FILE}" ]; then
                    if jq -e '.build_info.totalSize' "${GOLDEN_INFO_FILE}" > /dev/null 2>&1; then
                        GOLDEN_BUNDLE_SIZE=$(jq -r '.build_info.totalSize' "${GOLDEN_INFO_FILE}")
                        
                        # Calculate size difference
                        SIZE_DIFF=$((CURRENT_BUNDLE_SIZE - GOLDEN_BUNDLE_SIZE))
                        SIZE_DIFF_PERCENT=$(echo "scale=2; (${SIZE_DIFF} * 100) / ${GOLDEN_BUNDLE_SIZE}" | bc)
                        
                        REPORT_CONTENT+="- Golden baseline bundle size: ${GOLDEN_BUNDLE_SIZE} bytes\n"
                        
                        if [ ${SIZE_DIFF} -gt 0 ]; then
                            REPORT_CONTENT+="- **Increased by**: ${SIZE_DIFF} bytes (${SIZE_DIFF_PERCENT}%)\n\n"
                            
                            # Flag significant increases
                            if (( $(echo "${SIZE_DIFF_PERCENT} > 10" | bc -l) )); then
                                add_issue "WARNING" "Bundle size increased by ${SIZE_DIFF_PERCENT}%"
                            elif (( $(echo "${SIZE_DIFF_PERCENT} > 5" | bc -l) )); then
                                add_issue "INFO" "Bundle size increased by ${SIZE_DIFF_PERCENT}%"
                            fi
                        elif [ ${SIZE_DIFF} -lt 0 ]; then
                            REPORT_CONTENT+="- **Decreased by**: ${SIZE_DIFF#-} bytes (${SIZE_DIFF_PERCENT#-}%)\n\n"
                            REPORT_CONTENT+="✅ Bundle size has improved\n\n"
                        else
                            REPORT_CONTENT+="- **No change in bundle size**\n\n"
                        fi
                    fi
                else
                    REPORT_CONTENT+="- No golden baseline bundle size available for comparison\n\n"
                fi
            else
                REPORT_CONTENT+="- Bundle stats not available\n\n"
            fi
        else
            REPORT_CONTENT+="- Build script not found, skipping bundle analysis\n\n"
        fi
    fi
    
    # Check for code complexity changes
    if command_exists find && command_exists wc; then
        # Count lines of code
        JS_LINES=$(count_lines "*.js")
        TS_LINES=$(count_lines "*.ts")
        JSX_LINES=$(count_lines "*.jsx")
        TSX_LINES=$(count_lines "*.tsx")
        TOTAL_LINES=$((JS_LINES + TS_LINES + JSX_LINES + TSX_LINES))
        
        REPORT_CONTENT+="### Code Metrics\n\n"
        REPORT_CONTENT+="Lines of code:\n"
        REPORT_CONTENT+="- JavaScript: ${JS_LINES}\n"
        REPORT_CONTENT+="- TypeScript: ${TS_LINES}\n"
        REPORT_CONTENT+="- JSX: ${JSX_LINES}\n"
        REPORT_CONTENT+="- TSX: ${TSX_LINES}\n"
        REPORT_CONTENT+="- Total: ${TOTAL_LINES}\n\n"
        
        # Compare with golden if available
        if [ -f "${GOLDEN_INFO_FILE}" ] && [ -f ".golden-baselines/code-metrics-${GOLDEN_TAG}.json" ]; then
            GOLDEN_METRICS=$(cat ".golden-baselines/code-metrics-${GOLDEN_TAG}.json")
            GOLDEN_TOTAL=$(echo "${GOLDEN_METRICS}" | jq -r '.total_lines')
            
            LINES_DIFF=$((TOTAL_LINES - GOLDEN_TOTAL))
            REPORT_CONTENT+="- Lines changed since golden: ${LINES_DIFF}\n\n"
            
            if [ ${LINES_DIFF} -gt 1000 ]; then
                add_issue "WARNING" "Large increase in code size: ${LINES_DIFF} lines"
            elif [ ${LINES_DIFF} -gt 500 ]; then
                add_issue "INFO" "Significant increase in code size: ${LINES_DIFF} lines"
            fi
        else
            # Store current metrics for future comparisons
            CODE_METRICS="{\"js_lines\": ${JS_LINES}, \"ts_lines\": ${TS_LINES}, \"jsx_lines\": ${JSX_LINES}, \"tsx_lines\": ${TSX_LINES}, \"total_lines\": ${TOTAL_LINES}}"
            mkdir -p .golden-baselines
            echo "${CODE_METRICS}" > ".golden-baselines/code-metrics-${CURRENT_BRANCH}-$(date +"%Y%m%d%H%M%S").json"
        fi
    fi
fi

# Check test coverage if enabled
if [ "$COVERAGE_CHECK" = "true" ]; then
    log "INFO" "Checking test coverage..."
    REPORT_CONTENT+="## Test Coverage\n\n"
    
    # Try to run test coverage if npm is available
    if command_exists npm && [ -f "package.json" ]; then
        if grep -q "\"test:coverage\"" package.json; then
            if [ "$VERBOSE" = "true" ]; then
                log "INFO" "Running test coverage report..."
                npm run test:coverage > /dev/null 2>&1 || log "WARNING" "Test coverage run failed."
            fi
        fi
    fi
    
    # Check coverage results
    if [ -f "coverage/coverage-summary.json" ]; then
        CURRENT_LINES_COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
        CURRENT_STATEMENTS_COVERAGE=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
        CURRENT_FUNCTIONS_COVERAGE=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
        CURRENT_BRANCHES_COVERAGE=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)
        
        REPORT_CONTENT+="Current coverage:\n"
        REPORT_CONTENT+="- Lines: ${CURRENT_LINES_COVERAGE}%\n"
        REPORT_CONTENT+="- Statements: ${CURRENT_STATEMENTS_COVERAGE}%\n"
        REPORT_CONTENT+="- Functions: ${CURRENT_FUNCTIONS_COVERAGE}%\n"
        REPORT_CONTENT+="- Branches: ${CURRENT_BRANCHES_COVERAGE}%\n\n"
        
        # Compare with golden baseline if available
        if [ -f "${GOLDEN_INFO_FILE}" ]; then
            if jq -e '.test_coverage' "${GOLDEN_INFO_FILE}" > /dev/null 2>&1; then
                GOLDEN_LINES_COVERAGE=$(jq -r '.test_coverage.total.lines.pct' "${GOLDEN_INFO_FILE}")
                
                COVERAGE_DIFF=$(echo "${CURRENT_LINES_COVERAGE} - ${GOLDEN_LINES_COVERAGE}" | bc)
                REPORT_CONTENT+="- Golden baseline lines coverage: ${GOLDEN_LINES_COVERAGE}%\n"
                
                if (( $(echo "${COVERAGE_DIFF} < 0" | bc -l) )); then
                    REPORT_CONTENT+="- **Coverage decreased by ${COVERAGE_DIFF#-}%**\n\n"
                    add_issue "WARNING" "Test coverage decreased by ${COVERAGE_DIFF#-}%"
                elif (( $(echo "${COVERAGE_DIFF} > 0" | bc -l) )); then
                    REPORT_CONTENT+="- **Coverage increased by ${COVERAGE_DIFF}%**\n\n"
                    REPORT_CONTENT+="✅ Test coverage has improved\n\n"
                else
                    REPORT_CONTENT+="- **No change in coverage**\n\n"
                fi
            else
                REPORT_CONTENT+="- Golden baseline coverage information not available\n\n"
            fi
        else
            REPORT_CONTENT+="- Golden baseline information not available for comparison\n\n"
        fi
    else
        REPORT_CONTENT+="- Coverage report not available\n\n"
    fi
fi

# Run tests if enabled
if [ "$TEST_CHECK" = "true" ]; then
    log "INFO" "Running tests..."
    REPORT_CONTENT+="## Test Results\n\n"
    
    # Create temporary test output file
    TEST_OUTPUT_FILE=".golden-baselines/tests-${CURRENT_BRANCH}-$(date +"%Y%m%d%H%M%S").log"
    mkdir -p ".golden-baselines"
    
    # Run tests
    if command_exists npm && [ -f "package.json" ]; then
        if npm test > "${TEST_OUTPUT_FILE}" 2>&1; then
            TEST_RESULT="PASS"
            REPORT_CONTENT+="✅ All tests passing\n\n"
        else
            TEST_RESULT="FAIL"
            REPORT_CONTENT+="❌ Tests failing\n\n"
            
            # Extract error summary
            TEST_ERRORS=$(grep -A 10 "FAIL" "${TEST_OUTPUT_FILE}" | head -n 20)
            
            REPORT_CONTENT+="<details>\n<summary>Test failure summary</summary>\n\n\`\`\`\n${TEST_ERRORS}\n\`\`\`\n\n"
            REPORT_CONTENT+="Full test log: ${TEST_OUTPUT_FILE}\n</details>\n\n"
            
            add_issue "CRITICAL" "Tests are failing"
        fi
    else
        REPORT_CONTENT+="- Test capability not available\n\n"
    fi
fi

# Check API compatibility if enabled
if [ "$API_CHECK" = "true" ]; then
    log "INFO" "Checking API compatibility..."
    REPORT_CONTENT+="## API Compatibility\n\n"
    
    # Look for API definitions
    if find . -path "*/api/*.js" -o -path "*/api/*.ts" | grep -q .; then
        API_FILES=$(find . -path "*/api/*.js" -o -path "*/api/*.ts" | grep -v test | grep -v spec)
        API_FILES_COUNT=$(echo "${API_FILES}" | wc -l | tr -d ' ')
        
        REPORT_CONTENT+="Detected ${API_FILES_COUNT} API files\n\n"
        
        # Check for changed API files
        CHANGED_API_FILES=$(git diff --name-only "${GOLDEN_TAG}" HEAD -- $(echo "${API_FILES}" | tr '\n' ' '))
        CHANGED_API_COUNT=$(echo "${CHANGED_API_FILES}" | wc -w | tr -d ' ')
        
        if [ ${CHANGED_API_COUNT} -gt 0 ]; then
            REPORT_CONTENT+="⚠️ **${CHANGED_API_COUNT} API files changed since golden baseline**\n\n"
            
            REPORT_CONTENT+="<details>\n<summary>Changed API files</summary>\n\n"
            REPORT_CONTENT+="$(echo "${CHANGED_API_FILES}" | sed 's/^/- /g')\n\n"
            
            # Check for potential breaking changes
            BREAKING_CHANGES=0
            BREAKING_DETAILS=""
            
            for file in ${CHANGED_API_FILES}; do
                # Check for removed lines that might indicate API breakage
                REMOVED_LINES=$(git diff "${GOLDEN_TAG}" HEAD -- "${file}" | grep -E "^-\\s*(function|const|class|export|interface)" || echo "")
                
                if [ -n "${REMOVED_LINES}" ]; then
                    BREAKING_CHANGES=1
                    BREAKING_DETAILS+="### Potential breaking changes in ${file}\n\n"
                    BREAKING_DETAILS+="\`\`\`diff\n${REMOVED_LINES}\n\`\`\`\n\n"
                fi
            done
            
            if [ ${BREAKING_CHANGES} -eq 1 ]; then
                REPORT_CONTENT+="⚠️ **Potential breaking API changes detected**\n\n"
                add_issue "WARNING" "Potential breaking API changes detected"
                
                if [ "$DETAILED_REPORT" = "true" ]; then
                    REPORT_CONTENT+="${BREAKING_DETAILS}"
                else
                    REPORT_CONTENT+="Use --detailed-report to view details\n\n"
                fi
            else
                REPORT_CONTENT+="Likely backwards-compatible API changes\n\n"
            fi
            
            REPORT_CONTENT+="</details>\n\n"
        else
            REPORT_CONTENT+="✅ No API changes detected\n\n"
        fi
    else
        REPORT_CONTENT+="- No API files detected in the codebase\n\n"
    fi
}

# Add custom theme verification
REPORT_CONTENT+="## Theme Verification\n\n"
THEME_ISSUES=0

# Check if this is a themed application
if [ -d "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/src/themes" ]; then
    REPORT_CONTENT+="✅ Themes directory found.\n\n"
    THEMES_DIR="final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/src/themes"
    STYLES_DIR="final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/src/styles"
    
    # Collect available themes
    AVAILABLE_THEMES=$(find "$THEMES_DIR" -name "*.scss" -exec basename {} .scss \; | tr '\n' ' ')
    REPORT_CONTENT+="Available themes: ${AVAILABLE_THEMES}\n\n"
    
    # Check for TBWA theme files
    if [ -f "${THEMES_DIR}/tbwa.scss" ]; then
        REPORT_CONTENT+="✅ TBWA theme found.\n\n"
        
        # Check variables file
        if [ -f "${STYLES_DIR}/variables-tbwa.scss" ]; then
            REPORT_CONTENT+="✅ TBWA variables file found.\n\n"
            
            # Check for brand colors in the variables file
            if grep -q "#002B80" "${STYLES_DIR}/variables-tbwa.scss"; then
                REPORT_CONTENT+="✅ TBWA Navy color found.\n\n"
            else
                REPORT_CONTENT+="❌ TBWA Navy color not found in variables file.\n\n"
                THEME_ISSUES=$((THEME_ISSUES+1))
                add_issue "WARNING" "TBWA Navy color not found in theme variables"
            fi
            
            if grep -q "#00C3EC" "${STYLES_DIR}/variables-tbwa.scss"; then
                REPORT_CONTENT+="✅ TBWA Cyan color found.\n\n"
            else
                REPORT_CONTENT+="❌ TBWA Cyan color not found in variables file.\n\n"
                THEME_ISSUES=$((THEME_ISSUES+1))
                add_issue "WARNING" "TBWA Cyan color not found in theme variables"
            fi
            
            if grep -q "#E60028" "${STYLES_DIR}/variables-tbwa.scss"; then
                REPORT_CONTENT+="✅ TBWA Red color found.\n\n"
            else
                REPORT_CONTENT+="❌ TBWA Red color not found in variables file.\n\n"
                THEME_ISSUES=$((THEME_ISSUES+1))
                add_issue "WARNING" "TBWA Red color not found in theme variables"
            fi
            
            # Check for rollback component specific variables
            if grep -q "rollback-" "${STYLES_DIR}/variables-tbwa.scss"; then
                REPORT_CONTENT+="✅ Rollback component specific variables found.\n\n"
            else
                REPORT_CONTENT+="⚠️ No rollback component specific variables found in theme.\n\n"
                THEME_ISSUES=$((THEME_ISSUES+1))
                add_issue "WARNING" "No rollback component specific variables found in TBWA theme"
            fi
        else
            REPORT_CONTENT+="❌ TBWA variables file not found.\n\n"
            THEME_ISSUES=$((THEME_ISSUES+1))
            add_issue "WARNING" "TBWA variables file not found"
        fi
        
        # Check for rollback component styles in the theme file
        if grep -q "rollback-dashboard" "${THEMES_DIR}/tbwa.scss"; then
            REPORT_CONTENT+="✅ Rollback dashboard component styles found in TBWA theme.\n\n"
            
            # Check for completeness of rollback component styles
            ROLLBACK_PARTS=("rollback-dashboard-header" "rollback-dashboard-content" "rollback-dashboard-actions")
            MISSING_PARTS=()
            
            for part in "${ROLLBACK_PARTS[@]}"; do
                if ! grep -q "$part" "${THEMES_DIR}/tbwa.scss"; then
                    MISSING_PARTS+=("$part")
                fi
            done
            
            if [ ${#MISSING_PARTS[@]} -eq 0 ]; then
                REPORT_CONTENT+="✅ Rollback component styles are complete.\n\n"
            else
                REPORT_CONTENT+="⚠️ Incomplete rollback component styles: Missing ${MISSING_PARTS[*]}.\n\n"
                THEME_ISSUES=$((THEME_ISSUES+1))
                add_issue "WARNING" "Incomplete rollback component styles in TBWA theme"
            fi
        else
            REPORT_CONTENT+="❌ Rollback dashboard component styles not found in TBWA theme.\n\n"
            THEME_ISSUES=$((THEME_ISSUES+1))
            add_issue "CRITICAL" "Missing rollback dashboard component styles in TBWA theme"
            
            # Recommend fix
            if [ "$FIX_MODE" = "true" ]; then
                REPORT_CONTENT+="🔄 Attempting to fix missing rollback styles...\n\n"
                
                # Try to find rollback styles in another theme to copy
                for theme_file in $(find "$THEMES_DIR" -name "*.scss"); do
                    if [ "$theme_file" != "${THEMES_DIR}/tbwa.scss" ] && grep -q "rollback-dashboard" "$theme_file"; then
                        # Create backup
                        cp "${THEMES_DIR}/tbwa.scss" "${THEMES_DIR}/tbwa.scss.bak"
                        
                        # Extract and append rollback styles
                        ROLLBACK_STYLES=$(awk '/\/\/ Rollback Dashboard Component/,/^}$/' "$theme_file")
                        echo -e "\n$ROLLBACK_STYLES" >> "${THEMES_DIR}/tbwa.scss"
                        
                        REPORT_CONTENT+="✅ Added rollback styles from $(basename "$theme_file") to TBWA theme.\n\n"
                        break
                    fi
                done
            else
                REPORT_CONTENT+="💡 Use --fix to automatically add rollback styles.\n\n"
            fi
        fi
        
        # Verify compiled CSS files if available
        if [ -d "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/dist" ]; then
            CSS_FILES=$(find "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/dist" -name "*.css")
            
            if [ -n "$CSS_FILES" ]; then
                ROLLBACK_STYLES_IN_CSS=false
                
                for css_file in $CSS_FILES; do
                    if grep -q "rollback-dashboard" "$css_file"; then
                        ROLLBACK_STYLES_IN_CSS=true
                        REPORT_CONTENT+="✅ Rollback styles found in compiled CSS: $(basename "$css_file").\n\n"
                        break
                    fi
                done
                
                if [ "$ROLLBACK_STYLES_IN_CSS" = false ]; then
                    REPORT_CONTENT+="❌ Rollback styles not found in any compiled CSS files.\n\n"
                    THEME_ISSUES=$((THEME_ISSUES+1))
                    add_issue "CRITICAL" "Rollback styles missing from compiled CSS files"
                    
                    # Try to build with webpack if fix mode is enabled
                    if [ "$FIX_MODE" = "true" ] && [ -f "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/webpack.config.js" ]; then
                        REPORT_CONTENT+="🔄 Attempting to rebuild CSS with webpack...\n\n"
                        
                        CURR_DIR=$(pwd)
                        cd "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard"
                        
                        if npx webpack --config webpack.config.js --env theme=tbwa --mode production; then
                            REPORT_CONTENT+="✅ Successfully rebuilt the TBWA theme CSS.\n\n"
                        else
                            REPORT_CONTENT+="❌ Failed to rebuild CSS with webpack.\n\n"
                            add_issue "CRITICAL" "Failed to rebuild CSS with webpack"
                        fi
                        
                        cd "$CURR_DIR"
                    else
                        REPORT_CONTENT+="💡 Use --fix to attempt rebuilding the CSS files.\n\n"
                    fi
                fi
            else
                REPORT_CONTENT+="⚠️ No compiled CSS files found. Theme may not be fully built.\n\n"
                add_issue "WARNING" "No compiled CSS files found for theme verification"
            fi
        else
            REPORT_CONTENT+="⚠️ No compiled theme directory found. Theme may not be built.\n\n"
            add_issue "WARNING" "No compiled theme directory found"
        fi
    else
        REPORT_CONTENT+="❌ TBWA theme file not found.\n\n"
        THEME_ISSUES=$((THEME_ISSUES+1))
        add_issue "WARNING" "TBWA theme file not found"
    }
    
    # Check deployment scripts for theme verification
    DEPLOY_SCRIPTS=(
        "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy_to_azure.sh"
        "final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/scripts/deploy_tbwa_theme.sh"
    )
    
    DEPLOY_SCRIPT_VERIFICATION=false
    
    for script in "${DEPLOY_SCRIPTS[@]}"; do
        if [ -f "$script" ] && grep -q "rollback.*styles" "$script"; then
            DEPLOY_SCRIPT_VERIFICATION=true
            REPORT_CONTENT+="✅ Theme verification check found in deployment script: $(basename "$script").\n\n"
            break
        fi
    done
    
    if [ "$DEPLOY_SCRIPT_VERIFICATION" = false ]; then
        REPORT_CONTENT+="⚠️ No theme verification check found in deployment scripts.\n\n"
        THEME_ISSUES=$((THEME_ISSUES+1))
        add_issue "WARNING" "No theme verification check found in deployment scripts"
    }
else
    REPORT_CONTENT+="⚠️ No themes directory found. Skipping theme verification.\n\n"
fi

# Update summary based on issues found
ISSUES_TOTAL=$((CRITICAL_ISSUES + WARNING_ISSUES + INFO_ISSUES))
SUMMARY="Verification completed with ${ISSUES_TOTAL} issues:\n"
SUMMARY+="- ${CRITICAL_ISSUES} critical issues\n"
SUMMARY+="- ${WARNING_ISSUES} warnings\n"
SUMMARY+="- ${INFO_ISSUES} informational notes\n\n"

if [ ${CRITICAL_ISSUES} -gt 0 ]; then
    RECOMMENDATION="❌ **NOT RECOMMENDED**: Critical issues detected\n\n"
    RECOMMENDATION+="Address the critical issues before proceeding.\n"
    EXIT_CODE=2
elif [ ${WARNING_ISSUES} -gt 0 ]; then
    RECOMMENDATION="⚠️ **CAUTION**: Some concerns detected\n\n"
    RECOMMENDATION+="Review the warnings carefully before proceeding.\n"
    EXIT_CODE=1
else
    RECOMMENDATION="✅ **APPROVED**: Changes appear reasonable compared to golden baseline\n\n"
    RECOMMENDATION+="Proceed with confidence.\n"
    EXIT_CODE=0
fi

# Insert summary at the start of the report
FINAL_REPORT="# Verification Report: ${CURRENT_BRANCH} vs ${GOLDEN_TAG}\n\n"
FINAL_REPORT+="Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")\n\n"
FINAL_REPORT+="## Summary\n\n"
FINAL_REPORT+="${SUMMARY}\n"
FINAL_REPORT+="${RECOMMENDATION}\n"
FINAL_REPORT+="${REPORT_CONTENT#*"## Summary"*$'\n\n'*$'\n\n'}"

# Print results to console
log "INFO" "Verification completed."
echo ""
echo "==================== VERIFICATION SUMMARY ===================="
echo -e "${SUMMARY}"
echo -e "${RECOMMENDATION}"
echo "=============================================================="

# Save report to file if requested
if [ -n "${OUTPUT_FILE}" ]; then
    echo -e "${FINAL_REPORT}" > "${OUTPUT_FILE}"
    log "SUCCESS" "Report saved to: ${OUTPUT_FILE}"
fi

# Apply fixes if in fix mode
if [ "$FIX_MODE" = "true" ] && [ ${CRITICAL_ISSUES} -eq 0 ]; then
    log "INFO" "Attempting to fix minor issues..."
    # Add fix logic here for common issues
    # For example, prettier formatting, linting fixes, etc.
fi

# Exit with appropriate code
exit ${EXIT_CODE}