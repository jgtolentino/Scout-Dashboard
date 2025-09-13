#!/bin/bash

# Production Verification Script
# Run this to verify your production deployment is working correctly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CHECKS_PASSED=0
CHECKS_FAILED=0

# Functions
log() {
    echo -e "${BLUE}[CHECK] $1${NC}"
}

pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((CHECKS_PASSED++))
}

fail() {
    echo -e "${RED}✗ $1${NC}"
    ((CHECKS_FAILED++))
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check functions
check_dependencies() {
    log "Checking dependencies..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        pass "Node.js installed: $NODE_VERSION"
    else
        fail "Node.js not installed"
    fi
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        pass "npm installed: $NPM_VERSION"
    else
        fail "npm not installed"
    fi
    
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        pass "Git installed: $GIT_VERSION"
    else
        fail "Git not installed"
    fi
}

check_file_structure() {
    log "Checking file structure..."
    
    local required_files=(
        "package.json"
        "frontend/package.json"
        "api/package.json"
        ".github/workflows/poc.yml"
        "README.md"
        ".gitignore"
        "staticwebapp.config.json"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            pass "Found: $file"
        else
            fail "Missing: $file"
        fi
    done
}

check_npm_scripts() {
    log "Checking npm scripts..."
    
    local required_scripts=(
        "dev"
        "build"
        "lint"
        "format"
        "deploy"
    )
    
    for script in "${required_scripts[@]}"; do
        if npm run | grep -q "$script"; then
            pass "Script found: npm run $script"
        else
            fail "Script missing: npm run $script"
        fi
    done
}

check_build() {
    log "Testing build process..."
    
    # Clean previous builds
    rm -rf frontend/dist api/dist
    
    # Try to build
    if npm run build &> /dev/null; then
        pass "Build successful"
        
        # Check build outputs
        if [[ -d "frontend/dist" ]]; then
            pass "Frontend build output exists"
        else
            fail "Frontend build output missing"
        fi
    else
        fail "Build failed"
    fi
}

check_lint() {
    log "Running linting..."
    
    if npm run lint &> /dev/null; then
        pass "Linting passed"
    else
        warning "Linting has warnings/errors"
    fi
}

check_environment() {
    log "Checking environment variables..."
    
    if [[ -f ".env.example" ]]; then
        pass "Environment example file exists"
    else
        warning "No .env.example file"
    fi
    
    # Check for secrets in code
    if grep -r "AZURE_STATIC_WEB_APPS_API_TOKEN" --include="*.js" --include="*.ts" --exclude-dir=node_modules . &> /dev/null; then
        fail "Found hardcoded secrets in code!"
    else
        pass "No hardcoded secrets found"
    fi
}

check_git_status() {
    log "Checking Git status..."
    
    if [[ -d ".git" ]]; then
        pass "Git repository initialized"
        
        # Check remote
        if git remote -v | grep -q "origin"; then
            REMOTE_URL=$(git remote get-url origin)
            pass "Git remote configured: $REMOTE_URL"
        else
            fail "No Git remote configured"
        fi
        
        # Check branch
        CURRENT_BRANCH=$(git branch --show-current)
        pass "Current branch: $CURRENT_BRANCH"
    else
        fail "Not a Git repository"
    fi
}

check_deployment_readiness() {
    log "Checking deployment readiness..."
    
    # Check for Azure CLI
    if command -v az &> /dev/null; then
        pass "Azure CLI installed"
    else
        warning "Azure CLI not installed (needed for some deployments)"
    fi
    
    # Check for SWA CLI
    if command -v swa &> /dev/null; then
        pass "Static Web Apps CLI installed"
    else
        warning "Static Web Apps CLI not installed"
    fi
}

test_local_server() {
    log "Testing local development server..."
    
    warning "Skipping local server test (requires manual verification)"
    echo "   To test: Run 'npm run dev' and check:"
    echo "   - Frontend: http://localhost:5173"
    echo "   - API: http://localhost:7071/api/transactions"
}

# Production URL test (optional)
test_production_url() {
    if [[ -n "$PRODUCTION_URL" ]]; then
        log "Testing production URL: $PRODUCTION_URL"
        
        # Test main page
        if curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" | grep -q "200"; then
            pass "Production site is up"
        else
            fail "Production site is down or unreachable"
        fi
        
        # Test API
        if curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/transactions" | grep -q "200"; then
            pass "Production API is responding"
        else
            fail "Production API is not responding"
        fi
    else
        warning "Set PRODUCTION_URL environment variable to test production deployment"
    fi
}

# Generate report
generate_report() {
    echo ""
    echo "==================================="
    echo "   PRODUCTION VERIFICATION REPORT"
    echo "==================================="
    echo ""
    echo -e "${GREEN}Passed:${NC} $CHECKS_PASSED"
    echo -e "${RED}Failed:${NC} $CHECKS_FAILED"
    echo ""
    
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
        echo "Your production environment is ready."
    else
        echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
        echo "Please fix the issues above before deploying to production."
        exit 1
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Run 'npm run dev' to test locally"
    echo "2. Push to GitHub to trigger CI/CD"
    echo "3. Monitor the deployment in GitHub Actions"
    echo "4. Verify the live site once deployed"
}

# Main execution
main() {
    echo "=== Production Verification Script ==="
    echo "Running comprehensive checks..."
    echo ""
    
    check_dependencies
    check_file_structure
    check_npm_scripts
    check_build
    check_lint
    check_environment
    check_git_status
    check_deployment_readiness
    test_local_server
    test_production_url
    
    generate_report
}

# Allow running with production URL
if [[ -n "$1" ]]; then
    export PRODUCTION_URL="$1"
fi

main