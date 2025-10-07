#!/bin/bash
# MindsDB Health Check Script
# Comprehensive validation of MindsDB instances and data pipelines

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DESKTOP_PORT=47334
CODE_PORT=57334
TIMEOUT=30
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Health check functions
check_docker_containers() {
    log_info "Checking Docker containers..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found"
        return 1
    fi
    
    local desktop_status=$(docker inspect -f '{{.State.Health.Status}}' mindsdb-desktop 2>/dev/null || echo "not_found")
    local code_status=$(docker inspect -f '{{.State.Health.Status}}' mindsdb-code 2>/dev/null || echo "not_found")
    
    if [[ "$desktop_status" == "healthy" ]]; then
        log_success "MindsDB Desktop container is healthy"
    else
        log_error "MindsDB Desktop container: $desktop_status"
        return 1
    fi
    
    if [[ "$code_status" == "healthy" ]]; then
        log_success "MindsDB Code container is healthy"
    else
        log_error "MindsDB Code container: $code_status"
        return 1
    fi
}

check_api_endpoints() {
    log_info "Checking API endpoints..."
    
    # Check Desktop instance
    if curl -sf --max-time $TIMEOUT "http://localhost:$DESKTOP_PORT/api/status" > /dev/null 2>&1; then
        log_success "Desktop API (port $DESKTOP_PORT) is responding"
    else
        log_error "Desktop API (port $DESKTOP_PORT) is unreachable"
        return 1
    fi
    
    # Check Code instance
    if curl -sf --max-time $TIMEOUT "http://localhost:$CODE_PORT/api/status" > /dev/null 2>&1; then
        log_success "Code API (port $CODE_PORT) is responding"
    else
        log_error "Code API (port $CODE_PORT) is unreachable"  
        return 1
    fi
}

test_sql_connectivity() {
    log_info "Testing SQL connectivity..."
    
    local test_query='{"query":"SELECT 1 as health_check;"}'
    
    # Test Desktop instance SQL
    local desktop_response=$(curl -s --max-time $TIMEOUT -X POST "http://localhost:$DESKTOP_PORT/api/sql/query" \
        -H "Content-Type: application/json" \
        -d "$test_query" 2>/dev/null)
    
    if echo "$desktop_response" | grep -q "health_check"; then
        log_success "Desktop SQL query execution works"
    else
        log_error "Desktop SQL query failed"
        return 1
    fi
    
    # Test Code instance SQL  
    local code_response=$(curl -s --max-time $TIMEOUT -X POST "http://localhost:$CODE_PORT/api/sql/query" \
        -H "Content-Type: application/json" \
        -d "$test_query" 2>/dev/null)
        
    if echo "$code_response" | grep -q "health_check"; then
        log_success "Code SQL query execution works"
    else
        log_error "Code SQL query failed"
        return 1
    fi
}

check_datasources() {
    log_info "Checking datasource connectivity..."
    
    # Test datasource listing via Code instance
    local datasources=$(curl -s --max-time $TIMEOUT "http://localhost:$CODE_PORT/api/datasources" 2>/dev/null)
    
    if echo "$datasources" | grep -q "supabase"; then
        log_success "Supabase datasources are registered"
    else
        log_warning "No Supabase datasources found - may need to run register_datasources.sh"
    fi
}

check_kpi_freshness() {
    log_info "Checking KPI data freshness..."
    
    # Source secrets if available
    if [[ -f "$SCRIPT_DIR/../secrets_export.sh" ]]; then
        source "$SCRIPT_DIR/../secrets_export.sh" remote 2>/dev/null || true
    fi
    
    # Check if we have database connection
    if [[ -z "$SUPABASE_PG_URL_REMOTE" ]] && [[ -z "$SUPABASE_POOLER_URL" ]]; then
        log_warning "No database connection available - skipping KPI freshness check"
        return 0
    fi
    
    # Use pooler URL if available, otherwise remote URL
    local db_url="${SUPABASE_POOLER_URL:-$SUPABASE_PG_URL_REMOTE}"
    
    # Query last KPI update
    local last_update=$(psql "$db_url" -t -c "
        SELECT MAX(updated_at) FROM kpi_metrics 
        WHERE source = 'mindsdb'
    " 2>/dev/null | xargs || echo "")
    
    if [[ -z "$last_update" ]]; then
        log_warning "No KPI data found from MindsDB source"
        return 0
    fi
    
    # Check if data is fresh (within 6 hours)
    local cutoff=$(date -u -d '6 hours ago' '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -u -j -v-6H '+%Y-%m-%d %H:%M:%S')
    
    if [[ "$last_update" > "$cutoff" ]]; then
        log_success "KPI data is fresh (last update: $last_update)"
    else
        log_warning "KPI data may be stale (last update: $last_update)"
    fi
}

check_jobs_status() {
    log_info "Checking scheduled jobs status..."
    
    # Check jobs via Code instance API
    local jobs_response=$(curl -s --max-time $TIMEOUT "http://localhost:$CODE_PORT/api/projects/mindsdb/jobs" 2>/dev/null)
    
    if [[ -n "$jobs_response" ]]; then
        local job_count=$(echo "$jobs_response" | grep -o '"name"' | wc -l || echo "0")
        if [[ $job_count -gt 0 ]]; then
            log_success "Found $job_count scheduled jobs"
        else
            log_info "No scheduled jobs found"
        fi
    else
        log_warning "Could not retrieve jobs status"
    fi
}

# Main health check execution
main() {
    echo "🏥 MindsDB Health Check Starting..."
    echo "=================================="
    
    local failed_checks=0
    
    # Run all health checks
    check_docker_containers || ((failed_checks++))
    echo
    
    check_api_endpoints || ((failed_checks++))
    echo
    
    test_sql_connectivity || ((failed_checks++))
    echo
    
    check_datasources || ((failed_checks++))
    echo
    
    check_kpi_freshness || ((failed_checks++))
    echo
    
    check_jobs_status || ((failed_checks++))
    echo
    
    # Summary
    echo "=================================="
    if [[ $failed_checks -eq 0 ]]; then
        log_success "All health checks passed! MindsDB is healthy."
        exit 0
    else
        log_error "$failed_checks health check(s) failed."
        echo
        echo "Common troubleshooting steps:"
        echo "1. Restart containers: docker compose -f docker-compose.mcp.yml restart"
        echo "2. Check logs: docker compose -f docker-compose.mcp.yml logs -f"
        echo "3. Verify configuration: ./configure_claude.sh"
        echo "4. Register datasources: ./register_datasources.sh"
        exit 1
    fi
}

# Execute main function
main "$@"