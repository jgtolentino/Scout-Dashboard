#!/bin/bash
set -euo pipefail

# AI-BI-Genie Deployment Validation Script

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    local level=$1
    shift
    case $level in
        "INFO") echo -e "${BLUE}[INFO]${NC} $*" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $*" ;;
        "WARN") echo -e "${YELLOW}[WARN]${NC} $*" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $*" ;;
    esac
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

log "INFO" "Starting AI-BI-Genie deployment validation..."

# Validation checks
checks_passed=0
total_checks=0

check_requirement() {
    local name=$1
    local command=$2
    local expected_output=$3
    
    total_checks=$((total_checks + 1))
    log "INFO" "Checking $name..."
    
    if eval "$command" | grep -q "$expected_output"; then
        log "SUCCESS" "$name: ✅ PASS"
        checks_passed=$((checks_passed + 1))
    else
        log "ERROR" "$name: ❌ FAIL"
    fi
}

# Check prerequisites
check_requirement "Docker" "docker --version" "Docker version"
check_requirement "Docker Compose" "docker-compose --version" "version"
check_requirement "Python 3" "python3 --version" "Python 3"
check_requirement "Node.js" "node --version" "v"

# Check project structure
log "INFO" "Validating project structure..."
required_files=(
    "docker-compose.yml"
    ".env"
    "app/app_simple.py"
    "azure-portal-spa/package.json"
    "scripts/deploy_local.sh"
    "requirements.txt"
    "README.md"
)

for file in "${required_files[@]}"; do
    total_checks=$((total_checks + 1))
    if [ -f "$file" ]; then
        log "SUCCESS" "File exists: $file ✅"
        checks_passed=$((checks_passed + 1))
    else
        log "ERROR" "Missing file: $file ❌"
    fi
done

# Check Docker Compose configuration
total_checks=$((total_checks + 1))
if docker-compose config --quiet > /dev/null 2>&1; then
    log "SUCCESS" "Docker Compose configuration: ✅ VALID"
    checks_passed=$((checks_passed + 1))
else
    log "ERROR" "Docker Compose configuration: ❌ INVALID"
fi

# Check environment file
total_checks=$((total_checks + 1))
if grep -q "DATABASE_URL" .env && grep -q "REDIS_URL" .env; then
    log "SUCCESS" "Environment configuration: ✅ COMPLETE"
    checks_passed=$((checks_passed + 1))
else
    log "ERROR" "Environment configuration: ❌ INCOMPLETE"
fi

# Summary
echo ""
log "INFO" "Validation Summary:"
echo "=================="
echo "Checks passed: $checks_passed/$total_checks"

if [ $checks_passed -eq $total_checks ]; then
    log "SUCCESS" "🎉 All validation checks passed! Ready for deployment."
    echo ""
    echo "Next steps:"
    echo "1. Run './scripts/deploy_local.sh' to start local deployment"
    echo "2. Access the application at http://localhost:8080"
    echo "3. Check './monitor.sh' for system status"
    exit 0
else
    failed_checks=$((total_checks - checks_passed))
    log "ERROR" "❌ $failed_checks validation check(s) failed. Please fix issues before deployment."
    exit 1
fi