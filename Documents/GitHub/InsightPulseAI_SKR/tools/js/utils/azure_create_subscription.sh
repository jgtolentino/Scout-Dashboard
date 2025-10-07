#!/bin/bash
# azure_create_subscription.sh - Guide through creating a new Azure subscription
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

echo -e "${BOLD}Azure New Subscription Creation Guide${NC}"
echo "====================================================="
echo "This interactive script will guide you through creating"
echo "a new Azure subscription with full ownership and billing control."
echo ""

# Step 1: Check current Azure login state
echo -e "${YELLOW}Step 1: Checking current Azure login state...${NC}"
LOGIN_INFO=$(az account show 2>/dev/null)
if [ $? -eq 0 ]; then
    CURRENT_USER=$(echo "$LOGIN_INFO" | jq -r '.user.name')
    CURRENT_TENANT=$(echo "$LOGIN_INFO" | jq -r '.tenantId')
    CURRENT_SUB=$(echo "$LOGIN_INFO" | jq -r '.name')
    
    echo -e "Currently logged in as: ${BLUE}$CURRENT_USER${NC}"
    echo -e "Current tenant: ${BLUE}$CURRENT_TENANT${NC}"
    echo -e "Current subscription: ${BLUE}$CURRENT_SUB${NC}"
    
    echo ""
    read -p "Do you want to sign out of this account first? (y/n): " SIGNOUT
    if [[ "$SIGNOUT" == "y" || "$SIGNOUT" == "Y" ]]; then
        echo "Signing out from Azure CLI..."
        az logout
        echo -e "${GREEN}✓ Successfully signed out${NC}"
    else
        echo "Remaining signed in. You'll need to use a different browser or private window for the new sign-up."
    fi
else
    echo "You are not currently logged into Azure CLI."
fi
echo ""

# Step 2: Gather new subscription information
echo -e "${YELLOW}Step 2: Preparing for new subscription...${NC}"
echo ""
echo -e "${CYAN}What type of account will you use for the new subscription?${NC}"
echo "1. Personal Microsoft account (outlook.com, hotmail.com, etc.)"
echo "2. Work or school account (organization account)"
read -p "Enter your choice [1-2]: " ACCOUNT_TYPE

if [ "$ACCOUNT_TYPE" == "1" ]; then
    echo -e "\n${GREEN}✓ Personal Microsoft account selected${NC}"
    echo "Make sure you have access to this account and it's not managed by an organization."
    
    read -p "Enter your Microsoft account email: " MS_EMAIL
    echo -e "${CYAN}We recommend using a personal Microsoft account where you are the primary owner.${NC}"
elif [ "$ACCOUNT_TYPE" == "2" ]; then
    echo -e "\n${YELLOW}! Work/school account selected${NC}"
    echo "Be aware that organizational policies might restrict your control."
    
    read -p "Enter your work/school email: " MS_EMAIL
    echo -e "${CYAN}Ensure you have sufficient permissions in your organization to create subscriptions.${NC}"
else
    echo -e "${RED}Invalid selection. Defaulting to personal account option.${NC}"
    ACCOUNT_TYPE="1"
fi

# Step 3: Subscription options
echo -e "\n${YELLOW}Step 3: Choose subscription type...${NC}"
echo ""
echo -e "${CYAN}What type of subscription do you want to create?${NC}"
echo "1. Free trial (12 months of free services + $200 credit for 30 days)"
echo "2. Pay-As-You-Go (standard usage-based billing)"
echo "3. Visual Studio subscription (if you have eligible credentials)"
echo "4. Microsoft for Startups (if you're in a startup program)"
read -p "Enter your choice [1-4]: " SUB_TYPE

case "$SUB_TYPE" in
    1)
        SIGNUP_URL="https://azure.microsoft.com/free/"
        SUB_DESC="Free trial"
        echo -e "\n${GREEN}✓ Free trial selected${NC}"
        echo "You'll get 12 months of popular services free + $200 credit for 30 days."
        ;;
    2)
        SIGNUP_URL="https://azure.microsoft.com/pricing/purchase-options/pay-as-you-go/"
        SUB_DESC="Pay-As-You-Go"
        echo -e "\n${GREEN}✓ Pay-As-You-Go selected${NC}"
        echo "Standard usage-based billing with no upfront costs."
        ;;
    3)
        SIGNUP_URL="https://azure.microsoft.com/pricing/member-offers/credit-for-visual-studio-subscribers/"
        SUB_DESC="Visual Studio subscription"
        echo -e "\n${GREEN}✓ Visual Studio subscription selected${NC}"
        echo "Make sure you have an active Visual Studio subscription."
        ;;
    4)
        SIGNUP_URL="https://azure.microsoft.com/pricing/member-offers/startup-discount/"
        SUB_DESC="Microsoft for Startups"
        echo -e "\n${GREEN}✓ Microsoft for Startups selected${NC}"
        echo "Make sure you're registered in the Microsoft for Startups program."
        ;;
    *)
        SIGNUP_URL="https://azure.microsoft.com/free/"
        SUB_DESC="Free trial"
        echo -e "\n${RED}Invalid selection. Defaulting to Free trial.${NC}"
        ;;
