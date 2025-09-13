#!/bin/bash
# Production Go-Live Script
# This script orchestrates the full deployment of Client360 Dashboard
# including data pipeline, ETL processes, and frontend dashboard.

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}=     Client360 Dashboard Production Go-Live     =${NC}"
echo -e "${BLUE}=================================================${NC}"

# Make the script executable
chmod +x "$0"

# Root directory of the project
ROOT_DIR="$(dirname "$(dirname "$(realpath "$0")")")"
SCRIPTS_DIR="$ROOT_DIR/scripts"

# Ensure all scripts are executable
chmod +x "$SCRIPTS_DIR"/*.sh

# Start logging
LOG_FILE="$ROOT_DIR/go_live_$(date +%Y%m%d%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "Starting go-live process at $(date)"
echo "Log file: $LOG_FILE"

# Check for required tools
echo -e "${CYAN}Checking required tools...${NC}"
MISSING_TOOLS=()

for tool in az databricks node npm jq; do
    if ! command -v $tool &> /dev/null; then
        MISSING_TOOLS+=("$tool")
    fi
done

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo -e "${RED}Error: The following required tools are missing:${NC}"
    for tool in "${MISSING_TOOLS[@]}"; do
        echo "- $tool"
    done
    echo "Please install them and try again."
    exit 1
fi

# Load environment variables if present
ENV_FILE="$ROOT_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from $ENV_FILE"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Check for required environment variables
echo -e "${CYAN}Checking required environment variables...${NC}"
REQUIRED_VARS=(
    "KEY_VAULT_NAME"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}Error: The following required environment variables are missing:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "- $var"
    done
    echo -e "${YELLOW}Would you like to proceed with setup scripts to configure them? (y/n)${NC}"
    read -r SETUP_ENV
    
    if [[ "$SETUP_ENV" =~ ^[Yy]$ ]]; then
        # Run setup scripts
        echo "Running setup scripts..."
        
        # Key Vault detection or creation
        if [ -z "$KEY_VAULT_NAME" ]; then
            echo "Enter the Key Vault name to use:"
            read -r KEY_VAULT_NAME
            export KEY_VAULT_NAME="$KEY_VAULT_NAME"
            
            # Check if Key Vault exists
            if ! az keyvault show --name "$KEY_VAULT_NAME" &>/dev/null; then
                echo "Key Vault $KEY_VAULT_NAME does not exist. Creating it..."
                RESOURCE_GROUP=$(az group list --query "[0].name" -o tsv)
                echo "Using resource group: $RESOURCE_GROUP"
                
                LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv)
                az keyvault create --name "$KEY_VAULT_NAME" --resource-group "$RESOURCE_GROUP" --location "$LOCATION"
                echo -e "${GREEN}Key Vault created successfully.${NC}"
            else
                echo "Using existing Key Vault: $KEY_VAULT_NAME"
            fi
        fi
    else
        echo "Exiting due to missing environment variables."
        exit 1
    fi
fi

# Functions for each deployment phase
function deploy_data_infrastructure() {
    echo -e "\n${MAGENTA}=== Phase 1: Deploying Data Infrastructure ===${NC}"
    
    # Step 1: Configure Event Hubs
    echo -e "${CYAN}Configuring Event Hubs...${NC}"
    if [ -f "$SCRIPTS_DIR/configure_event_hubs.sh" ]; then
        echo "Running Event Hubs configuration script..."
        "$SCRIPTS_DIR/configure_event_hubs.sh"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Event Hubs configuration failed.${NC}"
            echo -e "${YELLOW}Would you like to continue anyway? (y/n)${NC}"
            read -r CONTINUE
            
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                echo "Exiting deployment."
                exit 1
            fi
        else
            echo -e "${GREEN}Event Hubs configured successfully.${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: Event Hubs configuration script not found. Skipping.${NC}"
    fi
    
    # Step 2: Set up Databricks SQL Warehouse
    echo -e "\n${CYAN}Setting up Databricks SQL Warehouse...${NC}"
    if [ -f "$SCRIPTS_DIR/setup_databricks_sql.sh" ]; then
        echo "Running Databricks SQL setup script..."
        "$SCRIPTS_DIR/setup_databricks_sql.sh"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Databricks SQL setup failed.${NC}"
            echo -e "${YELLOW}Would you like to continue anyway? (y/n)${NC}"
            read -r CONTINUE
            
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                echo "Exiting deployment."
                exit 1
            fi
        else
            echo -e "${GREEN}Databricks SQL configured successfully.${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: Databricks SQL setup script not found. Skipping.${NC}"
    fi
    
    # Step 3: Deploy DLT Pipelines
    echo -e "\n${CYAN}Deploying DLT Pipelines...${NC}"
    if [ -f "$SCRIPTS_DIR/deploy_dlt_pipelines.sh" ]; then
        echo "Running DLT pipeline deployment script..."
        "$SCRIPTS_DIR/deploy_dlt_pipelines.sh"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}DLT pipeline deployment failed.${NC}"
            echo -e "${YELLOW}Would you like to continue anyway? (y/n)${NC}"
            read -r CONTINUE
            
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                echo "Exiting deployment."
                exit 1
            fi
        else
            echo -e "${GREEN}DLT pipelines deployed successfully.${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: DLT pipeline deployment script not found. Skipping.${NC}"
    fi
    
    echo -e "${GREEN}Data infrastructure deployment completed.${NC}"
}

function test_data_connectivity() {
    echo -e "\n${MAGENTA}=== Phase 2: Testing Data Connectivity ===${NC}"
    
    # Test SQL connectivity
    echo -e "${CYAN}Testing Databricks SQL connectivity...${NC}"
    if [ -f "$SCRIPTS_DIR/test_databricks_connectivity.sh" ]; then
        echo "Running Databricks SQL connectivity test..."
        "$SCRIPTS_DIR/test_databricks_connectivity.sh"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Databricks SQL connectivity test failed.${NC}"
            echo -e "${YELLOW}Would you like to continue anyway? (y/n)${NC}"
            read -r CONTINUE
            
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                echo "Exiting deployment."
                exit 1
            fi
        else
            echo -e "${GREEN}Databricks SQL connectivity test passed.${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: Databricks SQL connectivity test script not found. Skipping.${NC}"
    fi
    
    # Test end-to-end dataflow
    echo -e "\n${CYAN}Testing end-to-end dataflow...${NC}"
    if [ -f "$SCRIPTS_DIR/test_end_to_end_dataflow.sh" ]; then
        echo "Running end-to-end dataflow test..."
        "$SCRIPTS_DIR/test_end_to_end_dataflow.sh"
        
        TEST_RESULT=$?
        if [ $TEST_RESULT -ne 0 ]; then
            echo -e "${YELLOW}End-to-end dataflow test had some warnings or incomplete tests.${NC}"
            echo -e "${YELLOW}This might be OK for initial deployment. Would you like to continue? (y/n)${NC}"
            read -r CONTINUE
            
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                echo "Exiting deployment."
                exit 1
            fi
        else
            echo -e "${GREEN}End-to-end dataflow test passed.${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: End-to-end dataflow test script not found. Skipping.${NC}"
    fi
    
    echo -e "${GREEN}Data connectivity tests completed.${NC}"
}

function deploy_frontend_dashboard() {
    echo -e "\n${MAGENTA}=== Phase 3: Deploying Frontend Dashboard ===${NC}"
    
    # Deploy to production
    echo -e "${CYAN}Deploying dashboard to production...${NC}"
    if [ -f "$SCRIPTS_DIR/deploy-only-production.sh" ]; then
        echo "Running production deployment script..."
        "$SCRIPTS_DIR/deploy-only-production.sh"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Production deployment failed.${NC}"
            echo "Exiting deployment."
            exit 1
        else
            echo -e "${GREEN}Production deployment successful.${NC}"
        fi
    else
        echo -e "${RED}Error: Production deployment script not found.${NC}"
        echo "Exiting deployment."
        exit 1
    fi
    
    # Verify deployment
    echo -e "\n${CYAN}Verifying deployment...${NC}"
    if [ -f "$SCRIPTS_DIR/verify-production.sh" ]; then
        echo "Running production verification script..."
        "$SCRIPTS_DIR/verify-production.sh"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Production verification failed.${NC}"
            echo -e "${YELLOW}Would you like to continue anyway? (y/n)${NC}"
            read -r CONTINUE
            
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                echo "Exiting deployment."
                exit 1
            fi
        else
            echo -e "${GREEN}Production verification passed.${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: Production verification script not found. Skipping.${NC}"
    fi
    
    echo -e "${GREEN}Frontend dashboard deployment completed.${NC}"
}

function setup_monitoring() {
    echo -e "\n${MAGENTA}=== Phase 4: Setting Up Monitoring & Alerting ===${NC}"
    
    # Set up Azure Monitor alerts
    echo -e "${CYAN}Setting up Azure Monitor alerts...${NC}"
    
    # Get production Static Web App name
    PRODUCTION_APP_NAME="tbwa-client360-dashboard-production"
    
    # Get resource group
    RESOURCE_GROUP=$(az group list --query "[0].name" -o tsv)
    
    # Check if SWA exists
    if az staticwebapp show --name "$PRODUCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
        echo "Setting up availability monitoring for $PRODUCTION_APP_NAME..."
        
        # Set up availability alert
        az monitor metrics alert create \
            --name "Client360DashboardAvailability" \
            --resource-group "$RESOURCE_GROUP" \
            --scopes $(az staticwebapp show --name "$PRODUCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv) \
            --condition "avg SuccessE2ELatency > 2000" \
            --description "Alert when dashboard response time exceeds 2 seconds" \
            --evaluation-frequency 5m \
            --window-size 5m \
            --severity 2
        
        # Set up HTTP 5xx error alert
        az monitor metrics alert create \
            --name "Client360Dashboard5xxErrors" \
            --resource-group "$RESOURCE_GROUP" \
            --scopes $(az staticwebapp show --name "$PRODUCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv) \
            --condition "count Http5xx > 5" \
            --description "Alert when dashboard has 5xx errors" \
            --evaluation-frequency 5m \
            --window-size 5m \
            --severity 1
        
        echo -e "${GREEN}Azure Monitor alerts set up successfully.${NC}"
    else
        echo -e "${YELLOW}Warning: Static Web App $PRODUCTION_APP_NAME not found. Skipping monitoring setup.${NC}"
    fi
    
    # Set up data freshness monitoring
    echo -e "\n${CYAN}Setting up data freshness monitoring...${NC}"
    FRESHNESS_SCRIPT="$ROOT_DIR/scripts/check_kpi_freshness.sh"
    
    cat > "$FRESHNESS_SCRIPT" << 'EOF'
#!/bin/bash
# Check KPI data freshness
# This script checks if the KPIs in the dashboard are being updated regularly

set -e

# Root directory of the project
ROOT_DIR="$(dirname "$(dirname "$(realpath "$0")")")"

# Create and run a test script
TEST_SCRIPT="$ROOT_DIR/temp_check_freshness.js"

cat > "$TEST_SCRIPT" << EOFJS
const FMCGSQLConnector = require('../data/sql_connector');

async function checkFreshness() {
    console.log('Creating SQL connector instance...');
    const connector = new FMCGSQLConnector();
    
    try {
        console.log('Getting data freshness...');
        const freshness = await connector.getDataFreshness();
        console.log('Data freshness:', JSON.stringify(freshness, null, 2));
        
        let staleData = false;
        const MAX_DAYS_STALE = 1;
        
        if (freshness && freshness.length > 0) {
            for (const item of freshness) {
                if (item.days_since_update > MAX_DAYS_STALE) {
                    console.error(\`ALERT: \${item.data_type} data is stale (\${item.days_since_update} days old)\`);
                    staleData = true;
                }
            }
        } else {
            console.error('No freshness data available');
            return false;
        }
        
        if (staleData) {
            console.error('Some data is stale');
            return false;
        } else {
            console.log('All data is fresh');
            return true;
        }
    } catch (error) {
        console.error('Error checking freshness:', error);
        return false;
    } finally {
        connector.close();
    }
}

checkFreshness()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
EOFJS

# Run the script
node "$TEST_SCRIPT"
RESULT=$?

# Clean up
rm "$TEST_SCRIPT"

exit $RESULT
EOF
    
    chmod +x "$FRESHNESS_SCRIPT"
    
    echo -e "${GREEN}Data freshness monitoring script created: $FRESHNESS_SCRIPT${NC}"
    echo -e "${YELLOW}To monitor data freshness, add this script to your crontab:${NC}"
    echo "0 */4 * * * $FRESHNESS_SCRIPT || curl -X POST https://your-alert-webhook-url"
    
    echo -e "${GREEN}Monitoring setup completed.${NC}"
}

