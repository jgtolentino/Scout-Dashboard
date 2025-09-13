#!/bin/bash
# azure_account_relationship_check.sh - Diagnose account ownership vs subscription relationship issues
# Part of InsightPulseAI/Pulser toolset

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
NC="\033[0m" # No Color

echo -e "${BOLD}Azure Account Relationship Diagnostic${NC}"
echo "====================================================="
echo "This script performs deep inspection of account ownership,"
echo "subscription relationships, and directory metadata to identify"
echo "complex permission and tenant relationship issues."
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
CURRENT_TENANT=$(az account show --query homeTenantId -o tsv)
CURRENT_TENANT_NAME=$(az account show --query tenantDisplayName -o tsv)

echo -e "Logged in as: ${BLUE}$CURRENT_USER${NC}"
echo -e "Home tenant: ${BLUE}$CURRENT_TENANT_NAME${NC} ($CURRENT_TENANT)"
echo -e "${GREEN}✓ Successfully authenticated${NC}"
echo ""

# Step 2: Collect detailed account information
echo -e "${YELLOW}Step 2: Collecting detailed account information...${NC}"

# Get current subscription details
CURRENT_SUB=$(az account show --query name -o tsv)
CURRENT_SUB_ID=$(az account show --query id -o tsv)
CURRENT_SUB_STATE=$(az account show --query state -o tsv)
CURRENT_SUB_TENANT=$(az account show --query tenantId -o tsv)

echo -e "Current subscription: ${BLUE}$CURRENT_SUB${NC} ($CURRENT_SUB_ID)"
echo -e "Subscription state: ${BLUE}$CURRENT_SUB_STATE${NC}"
echo -e "Subscription tenant: ${BLUE}$CURRENT_SUB_TENANT${NC}"

# Check if home tenant matches subscription tenant
if [ "$CURRENT_TENANT" != "$CURRENT_SUB_TENANT" ]; then
    echo -e "${MAGENTA}⚠️ TENANT MISMATCH DETECTED: Your home tenant differs from the subscription tenant!${NC}"
    echo "   This can cause permission issues when managing billing."
fi

# Check user's role in the subscription
echo -e "\nChecking your roles in the current subscription:"
SUB_ROLES=$(az role assignment list --query "[?principalName=='$CURRENT_USER'].roleDefinitionName" -o tsv)

if [ -z "$SUB_ROLES" ]; then
    echo -e "${RED}✗ You have no explicit role assignments in this subscription.${NC}"
    IS_SUB_OWNER=false
else
    echo "Your subscription roles:"
    echo "$SUB_ROLES" | while read -r role; do
        echo " - $role"
        if [ "$role" == "Owner" ]; then
            IS_SUB_OWNER=true
        fi
    done
    
    if [[ "$SUB_ROLES" == *"Owner"* ]]; then
        echo -e "${GREEN}✓ You have the Owner role on this subscription.${NC}"
    else
        echo -e "${YELLOW}! You do not have the Owner role on this subscription.${NC}"
    fi
fi

echo ""

# Step 3: Check subscription creation and lifecycle
echo -e "${YELLOW}Step 3: Checking subscription creation and lifecycle...${NC}"
echo -e "${CYAN}Note: This information helps determine if you created this subscription.${NC}"

# Get all subscriptions
SUBS=$(az account list --query "[].{Name:name, Id:id, State:state, CreatedTime:\"unknown\", TenantId:tenantId}" -o json)
SUB_COUNT=$(echo "$SUBS" | jq '. | length')

echo -e "You have access to ${BLUE}$SUB_COUNT${NC} subscription(s)."

