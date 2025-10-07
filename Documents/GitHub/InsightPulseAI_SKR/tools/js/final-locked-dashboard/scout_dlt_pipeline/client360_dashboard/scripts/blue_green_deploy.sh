#!/bin/bash
# Blue-Green Deployment script for Client360 Dashboard

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define the standard deployment source branch
MIRROR_BRANCH="feature-dashboard"

# Get environment from command line argument
ENVIRONMENT=${1:-"production"}

# Set resource names based on environment
case $ENVIRONMENT in
  "production")
    RG="scout-dashboard"
    APP="tbwa-client360-dashboard-production"
    SLOT_BLUE="blue"
    SLOT_GREEN="green"
    ;;
  *)
    echo -e "${RED}Invalid environment: $ENVIRONMENT. Only production is supported for blue-green deployment.${NC}"
    exit 1
    ;;
esac

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/blue_green_deploy_${ENVIRONMENT}_${TIMESTAMP}.log"
REPORT_FILE="reports/blue_green_deploy_${ENVIRONMENT}_${TIMESTAMP}.md"

# Create logs directory if it doesn't exist
mkdir -p logs
mkdir -p reports

echo -e "${YELLOW}Starting Blue-Green Deployment for $ENVIRONMENT...${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Deployment timestamp: $(date)${NC}" | tee -a "$LOG_FILE"

# Helper function for logging
log() {
  echo -e "${YELLOW}$1${NC}" | tee -a "$LOG_FILE"
}

# 1. Determine which slot (blue or green) is currently active
log "Determining active slot..."
ACTIVE_SLOT="blue"  # Default assumption
INACTIVE_SLOT="green"

# Check if the slots exist and determine which is active
if az staticwebapp environment list --name "$APP" --resource-group "$RG" --query "[?name=='$SLOT_BLUE']" -o tsv 2>/dev/null; then
  log "Found blue slot"
  if az staticwebapp environment list --name "$APP" --resource-group "$RG" --query "[?name=='$SLOT_GREEN']" -o tsv 2>/dev/null; then
    log "Found green slot"
    
    # Determine active slot based on production traffic
    PROD_SLOT=$(az staticwebapp environment list --name "$APP" --resource-group "$RG" --query "[?name=='production'].id" -o tsv)
    BLUE_SLOT=$(az staticwebapp environment list --name "$APP" --resource-group "$RG" --query "[?name=='$SLOT_BLUE'].id" -o tsv)
    
    if [ "$PROD_SLOT" = "$BLUE_SLOT" ]; then
      ACTIVE_SLOT="blue"
      INACTIVE_SLOT="green"
    else
      ACTIVE_SLOT="green"
      INACTIVE_SLOT="blue"
    fi
  else
    log "Green slot does not exist, creating it..."
    az staticwebapp environment create --name "$APP" --resource-group "$RG" --environment-name "$SLOT_GREEN"
    ACTIVE_SLOT="blue"
    INACTIVE_SLOT="green"
  fi
else
  log "Blue slot does not exist, creating both slots..."
  az staticwebapp environment create --name "$APP" --resource-group "$RG" --environment-name "$SLOT_BLUE"
  az staticwebapp environment create --name "$APP" --resource-group "$RG" --environment-name "$SLOT_GREEN"
  ACTIVE_SLOT="blue"
  INACTIVE_SLOT="green"
fi

log "Active slot: $ACTIVE_SLOT"
log "Inactive slot: $INACTIVE_SLOT"

# 2. Deploy to the inactive slot
log "Deploying to $INACTIVE_SLOT slot..."
./scripts/deploy_to_azure.sh "$ENVIRONMENT" "$INACTIVE_SLOT"

# 3. Run smoke tests on the inactive slot
log "Running smoke tests on $INACTIVE_SLOT slot..."
INACTIVE_SLOT_URL=$(az staticwebapp environment show --name "$APP" --resource-group "$RG" --environment-name "$INACTIVE_SLOT" --query "hostName" -o tsv)
if [ -z "$INACTIVE_SLOT_URL" ]; then
  log "Failed to get URL for $INACTIVE_SLOT slot"
  exit 1
fi

log "Inactive slot URL: https://$INACTIVE_SLOT_URL"
SMOKE_TEST_RESULT=0
if ./scripts/run_smoke_tests.sh "$ENVIRONMENT-$INACTIVE_SLOT"; then
  log "Smoke tests passed on $INACTIVE_SLOT slot"
