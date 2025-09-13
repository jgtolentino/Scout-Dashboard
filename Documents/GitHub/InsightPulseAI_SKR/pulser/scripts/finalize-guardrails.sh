#!/bin/bash

# Finalize Guardrails Script
# This script finalizes the guardrails implementation by 
# setting up directory structure, making files executable, and
# preparing a Git commit.

set -e

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Ensure all directories exist
mkdir -p .github/workflows
mkdir -p .husky
mkdir -p .prompts
mkdir -p schemas

# Make all scripts executable
chmod +x scripts/*.js
chmod +x scripts/*.sh
chmod +x .husky/*

# Initialize husky if not already done
if [ ! -f .husky/_/husky.sh ]; then
  echo "Initializing Husky..."
  npx husky install
fi

# Install necessary dependencies
echo "Installing dependencies..."
npm install --save-dev \
  eslint \
  prettier \
  stylelint \
  stylelint-config-standard \
  husky \
  ajv \
  ajv-cli \
  jest

# Update package.json with scripts
echo "Updating package.json..."
node -e "
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Add or update scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'test': 'jest',
    'test:coverage': 'jest --coverage',
    'lint': 'eslint \"**/*.{js,jsx,ts,tsx}\"',
    'lint:fix': 'eslint --fix \"**/*.{js,jsx,ts,tsx}\"',
    'format': 'prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"',
    'format:check': 'prettier --check \"**/*.{js,jsx,ts,tsx,json,css,md}\"',
    'validate:schemas': 'node scripts/validate-schemas.js',
    'prepare': 'husky install'
  };
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
"

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
const glob = require('glob');

// Find all staticwebapp.config.json files
const staticwebappConfigs = glob.sync('**/staticwebapp.config.json');
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
const dltConfigs = glob.sync('**/*.dlt.json');
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
EOF

chmod +x scripts/validate-schemas.js

# Add husky hooks
echo "Setting up husky hooks..."
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/pre-push "npm test"

# Create a lint-staged configuration
echo "Creating lint-staged configuration..."
cat > .lintstagedrc.json << 'EOF'
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

# Add .gitignore entries
echo "Updating .gitignore..."
cat >> .gitignore << 'EOF'

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
2. ESLint, Prettier, and StyleLint for code quality
3. Husky pre-commit and pre-push hooks
4. Feature flags system for canary deployments
5. Golden baseline tools for rollback
6. AI test feedback loop
7. Telemetry and alerting system

Review the README_GUARDRAILS.md file for usage instructions.
"

# Ask if the user wants to commit the changes
read -p "Do you want to commit these changes to Git? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git add .
  git commit -m "Add CI guardrails: schema, linters, canary, prompt templates, telemetry"
  echo "Changes committed to Git."
else
  echo "Changes are ready but not committed."
fi

echo "Done!"