# Try to get management groups
echo -e "\nChecking management groups (requires elevated permissions):"
MGMT_GROUPS=$(az account management-group list 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$MGMT_GROUPS" ]; then
    echo -e "${GREEN}✓ You have access to management groups.${NC}"
    echo "$MGMT_GROUPS" | jq -r '.[] | "- \(.name): \(.displayName)"'
else
    echo -e "${YELLOW}! Unable to access management groups. This is typical for non-enterprise accounts.${NC}"
fi

echo ""

# Step 4: Check subscription-account relationship
echo -e "${YELLOW}Step 4: Checking subscription-account relationship...${NC}"

# Try to get subscription account relationship
ACCOUNT_ID=""
ACCOUNT_NAME=""

echo "Attempting to verify account ownership (requires billing permissions):"

# Try with various approaches
ACCT_INFO=$(az billing account list 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$ACCT_INFO" ] && [ "$ACCT_INFO" != "[]" ]; then
    ACCOUNT_ID=$(echo "$ACCT_INFO" | jq -r '.[0].name')
    ACCOUNT_NAME=$(echo "$ACCT_INFO" | jq -r '.[0].displayName')
    echo -e "${GREEN}✓ Found billing account: $ACCOUNT_NAME ($ACCOUNT_ID)${NC}"
    HAS_BILLING_ACCESS=true
    
    # Try to get more detailed agreement info
    AGREEMENT=$(az billing agreement list --account-name "$ACCOUNT_ID" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$AGREEMENT" ] && [ "$AGREEMENT" != "[]" ]; then
        AGREEMENT_TYPE=$(echo "$AGREEMENT" | jq -r '.[0].agreementType')
        echo -e "Agreement type: ${BLUE}$AGREEMENT_TYPE${NC}"
    fi
else
    echo -e "${RED}✗ Unable to access billing account information.${NC}"
    HAS_BILLING_ACCESS=false
fi

echo ""

# Step 5: Advanced tenant analysis
echo -e "${YELLOW}Step 5: Advanced tenant relationship analysis...${NC}"

# Check if there are multiple tenants in play
echo "Checking for multi-tenant scenario:"
TENANTS=$(az account list --query "[].{TenantId:tenantId, HomeTenantId:homeTenantId}" -o json)
TENANT_COUNT=$(echo "$TENANTS" | jq '[.[].TenantId] | unique | length')
HOME_TENANT_COUNT=$(echo "$TENANTS" | jq '[.[].HomeTenantId] | unique | length')

if [ "$TENANT_COUNT" -gt 1 ] || [ "$HOME_TENANT_COUNT" -gt 1 ]; then
    echo -e "${MAGENTA}⚠️ MULTI-TENANT SCENARIO DETECTED:${NC}"
    echo "   Your account has relationships with multiple Azure AD tenants."
    echo "   This often complicates billing relationship management."
    
    echo -e "\nTenant relationships found:"
    echo "$TENANTS" | jq -r '.[] | "- Tenant: \(.TenantId), Home Tenant: \(.HomeTenantId)"'
else
    echo -e "${GREEN}✓ Simple single-tenant scenario.${NC}"
fi

# Check if this is a student or sponsored account
echo -e "\nChecking for special account types:"
SPONSORED_KEYWORDS=("student" "education" "sponsored" "trial" "free")
SUB_NAME_LOWER=$(echo "$CURRENT_SUB" | tr '[:upper:]' '[:lower:]')
TENANT_NAME_LOWER=$(echo "$CURRENT_TENANT_NAME" | tr '[:upper:]' '[:lower:]')
IS_SPONSORED=false

for keyword in "${SPONSORED_KEYWORDS[@]}"; do
    if [[ "$SUB_NAME_LOWER" == *"$keyword"* ]] || [[ "$TENANT_NAME_LOWER" == *"$keyword"* ]]; then
        IS_SPONSORED=true
        break
    fi
done

if [ "$IS_SPONSORED" = true ]; then
    echo -e "${MAGENTA}⚠️ SPONSORED/EDUCATIONAL ACCOUNT DETECTED:${NC}"
    echo "   Your subscription appears to be a sponsored, educational, or free tier account."
    echo "   These accounts often have special billing restrictions and limitations."
else
    echo -e "${GREEN}✓ Standard commercial subscription detected.${NC}"
fi

echo ""

# Step 6: Diagnostic Summary
echo -e "${YELLOW}Step 6: Comprehensive Diagnostic Summary${NC}"
echo "====================================================="

# Summarize findings
echo -e "${BOLD}Main findings:${NC}"

# Account ownership
if [ "$HAS_BILLING_ACCESS" = true ]; then
    echo -e "${GREEN}✅ You have billing account access.${NC}"
else
    echo -e "${RED}❌ You DO NOT have billing account access.${NC}"
fi

# Subscription ownership
if [[ "$SUB_ROLES" == *"Owner"* ]]; then
    echo -e "${GREEN}✅ You have subscription ownership (Owner role).${NC}"
else
    echo -e "${RED}❌ You DO NOT have subscription ownership.${NC}"
fi

# Tenant relationships
if [ "$CURRENT_TENANT" != "$CURRENT_SUB_TENANT" ]; then
    echo -e "${RED}❌ TENANT MISMATCH: Home tenant ≠ Subscription tenant.${NC}"
elif [ "$TENANT_COUNT" -gt 1 ] || [ "$HOME_TENANT_COUNT" -gt 1 ]; then
    echo -e "${YELLOW}⚠️ COMPLEX MULTI-TENANT RELATIONSHIPS detected.${NC}"
else
    echo -e "${GREEN}✅ Clean tenant relationship structure.${NC}"
fi

# Account type
if [ "$IS_SPONSORED" = true ]; then
    echo -e "${YELLOW}⚠️ SPONSORED/EDUCATIONAL account with potential restrictions.${NC}"
else
    echo -e "${GREEN}✅ Standard commercial account type.${NC}"
fi

echo ""
echo -e "${BOLD}Likely scenario based on findings:${NC}"

if [ "$HAS_BILLING_ACCESS" = false ] && [[ "$SUB_ROLES" == *"Owner"* ]]; then
    if [ "$IS_SPONSORED" = true ]; then
        echo -e "${MAGENTA}🎓 EDUCATIONAL ACCOUNT WITH SPLIT PERMISSIONS${NC}"
        echo "You likely have a student/educational Azure account where:"
        echo "- You can manage resources (Owner role)"
        echo "- But billing/upgrading is controlled by your educational institution"
        echo "- These accounts typically CANNOT be upgraded to standard accounts"
        echo "- Non-administrator users CANNOT be granted billing access"
        
        echo -e "\n${BOLD}Recommended action:${NC}"
        echo "1. Create a new personal Azure account for full billing control"
        echo "2. Request a Microsoft Azure student credit transfer (rarely approved)"
        echo "3. Contact your educational institution's IT department"
    elif [ "$CURRENT_TENANT" != "$CURRENT_SUB_TENANT" ]; then
        echo -e "${MAGENTA}🔀 CROSS-TENANT SUBSCRIPTION MANAGEMENT${NC}"
        echo "You are managing a subscription in a different tenant from your home tenant:"
        echo "- You have resource management rights (Owner role)"
        echo "- But billing is controlled by administrators in the subscription's tenant"
        echo "- Cross-tenant billing access is extremely restricted by design"
        
        echo -e "\n${BOLD}Recommended action:${NC}"
        echo "1. Contact the administrators of tenant $CURRENT_SUB_TENANT"
        echo "2. Login directly to tenant $CURRENT_SUB_TENANT to check billing"
        echo "3. Create resources in your home tenant ($CURRENT_TENANT) for full control"
    else
        echo -e "${MAGENTA}🔒 STANDARD SPLIT-PERMISSION SCENARIO${NC}"
        echo "You have a standard Azure account with split permissions:"
        echo "- You can manage resources (Owner role)"
        echo "- But someone else controls billing"
        echo "- The billing administrator is likely the person who created the subscription"
        
        echo -e "\n${BOLD}Recommended action:${NC}"
        echo "1. Identify who created the subscription and contact them"
        echo "2. Request billing ownership transfer via account.azure.com"
        echo "3. Create a new subscription where you are both Owner and billing administrator"
    fi
elif [ "$HAS_BILLING_ACCESS" = true ] && [[ "$SUB_ROLES" != *"Owner"* ]]; then
    echo -e "${MAGENTA}📊 BILLING ADMINISTRATOR WITHOUT RESOURCE CONTROL${NC}"
    echo "You control billing but not resources:"
    echo "- You have billing account access"
    echo "- But you don't have full resource management rights"
    echo "- This is an unusual but valid configuration"
    
    echo -e "\n${BOLD}Recommended action:${NC}"
    echo "1. Request Owner role from the current Owner"
    echo "2. If appropriate, assign yourself as Owner via billing account transfer"
elif [ "$HAS_BILLING_ACCESS" = true ] && [[ "$SUB_ROLES" == *"Owner"* ]]; then
    echo -e "${GREEN}✓ FULL CONTROL SCENARIO${NC}"
    echo "You appear to have full control over both billing and resources."
    echo "If you're still encountering upgrade issues, consider these specialized scenarios:"
    
    echo -e "\n${BOLD}Potential hidden issues:${NC}"
    echo "1. The subscription might be subject to a spending limit or policy restriction"
    echo "2. There might be an explicit upgrade block via Azure Policy"
    echo "3. The billing account might have a special agreement with restrictions"
    
    echo -e "\n${BOLD}Advanced troubleshooting:${NC}"
    echo "1. Check for Azure Policies restricting upgrades"
    echo "2. Verify credit/payment information is valid"
    echo "3. Check Azure Support Center for account-specific notices"
    echo "4. Contact Azure Support with error details from the upgrade attempt"
else
    echo -e "${RED}❌ LIMITED ACCESS SCENARIO${NC}"
    echo "You have neither billing access nor subscription ownership."
    
    echo -e "\n${BOLD}Recommended action:${NC}"
    echo "1. Contact both the subscription Owner and the billing administrator"
    echo "2. Create your own Azure subscription for full control"
fi

echo ""
echo "====================================================="
echo -e "${BOLD}Command to manually check tenant relationships:${NC}"
echo "az account list --query \"[].{Name:name, SubscriptionId:id, TenantId:tenantId, HomeTenantId:homeTenantId, State:state}\" --output table"
echo ""