#!/bin/bash
set -euo pipefail

# Scout v6 + Isko Quick Smoke Test Suite
# Parallel-safe smoke tests for fast validation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
SUPABASE_URL="${SUPABASE_URL:-https://cxzllzyxwpyptfretryc.supabase.co}"
APP_URL="${APP_URL:-http://localhost:3000}"
CSV_DIR="${CSV_DIR:-scout_v6_deployment/data/csv}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test functions
smoke_edges() {
    log "Testing Supabase Edge Functions..."
    
    local failed=0
    
    # Test isko-sku-scraper (dry run)
    log "  Testing isko-sku-scraper (dry run)..."
    if curl -s -X POST "$SUPABASE_URL/functions/v1/isko-sku-scraper" \
        -H "Content-Type: application/json" \
        -H "x-tenant-id: test-tenant" \
        -d '{"dry_run":true}' \
        --max-time 10 | jq . >/dev/null 2>&1; then
        success "isko-sku-scraper responding"
    else
        error "isko-sku-scraper failed"
        ((failed++))
    fi
    
    # Test agent-job-runner health
    log "  Testing agent-job-runner health..."
    if curl -s "$SUPABASE_URL/functions/v1/agent-job-runner/health" \
        --max-time 10 | jq . >/dev/null 2>&1; then
        success "agent-job-runner health check passed"
    else
        error "agent-job-runner health check failed"
        ((failed++))
    fi
    
    if [ $failed -eq 0 ]; then
        success "All edge functions responding"
        return 0
    else
        error "$failed edge function(s) failed"
        return 1
    fi
}

smoke_api() {
    log "Testing local app APIs..."
    
    local failed=0
    local endpoints=("/api/analytics" "/api/geo" "/api/exports")
    
    # Check if app is running first
    if ! curl -s "$APP_URL" --max-time 5 >/dev/null 2>&1; then
        warning "App not running at $APP_URL - skipping API tests"
        return 0
    fi
    
    for ep in "${endpoints[@]}"; do
        log "  Testing GET $ep..."
        if curl -sS "$APP_URL$ep" --max-time 5 | jq . >/dev/null 2>&1; then
            success "$ep responding with valid JSON"
        else
            # Try without JSON validation
            if curl -sS "$APP_URL$ep" --max-time 5 -w "%{http_code}" -o /dev/null 2>/dev/null | grep -q "^2"; then
                warning "$ep responding but not JSON"
            else
                error "$ep failed"
                ((failed++))
            fi
        fi
    done
    
    if [ $failed -eq 0 ]; then
        success "All API endpoints responding"
        return 0
    else
        error "$failed API endpoint(s) failed"
        return 1
    fi
}

smoke_csv() {
    log "Checking CSV data and manifest..."
    
    if [ ! -d "$CSV_DIR" ]; then
        warning "CSV directory not found: $CSV_DIR - skipping"
        return 0
    fi
    
    # Count CSV files
    local csv_count
    csv_count=$(find "$CSV_DIR" -name "*.csv" | wc -l)
    
    log "  Found $csv_count CSV files"
    
    if [ "$csv_count" -lt 12 ]; then
        error "Only found $csv_count CSV files, expected at least 12"
        return 1
    fi
    
    # Check for manifest
    local manifest_files
    manifest_files=$(find "$CSV_DIR" -name "MANIFEST_*.txt" | wc -l)
    
    if [ "$manifest_files" -eq 0 ]; then
        error "No MANIFEST_*.txt file found"
        return 1
    fi
    
    # Get latest manifest
    local latest_manifest
    latest_manifest=$(find "$CSV_DIR" -name "MANIFEST_*.txt" -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2- || echo "")
    
    if [ -n "$latest_manifest" ]; then
        local manifest_lines
        manifest_lines=$(wc -l < "$latest_manifest")
        success "CSV validation passed: $csv_count files, manifest with $manifest_lines entries"
        log "  Latest manifest: $(basename "$latest_manifest")"
        return 0
    else
        error "Could not read manifest file"
        return 1
    fi
}

# Main execution
main() {
    log "🚀 Starting Scout v6 + Isko Smoke Tests"
    log "Configuration:"
    log "  SUPABASE_URL: $SUPABASE_URL"
    log "  APP_URL: $APP_URL"
    log "  CSV_DIR: $CSV_DIR"
    echo
    
    local failed_tests=0
    local total_tests=3
    
    # Run smoke tests
    echo "=== Edge Functions Smoke Test ==="
    if smoke_edges; then
        success "Edge functions smoke test passed"
    else
        error "Edge functions smoke test failed"
        ((failed_tests++))
    fi
    echo
    
    echo "=== API Smoke Test ==="
    if smoke_api; then
        success "API smoke test passed"
    else
        error "API smoke test failed"
        ((failed_tests++))
    fi
    echo
    
    echo "=== CSV Data Smoke Test ==="
    if smoke_csv; then
        success "CSV smoke test passed"
    else
        error "CSV smoke test failed"
        ((failed_tests++))
    fi
    echo
    
    # Summary
    local passed_tests=$((total_tests - failed_tests))
    log "=== Smoke Test Summary ==="
    log "Passed: $passed_tests/$total_tests"
    log "Failed: $failed_tests/$total_tests"
    
    if [ $failed_tests -eq 0 ]; then
        success "All smoke tests passed! 🎉"
        return 0
    else
        error "Some smoke tests failed"
        return 1
    fi
}

# Handle command line arguments
case "${1:-all}" in
    edges)
        smoke_edges
        ;;
    api)
        smoke_api
        ;;
    csv)
        smoke_csv
        ;;
    all)
        main
        ;;
    *)
        echo "Usage: $0 [edges|api|csv|all]"
        echo "  edges - Test Supabase Edge Functions"
        echo "  api   - Test local app APIs"
        echo "  csv   - Test CSV data and manifest"
        echo "  all   - Run all smoke tests (default)"
        exit 1
        ;;
esac