#!/bin/bash
# azure_billing_role_check.sh - Verify billing roles vs subscription roles
# Part of InsightPulseAI/Pulser toolset

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
NC="\033[0m" # No Color

echo -e "${BOLD}Azure Billing vs Subscription Role Diagnostic${NC}"
echo "====================================================="
echo "This script detects the mismatch between subscription ownership"
echo "and billing account control that prevents subscription upgrades."
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

# Step 2: Check subscription ownership
echo -e "${YELLOW}Step 2: Checking subscription ownership roles...${NC}"

# Get current subscription
CURRENT_SUB=$(az account show --query name -o tsv)
CURRENT_SUB_ID=$(az account show --query id -o tsv)
echo -e "Current subscription: ${BLUE}$CURRENT_SUB${NC} ($CURRENT_SUB_ID)"

# Check if user is an Owner in current subscription
IS_OWNER=$(az role assignment list --query "[?principalName=='$CURRENT_USER' && roleDefinitionName=='Owner'].roleDefinitionName" -o tsv)

if [ -n "$IS_OWNER" ]; then
    echo -e "${GREEN}✓ You have the Owner role on this subscription.${NC}"
    HAS_OWNER=true
else
    echo -e "${RED}✗ You do NOT have the Owner role on this subscription.${NC}"
    HAS_OWNER=false
fi

echo ""

# Step 3: Check billing roles
echo -e "${YELLOW}Step 3: Checking billing account roles...${NC}"

# Check if billing module is available
if ! az billing --help &>/dev/null; then
    echo -e "${RED}✗ Azure Billing CLI module is not available or you don't have permissions to use it.${NC}"
    HAS_BILLING_ACCESS=false
else
    # Try to list billing accounts
    BILLING_ACCOUNTS=$(az billing account list --query "[].{Name:name, DisplayName:displayName}" -o json 2>/dev/null)
    
    if [ $? -ne 0 ] || [ -z "$BILLING_ACCOUNTS" ] || [ "$BILLING_ACCOUNTS" == "[]" ]; then
        echo -e "${RED}✗ Unable to access billing accounts. You likely don't have billing administrator permissions.${NC}"
        HAS_BILLING_ACCESS=false
    else
        echo -e "${GREEN}✓ You have access to billing accounts.${NC}"
        HAS_BILLING_ACCESS=true
        
        # List billing accounts
        echo "Available billing accounts:"
        echo "$BILLING_ACCOUNTS" | jq -r '.[] | "- \(.DisplayName) (\(.Name))"'
        
        # List billing profiles
        echo -e "\nChecking billing profiles:"
        BILLING_ACCOUNT_NAME=$(echo "$BILLING_ACCOUNTS" | jq -r '.[0].Name')
        
        BILLING_PROFILES=$(az billing profile list --account-name "$BILLING_ACCOUNT_NAME" -o json 2>/dev/null)
        if [ $? -eq 0 ] && [ -n "$BILLING_PROFILES" ] && [ "$BILLING_PROFILES" != "[]" ]; then
            echo -e "${GREEN}✓ You have access to billing profiles.${NC}"
            echo "$BILLING_PROFILES" | jq -r '.[] | "- \(.displayName) (\(.name))"'
            
            # Attempt to check billing role assignments
            PROFILE_NAME=$(echo "$BILLING_PROFILES" | jq -r '.[0].name')
            echo -e "\nChecking billing role assignments for your user..."
            
            ROLES=$(az billing account list --query "[].{roles:roleAssignments[?contains(principalName,'$CURRENT_USER')].roleDefinitionId}" -o json 2>/dev/null)
            if [ $? -eq 0 ] && [ -n "$ROLES" ] && [ "$ROLES" != "[{\"roles\":[]}]" ]; then
                echo -e "${GREEN}✓ You have billing role assignments.${NC}"
                echo "$ROLES" | jq
                HAS_BILLING_ROLE=true
            else
                echo -e "${RED}✗ You do NOT have billing role assignments.${NC}"
                HAS_BILLING_ROLE=false
            fi
        else
            echo -e "${RED}✗ Unable to access billing profiles. You don't have sufficient billing administrator permissions.${NC}"
            HAS_BILLING_ROLE=false
        fi
    fi
fi

echo ""

# Step 4: Check Billing Administrator role in directory
echo -e "${YELLOW}Step 4: Checking directory billing roles...${NC}"

# Check if user has Billing Administrator role in directory
IS_BILLING_ADMIN=$(az rest --method get --url "https://graph.microsoft.com/v1.0/me/memberOf" --query "value[?displayName=='Billing Administrator'].displayName" -o tsv 2>/dev/null)

