#!/bin/bash

# Create Azure SQL user using Azure CLI
echo "🚀 Creating TBWA Admin User via Azure CLI"
echo "========================================="

# Set variables
SERVER_NAME="sqltbwaprojectscoutserver"
DATABASE_NAME="SQL-TBWA-ProjectScout-Reporting-Prod"
RESOURCE_GROUP="rg-tbwa-projectscout"
NEW_USER="tbwa_admin"
NEW_PASSWORD="R@nd0mPA$$2025!"

echo "📋 Configuration:"
echo "   Server: $SERVER_NAME"
echo "   Database: $DATABASE_NAME"
echo "   New User: $NEW_USER"
echo ""

# Check if logged in to Azure
echo "🔐 Checking Azure CLI authentication..."
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure CLI"
    echo "Please run: az login"
    exit 1
fi

echo "✅ Azure CLI authenticated"
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "   Subscription: $SUBSCRIPTION"
echo ""

# Create login at server level (master database)
echo "👤 Creating login in master database..."
az sql db query \
    --server "$SERVER_NAME" \
    --database "master" \
    --query "CREATE LOGIN [$NEW_USER] WITH PASSWORD = '$NEW_PASSWORD';" \
    --output table

if [ $? -eq 0 ]; then
    echo "✅ Login created successfully"
else
    echo "⚠️  Login might already exist or error occurred"
fi

echo ""

# Create user in target database
echo "👥 Creating user in target database..."
az sql db query \
    --server "$SERVER_NAME" \
    --database "$DATABASE_NAME" \
    --query "CREATE USER [$NEW_USER] FOR LOGIN [$NEW_USER];" \
    --output table

if [ $? -eq 0 ]; then
    echo "✅ User created successfully"
else
    echo "⚠️  User might already exist or error occurred"
fi

echo ""

# Grant permissions
echo "🔑 Granting permissions..."

# Data reader permission
az sql db query \
    --server "$SERVER_NAME" \
    --database "$DATABASE_NAME" \
    --query "ALTER ROLE db_datareader ADD MEMBER [$NEW_USER];" \
    --output table

# Data writer permission  
az sql db query \
    --server "$SERVER_NAME" \
    --database "$DATABASE_NAME" \
    --query "ALTER ROLE db_datawriter ADD MEMBER [$NEW_USER];" \
    --output table

# DDL admin permission
az sql db query \
    --server "$SERVER_NAME" \
    --database "$DATABASE_NAME" \
    --query "ALTER ROLE db_ddladmin ADD MEMBER [$NEW_USER];" \
    --output table

# Table creation permission
az sql db query \
    --server "$SERVER_NAME" \
    --database "$DATABASE_NAME" \
    --query "GRANT CREATE TABLE TO [$NEW_USER];" \
    --output table

echo "✅ Permissions granted"
echo ""

# Test the new user
echo "🧪 Testing new user connection..."
node test-new-user.js

echo ""
echo "🎉 User creation complete!"
echo "Ready to populate TBWA campaign data"