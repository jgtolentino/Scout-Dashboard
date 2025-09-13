#!/bin/bash

# Complete TBWA Campaign Intelligence Setup
echo "🚀 TBWA Campaign Intelligence - Complete Setup"
echo "=============================================="
echo ""

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install azure-cli
        else
            echo "Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    else
        # Linux
        curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    fi
fi

echo "✅ Azure CLI available"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first"
    exit 1
fi

echo "✅ Node.js available"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "✅ Dependencies ready"
echo ""

# Step 2: Azure authentication
echo "📋 Step 2: Azure authentication..."

if ! az account show &> /dev/null; then
    echo "🔐 Logging in to Azure..."
    az login
    
    if [ $? -ne 0 ]; then
        echo "❌ Azure login failed"
        exit 1
    fi
fi

echo "✅ Azure authenticated"
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "   Active subscription: $SUBSCRIPTION"
echo ""

# Step 3: Create database user
echo "📋 Step 3: Creating database user..."
chmod +x create-user-cli.sh
./create-user-cli.sh

if [ $? -ne 0 ]; then
    echo "❌ User creation failed"
    echo "💡 Trying alternative approach..."
    
    # Alternative: Use sqlcmd if available
    if command -v sqlcmd &> /dev/null; then
        echo "🔄 Using sqlcmd approach..."
        ./create-user-sqlcmd.sh
    else
        echo "❌ Cannot create user. Please run manually in Azure Portal"
        echo "   Use the commands in create-user-commands.sql"
        exit 1
    fi
fi

echo ""

# Step 4: Test connection
echo "📋 Step 4: Testing database connection..."
node test-new-user.js

if [ $? -ne 0 ]; then
    echo "❌ Connection test failed"
    echo "💡 Please check:"
    echo "   1. Azure SQL firewall rules"
    echo "   2. User creation success"
    echo "   3. Network connectivity"
    exit 1
fi

echo ""

# Step 5: Populate TBWA data
echo "📋 Step 5: Populating TBWA campaign data..."
node populate-tbwa-campaigns.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 COMPLETE SUCCESS!"
    echo "==================="
    echo "✅ User created: tbwa_admin"
    echo "✅ Database connection verified"
    echo "✅ TBWA campaign data populated"
    echo "✅ Intelligence tables created"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Start dashboard: npm run dev"
    echo "   2. Visit: http://localhost:3000"
    echo "   3. Check Campaign Intelligence section"
    echo ""
    echo "📊 Data Available:"
    echo "   • Campaign documents and metadata"
    echo "   • Echo-style creative analysis"
    echo "   • Kalaw-style business predictions"
    echo "   • Real-time metrics and insights"
else
    echo "❌ Data population failed"
    echo "Check the error messages above"
    exit 1
fi