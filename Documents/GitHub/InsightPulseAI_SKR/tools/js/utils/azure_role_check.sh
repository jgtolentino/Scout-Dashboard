#!/bin/bash
# azure_role_check.sh - Check Azure roles and permissions for current user
# Part of InsightPulseAI/Pulser toolset

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BOLD}Azure Role & Permissions Check${NC}"
echo "==========================================="
echo "This script checks your roles and permissions across all subscriptions."
echo ""

# Login to Azure if not already logged in
echo -e "${YELLOW}Step 1: Checking Azure authentication...${NC}"
az account show &>/dev/null
if [ $? -ne 0 ]; then
    echo "Not logged in. Authenticating with Azure..."
    az login || { echo -e "${RED}Authentication failed.${NC}"; exit 1; }
else
    echo "Already logged in to Azure."
fi

# Get current user information
CURRENT_USER=$(az ad signed-in-user show --query userPrincipalName -o tsv 2>/dev/null)
if [ -z "$CURRENT_USER" ]; then
    CURRENT_USER=$(az account show --query user.name -o tsv)
fi
echo -e "Logged in as: ${BLUE}$CURRENT_USER${NC}"
echo -e "${GREEN}✓ Successfully authenticated${NC}"
echo ""

# Step 2: Check for Billing Administrator Role
echo -e "${YELLOW}Step 2: Checking for Billing Administrator role...${NC}"

# Checking in Azure AD/Entra directory roles
echo "Checking directory roles..."
IS_BILLING_ADMIN=$(az rest --method get --url "https://graph.microsoft.com/v1.0/me/memberOf" --query "value[?displayName=='Billing Administrator'].displayName" -o tsv 2>/dev/null)

if [ -n "$IS_BILLING_ADMIN" ]; then
    echo -e "${GREEN}✓ You have the Billing Administrator directory role.${NC}"
    HAS_BILLING_ADMIN=true
else
    echo -e "${RED}✗ You do not have the Billing Administrator directory role.${NC}"
    HAS_BILLING_ADMIN=false
fi

# Step 3: Check subscriptions and roles
echo -e "\n${YELLOW}Step 3: Checking subscription roles...${NC}"
echo "Listing all accessible subscriptions and your roles:"
echo ""
echo -e "${BOLD}Subscription Roles:${NC}"
echo "---------------------------------------------"
printf "%-40s %-20s %-40s\n" "Subscription Name" "Subscription ID" "Your Role(s)"
echo "---------------------------------------------"

# Get all subscriptions
SUBSCRIPTIONS=$(az account list --query "[].{Name:name, Id:id}" -o json)
SUB_COUNT=$(echo "$SUBSCRIPTIONS" | jq '. | length')

# Check if there are any subscriptions
if [ "$SUB_COUNT" -eq 0 ]; then
    echo -e "${RED}No subscriptions found.${NC}"
    echo "You may not have access to any subscriptions, or they might be filtered."
else
    # For each subscription, check the user's roles
    HAS_OWNER=false
    HAS_CONTRIBUTOR=false
    
    for ((i=0; i<$SUB_COUNT; i++)); do
        SUB_NAME=$(echo "$SUBSCRIPTIONS" | jq -r ".[$i].Name")
        SUB_ID=$(echo "$SUBSCRIPTIONS" | jq -r ".[$i].Id")
        
        # Get user's roles for this subscription
        az account set --subscription "$SUB_ID" > /dev/null
        USER_ROLES=$(az role assignment list --query "[?principalName=='$CURRENT_USER'].roleDefinitionName" -o tsv)
        
        if [ -z "$USER_ROLES" ]; then
            ROLES_STR="No explicit roles"
        else
            ROLES_STR=$(echo "$USER_ROLES" | tr '\n' ', ' | sed 's/,$//' | sed 's/,/, /g')
            
            # Check for owner/contributor roles
            if echo "$USER_ROLES" | grep -q "Owner"; then
                HAS_OWNER=true
            fi
            if echo "$USER_ROLES" | grep -q "Contributor"; then
                HAS_CONTRIBUTOR=true
            fi
        fi
        
        printf "%-40s %-20s %-40s\n" "$SUB_NAME" "$SUB_ID" "$ROLES_STR"
    done
fi

echo -e "\n${YELLOW}Step 4: Summary of permissions...${NC}"
echo ""

if [ "$HAS_BILLING_ADMIN" = true ]; then
    echo -e "${GREEN}✓ You have Billing Administrator role${NC} - You can manage billing and purchases."
else
    echo -e "${RED}✗ You don't have Billing Administrator role${NC} - You cannot manage billing or upgrade subscriptions."
fi

if [ "$HAS_OWNER" = true ]; then
    echo -e "${GREEN}✓ You have Owner role${NC} on at least one subscription - You have full control over resources."
else
    if [ "$HAS_CONTRIBUTOR" = true ]; then
        echo -e "${YELLOW}! You have Contributor role${NC} on at least one subscription - You can manage resources but not grant permissions."
    else
        echo -e "${RED}✗ You don't have Owner or Contributor roles${NC} - You have limited control over resources."
    fi
fi

echo ""
echo "==========================================="
echo -e "${BOLD}Next steps:${NC}"

if [ "$HAS_BILLING_ADMIN" = true ] && [ "$HAS_OWNER" = true ]; then
    echo -e "${GREEN}You have all necessary permissions to manage resources and billing.${NC}"
else
    echo "To get full control over billing and resources:"
    
    if [ "$HAS_BILLING_ADMIN" = false ]; then
        echo "1. For billing control:"
        echo "   a. Contact the tenant administrator to assign you the Billing Administrator role"
        echo "   b. Or transfer billing ownership via https://account.azure.com/Subscriptions"
    fi
    
    if [ "$HAS_OWNER" = false ]; then
        echo "2. For resource control:"
        echo "   a. Contact the subscription owner to assign you the Owner role"
        echo "   b. Or create a new subscription where you are the Owner"
    fi
    
    echo "3. For complete freedom, consider creating a new Azure account with your own Microsoft account"
fi
echo ""