#!/bin/bash

# Alternative user creation using sqlcmd
echo "🔄 Creating TBWA Admin User via sqlcmd"
echo "======================================"

# Set variables
SERVER="sqltbwaprojectscoutserver.database.windows.net"
DATABASE="SQL-TBWA-ProjectScout-Reporting-Prod"
ADMIN_USER="sqladmin"  # Try with existing admin
NEW_USER="tbwa_admin"
NEW_PASSWORD="R@nd0mPA$$2025!"

echo "📋 Using sqlcmd approach..."
echo "   Server: $SERVER"
echo "   Database: $DATABASE"
echo ""

# Check if sqlcmd is available
if ! command -v sqlcmd &> /dev/null; then
    echo "📦 Installing sqlcmd..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
        brew update
        HOMEBREW_NO_ENV_FILTERING=1 ACCEPT_EULA=Y brew install msodbcsql17 mssql-tools
    else
        # Linux
        curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
        curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
        sudo apt-get update
        sudo ACCEPT_EULA=Y apt-get install -y msodbcsql17 mssql-tools
    fi
fi

# Try to connect and create user
echo "🔐 Attempting to create user with sqlcmd..."

# Create login in master database
sqlcmd -S "$SERVER" -d "master" -U "$ADMIN_USER" -P "$NEW_PASSWORD" -Q "CREATE LOGIN [$NEW_USER] WITH PASSWORD = '$NEW_PASSWORD';" -l 30

# Create user in target database
sqlcmd -S "$SERVER" -d "$DATABASE" -U "$ADMIN_USER" -P "$NEW_PASSWORD" -Q "CREATE USER [$NEW_USER] FOR LOGIN [$NEW_USER];" -l 30

# Grant permissions
sqlcmd -S "$SERVER" -d "$DATABASE" -U "$ADMIN_USER" -P "$NEW_PASSWORD" -Q "ALTER ROLE db_datareader ADD MEMBER [$NEW_USER]; ALTER ROLE db_datawriter ADD MEMBER [$NEW_USER]; ALTER ROLE db_ddladmin ADD MEMBER [$NEW_USER]; GRANT CREATE TABLE TO [$NEW_USER];" -l 30

echo "✅ sqlcmd user creation attempted"
echo "🧪 Testing connection..."

# Test the connection
node test-new-user.js