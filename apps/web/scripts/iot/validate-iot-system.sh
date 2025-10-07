#!/bin/bash

# IoT Expert System Validation Script
# Comprehensive testing for Scout Dashboard IoT integration

set -euo pipefail

echo "🔍 Scout Dashboard IoT Expert - System Validation"
echo "================================================="

# Configuration
SUPABASE_URL="${SUPABASE_URL:-https://cxzllzyxwpyptfretryc.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
IOT_ALLOW_WRITES="${IOT_ALLOW_WRITES:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

print_test_header() {
    echo -e "\n${BLUE}🧪 Test: $1${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo -e "   ${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "   ${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "   ${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "   ${BLUE}ℹ️  $1${NC}"
}

# Test 1: Environment Configuration
test_environment() {
    print_test_header "Environment Configuration"
    
    if [[ -n "$SUPABASE_URL" ]]; then
        print_success "SUPABASE_URL is set: $SUPABASE_URL"
    else
        print_failure "SUPABASE_URL is not set"
    fi
    
    if [[ -n "$SUPABASE_ANON_KEY" ]]; then
        print_success "SUPABASE_ANON_KEY is set (length: ${#SUPABASE_ANON_KEY})"
    else
        print_warning "SUPABASE_ANON_KEY is not set (required for telemetry)"
    fi
    
    if [[ -n "$SUPABASE_SERVICE_KEY" ]]; then
        print_success "SUPABASE_SERVICE_ROLE_KEY is set (length: ${#SUPABASE_SERVICE_KEY})"
    else
        print_warning "SUPABASE_SERVICE_ROLE_KEY is not set (required for admin operations)"
    fi
    
    if [[ "$IOT_ALLOW_WRITES" == "true" ]]; then
        print_success "IOT_ALLOW_WRITES is enabled"
    else
        print_failure "IOT_ALLOW_WRITES is not enabled (set to 'true' to enable IoT ingestion)"
    fi
}

# Test 2: Network Connectivity
test_connectivity() {
    print_test_header "Network Connectivity"
    
    # Test basic internet connectivity
    if ping -c 1 8.8.8.8 &> /dev/null; then
        print_success "Internet connectivity: OK"
    else
        print_failure "No internet connectivity"
        return
    fi
    
    # Test Supabase URL resolution
    if nslookup "$(echo $SUPABASE_URL | cut -d'/' -f3)" &> /dev/null; then
        print_success "Supabase URL resolution: OK"
    else
        print_failure "Cannot resolve Supabase URL"
    fi
    
    # Test HTTPS connectivity to Supabase
    if curl -s --max-time 5 "$SUPABASE_URL" &> /dev/null; then
        print_success "HTTPS connectivity to Supabase: OK"
    else
        print_failure "Cannot connect to Supabase over HTTPS"
    fi
}

# Test 3: Supabase API Access
test_supabase_api() {
    print_test_header "Supabase API Access"
    
    # Test REST API endpoint
    local rest_response
    rest_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        "${SUPABASE_URL}/rest/v1/" 2>/dev/null)
    
    local rest_status
    rest_status=$(echo "$rest_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
    
    if [[ "$rest_status" == "200" ]]; then
        print_success "REST API access: OK"
    elif [[ "$rest_status" == "401" ]]; then
        print_failure "REST API access: Unauthorized (check SUPABASE_ANON_KEY)"
    else
        print_failure "REST API access: Failed (status: $rest_status)"
    fi
}

# Test 4: Edge Functions
test_edge_functions() {
    print_test_header "Edge Functions"
    
    # Test iot-ingest function
    local ingest_response
    ingest_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -X OPTIONS \
        "${SUPABASE_URL}/functions/v1/iot-ingest" 2>/dev/null)
    
    local ingest_status
    ingest_status=$(echo "$ingest_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
    
    if [[ "$ingest_status" == "200" ]]; then
        print_success "iot-ingest function: Deployed and accessible"
    elif [[ "$ingest_status" == "404" ]]; then
        print_failure "iot-ingest function: Not found (needs deployment)"
    else
        print_failure "iot-ingest function: Error (status: $ingest_status)"
    fi
    
    # Test iot-minute-aggregator function  
    local aggregator_response
    aggregator_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -X OPTIONS \
        "${SUPABASE_URL}/functions/v1/iot-minute-aggregator" 2>/dev/null)
    
    local aggregator_status
    aggregator_status=$(echo "$aggregator_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
    
    if [[ "$aggregator_status" == "200" ]]; then
        print_success "iot-minute-aggregator function: Deployed and accessible"
    elif [[ "$aggregator_status" == "404" ]]; then
        print_failure "iot-minute-aggregator function: Not found (needs deployment)"
    else
        print_failure "iot-minute-aggregator function: Error (status: $aggregator_status)"
    fi
}

# Test 5: Database Schema
test_database_schema() {
    print_test_header "Database Schema"
    
    if [[ -z "$SUPABASE_SERVICE_KEY" ]]; then
        print_warning "Cannot test database schema without SUPABASE_SERVICE_ROLE_KEY"
        return
    fi
    
    # Test IoT schema existence
    local schema_response
    schema_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        "${SUPABASE_URL}/rest/v1/iot.devices?limit=1" 2>/dev/null)
    
    local schema_status
    schema_status=$(echo "$schema_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
    
    if [[ "$schema_status" == "200" ]]; then
        print_success "IoT schema: Tables accessible"
        
        # Count existing devices
        local device_count
        device_count=$(echo "$schema_response" | sed 's/HTTP_STATUS:[0-9]*//' | jq '. | length' 2>/dev/null || echo "0")
        print_info "Existing devices in registry: $device_count"
        
    elif [[ "$schema_status" == "401" ]]; then
        print_failure "IoT schema: Unauthorized (check service role key)"
    elif [[ "$schema_status" == "404" ]]; then
        print_failure "IoT schema: Tables not found (migration needed)"
    else
        print_failure "IoT schema: Error (status: $schema_status)"
    fi
}

# Test 6: End-to-End Telemetry
test_telemetry_flow() {
    print_test_header "End-to-End Telemetry Flow"
    
    if [[ "$IOT_ALLOW_WRITES" != "true" ]]; then
        print_warning "IOT_ALLOW_WRITES is not enabled, skipping telemetry test"
        return
    fi
    
    if [[ -z "$SUPABASE_ANON_KEY" ]]; then
        print_warning "Cannot test telemetry without SUPABASE_ANON_KEY"
        return
    fi
    
    # Create test telemetry payload
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    
    local test_payload
    test_payload=$(cat << EOF
{
  "device_id": "test-device-$(date +%s)",
  "device_type": "validation_test",
  "event_data": {
    "test_metric": 42.0,
    "validation_test": true,
    "timestamp": "$timestamp",
    "message": "IoT system validation test"
  },
  "event_timestamp": "$timestamp"
}
EOF
)
    
    # Send test telemetry
    local telemetry_response
    telemetry_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "x-client-info: iot-validation/1.0.0" \
        -d "$test_payload" \
        "${SUPABASE_URL}/functions/v1/iot-ingest" 2>/dev/null)
    
    local telemetry_status
    telemetry_status=$(echo "$telemetry_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
    
    if [[ "$telemetry_status" == "200" ]]; then
        print_success "Telemetry ingestion: Working"
        
        # Extract event ID if available
        local event_id
        event_id=$(echo "$telemetry_response" | sed 's/HTTP_STATUS:[0-9]*//' | jq -r '.event_id // "N/A"' 2>/dev/null)
        print_info "Event ID: $event_id"
        
    elif [[ "$telemetry_status" == "403" ]]; then
        print_failure "Telemetry ingestion: Forbidden (check IOT_ALLOW_WRITES)"
    elif [[ "$telemetry_status" == "404" ]]; then
        print_failure "Telemetry ingestion: Function not found (needs deployment)"
    else
        print_failure "Telemetry ingestion: Error (status: $telemetry_status)"
        local error_msg
        error_msg=$(echo "$telemetry_response" | sed 's/HTTP_STATUS:[0-9]*//' | jq -r '.error // "Unknown error"' 2>/dev/null)
        print_info "Error: $error_msg"
    fi
}

# Test 7: File Dependencies
test_file_dependencies() {
    print_test_header "File Dependencies"
    
    local files_to_check=(
        "supabase/functions/iot-ingest/index.ts"
        "supabase/functions/iot-minute-aggregator/index.ts"
        "supabase/migrations/20250904_iot_expert.sql"
        "scripts/iot/mqtt.ts"
        "scripts/iot/pi-device-setup.sh"
    )
    
    for file in "${files_to_check[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "$file exists"
        else
            print_failure "$file not found"
        fi
    done
}

# Test 8: Required Tools
test_required_tools() {
    print_test_header "Required Tools"
    
    local tools=("curl" "jq" "nslookup" "ping")
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            print_success "$tool is available"
        else
            print_failure "$tool is not available"
        fi
    done
    
    # Check for optional tools
    if command -v deno &> /dev/null; then
        print_success "Deno is available (for MQTT CLI tool)"
    else
        print_warning "Deno is not available (install for MQTT CLI tool)"
    fi
}

# Main execution
main() {
    echo "Starting IoT Expert system validation..."
    echo "Timestamp: $(date)"
    echo ""
    
    test_environment
    test_connectivity  
    test_supabase_api
    test_edge_functions
    test_database_schema
    test_telemetry_flow
    test_file_dependencies
    test_required_tools
    
    echo ""
    echo "================================================="
    echo "🏁 Validation Complete"
    echo "================================================="
    echo ""
    echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 All tests passed! IoT Expert system is ready for production.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Some tests failed. Please review the issues above.${NC}"
        echo ""
        echo "🔧 Common fixes:"
        echo "• Set IOT_ALLOW_WRITES=true to enable telemetry ingestion"
        echo "• Deploy edge functions: supabase functions deploy iot-ingest"
        echo "• Apply database migration: supabase db push"
        echo "• Check API keys are valid and have correct permissions"
        exit 1
    fi
}

# Help message
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    echo "IoT Expert System Validation Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Environment variables:"
    echo "  SUPABASE_URL              Supabase project URL"
    echo "  SUPABASE_ANON_KEY         Anonymous key for API access"
    echo "  SUPABASE_SERVICE_ROLE_KEY Service role key for admin operations"
    echo "  IOT_ALLOW_WRITES          Set to 'true' to enable telemetry ingestion"
    echo ""
    echo "Options:"
    echo "  -h, --help               Show this help message"
    echo ""
    exit 0
fi

# Run main function
main