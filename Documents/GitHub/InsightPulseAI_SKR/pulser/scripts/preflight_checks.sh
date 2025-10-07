#!/bin/bash
set -euo pipefail

# 🔍 Pre-flight checks for production deployment
# Comprehensive validation of tools, credentials, and environment

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Pre-flight Checks Starting...${NC}"
echo "================================================================"

# Track overall status
PREFLIGHT_PASSED=true

check_command() {
    local cmd=$1
    local name=$2
    local install_hint=$3
    
    if command -v "$cmd" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $name installed${NC}"
        return 0
    else
        echo -e "${RED}❌ $name not found${NC}"
        echo -e "${YELLOW}   Install with: $install_hint${NC}"
        PREFLIGHT_PASSED=false
        return 1
    fi
}

check_version() {
    local cmd=$1
    local version_cmd=$2
    local min_version=$3
    local name=$4
    
    if command -v "$cmd" >/dev/null 2>&1; then
        local current_version=$($version_cmd 2>/dev/null | head -1)
        echo -e "${GREEN}✅ $name: $current_version${NC}"
        return 0
    else
        echo -e "${RED}❌ $name version check failed${NC}"
        PREFLIGHT_PASSED=false
        return 1
    fi
}

check_env_var() {
    local var_name=$1
    local description=$2
    local required=${3:-true}
    
    if [[ -n "${!var_name:-}" ]]; then
        local value="${!var_name}"
        local masked_value="${value:0:8}...${value: -4}"
        echo -e "${GREEN}✅ $var_name set ($masked_value)${NC}"
        return 0
    else
        if [[ "$required" == "true" ]]; then
            echo -e "${RED}❌ $var_name not set${NC}"
            echo -e "${YELLOW}   $description${NC}"
            PREFLIGHT_PASSED=false
            return 1
        else
            echo -e "${YELLOW}⚠️  $var_name not set (optional)${NC}"
            return 0
        fi
    fi
}

echo -e "${BLUE}1️⃣ Checking Required Tools...${NC}"
check_command "az" "Azure CLI" "curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
check_command "func" "Azure Functions Core Tools" "npm install -g azure-functions-core-tools@4"
check_command "node" "Node.js" "https://nodejs.org/ or use nvm"
check_command "npm" "npm" "Comes with Node.js"
check_command "gh" "GitHub CLI" "https://cli.github.com/"
check_command "git" "Git" "https://git-scm.com/"
check_command "curl" "curl" "sudo apt-get install curl"
check_command "jq" "jq" "sudo apt-get install jq"

echo ""
echo -e "${BLUE}2️⃣ Checking Tool Versions...${NC}"
check_version "node" "node --version" "v20" "Node.js"
check_version "npm" "npm --version" "9" "npm"
check_version "az" "az --version | head -1" "2.50" "Azure CLI"

# Check Node.js version specifically
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)
    if [[ "$MAJOR_VERSION" -ge 20 ]]; then
        echo -e "${GREEN}✅ Node.js version $NODE_VERSION (>=20 required)${NC}"
    else
        echo -e "${RED}❌ Node.js version $NODE_VERSION (<20 required)${NC}"
        echo -e "${YELLOW}   Install Node.js 20+ from https://nodejs.org/${NC}"
        PREFLIGHT_PASSED=false
    fi
fi

echo ""
echo -e "${BLUE}3️⃣ Checking Authentication...${NC}"

# Azure login check
if az account show >/dev/null 2>&1; then
    ACCOUNT_NAME=$(az account show --query user.name -o tsv 2>/dev/null || echo "Unknown")
    SUBSCRIPTION_NAME=$(az account show --query name -o tsv 2>/dev/null || echo "Unknown")
    echo -e "${GREEN}✅ Azure CLI logged in as: $ACCOUNT_NAME${NC}"
    echo -e "${GREEN}   Subscription: $SUBSCRIPTION_NAME${NC}"
else
    echo -e "${RED}❌ Azure CLI not logged in${NC}"
    echo -e "${YELLOW}   Run: az login${NC}"
    PREFLIGHT_PASSED=false
