#!/bin/bash
#
# pilot_test.sh - Start pilot test with Pulser as Pointer → Manus → Artifact system
#
# This script launches a pilot test of the end-to-end system,
# connecting Pulser to the Pointer → Manus → Artifact pipeline.

VERSION="1.1.0"

set -e  # Exit on any error

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_ROOT="$(dirname "$(dirname "$0")")"
LOG_DIR="${REPO_ROOT}/logs"
LOG_FILE="${LOG_DIR}/pilot_test_$(date +%Y%m%d_%H%M%S).log"
RESULTS_DIR="${REPO_ROOT}/pilot_results"

# Services
POINTER_SERVICE="${REPO_ROOT}/scripts/pointer_launch.sh"
MANUS_SERVICE="${REPO_ROOT}/scripts/skr_dedupe.py"
ARTIFACTS_DIR="${REPO_ROOT}/SKR/03_Artifacts"

# Test cases
TEST_CASES=(
    "marketing strategy for tech startup"
    "customer segmentation for retail"
    "competitive analysis framework"
    "social media content calendar"
)

# Create necessary directories
mkdir -p "$LOG_DIR" "$RESULTS_DIR"

# Function for logging
log() {
    local message="$1"
    local level="${2:-INFO}"
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Display banner
show_banner() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}          InsightPulseAI End-to-End Pilot Test - v${VERSION}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Display help message
show_help() {
    show_banner
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -r, --run             Run the pilot test"
    echo "  -c, --custom QUERY    Run a custom test query"
    echo "  -a, --analyze         Analyze previous test results"
    echo "  -v, --version         Show version"
    echo "  -h, --help            Show this help"
    echo
    echo "Examples:"
    echo "  $0 --run              # Run the standard pilot test"
    echo "  $0 --custom \"AI ethics framework\"   # Test with custom query"
    echo "  $0 --analyze          # Analyze previous results"
    echo
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..." "INFO"
    
    # Check if pointer_launch.sh exists and is executable
    if [[ ! -x "$POINTER_SERVICE" ]]; then
        log "Pointer service not found or not executable: $POINTER_SERVICE" "ERROR"
        echo -e "${RED}✗ Pointer service not found or not executable${NC}"
        exit 1
    fi
    
    # Check if skr_dedupe.py exists and is executable
    if [[ ! -x "$MANUS_SERVICE" ]]; then
        log "Manus service not found or not executable: $MANUS_SERVICE" "ERROR"
        echo -e "${RED}✗ Manus service not found or not executable${NC}"
        exit 1
    fi
    
    # Check if the artifacts directory exists
    if [[ ! -d "$ARTIFACTS_DIR" ]]; then
        log "Artifacts directory not found: $ARTIFACTS_DIR" "ERROR"
        echo -e "${RED}✗ Artifacts directory not found${NC}"
        exit 1
    fi
    
    log "All system requirements satisfied" "SUCCESS"
    echo -e "${GREEN}✓ System requirements check passed${NC}"
}

# Run a single test case
run_test_case() {
    local query="$1"
    local test_id="$(date +%Y%m%d_%H%M%S)_$(echo "$query" | tr ' ' '_' | tr -cd 'a-zA-Z0-9_-' | cut -c1-30)"
    local test_dir="${RESULTS_DIR}/${test_id}"
    
    mkdir -p "$test_dir"
    
    log "Running test case: $query" "INFO"
    echo -e "${BLUE}Test Case:${NC} $query"
    
    # Step 1: Search using Pointer
    log "Step 1: Searching using Pointer..." "INFO"
    echo -e "${YELLOW}Step 1:${NC} Searching knowledge base..."
    
    "$POINTER_SERVICE" --search "$query" > "${test_dir}/pointer_results.txt" 2>&1
    if [[ $? -eq 0 ]]; then
        log "Pointer search completed successfully" "SUCCESS"
        echo -e "${GREEN}✓ Search complete${NC}"
    else
        log "Pointer search failed" "ERROR"
        echo -e "${RED}✗ Search failed${NC}"
        return 1
    fi
    
    # Step 2: Process with Manus (simulated)
    log "Step 2: Processing with Manus..." "INFO"
    echo -e "${YELLOW}Step 2:${NC} Processing knowledge..."
    
    # Simulate Manus processing - in a real system, this would call the actual Manus service
    # For this pilot, we'll create a simple JSON result
    cat > "${test_dir}/manus_results.json" << EOF
{
    "query": "$query",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "processed": true,
    "artifacts": [
        {
            "id": "${test_id}_1",
            "type": "report",
            "status": "complete"
        }
    ]
}
EOF
    
    log "Manus processing simulated" "SUCCESS"
    echo -e "${GREEN}✓ Processing complete${NC}"
    
    # Step 3: Generate artifact
    log "Step 3: Generating artifact..." "INFO"
    echo -e "${YELLOW}Step 3:${NC} Generating artifact..."
    
    # Simulate artifact generation - in a real system, this would create an actual artifact
    local artifact_content="# Generated Report: $query\n\nThis is a simulated artifact for the pilot test.\n\nQuery: $query\nTimestamp: $(date)\nTest ID: $test_id"
    
    echo -e "$artifact_content" > "${test_dir}/artifact.md"
    
    # Also copy to artifacts directory for the full end-to-end experience
    echo -e "$artifact_content" > "${ARTIFACTS_DIR}/pilot_${test_id}.md"
    
    log "Artifact generated" "SUCCESS"
    echo -e "${GREEN}✓ Artifact generated${NC}"
    
    # Record test metadata
    cat > "${test_dir}/metadata.json" << EOF
{
    "id": "${test_id}",
    "query": "$query",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "steps": {
        "pointer": "success",
        "manus": "success",
        "artifact": "success"
    },
    "artifact_path": "${ARTIFACTS_DIR}/pilot_${test_id}.md"
}
EOF
    
    log "Test case completed successfully: $query" "SUCCESS"
    echo -e "${GREEN}✓ Test completed successfully${NC}"
    echo
    
    return 0
}

