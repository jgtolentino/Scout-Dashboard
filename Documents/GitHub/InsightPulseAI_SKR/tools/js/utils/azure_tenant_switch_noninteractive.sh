#!/bin/bash
# azure_tenant_switch_noninteractive.sh - Non-interactive utility to switch Azure tenant
# Part of InsightPulseAI/Pulser toolset

# Check if tenant ID is provided
if [ -z "$1" ]; then
    echo "Error: Tenant ID is required."
    echo "Usage: $0 <tenant-id>"
    exit 1
fi

TENANT_ID="$1"

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}Azure Tenant Switch Utility (Non-interactive)${NC}"
echo "==========================================="
echo "This script switches to the specified Azure tenant."
echo ""

# Validate tenant ID format
if [[ ! $TENANT_ID =~ ^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$ ]]; then
    echo -e "${RED}Invalid Tenant ID format. Please provide a valid GUID.${NC}"
    exit 1
fi

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

# Verify tenant exists
echo -e "${YELLOW}Step 2: Verifying tenant ID...${NC}"
TENANT_EXISTS=$(az account list --query "[?tenantId=='$TENANT_ID']" --output tsv)
if [ -z "$TENANT_EXISTS" ]; then
    echo -e "${RED}Error: Tenant ID not found or you don't have access to it.${NC}"
    echo "Available tenants:"
    az account list --query "[].{TenantId:tenantId, Name:name}" --output table
    exit 1
fi
echo -e "${GREEN}✓ Tenant ID verified${NC}"
echo ""

# Switch to the selected tenant
echo -e "${YELLOW}Step 3: Switching to tenant...${NC}"

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