#!/usr/bin/env node
/**
 * PH Awards Database Deployment Script
 * Uses Node.js with mssql package to deploy tables to Azure SQL
 */

// Install required packages if not already installed
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}===== PH AWARDS NODE.JS DEPLOYMENT =====${colors.reset}`);

// Check if mssql is installed
try {
  console.log(`${colors.blue}Checking for mssql package...${colors.reset}`);
  require.resolve('mssql');
  console.log(`${colors.green}mssql package is already installed.${colors.reset}`);
} catch (e) {
  console.log(`${colors.yellow}mssql package not found. Installing...${colors.reset}`);
  try {
    execSync('npm install mssql tedious', { stdio: 'inherit' });
    console.log(`${colors.green}mssql package installed successfully.${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}Failed to install mssql package:${colors.reset}`, err.message);
    console.log(`${colors.yellow}Please follow the manual setup instructions.${colors.reset}`);
    process.exit(1);
  }
}

// Now import the mssql package
const sql = require('mssql');

// Database connection config
const config = {
  server: 'tbwa-ces-model-server.database.windows.net',
  database: 'CESDatabank',
  user: 'TBWA',
  password: 'R@nd0mPA$$2025!',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// Read SQL schema file
const schemaPath = '/Users/tbwa/ph_awards_schema.sql';
let schemaContent;
try {
  schemaContent = fs.readFileSync(schemaPath, 'utf8');
  console.log(`${colors.green}Successfully read schema file.${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}Failed to read schema file:${colors.reset}`, err.message);
  process.exit(1);
}

// Split the schema into individual commands by GO statements
const commands = schemaContent
  .split(/\nGO\s*\n/i)
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0);

console.log(`${colors.blue}Extracted ${commands.length} SQL commands from schema.${colors.reset}`);

// Connect to database and execute commands
async function deploySchema() {
  console.log(`${colors.blue}Connecting to database...${colors.reset}`);
  console.log(`${colors.yellow}Server: ${config.server}${colors.reset}`);
  console.log(`${colors.yellow}Database: ${config.database}${colors.reset}`);
  
  try {
    // Connect to SQL Server
    await sql.connect(config);
    console.log(`${colors.green}Connected to database!${colors.reset}`);
    
    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`${colors.blue}Executing command ${i+1}/${commands.length}...${colors.reset}`);
      
      try {
        const result = await sql.query(command);
        console.log(`${colors.green}Command ${i+1} executed successfully.${colors.reset}`);
        
        // If there's a recordset, show it
        if (result.recordset && result.recordset.length > 0) {
          console.log(`${colors.yellow}Result:${colors.reset}`, result.recordset);
        }
      } catch (err) {
        console.error(`${colors.red}Error executing command ${i+1}:${colors.reset}`, err.message);
        console.log(`${colors.yellow}Continuing with next command...${colors.reset}`);
      }
    }
    
    // Verify tables were created
    console.log(`${colors.blue}Verifying tables...${colors.reset}`);
    try {
      const tableResult = await sql.query("SELECT name, create_date FROM sys.tables WHERE name LIKE 'PH_%'");
      
      if (tableResult.recordset && tableResult.recordset.length > 0) {
        console.log(`${colors.green}Successfully created tables:${colors.reset}`);
        tableResult.recordset.forEach(table => {
          console.log(`${colors.green}- ${table.name} (created on ${table.create_date})${colors.reset}`);
        });
      } else {
        console.log(`${colors.red}No PH_ tables found in the database.${colors.reset}`);
      }
    } catch (err) {
      console.error(`${colors.red}Error verifying tables:${colors.reset}`, err.message);
    }
    
    // Close connection
    await sql.close();
    console.log(`${colors.green}Database connection closed.${colors.reset}`);
    
    // Run data import
    console.log(`${colors.blue}Running data import script...${colors.reset}`);
    try {
      execSync('python3 /Users/tbwa/import_ph_awards_data.py /Users/tbwa/analysis_results', { stdio: 'inherit' });
      console.log(`${colors.green}Data import completed.${colors.reset}`);
    } catch (err) {
      console.error(`${colors.red}Data import failed:${colors.reset}`, err.message);
    }
    
    // Run verification
    console.log(`${colors.blue}Running verification script...${colors.reset}`);
    try {
      execSync('python3 /Users/tbwa/verify_ph_awards_setup.py', { stdio: 'inherit' });
      console.log(`${colors.green}Verification completed.${colors.reset}`);
    } catch (err) {
      console.error(`${colors.red}Verification failed:${colors.reset}`, err.message);
    }
    
  } catch (err) {
    console.error(`${colors.red}Database connection failed:${colors.reset}`, err.message);
    console.log(`${colors.yellow}Falling back to manual deployment...${colors.reset}`);
    
    // Open Azure Portal
    try {
      execSync('open "https://portal.azure.com/#@outlook.com/resource/subscriptions/c03c092c-443c-4f25-9efe-33f092621251/resourceGroups/RG-TBWA-ProjectScout-Data/providers/Microsoft.Sql/servers/tbwa-ces-model-server/databases/CESDatabank/queryEditor"');
      
      // Copy SQL script to clipboard
      try {
        execSync(`cat "${schemaPath}" | pbcopy`);
        console.log(`${colors.green}SQL script copied to clipboard.${colors.reset}`);
      } catch (clipErr) {
        console.error(`${colors.red}Could not copy to clipboard:${colors.reset}`, clipErr.message);
      }
    } catch (openErr) {
      console.error(`${colors.red}Could not open Azure Portal:${colors.reset}`, openErr.message);
    }
    
    // Display instructions
    console.log(`${colors.blue}===== MANUAL DEPLOYMENT STEPS =====${colors.reset}`);
    console.log(`${colors.yellow}1. Open Azure Portal Query Editor${colors.reset}`);
    console.log(`${colors.yellow}2. Paste the SQL script from clipboard${colors.reset}`);
    console.log(`${colors.yellow}3. Click Run to execute the script${colors.reset}`);
    console.log(`${colors.yellow}4. After tables are created, run:${colors.reset}`);
    console.log(`${colors.green}   python3 /Users/tbwa/import_ph_awards_data.py /Users/tbwa/analysis_results${colors.reset}`);
  }
}

// Run the deployment
deploySchema().catch(err => {
  console.error(`${colors.red}Deployment failed:${colors.reset}`, err.message);
  process.exit(1);
});