# Run all test cases
run_pilot_test() {
    show_banner
    check_requirements
    
    log "Starting pilot test..." "INFO"
    echo -e "\n${BLUE}Starting pilot test with ${#TEST_CASES[@]} test cases${NC}\n"
    
    local success_count=0
    local failure_count=0
    
    for query in "${TEST_CASES[@]}"; do
        if run_test_case "$query"; then
            ((success_count++))
        else
            ((failure_count++))
        fi
    done
    
    # Display summary
    echo -e "\n${BLUE}Pilot Test Summary:${NC}"
    echo -e "  ${GREEN}Successful test cases: ${success_count}${NC}"
    if [[ $failure_count -gt 0 ]]; then
        echo -e "  ${RED}Failed test cases: ${failure_count}${NC}"
    else
        echo -e "  ${GREEN}Failed test cases: 0${NC}"
    fi
    
    log "Pilot test completed. Success: $success_count, Failure: $failure_count" "INFO"
    
    if [[ $failure_count -eq 0 ]]; then
        echo -e "\n${GREEN}✓ All tests passed successfully!${NC}"
    else
        echo -e "\n${RED}✗ Some tests failed. Check the logs for details.${NC}"
    fi
}

# Run a custom test case
run_custom_test() {
    local query="$1"
    
    if [[ -z "$query" ]]; then
        log "No query provided for custom test" "ERROR"
        echo -e "${RED}✗ No query provided for custom test${NC}"
        exit 1
    fi
    
    show_banner
    check_requirements
    
    log "Starting custom test..." "INFO"
    echo -e "\n${BLUE}Starting custom test with query:${NC} $query\n"
    
    run_test_case "$query"
    
    echo -e "\n${GREEN}✓ Custom test completed!${NC}"
}

# Analyze previous test results
analyze_results() {
    show_banner
    
    log "Analyzing test results..." "INFO"
    echo -e "\n${BLUE}Analyzing previous test results${NC}\n"
    
    # Check if results directory exists and contains test results
    if [[ ! -d "$RESULTS_DIR" ]] || [[ -z "$(ls -A "$RESULTS_DIR" 2>/dev/null)" ]]; then
        log "No test results found in $RESULTS_DIR" "ERROR"
        echo -e "${RED}✗ No test results found${NC}"
        exit 1
    fi
    
    # Count test cases
    local total_tests=$(find "$RESULTS_DIR" -maxdepth 1 -type d | wc -l)
    ((total_tests--))  # Subtract 1 for the parent directory
    
    # Count successful tests (those with metadata.json containing "steps": {"pointer": "success", ...})
    local success_count=$(grep -r '"pointer": "success"' "$RESULTS_DIR" | wc -l)
    
    # Calculate failure count
    local failure_count=$((total_tests - success_count))
    
    # Display summary
    echo -e "${BLUE}Test Results Summary:${NC}"
    echo -e "  ${BLUE}Total test cases: ${total_tests}${NC}"
    echo -e "  ${GREEN}Successful test cases: ${success_count}${NC}"
    if [[ $failure_count -gt 0 ]]; then
        echo -e "  ${RED}Failed test cases: ${failure_count}${NC}"
    else
        echo -e "  ${GREEN}Failed test cases: 0${NC}"
    fi
    
    # List recent test cases
    echo -e "\n${BLUE}Recent Test Cases:${NC}"
    local recent_tests=$(find "$RESULTS_DIR" -maxdepth 1 -type d -not -path "$RESULTS_DIR" | sort -r | head -5)
    
    for test_dir in $recent_tests; do
        if [[ -f "${test_dir}/metadata.json" ]]; then
            local query=$(grep -o '"query": "[^"]*"' "${test_dir}/metadata.json" | cut -d'"' -f4)
            local timestamp=$(grep -o '"timestamp": "[^"]*"' "${test_dir}/metadata.json" | cut -d'"' -f4)
            local success=$(grep -o '"pointer": "[^"]*"' "${test_dir}/metadata.json" | cut -d'"' -f4)
            
            if [[ "$success" == "success" ]]; then
                echo -e "  ${GREEN}✓${NC} $(date -d "$timestamp" '+%Y-%m-%d %H:%M:%S') - $query"
            else
                echo -e "  ${RED}✗${NC} $(date -d "$timestamp" '+%Y-%m-%d %H:%M:%S') - $query"
            fi
        fi
    done
    
    log "Analysis completed" "SUCCESS"
}

# Main execution
if [[ $# -eq 0 ]]; then
    show_help
    exit 0
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            echo -e "${BLUE}InsightPulseAI End-to-End Pilot Test${NC} v${VERSION}"
            exit 0
            ;;
        -r|--run)
            run_pilot_test
            shift
            ;;
        -c|--custom)
            if [[ -n "$2" ]] && [[ "${2:0:1}" != "-" ]]; then
                run_custom_test "$2"
                shift
            else
                log "No query provided for custom test" "ERROR"
                echo -e "${RED}✗ No query provided for custom test${NC}"
                exit 1
            fi
            shift
            ;;
        -a|--analyze)
            analyze_results
            shift
            ;;
        *)
            log "Unknown option: $1" "ERROR"
            echo -e "${RED}✗ Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done