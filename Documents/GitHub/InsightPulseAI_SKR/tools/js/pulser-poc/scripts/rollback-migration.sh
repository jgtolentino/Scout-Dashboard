#!/bin/bash

# Rollback Script: Emergency rollback for failed migrations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Main rollback function
rollback() {
    log "=== Emergency Rollback Script ==="
    
    # Get the latest backup branch
    cd ../
    BACKUP_BRANCH=$(git branch -r | grep "origin/legacy-backup-" | sort -r | head -n1 | xargs)
    
    if [[ -z "$BACKUP_BRANCH" ]]; then
        error "No backup branch found!"
    fi
    
    warning "This will rollback to: $BACKUP_BRANCH"
    read -p "Continue? (yes/no) " -r
    
    if [[ "$REPLY" != "yes" ]]; then
        error "Rollback cancelled"
    fi
    
    # Perform rollback
    log "Starting rollback..."
    
    # Stash any current changes
    git stash -u || true
    
    # Checkout backup branch
    git fetch origin
    git checkout "${BACKUP_BRANCH#origin/}"
    
    # Create new main branch from backup
    git checkout -b main-rollback
    
    # Force update main (dangerous!)
    warning "About to force-push to main branch!"
    read -p "Type 'ROLLBACK' to confirm: " -r
    
    if [[ "$REPLY" == "ROLLBACK" ]]; then
        git push origin main-rollback:main --force-with-lease
        log "Rollback complete!"
        log ""
        log "Next steps:"
        log "1. Update Azure Static Web Apps to point to main branch"
        log "2. Notify team of rollback"
        log "3. Investigate what went wrong"
    else
        error "Rollback cancelled"
    fi
}

# Run rollback
rollback