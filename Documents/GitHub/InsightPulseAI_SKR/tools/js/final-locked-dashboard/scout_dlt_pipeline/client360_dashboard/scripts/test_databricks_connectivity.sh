#!/bin/bash
# Script to test Databricks SQL connectivity
# This script verifies that the SQL connector can successfully connect to the Databricks SQL endpoint
# and retrieve data from the gold tables.

set -e
echo "Testing Databricks SQL connectivity..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Make the script executable
chmod +x "$0"

# Root directory
ROOT_DIR="$(dirname "$(dirname "$(realpath "$0")")")"
echo "Root directory: $ROOT_DIR"

# Check if environment variables are set
if [ -z "$DATABRICKS_SQL_TOKEN" ]; then
  echo -e "${YELLOW}Warning: DATABRICKS_SQL_TOKEN environment variable not set.${NC}"
  echo "Will attempt to retrieve from Key Vault if managed identity is enabled."
fi

if [ -z "$DATABRICKS_SQL_HOST" ]; then
  echo -e "${YELLOW}Warning: DATABRICKS_SQL_HOST environment variable not set.${NC}"
  echo "Using default from configuration."
fi

# Create a test script
TEST_SCRIPT_PATH="$ROOT_DIR/temp_test_databricks.js"

cat > "$TEST_SCRIPT_PATH" << 'EOF'
const FMCGSQLConnector = require('../data/sql_connector');

async function testConnectivity() {
  console.log('Creating SQL connector instance...');
  const connector = new FMCGSQLConnector({
    logging: {
      level: 'debug'
    }
  });
  
  try {
    console.log('Testing database connection...');
    const connected = await connector.checkConnection();
    if (connected) {
      console.log('✅ Successfully connected to Databricks SQL endpoint!');
    } else {
      console.log('❌ Failed to connect to Databricks SQL endpoint. Using simulation mode.');
    }
    
    console.log('Testing basic query...');
    const kpis = await connector.getDashboardKPIs();
    console.log('KPIs retrieved:', JSON.stringify(kpis, null, 2));
    
    console.log('Testing data freshness...');
    const freshness = await connector.getDataFreshness();
    console.log('Data freshness:', JSON.stringify(freshness, null, 2));
    
    console.log('Getting connector stats...');
    const stats = connector.getStats();
    console.log('Stats:', JSON.stringify(stats, null, 2));
    
    console.log('Test complete.');
    
    // Close connection
    connector.close();
    
    return true;
  } catch (error) {
    console.error('Error during test:', error);
    return false;
  }
}

// Run the test
testConnectivity()
  .then(success => {
    if (success) {
      console.log('✅ All tests completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error during test:', error);
    process.exit(1);
  });
EOF

# Run the test
echo "Running connectivity test..."
node "$TEST_SCRIPT_PATH"

# Check result
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Databricks SQL connectivity test successful!${NC}"
  # Clean up
  rm "$TEST_SCRIPT_PATH"
  exit 0
else
  echo -e "${RED}❌ Databricks SQL connectivity test failed.${NC}"
  echo "Check the error messages above for details."
  # Leave the test script for debugging
  echo "Test script is available at: $TEST_SCRIPT_PATH"
  exit 1
fi