#!/bin/bash

# Migration Script: PoC to Production
# This script automates the migration of the PoC to the main repository

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BRANCH="legacy-backup-${TIMESTAMP}"
POC_DIR="pulser-poc"
TARGET_DIR="../../"  # Current js directory (where the old files are)
LOG_FILE="migration_${TIMESTAMP}.log"

# Functions
log() {
    echo -e "${2:-$BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# Pre-flight checks
preflight_check() {
    log "Running pre-flight checks..."
    
    # Check if we're in the poc directory
    if [[ ! -f "package.json" ]] || [[ ! -d "frontend" ]]; then
        error "Must run from pulser-poc directory"
    fi
    
    # Check if git is clean
    if [[ -n $(git status -s) ]]; then
        warning "Git working directory is not clean. Commit or stash changes first."
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check if main repo exists
    if [[ ! -d "$TARGET_DIR/.git" ]]; then
        error "Target directory is not a git repository"
    fi
    
    success "Pre-flight checks passed"
}

# Create backup of current main repo
create_backup() {
    log "Creating backup of current repository..."
    cd "$TARGET_DIR"
    
    # Create backup branch
    git checkout -b "$BACKUP_BRANCH"
    git add -A
    git commit -m "backup: Pre-migration snapshot ${TIMESTAMP}" || true
    git push origin "$BACKUP_BRANCH"
    
    # Return to main branch
    git checkout main
    
    success "Backup created in branch: $BACKUP_BRANCH"
    cd - > /dev/null
}

# Clean the main repository
clean_main_repo() {
    log "Cleaning main repository (preserving .git)..."
    cd "$TARGET_DIR"
    
    # Create a list of files to preserve
    cat > .preserve_list << EOF
.git
.gitignore
EOF
    
    # Remove everything except preserved files
    find . -mindepth 1 -maxdepth 1 ! -name '.git*' -exec rm -rf {} +
    
    success "Repository cleaned"
    cd - > /dev/null
}

# Copy PoC files to main repo
migrate_files() {
    log "Migrating PoC files to main repository..."
    
    # Copy all files except .git and scripts
    rsync -av --exclude='.git' \
              --exclude='scripts/migrate-*.sh' \
              --exclude='node_modules' \
              --exclude='dist' \
              --exclude='*.log' \
              . "$TARGET_DIR/"
    
    success "Files migrated successfully"
}

# Update configurations
update_configs() {
    log "Updating configurations..."
    cd "$TARGET_DIR"
    
    # Update package.json if needed
    if [[ -f "package.json" ]]; then
        # Add any production-specific scripts
        node -e "
        const pkg = require('./package.json');
        pkg.scripts = {
            ...pkg.scripts,
            'test': 'npm run test:frontend && npm run test:api',
            'test:frontend': 'cd frontend && npm test',
            'test:api': 'cd api && npm test',
            'ci': 'npm run lint && npm run test && npm run build'
        };
        require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
        "
    fi
    
    success "Configurations updated"
    cd - > /dev/null
}

# Commit the migration
commit_migration() {
    log "Committing migration..."
    cd "$TARGET_DIR"
    
    git add -A
    git commit -m "feat: migrate to clean monorepo structure

- Replaced legacy code with PoC foundation
- Added TypeScript, linting, and CI/CD
- Implemented Transaction Trends dashboard
- Full type safety with TypeScript
- Modern tooling: Vite, React 18, Azure Functions v4
- Automated deployment pipeline

Legacy code backed up in branch: $BACKUP_BRANCH

BREAKING CHANGE: Complete repository restructure" \
    -m "Migration details:
- Frontend: React + TypeScript + Vite
- API: Azure Functions with TypeScript
- CI/CD: GitHub Actions
- Linting: ESLint + Prettier
- Testing: Jest + React Testing Library (coming soon)"
    
    success "Migration committed"
    cd - > /dev/null
}

# Verify the migration
verify_migration() {
    log "Verifying migration..."
    cd "$TARGET_DIR"
    
    # Check critical files exist
    local required_files=(
        "package.json"
        "frontend/package.json"
        "api/package.json"
        ".github/workflows/poc.yml"
        "README.md"
        ".gitignore"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Required file missing: $file"
        fi
    done
    
    # Try to install dependencies
    log "Installing dependencies..."
    npm install
    
    success "Migration verified"
    cd - > /dev/null
}

# Main execution
main() {
    log "=== PoC to Production Migration Script ==="
    log "Timestamp: ${TIMESTAMP}"
    
    # Confirmation
    warning "This will replace the entire main repository with the PoC code!"
    warning "A backup will be created, but this is a destructive operation."
    read -p "Are you sure you want to continue? Type 'migrate' to proceed: " -r
    echo
    
    if [[ "$REPLY" != "migrate" ]]; then
        error "Migration cancelled"
    fi
    
    # Run migration steps
    preflight_check
    create_backup
    clean_main_repo
    migrate_files
    update_configs
    commit_migration
    verify_migration
    
    # Final instructions
    success "=== Migration Complete! ==="
    log ""
    log "Next steps:"
    log "1. Review the changes: cd $TARGET_DIR && git diff HEAD~1"
    log "2. Push to remote: git push origin main"
    log "3. Update CI/CD secrets in GitHub"
    log "4. Test deployment pipeline"
    log "5. Notify team of the migration"
    log ""
    log "Rollback command (if needed):"
    log "  cd $TARGET_DIR && git checkout $BACKUP_BRANCH && git checkout -b main-rollback"
    log ""
    log "Migration log saved to: $LOG_FILE"
}

# Run main function
main "$@"