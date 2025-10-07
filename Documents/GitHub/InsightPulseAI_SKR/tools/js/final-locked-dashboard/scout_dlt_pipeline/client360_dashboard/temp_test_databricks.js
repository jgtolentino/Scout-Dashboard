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
