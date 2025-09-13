/**
 * SQL Migration Runner for Project Scout
 * 
 * This script runs the session matching enhancement migration script
 * using the project's SQL connector.
 */

const fs = require('fs');
const path = require('path');
const SQLConnector = require('./final-locked-dashboard/js/sql_connector');

// Create SQL connector instance
const sqlConnector = new SQLConnector({
  // Override default connection settings if needed
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  // server: process.env.DB_SERVER,
  // database: process.env.DB_NAME
});

async function runMigration() {
  try {
    console.log('Reading migration script...');
    const migrationScriptPath = path.join(__dirname, 'final-locked-dashboard', 'sql', 'session_matching_enhancement.sql');
    const migrationScript = fs.readFileSync(migrationScriptPath, 'utf8');
    
    console.log('Connecting to database...');
    await sqlConnector.connect();
    
    console.log('Executing migration script...');
    console.log('This may take a while. Please wait...');
    
    // Execute the migration script
    await sqlConnector.executeQuery(
      'SessionMatchingEnhancementMigration',
      migrationScript,
      {},
      false // Don't use cache
    );
    
    console.log('Migration completed successfully!');
    console.log('Project Scout schema has been enhanced with session matching capabilities.');
    
  } catch (err) {
    console.error('Error executing migration:', err);
    
    // Provide some guidance based on common errors
    if (err.message && err.message.includes('Login failed')) {
      console.error('\nDatabase authentication failed. Please check your connection credentials.');
      console.error('You may need to set the following environment variables:');
      console.error('  DB_USER - Database username');
      console.error('  DB_PASSWORD - Database password');
      console.error('  DB_SERVER - Database server address');
      console.error('  DB_NAME - Database name');
    } else if (err.message && err.message.includes('network-related')) {
      console.error('\nCould not connect to the database server.');
      console.error('Please check if the server is running and accessible.');
    } else if (err.message && err.message.includes('already exists')) {
      console.error('\nSome database objects already exist.');
      console.error('You may need to drop existing objects before running the migration again.');
    }
    
  } finally {
    // Close the database connection
    if (sqlConnector.connected) {
      console.log('Closing database connection...');
      await sqlConnector.close();
    }
  }
}

// Run the migration
runMigration().catch(console.error);