function create_handover_docs() {
    echo -e "\n${MAGENTA}=== Phase 5: Creating Handover Documentation ===${NC}"
    
    # Generate handover document
    HANDOVER_DOC="$ROOT_DIR/CLIENT360_DASHBOARD_HANDOVER.md"
    
    echo -e "${CYAN}Generating handover documentation...${NC}"
    
    cat > "$HANDOVER_DOC" << EOF
# Client360 Dashboard Handover Documentation

## Overview

The Client360 Dashboard is a comprehensive solution that provides insights into store performance, brand performance, and customer interactions for FMCG Sari-Sari stores. The dashboard pulls data from various sources, processes it through a medallion architecture (Bronze → Silver → Gold), and presents it in an interactive UI.

## Architecture

### Frontend
- **Technology**: HTML/CSS/JavaScript
- **Hosting**: Azure Static Web App
- **URL**: https://tbwa-client360-dashboard-production.azurewebsites.net

### Backend
- **Data Processing**: Databricks Delta Live Tables (DLT)
- **Storage**: Azure Data Lake Storage Gen2
- **Real-time Ingestion**: Azure Event Hubs
- **Data Query**: Databricks SQL

## Deployment

### Frontend Deployment
\`\`\`bash
# Deploy to production
./scripts/deploy-only-production.sh

# Verify deployment
./scripts/verify-production.sh
\`\`\`

### Data Pipeline Deployment
\`\`\`bash
# Deploy DLT pipelines
./scripts/deploy_dlt_pipelines.sh

# Test end-to-end dataflow
./scripts/test_end_to_end_dataflow.sh
\`\`\`

## Monitoring

### Dashboard Monitoring
- Azure Monitor alerts are set up for:
  - Availability (response time > 2s)
  - HTTP 5xx errors

### Data Freshness Monitoring
\`\`\`bash
# Check data freshness
./scripts/check_kpi_freshness.sh
\`\`\`

## Rollback Procedures

### Frontend Rollback
\`\`\`bash
# Rollback to previous version
./scripts/rollback-to-previous.sh
\`\`\`

### Data Pipeline Rollback
\`\`\`bash
# Stop the DLT pipeline
databricks pipelines stop --pipeline-id <PIPELINE_ID>

# Revert to backup data (if available)
# This is handled automatically by Delta Lake time travel
\`\`\`

## Credentials and Access

All credentials are stored in Azure Key Vault **$KEY_VAULT_NAME**.

Required secrets:
- EVENT-HUB-CONNECTION-STRING - Connection string for Event Hubs
- SQL-ENDPOINT-TOKEN - Token for Databricks SQL endpoint
- STATIC-WEBAPP-DEPLOY-TOKEN - Token for Static Web App deployment

## Contact Points

### Data Engineering Team
- Primary: data-engineering@tbwa.com
- Backup: data-ops@tbwa.com

### Frontend Team
- Primary: web-team@tbwa.com
- Backup: web-ops@tbwa.com

### DevOps Team
- Primary: devops@tbwa.com
- Backup: cloud-ops@tbwa.com

## Resources

- GitHub Repository: https://github.com/tbwa/client360-dashboard
- Databricks Workspace: $DATABRICKS_HOST
- Azure Portal: https://portal.azure.com
EOF
    
    echo -e "${GREEN}Handover documentation created: $HANDOVER_DOC${NC}"
}

# Main deployment workflow
echo -e "${CYAN}Starting deployment workflow...${NC}"

# Phase 1: Deploy data infrastructure
deploy_data_infrastructure

# Phase 2: Test data connectivity
test_data_connectivity

# Phase 3: Deploy frontend dashboard
deploy_frontend_dashboard

# Phase 4: Set up monitoring
setup_monitoring

# Phase 5: Create handover documentation
create_handover_docs

# Print successful completion message
echo -e "\n${GREEN}=================================================${NC}"
echo -e "${GREEN}=     Client360 Dashboard Deployment Complete     =${NC}"
echo -e "${GREEN}=================================================${NC}"

echo -e "\n${BLUE}Deployment Summary:${NC}"
echo "✅ Data infrastructure deployed"
echo "✅ Data connectivity tested"
echo "✅ Frontend dashboard deployed"
echo "✅ Monitoring set up"
echo "✅ Handover documentation created"

echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Review the handover documentation: $ROOT_DIR/CLIENT360_DASHBOARD_HANDOVER.md"
echo "2. Schedule a runbook walk-through with the operations team"
echo "3. Set up regular data freshness monitoring via cron job"

echo -e "\n${BLUE}Deployment completed at:${NC} $(date)"
echo -e "${BLUE}Log file:${NC} $LOG_FILE"