else
  SMOKE_TEST_RESULT=1
  log "Smoke tests failed on $INACTIVE_SLOT slot"
  # Ask for confirmation before proceeding
  read -p "Smoke tests failed. Do you want to proceed with the deployment? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Deployment aborted by user"
    exit 1
  fi
fi

# 4. Swap slots to make the inactive slot live
log "Swapping $INACTIVE_SLOT slot to production..."
az staticwebapp environment swap --name "$APP" --resource-group "$RG" --source production --target "$INACTIVE_SLOT"

# 5. Verify the swap
log "Verifying the swap..."
PROD_SLOT_AFTER_SWAP=$(az staticwebapp environment list --name "$APP" --resource-group "$RG" --query "[?name=='production'].id" -o tsv)
NEW_SLOT_ID=$(az staticwebapp environment list --name "$APP" --resource-group "$RG" --query "[?name=='$INACTIVE_SLOT'].id" -o tsv)

if [ "$PROD_SLOT_AFTER_SWAP" = "$NEW_SLOT_ID" ]; then
  log "Slot swap verification failed. Production is not pointing to the expected slot."
  SWAP_VERIFIED=1
else
  log "Slot swap verified successfully."
  SWAP_VERIFIED=0
fi

# 6. Run smoke tests on production after swap
log "Running smoke tests on production after swap..."
if ./scripts/run_smoke_tests.sh "$ENVIRONMENT"; then
  log "Smoke tests passed on production after swap"
  PROD_SMOKE_TEST_RESULT=0
else
  log "Smoke tests failed on production after swap"
  PROD_SMOKE_TEST_RESULT=1
  
  # Prompt for rollback if tests fail
  read -p "Production smoke tests failed. Do you want to rollback to the previous deployment? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Rolling back to previous deployment..."
    az staticwebapp environment swap --name "$APP" --resource-group "$RG" --source production --target "$ACTIVE_SLOT"
    log "Rollback complete. Production is now back to $ACTIVE_SLOT slot."
    exit 1
  fi
fi

# 7. Create deployment record
cat > "$REPORT_FILE" << EOF
# Blue-Green Deployment Report: $ENVIRONMENT

## Summary
- **Environment**: $ENVIRONMENT
- **Deployment Date**: $(date)
- **From Slot**: $ACTIVE_SLOT
- **To Slot**: $INACTIVE_SLOT
- **Build Version**: $(cat deploy/version.json 2>/dev/null || echo "N/A")
- **Deployment Status**: $(if [ $SMOKE_TEST_RESULT -eq 0 ] && [ $PROD_SMOKE_TEST_RESULT -eq 0 ]; then echo "✅ SUCCESS"; else echo "⚠️ COMPLETED WITH WARNINGS"; fi)

## Deployment Steps
1. Determined active slot: $ACTIVE_SLOT
2. Deployed to inactive slot: $INACTIVE_SLOT
3. Ran smoke tests on $INACTIVE_SLOT: $(if [ $SMOKE_TEST_RESULT -eq 0 ]; then echo "✅ PASSED"; else echo "⚠️ FAILED"; fi)
4. Swapped $INACTIVE_SLOT to production
5. Verified slot swap: $(if [ $SWAP_VERIFIED -eq 0 ]; then echo "✅ SUCCESS"; else echo "⚠️ FAILED"; fi)
6. Ran smoke tests on production: $(if [ $PROD_SMOKE_TEST_RESULT -eq 0 ]; then echo "✅ PASSED"; else echo "⚠️ FAILED"; fi)

## Inactive Slot URL
- https://$INACTIVE_SLOT_URL

## Logs
- Deployment log: $LOG_FILE
- Smoke test logs: logs/smoke_test_${ENVIRONMENT}_*.log
- Smoke test logs (inactive slot): logs/smoke_test_${ENVIRONMENT}-${INACTIVE_SLOT}_*.log

## Rollback Information
To rollback this deployment, run:
\`\`\`
az staticwebapp environment swap --name "$APP" --resource-group "$RG" --source production --target "$ACTIVE_SLOT"
\`\`\`
EOF

echo -e "${YELLOW}===================================${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}Blue-Green Deployment Results: $ENVIRONMENT ${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}===================================${NC}" | tee -a "$LOG_FILE"

if [ $SMOKE_TEST_RESULT -eq 0 ] && [ $PROD_SMOKE_TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ Deployment successful!${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${YELLOW}⚠️ Deployment completed with warnings!${NC}" | tee -a "$LOG_FILE"
fi

echo -e "${GREEN}Report saved to: $REPORT_FILE${NC}" | tee -a "$LOG_FILE"

# Exit with success even if there were warnings
exit 0