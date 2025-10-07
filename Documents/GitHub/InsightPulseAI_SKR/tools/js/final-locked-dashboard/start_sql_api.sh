#!/bin/bash

# Start the SQL API server
# This script starts the SQL API server for the Retail Advisor dashboard

# Set environment variables for database connection
# In production, these should be set in a secure way
export DB_USER="retail_advisor_user"
export DB_PASSWORD="your_password_here"
export DB_SERVER="retail-advisor-sql.database.windows.net"
export DB_NAME="RetailAdvisorDB"
export PORT=3001

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
  echo "Installing dependencies..."
  npm install express cors mssql
fi

# Start the server
echo "Starting SQL API server on port $PORT..."
node sql_api.js

# This script will continue running until the server is stopped
# To stop the server, press Ctrl+C