esac

# Step 4: Launch signup process
echo -e "\n${YELLOW}Step 4: Launch signup process...${NC}"
echo ""
echo -e "${BOLD}Please complete the following steps:${NC}"
echo "1. Open this URL in your browser: ${BLUE}$SIGNUP_URL${NC}"
echo "2. Sign in with your Microsoft account: ${BLUE}$MS_EMAIL${NC}"
echo "3. Complete the registration process with your personal information"
echo "4. Provide valid payment information (required even for free tiers)"
echo "5. Accept the subscription agreement"
echo ""
read -p "Press Enter when you're ready to open the signup URL..." READY

# Try to open the URL if possible
if command -v open &> /dev/null; then
    open "$SIGNUP_URL"
elif command -v xdg-open &> /dev/null; then
    xdg-open "$SIGNUP_URL"
elif command -v start &> /dev/null; then
    start "$SIGNUP_URL"
else
    echo -e "${YELLOW}Please manually copy and open this URL:${NC} $SIGNUP_URL"
fi

echo -e "\n${CYAN}Completing signup in the browser...${NC}"
read -p "Press Enter once you've completed the signup process..." COMPLETED

# Step 5: Verify new subscription
echo -e "\n${YELLOW}Step 5: Verify your new subscription...${NC}"
echo ""
echo -e "${BOLD}Let's verify your new subscription:${NC}"
echo "1. Login to the Azure portal at: ${BLUE}https://portal.azure.com${NC}"
echo "2. Navigate to Subscriptions to see your new subscription"
echo "3. Check that you have both Owner and billing access"
echo ""

echo -e "${CYAN}Would you like to log in with your new account via Azure CLI now?${NC}"
read -p "Log in now? (y/n): " LOGIN_NOW

if [[ "$LOGIN_NOW" == "y" || "$LOGIN_NOW" == "Y" ]]; then
    echo "Initiating Azure CLI login with your new account..."
    az login
    
    # Check if login succeeded
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Successfully logged in${NC}"
        echo ""
        echo "Your subscriptions:"
        az account list --query "[].{Name:name, SubscriptionId:id, State:state, IsDefault:isDefault}" --output table
        
        echo ""
        echo "Checking your role assignments:"
        CURRENT_USER=$(az ad signed-in-user show --query userPrincipalName -o tsv 2>/dev/null)
        if [ -z "$CURRENT_USER" ]; then
            CURRENT_USER=$(az account show --query user.name -o tsv)
        fi
        
        az role assignment list --include-classic-administrators --query "[?principalName=='$CURRENT_USER'].roleDefinitionName" -o tsv
        
        echo ""
        echo "Checking billing access:"
        az billing account list &>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ You have billing access${NC}"
        else
            echo -e "${YELLOW}! Billing access verification might require some time to propagate${NC}"
            echo "  Try again in 10-15 minutes if you're expecting billing access"
        fi
    else
        echo -e "${RED}Login failed. Please try manually later.${NC}"
    fi
else
    echo "Skipping CLI login. You can log in later with: az login"
fi

# Step 6: Final recommendations
echo -e "\n${YELLOW}Step 6: Final recommendations...${NC}"
echo "====================================================="
echo -e "${BOLD}Congratulations on your new Azure subscription!${NC}"
echo ""
echo -e "${BOLD}Recommended next steps:${NC}"
echo "1. Set up Multi-Factor Authentication (MFA) for security"
echo "2. Create a resource group for your project's resources"
echo "3. Configure budget alerts to avoid unexpected charges"
echo "4. Document your subscription details for future reference"
echo ""

if [ "$SUB_DESC" == "Free trial" ]; then
    echo -e "${CYAN}TIP: Your free trial includes $200 credit valid for 30 days.${NC}"
    echo "Plan your Azure resource usage accordingly to maximize this credit."
fi

# Create resource group option
echo -e "\n${CYAN}Would you like to create a resource group now?${NC}"
read -p "Create resource group? (y/n): " CREATE_RG

if [[ "$CREATE_RG" == "y" || "$CREATE_RG" == "Y" ]]; then
    echo ""
    read -p "Enter a name for your resource group: " RG_NAME
    echo "Available locations:"
    az account list-locations --query "[].{DisplayName:displayName, Name:name}" --output table | head -n 10
    echo "..."
    read -p "Enter location (e.g., eastus, westeurope): " RG_LOCATION
    
    echo "Creating resource group..."
    az group create --name "$RG_NAME" --location "$RG_LOCATION"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Resource group created successfully${NC}"
    else
        echo -e "${RED}Failed to create resource group. Please try manually later.${NC}"
    fi
fi

echo ""
echo "====================================================="
echo -e "${BOLD}Your new Azure subscription setup is complete!${NC}"
echo ""
echo -e "For migration guidance, see: ${BLUE}AZURE_NEW_SUBSCRIPTION.md${NC}"
echo ""