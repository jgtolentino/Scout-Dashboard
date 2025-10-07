#!/bin/bash

# Run SQL API server for the Retail Advisor Dashboard
# This script launches the SQL API server that provides data for the dashboard

# Set environment variables for configuration
export PORT=3001 # API server port
export DB_SERVER="retail-advisor-sql.database.windows.net" # Database server
export DB_NAME="RetailAdvisorDB" # Database name
export DB_USER="retail_advisor_user" # Database user
export DB_PASSWORD="your_password_here" # Database password (should be set via environment variable in production)

# Display script header
echo "==================================================="
echo "     Retail Advisor Dashboard SQL API Server        "
echo "==================================================="
echo ""
echo "Starting SQL API server on port $PORT..."
echo "Using database: $DB_NAME on $DB_SERVER"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH."
    echo "Please install Node.js before running this script."
    exit 1
fi

# Check if required npm packages are installed
echo "Checking required npm packages..."
REQUIRED_PACKAGES=("express" "cors" "mssql")
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

# Create simulated data directory if it doesn't exist
if [ ! -d "./assets/data/simulated" ]; then
    echo "Creating simulated data directory..."
    mkdir -p "./assets/data/simulated"
fi

# Run the SQL API server
echo "Starting SQL API server..."
node sql_api.js

# Handle errors
if [ $? -ne 0 ]; then
    echo "Error: Failed to start SQL API server."
    exit 1
fi