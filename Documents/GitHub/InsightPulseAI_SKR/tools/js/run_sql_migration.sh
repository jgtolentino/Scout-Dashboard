#!/bin/bash

# Run SQL Migration Script for Project Scout
# This script executes the session matching enhancement migration

# Set environment variables for database connection
# Uncomment and set these if needed (otherwise, defaults will be used)
# export DB_SERVER="retail-advisor-sql.database.windows.net"
# export DB_NAME="RetailAdvisorDB" 
# export DB_USER="retail_advisor_user"
# export DB_PASSWORD="your_password_here"

# Display script header
echo "==================================================="
echo "     Project Scout Schema Migration Script         "
echo "==================================================="
echo ""
echo "This script will enhance the database schema with:"
echo "- Session matching capabilities"
echo "- Transaction metrics"
echo "- Request method tracking"
echo "- Unbranded commodities support"
echo ""
echo "Warning: This is a significant database change."
echo "Make sure you have a database backup before proceeding."
echo ""

# Confirm before proceeding
read -p "Do you want to proceed with the migration? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH."
    echo "Please install Node.js before running this script."
    exit 1
fi

# Check if required npm packages are installed
echo "Checking required npm packages..."
REQUIRED_PACKAGES=("mssql")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! npm list -g "$package" &> /dev/null && ! npm list "$package" &> /dev/null; then
        MISSING_PACKAGES+=("$package")
    fi
done

# Install missing packages if needed
if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo "Installing missing packages: ${MISSING_PACKAGES[*]}"
    npm install --save "${MISSING_PACKAGES[@]}"
fi

# Run the migration script using the direct runner
echo "Running migration script..."
node run_sql_migration_direct.js

# Check script exit status
if [ $? -ne 0 ]; then
    echo "Error: Migration failed."
    exit 1
else
    echo "Migration completed successfully."
    echo ""
    echo "Next steps:"
    echo "1. Verify the changes in the dashboard"
    echo "2. Update any application code to use the new schema"
    echo "3. Update documentation with the new database schema"
fi