fi

# GitHub authentication check
if gh auth status >/dev/null 2>&1; then
    GH_USER=$(gh api user --jq .login 2>/dev/null || echo "Unknown")
    echo -e "${GREEN}✅ GitHub CLI authenticated as: $GH_USER${NC}"
else
    echo -e "${RED}❌ GitHub CLI not authenticated${NC}"
    echo -e "${YELLOW}   Run: gh auth login${NC}"
    PREFLIGHT_PASSED=false
fi

echo ""
echo -e "${BLUE}4️⃣ Checking Environment Variables...${NC}"

# Required environment variables
check_env_var "AZURE_OPENAI_KEY" "Set with: export AZURE_OPENAI_KEY=your_key" true
check_env_var "AZURE_OPENAI_ENDPOINT" "Set with: export AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com" true

# Optional environment variables
check_env_var "AZURE_SUBSCRIPTION_ID" "Azure subscription ID (optional)" false
check_env_var "AZURE_TENANT_ID" "Azure tenant ID (optional)" false

echo ""
echo -e "${BLUE}5️⃣ Checking Repository Status...${NC}"

if git rev-parse --git-dir >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Git repository detected${NC}"
    
    # Check if we're on main branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$CURRENT_BRANCH" == "main" ]]; then
        echo -e "${GREEN}✅ On main branch${NC}"
    else
        echo -e "${YELLOW}⚠️  On branch: $CURRENT_BRANCH (main recommended for production)${NC}"
    fi
    
    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        echo -e "${GREEN}✅ No uncommitted changes${NC}"
    else
        echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
        echo -e "${YELLOW}   Consider committing changes before deployment${NC}"
    fi
    
    # Check if remote is up to date
    if git status --porcelain=v1 2>/dev/null | grep -q "^##.*behind"; then
        echo -e "${YELLOW}⚠️  Local branch is behind remote${NC}"
        echo -e "${YELLOW}   Run: git pull${NC}"
    else
        echo -e "${GREEN}✅ Repository up to date${NC}"
    fi
else
    echo -e "${RED}❌ Not in a Git repository${NC}"
    PREFLIGHT_PASSED=false
fi

echo ""
echo -e "${BLUE}6️⃣ Checking Azure Resource Access...${NC}"

# Check if we can access the resource group
RESOURCE_GROUP="RG-TBWA-ProjectScout-Compute"
if az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Can access resource group: $RESOURCE_GROUP${NC}"
else
    echo -e "${YELLOW}⚠️  Resource group $RESOURCE_GROUP not found (will be created)${NC}"
fi

# Check quota limits (basic check)
SWA_COUNT=$(az staticwebapp list --query "length(@)" -o tsv 2>/dev/null || echo "0")
if [[ "$SWA_COUNT" -lt 10 ]]; then
    echo -e "${GREEN}✅ Static Web Apps quota OK ($SWA_COUNT/10 used)${NC}"
else
    echo -e "${YELLOW}⚠️  High Static Web Apps usage ($SWA_COUNT/10)${NC}"
fi

echo ""
echo "================================================================"

# Final status
if [[ "$PREFLIGHT_PASSED" == "true" ]]; then
    echo -e "${GREEN}🎉 All pre-flight checks passed!${NC}"
    echo -e "${GREEN}✅ Ready for production deployment${NC}"
    exit 0
else
    echo -e "${RED}❌ Pre-flight checks failed${NC}"
    echo -e "${RED}   Please resolve the issues above before deploying${NC}"
    echo ""
    echo -e "${YELLOW}📋 Quick fixes:${NC}"
    echo -e "${YELLOW}   1. Install missing tools${NC}"
    echo -e "${YELLOW}   2. Login to Azure: az login${NC}"
    echo -e "${YELLOW}   3. Login to GitHub: gh auth login${NC}"
    echo -e "${YELLOW}   4. Set environment variables${NC}"
    echo -e "${YELLOW}   5. Commit any pending changes${NC}"
    exit 1
fi