#!/bin/bash

# Manual Finalize Guardrails Script
# This script finalizes the guardrails implementation by setting up directory structure
# and making files executable, without git integration

set -e

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Ensure all directories exist
mkdir -p .github/workflows
mkdir -p .husky
mkdir -p .prompts
mkdir -p schemas

# Make all scripts executable
find scripts -name "*.js" -o -name "*.sh" | xargs chmod +x
find .husky -type f | xargs chmod +x 2>/dev/null || true

echo "Creating package.json scripts configuration..."
cat > package.json.example << 'EOF'
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint \"**/*.{js,jsx,ts,tsx}\"",
    "lint:fix": "eslint --fix \"**/*.{js,jsx,ts,tsx}\"",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "validate:schemas": "node scripts/validate-schemas.js"
  },
  "devDependencies": {
    "eslint": "^8.45.0",
    "prettier": "^3.0.0",
    "stylelint": "^15.10.1",
    "stylelint-config-standard": "^34.0.0",
    "husky": "^8.0.3",
    "ajv": "^8.12.0",
    "ajv-cli": "^5.0.0",
    "jest": "^29.6.1"
  }
}
EOF

# Create a validate-schemas.js script
echo "Creating schema validation script..."
cat > scripts/validate-schemas.js << 'EOF'
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
EOF

chmod +x scripts/validate-schemas.js

# Create a lint-staged configuration example
echo "Creating lint-staged configuration example..."
cat > .lintstagedrc.json.example << 'EOF'
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{css,scss}": [
    "stylelint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ],
  "staticwebapp.config.json": [
    "npx ajv validate -s schemas/staticwebapp.schema.json -d"
  ],
  "*.dlt.json": [
    "npx ajv validate -s schemas/dlt.schema.json -d"
  ]
}
EOF

# Create .gitignore entries example
echo "Creating .gitignore entries example..."
cat > .gitignore.example << 'EOF'
# Guardrails ignore patterns
node_modules/
coverage/
.golden-baselines/
build-rollback/
build/
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

# Show summary
echo "
✅ Guardrails setup complete!

The following components have been set up:
1. Schema validation for configuration files
2. ESLint, Prettier, and StyleLint configurations
3. Feature flags system for canary deployments
4. Golden baseline tools for rollback
5. AI test feedback loop
6. Telemetry and alerting system

Example configuration files:
- package.json.example - Add these scripts to your package.json
- .lintstagedrc.json.example - Configuration for lint-staged
- .gitignore.example - Additional entries for .gitignore

Review the README_GUARDRAILS.md file for usage instructions.
"

echo "Done!"