if [ -n "$IS_BILLING_ADMIN" ]; then
    echo -e "${GREEN}✓ You have the Billing Administrator directory role.${NC}"
    HAS_BILLING_ADMIN=true
else
    echo -e "${RED}✗ You do NOT have the Billing Administrator directory role.${NC}"
    HAS_BILLING_ADMIN=false
fi

echo ""

# Step 5: Diagnostic Summary
echo -e "${YELLOW}Step 5: Diagnostic Summary${NC}"
echo "====================================================="

if [ "$HAS_OWNER" = true ] && [ "$HAS_BILLING_ACCESS" = true ] && [ "$HAS_BILLING_ROLE" = true ] && [ "$HAS_BILLING_ADMIN" = true ]; then
    echo -e "${GREEN}✅ FULL ACCESS: You have both subscription ownership and billing administration rights.${NC}"
    echo "You should be able to fully control both resources and billing for this subscription."
elif [ "$HAS_OWNER" = true ] && ([ "$HAS_BILLING_ACCESS" = false ] || [ "$HAS_BILLING_ROLE" = false ] || [ "$HAS_BILLING_ADMIN" = false ]); then
    echo -e "${MAGENTA}🔴 SPLIT PERMISSION SCENARIO DETECTED${NC}"
    echo -e "${YELLOW}⚠️ You have subscription Owner rights but NOT full billing administration.${NC}"
    echo ""
    echo -e "${BOLD}This explains why you cannot upgrade the subscription despite being an Owner.${NC}"
    echo "Microsoft Azure separates subscription resource control from billing control:"
    echo "  - You can manage resources in the subscription (create, modify, delete)"
    echo "  - But you CANNOT manage billing aspects (upgrades, payment methods, etc.)"
elif [ "$HAS_OWNER" = false ] && ([ "$HAS_BILLING_ACCESS" = true ] || [ "$HAS_BILLING_ROLE" = true ] || [ "$HAS_BILLING_ADMIN" = true ]); then
    echo -e "${MAGENTA}🔶 UNUSUAL PERMISSION SCENARIO DETECTED${NC}"
    echo -e "${YELLOW}⚠️ You have some billing administration rights but NOT subscription ownership.${NC}"
    echo ""
    echo "This is an unusual scenario where you might be able to manage billing but not resources."
else
    echo -e "${RED}❌ LIMITED ACCESS SCENARIO DETECTED${NC}"
    echo -e "${RED}⚠️ You have neither full subscription ownership nor billing administration rights.${NC}"
fi

echo ""
echo -e "${BOLD}Required Resolution:${NC}"

if [ "$HAS_OWNER" = true ] && ([ "$HAS_BILLING_ACCESS" = false ] || [ "$HAS_BILLING_ROLE" = false ] || [ "$HAS_BILLING_ADMIN" = false ]); then
    echo "1. You need to be added as a Billing Account Owner or Billing Administrator:"
    echo "   a. Go to: https://portal.azure.com/#view/Microsoft_Azure_Billing/BillingAccount"
    echo "   b. Navigate to: Cost Management + Billing → Billing scopes → Your Billing Account"
    echo "   c. Then: Access Control (IAM) → Add yourself as Billing Account Contributor/Owner"
    echo ""
    echo "2. If you cannot access billing settings, you must:"
    echo "   a. Contact the current Billing Account Owner to add you, or"
    echo "   b. Create a new Azure subscription under your own billing profile"
    echo ""
    echo "3. To verify the current Billing Account Owner:"
    echo "   a. Ask your Azure administrator, or"
    echo "   b. Check emails about Azure billing which usually go to the billing owner"
elif [ "$HAS_OWNER" = false ]; then
    echo "1. You need to be added as an Owner on this subscription:"
    echo "   a. Ask the current subscription Owner to add you via Access Control (IAM)"
    echo "   b. Command for current Owner: az role assignment create --role Owner --assignee $CURRENT_USER"
fi

echo ""
echo "====================================================="
echo -e "${BOLD}Technical Explanation:${NC}"
echo "Azure's Microsoft Customer Agreement (MCA) hierarchy strictly separates:"
echo "1. Subscription RBAC roles (Owner, Contributor) → resource management"
echo "2. Billing account roles → billing management"
echo ""
echo "Even with Owner role on a subscription, without billing roles you cannot:"
echo "- Upgrade subscription type (e.g., Free to Pay-As-You-Go)"
echo "- Change payment methods"
echo "- Modify billing properties"
echo "- Transfer subscription ownership"
echo ""