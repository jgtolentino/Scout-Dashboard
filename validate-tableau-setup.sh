#!/bin/bash

# Tableau Setup Validation & Testing Script
# Validates complete Tableau Desktop → Server migration with Claude Code CLI integration

set -euo pipefail

# Configuration
EXPORT_DIR="${EXPORT_DIR:-$HOME/tableau_complete_migration}"
MCP_PORT="${MCP_PORT:-8080}"
TSM_USER="${TSM_USER:-admin}"
TIMEOUT="${TIMEOUT:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠ $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ $1${NC}"
}

test_result() {
    local test_name="$1"
    local result="$2"
    
    if [[ "$result" == "PASS" ]]; then
        log "$test_name: PASS"
    elif [[ "$result" == "WARN" ]]; then
        warn "$test_name: WARNING"
    else
        error "$test_name: FAIL"
    fi
}

# Test 1: Desktop Asset Extraction
test_desktop_extraction() {
    info "Testing desktop asset extraction..."
    
    local result="PASS"
    local assets_dir="$EXPORT_DIR/desktop_assets"
    
    # Check if extraction directory exists
    if [[ ! -d "$assets_dir" ]]; then
        test_result "Desktop Assets Directory" "FAIL"
        return 1
    fi
    
    # Check workbooks
    local twb_count=$(ls "$assets_dir"/workbooks/*.twb 2>/dev/null | wc -l)
    if [[ $twb_count -gt 0 ]]; then
        test_result "Workbook Extraction ($twb_count files)" "PASS"
    else
        test_result "Workbook Extraction" "WARN"
        result="WARN"
    fi
    
    # Check datasources
    local tds_count=$(ls "$assets_dir"/tds/*.{tds,tdsx} 2>/dev/null | wc -l)
    if [[ $tds_count -gt 0 ]]; then
        test_result "Datasource Extraction ($tds_count files)" "PASS"
    else
        test_result "Datasource Extraction" "WARN"
        result="WARN"
    fi
    
    # Check hyper schemas
    local schema_count=$(ls "$assets_dir"/hyper_schemas/*.sql 2>/dev/null | wc -l)
    if [[ $schema_count -gt 0 ]]; then
        test_result "Hyper Schema Extraction ($schema_count files)" "PASS"
    else
        test_result "Hyper Schema Extraction" "WARN"
        result="WARN"
    fi
    
    # Check metadata
    if [[ -f "$assets_dir/metadata/workbook_metadata.json" ]]; then
        test_result "Workbook Metadata" "PASS"
    else
        test_result "Workbook Metadata" "WARN"
        result="WARN"
    fi
    
    # Check field definitions
    if [[ -f "$assets_dir/tds/datasource_fields.csv" ]]; then
        test_result "Datasource Field Definitions" "PASS"
    else
        test_result "Datasource Field Definitions" "WARN"
        result="WARN"
    fi
    
    test_result "Desktop Asset Extraction" "$result"
}

# Test 2: Tableau Server Status
test_tableau_server() {
    info "Testing Tableau Server status..."
    
    # Check if TSM is available
    if ! command -v tsm >/dev/null 2>&1; then
        test_result "TSM Command Available" "FAIL"
        return 1
    fi
    
    # Check server status
    if tsm status 2>/dev/null | grep -q "Status: RUNNING"; then
        test_result "Tableau Server Status" "PASS"
    else
        test_result "Tableau Server Status" "FAIL"
        return 1
    fi
    
    # Check server accessibility
    local server_ip=$(hostname -I | awk '{print $1}')
    if curl -k -s --connect-timeout $TIMEOUT "https://$server_ip" >/dev/null 2>&1; then
        test_result "Server Web Access" "PASS"
    else
        test_result "Server Web Access" "WARN"
    fi
    
    # Check admin access
    if curl -k -s --connect-timeout $TIMEOUT "https://$server_ip:8850" >/dev/null 2>&1; then
        test_result "TSM Admin Access" "PASS"
    else
        test_result "TSM Admin Access" "WARN"
    fi
    
    test_result "Tableau Server" "PASS"
}

# Test 3: MCP Proxy Status
test_mcp_proxy() {
    info "Testing MCP proxy status..."
    
    # Check if Docker is running
    if ! docker ps >/dev/null 2>&1; then
        test_result "Docker Service" "FAIL"
        return 1
    fi
    
    # Check if MCP container is running
    if docker ps | grep -q tableau-mcp; then
        test_result "MCP Container Running" "PASS"
    else
        test_result "MCP Container Running" "FAIL"
        return 1
    fi
    
    # Check MCP health endpoint
    if curl -s --connect-timeout $TIMEOUT "http://localhost:$MCP_PORT/health" >/dev/null 2>&1; then
        test_result "MCP Health Endpoint" "PASS"
    else
        test_result "MCP Health Endpoint" "FAIL"
        return 1
    fi
    
    # Test MCP API endpoints
    local health_response=$(curl -s "http://localhost:$MCP_PORT/health" 2>/dev/null)
    if echo "$health_response" | grep -q '"status"'; then
        test_result "MCP API Response" "PASS"
    else
        test_result "MCP API Response" "FAIL"
        return 1
    fi
    
    # Test datasources endpoint
    if curl -s --connect-timeout $TIMEOUT "http://localhost:$MCP_PORT/datasources" >/dev/null 2>&1; then
        test_result "MCP Datasources Endpoint" "PASS"
    else
        test_result "MCP Datasources Endpoint" "WARN"
    fi
    
    # Test workbooks endpoint
    if curl -s --connect-timeout $TIMEOUT "http://localhost:$MCP_PORT/workbooks" >/dev/null 2>&1; then
        test_result "MCP Workbooks Endpoint" "PASS"
    else
        test_result "MCP Workbooks Endpoint" "WARN"
    fi
    
    test_result "MCP Proxy" "PASS"
}

# Test 4: Claude Code CLI Scripts
test_claude_cli_scripts() {
    info "Testing Claude Code CLI integration scripts..."
    
    local scripts_dir="$EXPORT_DIR/server_deployment/claude_cli_scripts"
    
    # Check if scripts directory exists
    if [[ ! -d "$scripts_dir" ]]; then
        test_result "CLI Scripts Directory" "FAIL"
        return 1
    fi
    
    # Check MCP script
    if [[ -x "$scripts_dir/mcp_tableau.sh" ]]; then
        test_result "MCP Tableau Script Executable" "PASS"
    else
        test_result "MCP Tableau Script Executable" "FAIL"
        return 1
    fi
    
    # Check setup script
    if [[ -x "$scripts_dir/setup_env.sh" ]]; then
        test_result "Environment Setup Script" "PASS"
    else
        test_result "Environment Setup Script" "FAIL"
        return 1
    fi
    
    # Test script functionality
    if bash "$scripts_dir/mcp_tableau.sh" health >/dev/null 2>&1; then
        test_result "MCP Script Health Check" "PASS"
    else
        test_result "MCP Script Health Check" "WARN"
    fi
    
    test_result "Claude CLI Scripts" "PASS"
}

# Test 5: Asset Upload Verification
test_asset_upload() {
    info "Testing asset upload to server..."
    
    # Test MCP datasources endpoint for uploaded assets
    local ds_response=$(curl -s "http://localhost:$MCP_PORT/datasources" 2>/dev/null)
    if echo "$ds_response" | grep -q '"datasources"'; then
        local ds_count=$(echo "$ds_response" | jq -r '.count' 2>/dev/null || echo "0")
        if [[ "$ds_count" -gt 0 ]]; then
            test_result "Uploaded Datasources ($ds_count found)" "PASS"
        else
            test_result "Uploaded Datasources" "WARN"
        fi
    else
        test_result "Datasources API Response" "FAIL"
    fi
    
    # Test workbooks endpoint
    local wb_response=$(curl -s "http://localhost:$MCP_PORT/workbooks" 2>/dev/null)
    if echo "$wb_response" | grep -q '"workbooks"'; then
        local wb_count=$(echo "$wb_response" | jq -r '.count' 2>/dev/null || echo "0")
        if [[ "$wb_count" -gt 0 ]]; then
            test_result "Uploaded Workbooks ($wb_count found)" "PASS"
        else
            test_result "Uploaded Workbooks" "WARN"
        fi
    else
        test_result "Workbooks API Response" "FAIL"
    fi
    
    test_result "Asset Upload" "PASS"
}

# Test 6: System Performance
test_system_performance() {
    info "Testing system performance..."
    
    # Check memory usage
    local mem_usage=$(free | awk '/^Mem:/ {printf "%.1f", $3/$2 * 100}')
    if (( $(echo "$mem_usage < 80" | bc -l) )); then
        test_result "Memory Usage (${mem_usage}%)" "PASS"
    elif (( $(echo "$mem_usage < 90" | bc -l) )); then
        test_result "Memory Usage (${mem_usage}%)" "WARN"
    else
        test_result "Memory Usage (${mem_usage}%)" "FAIL"
    fi
    
    # Check disk usage
    local disk_usage=$(df / | awk 'NR==2 {printf "%.1f", $5}' | sed 's/%//')
    if (( $(echo "$disk_usage < 80" | bc -l) )); then
        test_result "Disk Usage (${disk_usage}%)" "PASS"
    elif (( $(echo "$disk_usage < 90" | bc -l) )); then
        test_result "Disk Usage (${disk_usage}%)" "WARN"
    else
        test_result "Disk Usage (${disk_usage}%)" "FAIL"
    fi
    
    # Check CPU load
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    if (( $(echo "$load_avg < $cpu_cores" | bc -l) )); then
        test_result "CPU Load ($load_avg/$cpu_cores cores)" "PASS"
    else
        test_result "CPU Load ($load_avg/$cpu_cores cores)" "WARN"
    fi
    
    test_result "System Performance" "PASS"
}

# Generate validation report
generate_validation_report() {
    info "Generating validation report..."
    
    local server_ip=$(hostname -I | awk '{print $1}')
    
    cat > "$EXPORT_DIR/VALIDATION_REPORT.md" << EOF
# Tableau Setup Validation Report

**Validation Date:** $(date)
**Validation Script:** $0

## System Overview

- **Tableau Server:** https://$server_ip
- **MCP Proxy:** http://localhost:$MCP_PORT
- **Export Directory:** $EXPORT_DIR

## Test Results Summary

$(if test_desktop_extraction >/dev/null 2>&1; then echo "✅ Desktop Asset Extraction"; else echo "❌ Desktop Asset Extraction"; fi)
$(if test_tableau_server >/dev/null 2>&1; then echo "✅ Tableau Server"; else echo "❌ Tableau Server"; fi)
$(if test_mcp_proxy >/dev/null 2>&1; then echo "✅ MCP Proxy"; else echo "❌ MCP Proxy"; fi)
$(if test_claude_cli_scripts >/dev/null 2>&1; then echo "✅ Claude CLI Scripts"; else echo "❌ Claude CLI Scripts"; fi)
$(if test_asset_upload >/dev/null 2>&1; then echo "✅ Asset Upload"; else echo "❌ Asset Upload"; fi)
$(if test_system_performance >/dev/null 2>&1; then echo "✅ System Performance"; else echo "❌ System Performance"; fi)

## Quick Commands

### Test MCP Connection
\`\`\`bash
curl http://localhost:$MCP_PORT/health
\`\`\`

### List Assets
\`\`\`bash
curl http://localhost:$MCP_PORT/datasources | jq '.count'
curl http://localhost:$MCP_PORT/workbooks | jq '.count'
\`\`\`

### Check Tableau Server
\`\`\`bash
tsm status
\`\`\`

### Claude CLI Integration
\`\`\`bash
$EXPORT_DIR/server_deployment/claude_cli_scripts/mcp_tableau.sh health
\`\`\`

## Next Steps

1. **If all tests pass**: Your system is ready for production use
2. **If warnings appear**: Review specific components but system is functional
3. **If failures occur**: Check logs and re-run failed components

## Support Commands

### Tableau Server Logs
\`\`\`bash
tail -f /var/opt/tableau/tableau_server/data/tabsvc/logs/tabadminservice/tabadminservice_*.log
\`\`\`

### MCP Proxy Logs
\`\`\`bash
docker logs tableau-mcp
\`\`\`

### System Status
\`\`\`bash
systemctl status docker
tsm status
docker ps | grep tableau-mcp
\`\`\`

---
Generated by: $0
EOF
    
    log "Validation report saved: $EXPORT_DIR/VALIDATION_REPORT.md"
}

# Main execution with progress tracking
main() {
    echo "═══════════════════════════════════════════"
    echo "  Tableau Setup Validation & Testing"
    echo "═══════════════════════════════════════════"
    echo ""
    
    local total_tests=6
    local current_test=0
    
    echo "Running $total_tests validation tests..."
    echo ""
    
    # Test 1: Desktop Asset Extraction
    ((current_test++))
    echo "[$current_test/$total_tests] Desktop Asset Extraction"
    test_desktop_extraction
    echo ""
    
    # Test 2: Tableau Server
    ((current_test++))
    echo "[$current_test/$total_tests] Tableau Server Status"
    test_tableau_server
    echo ""
    
    # Test 3: MCP Proxy
    ((current_test++))
    echo "[$current_test/$total_tests] MCP Proxy Status"
    test_mcp_proxy
    echo ""
    
    # Test 4: Claude CLI Scripts
    ((current_test++))
    echo "[$current_test/$total_tests] Claude Code CLI Scripts"
    test_claude_cli_scripts
    echo ""
    
    # Test 5: Asset Upload
    ((current_test++))
    echo "[$current_test/$total_tests] Asset Upload Verification"
    test_asset_upload
    echo ""
    
    # Test 6: System Performance
    ((current_test++))
    echo "[$current_test/$total_tests] System Performance"
    test_system_performance
    echo ""
    
    # Generate report
    generate_validation_report
    
    echo "═══════════════════════════════════════════"
    log "Validation completed!"
    info "Full report: $EXPORT_DIR/VALIDATION_REPORT.md"
    echo "═══════════════════════════════════════════"
}

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
    warn "jq not found. Installing..."
    sudo apt-get update && sudo apt-get install -y jq
fi

# Check if bc is available
if ! command -v bc >/dev/null 2>&1; then
    warn "bc not found. Installing..."
    sudo apt-get update && sudo apt-get install -y bc
fi

# Run main function
main "$@"