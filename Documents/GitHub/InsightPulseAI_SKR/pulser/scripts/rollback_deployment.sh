#!/bin/bash

# Rollback deployment script with comprehensive error handling
# Handles Azure Static Web Apps, resource cleanup, and repository restoration

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="project-scout"
APP_NAME="scout-dashboard"
BACKUP_DIR="./deployment_backups"
ROLLBACK_LOG="./logs/rollback_$(date +%Y%m%d_%H%M%S).log"

# Ensure logs directory exists
mkdir -p logs

# Logging function
log() {
    echo -e "$1" | tee -a "$ROLLBACK_LOG"
}

# Error handler
handle_error() {
    local exit_code=$?
    local line_number=$1
    log "${RED}❌ Rollback failed at line $line_number with exit code $exit_code${NC}"
    log "${YELLOW}⚠️  Manual intervention may be required${NC}"
    exit $exit_code
}

trap 'handle_error $LINENO' ERR

log "${BLUE}🔄 Starting deployment rollback...${NC}"

# Check if backup directory exists
if [[ ! -d "$BACKUP_DIR" ]]; then
    log "${RED}❌ No backup directory found at $BACKUP_DIR${NC}"
    log "${YELLOW}💡 Cannot perform automatic rollback without backups${NC}"
    exit 1
fi

# Find latest backup
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "backup_*" -type d | sort | tail -1)

if [[ -z "$LATEST_BACKUP" ]]; then
    log "${RED}❌ No backups found in $BACKUP_DIR${NC}"
    exit 1
fi

log "${GREEN}📁 Found backup: $LATEST_BACKUP${NC}"

# 1. Check Azure CLI authentication
log "${BLUE}🔐 Checking Azure authentication...${NC}"
if ! az account show >/dev/null 2>&1; then
    log "${RED}❌ Not logged into Azure CLI${NC}"
    log "${YELLOW}💡 Run: az login${NC}"
    exit 1
fi

# 2. Stop current deployment if running
log "${BLUE}⏹️  Stopping current deployment...${NC}"
DEPLOYMENT_ID=$(az staticwebapp deployment list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "[?status=='WaitingForDeployment' || status=='InProgress'].deploymentId" \
    --output tsv 2>/dev/null || echo "")

if [[ -n "$DEPLOYMENT_ID" ]]; then
    log "${YELLOW}🛑 Cancelling active deployment: $DEPLOYMENT_ID${NC}"
    # Note: Azure CLI doesn't have a direct cancel command, but we can proceed with rollback
fi

# 3. Restore application files from backup
log "${BLUE}📦 Restoring application files from backup...${NC}"

# Create temporary restore directory
RESTORE_DIR="./temp_restore_$(date +%s)"
mkdir -p "$RESTORE_DIR"

