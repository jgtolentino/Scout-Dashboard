#!/bin/bash
# validate_pulser_azure_deployment.sh - Validates Azure resources against Pulser 2.0.x expectations
# Part of InsightPulseAI/Pulser toolset

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
GRAY="\033[0;90m"
NC="\033[0m" # No Color

# Table formatting
HEADER_FORMAT="%-30s %-15s %-15s %-30s\n"
ROW_FORMAT="%-30s %-15s %-15s %-30s\n"

# Validation result tracking
VALID_COUNT=0
WARNING_COUNT=0
MISSING_COUNT=0
TOTAL_CHECKS=0

echo -e "${BOLD}Pulser 2.0.x Azure Deployment Validation${NC}"
echo "====================================================="
echo "This script validates Azure resources against expected Pulser infrastructure."
echo ""

# Check authentication
echo -e "${CYAN}Checking Azure authentication...${NC}"
az account show &>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Not logged in to Azure. Please run 'az login' first.${NC}"
    exit 1
fi

# Get subscription
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
echo -e "Using subscription: ${BLUE}$SUBSCRIPTION_NAME${NC} ($SUBSCRIPTION_ID)"
echo ""

# Get resource groups to search in
echo -e "${CYAN}Retrieving resource groups...${NC}"
RESOURCE_GROUPS=$(az group list --query "[].name" -o tsv)

if [ -z "$RESOURCE_GROUPS" ]; then
    echo -e "${RED}No resource groups found in this subscription.${NC}"
    exit 1
fi

# Count resource groups
RG_COUNT=$(echo "$RESOURCE_GROUPS" | wc -l)
echo -e "Found ${BLUE}$RG_COUNT${NC} resource group(s)"

# Look for resource group that might contain Pulser resources
PULSER_RG=""
for rg in $RESOURCE_GROUPS; do
    if [[ "$rg" == *"pulser"* || "$rg" == *"Pulser"* || "$rg" == *"PULSER"* ]]; then
        PULSER_RG="$rg"
        echo -e "Detected Pulser resource group: ${GREEN}$PULSER_RG${NC}"
        break
    fi
done

if [ -z "$PULSER_RG" ]; then
    echo -e "${YELLOW}No resource group with 'pulser' in the name found.${NC}"
    echo "Please select a resource group to validate:"
    
    # List resource groups with numbers
    i=1
    for rg in $RESOURCE_GROUPS; do
        echo "$i) $rg"
        i=$((i+1))
    done
    
    read -p "Enter resource group number: " RG_NUMBER
    
    # Validate input
    if ! [[ "$RG_NUMBER" =~ ^[0-9]+$ ]] || [ "$RG_NUMBER" -lt 1 ] || [ "$RG_NUMBER" -gt "$RG_COUNT" ]; then
        echo -e "${RED}Invalid selection.${NC}"
        exit 1
    fi
    
    # Get selected resource group
    PULSER_RG=$(echo "$RESOURCE_GROUPS" | sed -n "${RG_NUMBER}p")
    echo -e "Using resource group: ${BLUE}$PULSER_RG${NC}"
fi

echo ""
echo -e "${CYAN}Collecting resource information...${NC}"

# Get all resources in the resource group
RESOURCES=$(az resource list --resource-group "$PULSER_RG" --query "[].{name:name, type:type, id:id}" -o json)

if [ -z "$RESOURCES" ] || [ "$RESOURCES" == "[]" ]; then
    echo -e "${RED}No resources found in resource group $PULSER_RG.${NC}"
    exit 1
fi

echo -e "Found resources in $PULSER_RG:"
echo "$RESOURCES" | jq -r '.[] | "- \(.name) (\(.type))"'
echo ""

echo -e "${BOLD}Pulser 2.0.x Validation Criteria${NC}"
echo "====================================================="

printf "${HEADER_FORMAT}" "Component" "Expected" "Found" "Status"
echo "-------------------------------------------------------------------------------------"

# Function to validate resources
validate_resource() {
    local component="$1"
    local resource_type="$2"
    local expected_count="$3"
    local details="$4"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS+1))
    
    # Count resources of this type
    local found_count=$(echo "$RESOURCES" | jq -r "[.[] | select(.type | contains(\"$resource_type\"))] | length")
    
    # Check if resource exists and count matches
    if [ "$found_count" -eq 0 ]; then
        printf "${ROW_FORMAT}" "$component" "$expected_count" "$found_count" "${RED}MISSING${NC}"
        MISSING_COUNT=$((MISSING_COUNT+1))
    elif [ "$found_count" -ge "$expected_count" ]; then
        printf "${ROW_FORMAT}" "$component" "$expected_count" "$found_count" "${GREEN}VALID${NC}"
        VALID_COUNT=$((VALID_COUNT+1))
    else
        printf "${ROW_FORMAT}" "$component" "$expected_count" "$found_count" "${YELLOW}WARNING${NC}"
        WARNING_COUNT=$((WARNING_COUNT+1))
    fi
    
    # List resources of this type
    if [ "$found_count" -gt 0 ]; then
        echo -e "${GRAY}  Details: $details${NC}"
        echo "$RESOURCES" | jq -r ".[] | select(.type | contains(\"$resource_type\")) | \"  - \(.name)\"" | head -n 3
        
        # Show ellipsis if there are more than 3 resources
        if [ "$found_count" -gt 3 ]; then
            echo "  - ..."
        fi
        echo ""
    else
        echo -e "${GRAY}  Details: $details${NC}"
        echo ""
    fi
}

