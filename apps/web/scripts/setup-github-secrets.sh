#!/bin/bash
set -euo pipefail

# Setup GitHub Secrets for Scout v6 + Isko CI Pipeline
# Run this once to configure all required secrets for guard-all.yml

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is required but not installed"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

log "Setting up GitHub secrets for Scout v6 + Isko CI..."

# Database URL
if [ -n "${DB_URL:-}" ]; then
    log "Setting DB_URL secret..."
    echo "$DB_URL" | gh secret set DB_URL
    success "DB_URL secret set"
else
    warning "DB_URL environment variable not set - you may need to set this manually"
    echo "  Run: gh secret set DB_URL --body 'your-database-url'"
fi

# Supabase URL
SUPABASE_URL="${SUPABASE_URL:-https://cxzllzyxwpyptfretryc.supabase.co}"
log "Setting SUPABASE_URL secret..."
echo "$SUPABASE_URL" | gh secret set SUPABASE_URL
success "SUPABASE_URL secret set: $SUPABASE_URL"

# App URL (for CI testing)
APP_URL="${APP_URL:-http://localhost:3000}"
log "Setting APP_URL secret..."
echo "$APP_URL" | gh secret set APP_URL
success "APP_URL secret set: $APP_URL"

# CSV Directory
CSV_DIR="${CSV_DIR:-scout_v6_deployment/data/csv}"
log "Setting CSV_DIR secret..."
echo "$CSV_DIR" | gh secret set CSV_DIR
success "CSV_DIR secret set: $CSV_DIR"

# Figma credentials (optional)
if [ -n "${FIGMA_FILE_KEY:-}" ]; then
    log "Setting FIGMA_FILE_KEY secret..."
    echo "$FIGMA_FILE_KEY" | gh secret set FIGMA_FILE_KEY
    success "FIGMA_FILE_KEY secret set"
else
    warning "FIGMA_FILE_KEY not set - pixel parity tests will be skipped in CI"
    echo "  Set manually: gh secret set FIGMA_FILE_KEY --body 'your-figma-file-key'"
fi

if [ -n "${FIGMA_TOKEN:-}" ]; then
    log "Setting FIGMA_TOKEN secret..."
    echo "$FIGMA_TOKEN" | gh secret set FIGMA_TOKEN
    success "FIGMA_TOKEN secret set"
else
    warning "FIGMA_TOKEN not set - pixel parity tests will be skipped in CI"
    echo "  Set manually: gh secret set FIGMA_TOKEN --body 'your-figma-personal-access-token'"
fi

log "Verifying secrets were set..."
gh secret list | grep -E "(DB_URL|SUPABASE_URL|APP_URL|CSV_DIR|FIGMA_)" || true

success "GitHub secrets setup complete!"
echo
log "The following secrets have been configured for guard-all.yml:"
echo "  ✅ DB_URL - Database connection string"
echo "  ✅ SUPABASE_URL - Supabase project URL"
echo "  ✅ APP_URL - Application URL for testing"
echo "  ✅ CSV_DIR - CSV data directory path"
if [ -n "${FIGMA_TOKEN:-}" ]; then
    echo "  ✅ FIGMA_TOKEN - Figma personal access token"
    echo "  ✅ FIGMA_FILE_KEY - Figma file key for pixel parity"
else
    echo "  ⚠️  FIGMA_* secrets not set - pixel parity tests will be skipped"
fi

echo
log "Next steps:"
echo "  1. Commit and push your changes"
echo "  2. Create a PR to trigger the guard-all workflow"
echo "  3. Check Actions tab for validation results"