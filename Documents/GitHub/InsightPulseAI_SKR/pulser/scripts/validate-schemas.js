#!/usr/bin/env node

/**
 * Schema Validation Script
 * 
 * This script finds and validates all configuration files against their schemas.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Find all staticwebapp.config.json files
try {
  const staticwebappConfigs = fs.readdirSync('.').filter(file => 
    file.endsWith('staticwebapp.config.json'));
  
  console.log(`Found ${staticwebappConfigs.length} Static Web App config files`);

  let success = true;

  // Validate each one
  staticwebappConfigs.forEach(configPath => {
    try {
      console.log(`Validating ${configPath}...`);
      execSync(`npx ajv validate -s schemas/staticwebapp.schema.json -d ${configPath}`, { stdio: 'inherit' });
      console.log(`✅ ${configPath} is valid`);
    } catch (error) {
      console.error(`❌ ${configPath} is invalid`);
      success = false;
    }
  });

  // Find all DLT config files
  const dltConfigs = fs.readdirSync('.').filter(file => 
    file.endsWith('.dlt.json'));
  
  console.log(`\nFound ${dltConfigs.length} DLT config files`);

  // Validate each one
  dltConfigs.forEach(configPath => {
    try {
      console.log(`Validating ${configPath}...`);
      execSync(`npx ajv validate -s schemas/dlt.schema.json -d ${configPath}`, { stdio: 'inherit' });
      console.log(`✅ ${configPath} is valid`);
    } catch (error) {
      console.error(`❌ ${configPath} is invalid`);
      success = false;
    }
  });

  if (!success) {
    console.error('\n❌ Some schema validations failed');
    process.exit(1);
  } else {
    console.log('\n✅ All schema validations passed');
  }
} catch (error) {
  console.error(`Error scanning for config files: ${error.message}`);
}