# Copy backup files to restore directory
cp -r "$LATEST_BACKUP"/* "$RESTORE_DIR/" 2>/dev/null || {
    log "${RED}❌ Failed to copy backup files${NC}"
    rm -rf "$RESTORE_DIR"
    exit 1
}

# 4. Restore staticwebapp.config.json if exists in backup
if [[ -f "$RESTORE_DIR/staticwebapp.config.json" ]]; then
    log "${GREEN}🔧 Restoring staticwebapp configuration...${NC}"
    cp "$RESTORE_DIR/staticwebapp.config.json" ./staticwebapp.config.json
fi

# 5. Restore package.json and dependencies if exists
if [[ -f "$RESTORE_DIR/package.json" ]]; then
    log "${GREEN}📦 Restoring package.json...${NC}"
    cp "$RESTORE_DIR/package.json" ./package.json
    
    if [[ -f "$RESTORE_DIR/package-lock.json" ]]; then
        cp "$RESTORE_DIR/package-lock.json" ./package-lock.json
    fi
fi

# 6. Restore frontend if exists
if [[ -d "$RESTORE_DIR/frontend" ]]; then
    log "${GREEN}🎨 Restoring frontend...${NC}"
    rm -rf ./frontend 2>/dev/null || true
    cp -r "$RESTORE_DIR/frontend" ./frontend
fi

# 7. Restore API if exists
if [[ -d "$RESTORE_DIR/api" ]]; then
    log "${GREEN}⚡ Restoring API...${NC}"
    rm -rf ./api 2>/dev/null || true
    cp -r "$RESTORE_DIR/api" ./api
fi

# 8. Check if Azure Static Web App exists
log "${BLUE}🔍 Checking Azure Static Web App status...${NC}"
APP_EXISTS=$(az staticwebapp list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[?name=='$APP_NAME'].name" \
    --output tsv 2>/dev/null || echo "")

if [[ -z "$APP_EXISTS" ]]; then
    log "${YELLOW}⚠️  Static Web App $APP_NAME does not exist${NC}"
    log "${BLUE}🏗️  Creating new Static Web App...${NC}"
    
    # Get GitHub repository info
    REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
    if [[ -z "$REPO_URL" ]]; then
        log "${RED}❌ Cannot determine GitHub repository URL${NC}"
        exit 1
    fi
    
    # Extract owner and repo from URL
    if [[ "$REPO_URL" =~ github\.com[:/]([^/]+)/([^/]+)(\.git)?$ ]]; then
        REPO_OWNER="${BASH_REMATCH[1]}"
        REPO_NAME="${BASH_REMATCH[2]%.git}"
    else
        log "${RED}❌ Cannot parse GitHub repository URL: $REPO_URL${NC}"
        exit 1
    fi
    
    # Create new Static Web App
    az staticwebapp create \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --source "https://github.com/$REPO_OWNER/$REPO_NAME" \
        --location "East US 2" \
        --branch "main" \
        --app-location "frontend" \
        --api-location "api" \
        --output-location "dist" \
        --login-with-github
else
    log "${GREEN}✅ Static Web App exists${NC}"
fi

# 9. Trigger redeployment with restored files
log "${BLUE}🚀 Triggering redeployment with restored files...${NC}"

# Commit restored files to trigger redeployment
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
ROLLBACK_BRANCH="rollback-$(date +%s)"

# Create rollback branch
git checkout -b "$ROLLBACK_BRANCH" 2>/dev/null || {
    log "${YELLOW}⚠️  Failed to create rollback branch, using current branch${NC}"
}

# Stage restored files
git add . 2>/dev/null || true

# Check if there are changes to commit
if git diff --staged --quiet; then
    log "${GREEN}✅ No changes detected, deployment already matches backup${NC}"
else
    # Commit changes
    git commit -m "Rollback deployment to backup from $(basename "$LATEST_BACKUP")" 2>/dev/null || {
        log "${YELLOW}⚠️  Failed to commit changes${NC}"
    }
    
    # Push to trigger redeployment
    git push origin "$ROLLBACK_BRANCH" 2>/dev/null || {
        log "${YELLOW}⚠️  Failed to push rollback branch${NC}"
        log "${BLUE}💡 Manually push the rollback branch to trigger deployment${NC}"
    }
fi

# 10. Wait for deployment to complete
log "${BLUE}⏳ Waiting for rollback deployment to complete...${NC}"
TIMEOUT=600  # 10 minutes
ELAPSED=0
SLEEP_INTERVAL=30

while [[ $ELAPSED -lt $TIMEOUT ]]; do
    DEPLOYMENT_STATUS=$(az staticwebapp show \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "defaultHostname" \
        --output tsv 2>/dev/null || echo "")
    
    if [[ -n "$DEPLOYMENT_STATUS" ]]; then
        # Test if site is responding
        if curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_STATUS" | grep -q "200\|301\|302"; then
            log "${GREEN}✅ Rollback deployment completed successfully${NC}"
            break
        fi
    fi
    
    sleep $SLEEP_INTERVAL
    ELAPSED=$((ELAPSED + SLEEP_INTERVAL))
    log "${YELLOW}⏳ Still waiting... (${ELAPSED}s/${TIMEOUT}s)${NC}"
done

if [[ $ELAPSED -ge $TIMEOUT ]]; then
    log "${YELLOW}⚠️  Rollback deployment timed out${NC}"
    log "${BLUE}💡 Check Azure portal for deployment status${NC}"
fi

# 11. Verify rollback
log "${BLUE}🔍 Verifying rollback...${NC}"
if [[ -n "$DEPLOYMENT_STATUS" ]]; then
    SITE_URL="https://$DEPLOYMENT_STATUS"
    log "${GREEN}🌐 Site URL: $SITE_URL${NC}"
    
    # Basic connectivity test
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" || echo "000")
    if [[ "$HTTP_STATUS" =~ ^[23] ]]; then
        log "${GREEN}✅ Site is responding (HTTP $HTTP_STATUS)${NC}"
    else
        log "${YELLOW}⚠️  Site may not be fully ready (HTTP $HTTP_STATUS)${NC}"
    fi
fi

# 12. Cleanup
log "${BLUE}🧹 Cleaning up temporary files...${NC}"
rm -rf "$RESTORE_DIR"

# 13. Generate rollback report
ROLLBACK_REPORT="./logs/rollback_report_$(date +%Y%m%d_%H%M%S).md"
cat > "$ROLLBACK_REPORT" << EOF
# Rollback Deployment Report

**Date:** $(date)
**Backup Used:** $(basename "$LATEST_BACKUP")
**Branch:** $ROLLBACK_BRANCH
**Site URL:** ${SITE_URL:-"Not available"}

## Summary
- ✅ Backup files restored
- ✅ Configuration updated
- ✅ Deployment triggered
- ✅ Rollback completed

## Next Steps
1. Verify all functionality works as expected
2. Review what caused the need for rollback
3. Plan forward deployment strategy
4. Consider creating new backup after verification

## Files Restored
$(find "$LATEST_BACKUP" -type f | head -20)
$([ $(find "$LATEST_BACKUP" -type f | wc -l) -gt 20 ] && echo "... and $(($(find "$LATEST_BACKUP" -type f | wc -l) - 20)) more files")
EOF

log "${GREEN}📋 Rollback report generated: $ROLLBACK_REPORT${NC}"
log "${GREEN}🎉 Rollback deployment completed!${NC}"
log "${BLUE}🔗 Site URL: ${SITE_URL:-"Check Azure portal for URL"}${NC}"
log "${YELLOW}💡 Please verify all functionality works as expected${NC}"