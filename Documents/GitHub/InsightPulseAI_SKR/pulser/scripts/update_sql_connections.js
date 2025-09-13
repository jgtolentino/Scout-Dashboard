/**
 * SQL Server Consolidation - Connection String Updater
 * 
 * This script updates connection strings in configuration files to point
 * to the consolidated SQL server. It's part of the SQL server consolidation
 * project to migrate from multiple SQL servers to a single instance.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const readline = require('readline');

// Configuration for SQL server consolidation
const SQL_SERVER_CONFIG = {
  // Target consolidated server
  targetServer: 'sqltbwaprojectscoutserver.database.windows.net',
  
  // Source servers to be consolidated
  sourceServers: [
    'retail-advisor-sql.database.windows.net',
    'scout-edge-sql.database.windows.net'
  ],
  
  // Database mappings (source database -> target database)
  databaseMapping: {
    'RetailAdvisorDB': 'RetailAdvisorDB', // Same name on target
    'RetailAdvisor': 'RetailAdvisor'      // Same name on target
  },
  
  // Files to update (relative to project root)
  filesToUpdate: [
    'final-locked-dashboard/js/sql_connector.js',
    'final-locked-dashboard/run_sql_api.sh',
    'final-locked-dashboard/start_sql_api.sh',
    'final-locked-dashboard/scripts/config.json',
    'final-locked-dashboard/query_sales_data.js'
  ],
  
  // Directories to search for additional SQL connection references
  directoriesToSearch: [
    'juicer-stack/notebooks',
    'utils/ml-resources',
    'final-locked-dashboard'
  ],
  
  // File patterns to match when searching
  filePatterns: [
    '*.js',
    '*.sh',
    '*.json',
    '*.sql',
    '*.py',
    '*.md'
  ]
};

// Get project root directory
function getProjectRoot() {
  return path.resolve(__dirname, '..');
}

// Backup a file before modifying it
function backupFile(filePath) {
  const backupPath = `${filePath}.bak`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup: ${backupPath}`);
}

// Update a text file with SQL server references
function updateTextFile(filePath, sourceServers, targetServer) {
  try {
    backupFile(filePath);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Replace each source server with the target server
    sourceServers.forEach(sourceServer => {
      if (content.includes(sourceServer)) {
        const regex = new RegExp(sourceServer.replace('.', '\\.'), 'g');
        content = content.replace(regex, targetServer);
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
      return true;
    } else {
      console.log(`No updates needed for: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

// Update a JSON config file with SQL server references
function updateJsonFile(filePath, sourceServers, targetServer) {
  try {
    backupFile(filePath);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);
    let updated = false;
    
    // Recursive function to update properties in an object
    function updateObject(obj) {
      if (!obj || typeof obj !== 'object') return false;
      
      let objUpdated = false;
      
      // If it's an array, check each item
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const itemUpdated = updateObject(obj[i]);
          objUpdated = objUpdated || itemUpdated;
        }
      } else {
        // Check each property in the object
        for (const key in obj) {
          // If value is a string, check for server references
          if (typeof obj[key] === 'string') {
            sourceServers.forEach(sourceServer => {
              if (obj[key].includes(sourceServer)) {
                obj[key] = obj[key].replace(sourceServer, targetServer);
                objUpdated = true;
              }
            });
          } 
          // If value is an object, recursively update it
          else if (typeof obj[key] === 'object') {
            const propUpdated = updateObject(obj[key]);
            objUpdated = objUpdated || propUpdated;
          }
        }
      }
      
      return objUpdated;
    }
    
    // Update the JSON object
    updated = updateObject(config);
    
    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
      console.log(`Updated: ${filePath}`);
      return true;
    } else {
      console.log(`No updates needed for: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

// Find files that might contain SQL server references
function findSqlReferences(directories, patterns, sourceServers) {
  const projectRoot = getProjectRoot();
  const filesToCheck = [];
  
  directories.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    
    patterns.forEach(pattern => {
      const files = glob.sync(path.join(dirPath, '**', pattern));
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check if file contains any of the source servers
          const containsServerRef = sourceServers.some(server => content.includes(server));
          
          if (containsServerRef) {
            filesToCheck.push(path.relative(projectRoot, file));
          }
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
        }
      });
    });
  });
  
  return filesToCheck;
}

// Update all files with new SQL server references
function updateAllFiles(filesToUpdate, sourceServers, targetServer) {
  const projectRoot = getProjectRoot();
  const updatedFiles = [];
  
  filesToUpdate.forEach(file => {
    const filePath = path.join(projectRoot, file);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
      }
      
      // Check file extension to determine processing method
      const ext = path.extname(file).toLowerCase();
      let updated = false;
      
      if (ext === '.json') {
        updated = updateJsonFile(filePath, sourceServers, targetServer);
      } else {
        updated = updateTextFile(filePath, sourceServers, targetServer);
      }
      
      if (updated) {
        updatedFiles.push(file);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  });
  
  return updatedFiles;
}

// Main execution
async function main() {
  console.log('SQL Server Consolidation - Connection String Updater');
  console.log('===================================================');
  console.log(`Target SQL Server: ${SQL_SERVER_CONFIG.targetServer}`);
  console.log(`Source SQL Servers: ${SQL_SERVER_CONFIG.sourceServers.join(', ')}`);
  console.log('');
  
  const projectRoot = getProjectRoot();
  
  // Confirm before proceeding
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Do you want to find additional files with SQL server references? (y/n) ', async (answer) => {
    let filesToUpdate = [...SQL_SERVER_CONFIG.filesToUpdate];
    
    if (answer.toLowerCase() === 'y') {
      console.log('Searching for additional SQL server references...');
      const additionalFiles = findSqlReferences(
        SQL_SERVER_CONFIG.directoriesToSearch,
        SQL_SERVER_CONFIG.filePatterns,
        SQL_SERVER_CONFIG.sourceServers
      );
      
      console.log(`Found ${additionalFiles.length} additional files with SQL server references`);
      
      if (additionalFiles.length > 0) {
        console.log('Additional files:');
        additionalFiles.forEach(file => console.log(`- ${file}`));
        console.log('');
        
        // Add additional files to the list
        filesToUpdate = [...new Set([...filesToUpdate, ...additionalFiles])];
      }
    }
    
    rl.question(`Update ${filesToUpdate.length} files with new SQL server references? (y/n) `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('Updating files...');
        const updatedFiles = updateAllFiles(
          filesToUpdate,
          SQL_SERVER_CONFIG.sourceServers,
          SQL_SERVER_CONFIG.targetServer
        );
        
        console.log('');
        console.log(`Updated ${updatedFiles.length} files`);
        
        if (updatedFiles.length > 0) {
          console.log('Updated files:');
          updatedFiles.forEach(file => console.log(`- ${file}`));
        }
      } else {
        console.log('Update cancelled');
      }
      
      rl.close();
    });
  });
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  updateAllFiles,
  findSqlReferences,
  updateTextFile,
  updateJsonFile
};