# Validate App Service Plans
validate_resource "App Service Plans" "Microsoft.Web/serverfarms" 2 "Expected for Pulser Web UI and API hosting"

# Validate Web Apps
validate_resource "Web Apps / Sites" "Microsoft.Web/sites" 2 "Expected for Pulser Web UI and API endpoints"

# Validate Monitoring components
validate_resource "Monitoring Components" "Microsoft.Insights/components" 1 "Expected for Pulser Shell CLI and deployment logs"

# Validate Logging
validate_resource "Log Analytics Workspace" "Microsoft.OperationalInsights/workspaces" 1 "Used for Claudia orchestration logs"

# Validate Storage Accounts
validate_resource "Storage Accounts" "Microsoft.Storage/storageAccounts" 1 "Expected for logs and data storage"

# Validate Database
validate_resource "Database Accounts" "Microsoft.DocumentDB/databaseAccounts" 1 "Expected for TaskOrchestrationLog and PulseMemoryStore"

# Also check for SQL/PostgreSQL
validate_resource "SQL/PostgreSQL Databases" "Microsoft.Sql/servers" 1 "Alternative database for Pulser data"

# Validate Key Vault
validate_resource "Key Vault" "Microsoft.KeyVault/vaults" 1 "Expected for secret management"

# Validate Action Groups (Alerting)
validate_resource "Action Groups" "Microsoft.Insights/actionGroups" 1 "Expected for alerting and notifications"

# Validate CDN/Profiles
validate_resource "CDN/Front Door Profiles" "Microsoft.Cdn/profiles" 1 "May be used for Pulser static assets"

# Output validation summary
echo "====================================================="
echo -e "${BOLD}Validation Summary${NC}"
echo "====================================================="
echo -e "Total checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Valid components: ${GREEN}$VALID_COUNT${NC}"
echo -e "Warning components: ${YELLOW}$WARNING_COUNT${NC}"
echo -e "Missing components: ${RED}$MISSING_COUNT${NC}"

# Calculate percentage
PERCENT_VALID=$((VALID_COUNT * 100 / TOTAL_CHECKS))
echo ""
echo -e "Pulser deployment is ${BLUE}$PERCENT_VALID%${NC} compliant with expected architecture."

if [ "$PERCENT_VALID" -ge 80 ]; then
    echo -e "${GREEN}✅ Deployment appears valid for Pulser 2.0.x${NC}"
elif [ "$PERCENT_VALID" -ge 60 ]; then
    echo -e "${YELLOW}⚠️ Deployment mostly matches Pulser 2.0.x but has some missing components${NC}"
else
    echo -e "${RED}❌ Deployment significantly deviates from expected Pulser 2.0.x architecture${NC}"
fi

echo ""
echo "====================================================="
echo -e "${BOLD}Detailed Validation Commands${NC}"
echo ""
echo "Web App Configuration:"
echo "az webapp list --resource-group $PULSER_RG --output table"
echo ""
echo "Database Details:"
echo "az cosmosdb list --resource-group $PULSER_RG --output table"
echo ""
echo "Monitoring Configuration:"
echo "az monitor action-group list --resource-group $PULSER_RG --output table"
echo ""
echo "Storage Account Details:"
echo "az storage account list --resource-group $PULSER_RG --output table"
echo ""
echo "Key Vault Access Policies:"
echo "az keyvault list --resource-group $PULSER_RG --output table"
echo ""

# Suggest commands for missing components
if [ "$MISSING_COUNT" -gt 0 ]; then
    echo "====================================================="
    echo -e "${BOLD}Missing Component Resolution${NC}"
    echo ""
    echo "To address missing components, consider these commands:"
    echo ""
    
    if [ $(echo "$RESOURCES" | jq -r "[.[] | select(.type | contains(\"Microsoft.Web/serverfarms\"))] | length") -eq 0 ]; then
        echo "# Create App Service Plan:"
        echo "az appservice plan create --name pulser-app-plan --resource-group $PULSER_RG --sku B1"
        echo ""
    fi
    
    if [ $(echo "$RESOURCES" | jq -r "[.[] | select(.type | contains(\"Microsoft.Web/sites\"))] | length") -eq 0 ]; then
        echo "# Create Web App:"
        echo "az webapp create --name pulser-web-app --resource-group $PULSER_RG --plan pulser-app-plan"
        echo ""
    fi
    
    if [ $(echo "$RESOURCES" | jq -r "[.[] | select(.type | contains(\"Microsoft.DocumentDB/databaseAccounts\"))] | length") -eq 0 ]; then
        echo "# Create CosmosDB Account:"
        echo "az cosmosdb create --name pulser-db --resource-group $PULSER_RG --kind MongoDB"
        echo ""
    fi
    
    if [ $(echo "$RESOURCES" | jq -r "[.[] | select(.type | contains(\"Microsoft.KeyVault/vaults\"))] | length") -eq 0 ]; then
        echo "# Create Key Vault:"
        echo "az keyvault create --name pulser-keyvault --resource-group $PULSER_RG"
        echo ""
    fi
fi

echo ""
echo "To add this validation command as a Pulser CLI command, you can add it to your"
echo "command registry or create an alias in your .pulserrc or .zshrc file:"
echo ""
echo "alias :validate-azure-deployment='$(pwd)/validate_pulser_azure_deployment.sh'"