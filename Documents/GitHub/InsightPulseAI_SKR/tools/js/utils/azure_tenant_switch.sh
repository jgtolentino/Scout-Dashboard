#!/bin/bash
# azure_tenant_switch.sh - Utility to switch Azure tenant and verify access permissions
# Part of InsightPulseAI/Pulser toolset

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}Azure Tenant Switch Utility${NC}"
echo "==========================================="
echo "This script helps switch between Azure tenants where you have proper"
echo "administrative privileges for billing and resource management."
echo ""

# Login to Azure if not already logged in
echo -e "${YELLOW}Step 1: Checking Azure authentication...${NC}"
az account show &>/dev/null
if [ $? -ne 0 ]; then
    echo "Not logged in. Authenticating with Azure..."
    az login --allow-no-subscriptions || { echo -e "${RED}Authentication failed.${NC}"; exit 1; }
else
    echo "Already logged in to Azure."
fi
echo -e "${GREEN}✓ Successfully authenticated${NC}"
echo ""

# List available tenants with numbers for easier selection
echo -e "${YELLOW}Step 2: Available tenants...${NC}"
echo ""
TENANTS=$(az account list --query "[].{TenantId:tenantId, Name:name, DefaultDomain:tenantDefaultDomain}" --output json)
echo "$TENANTS" | jq -r 'to_entries | .[] | "[\(.key+1)] \(.value.Name) (\(.value.DefaultDomain)) - \(.value.TenantId)"'
echo ""

# Prompt user to select tenant by number
TENANT_COUNT=$(echo "$TENANTS" | jq '. | length')
read -p "Enter the number of the tenant to switch to [1-$TENANT_COUNT]: " TENANT_NUM

# Validate input is a number
if ! [[ "$TENANT_NUM" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}Invalid input. Please enter a number.${NC}"
    exit 1
fi

# Validate input is in range
if [ "$TENANT_NUM" -lt 1 ] || [ "$TENANT_NUM" -gt "$TENANT_COUNT" ]; then
    echo -e "${RED}Invalid selection. Please enter a number between 1 and $TENANT_COUNT.${NC}"
    exit 1
fi

# Get the selected tenant ID
TENANT_INDEX=$((TENANT_NUM-1))
TENANT_ID=$(echo "$TENANTS" | jq -r ".[$TENANT_INDEX].TenantId")
TENANT_NAME=$(echo "$TENANTS" | jq -r ".[$TENANT_INDEX].Name")

echo ""
echo -e "Selected ${GREEN}$TENANT_NAME${NC} with ID: ${YELLOW}$TENANT_ID${NC}"
echo ""

# Switch to the selected tenant
echo -e "${YELLOW}Step 3: Switching to selected tenant...${NC}"

# Log out and log back in to the specific tenant
echo "Logging out to clear session..."
az logout
echo "Logging in to specific tenant..."
az login --tenant $TENANT_ID --allow-no-subscriptions || { echo -e "${RED}Failed to login to tenant.${NC}"; exit 1; }

echo -e "${GREEN}✓ Successfully switched to new tenant${NC}"
echo ""

# Verify active tenant and subscriptions
echo -e "${YELLOW}Step 4: Verifying tenant and access...${NC}"
echo ""
echo "Current account information:"
az account show --output table
echo ""

# Check for subscriptions
echo "Available subscriptions in this tenant:"
az account list --output table
echo ""

# Check if subscriptions exist
SUB_COUNT=$(az account list --query "length([*])" --output tsv)

if [ "$SUB_COUNT" -eq 0 ]; then
    echo ""
    echo -e "${RED}Warning: No subscriptions found in this tenant.${NC}"
    echo "You will need to create a subscription in this tenant before you can manage resources."
    echo "Visit the Azure portal to create a new subscription."
else
    # Get the first subscription ID
    FIRST_SUB=$(az account list --query "[0].id" --output tsv)
    FIRST_SUB_NAME=$(az account list --query "[0].name" --output tsv)
    
    # Set the subscription as default
    echo "Setting subscription '$FIRST_SUB_NAME' as default..."
    az account set --subscription $FIRST_SUB
    
    echo ""
    echo "Checking your role assignments..."
    az role assignment list --query "[].{Role:roleDefinitionName, Scope:scope}" --output table
    
    echo ""
    echo -e "${GREEN}✓ Tenant switch complete${NC}"
    echo "You can now manage resources in this tenant with the available permissions."
fi

echo ""
echo "==========================================="
echo -e "${BOLD}Next steps:${NC}"
echo "1. Verify you have Owner or Billing Administrator role"
echo "2. Create resources in this tenant to avoid tenant restrictions"
echo "3. Update your Pulser CLI configuration if needed"
echo ""