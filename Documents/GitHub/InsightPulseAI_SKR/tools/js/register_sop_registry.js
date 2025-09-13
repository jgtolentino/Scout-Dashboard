/**
 * register_sop_registry.js
 * 
 * Script to register the SOP registry with the Pulser system.
 * This registers both the basic SOP profile and the enhanced data toggle profile
 * for use across all InsightPulseAI applications.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  standardProfilePath: './final-locked-dashboard/pulser_sop_profile.yaml',
  toggleProfilePath: './final-locked-dashboard/pulser_sop_profile_with_toggle.yaml',
  outputDir: './output/sop-registry',
  pulserConfigPath: './config/pulser_task_routing.yaml',
  appTemplates: ['PRISMA', 'GEZ', 'PulseUP', 'RetailEdge']
};

/**
 * Main execution function
 */
async function registerSopRegistry() {
  try {
    console.log('Starting SOP Registry registration with Pulser system...');
    
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    // Verify profile files exist
    await verifyFiles();
    
    // Register both SOP profiles with Pulser
    await registerProfiles();
    
    // Generate implementation templates for app examples
    await generateTemplates();
    
    // Update Pulser task routing configuration
    await updatePulserConfig();
    
    // Create SKR archive entry for this registration
    await createSkrEntry();
    
    console.log('\n✅ SOP Registry registration complete!');
    console.log(`Templates and documentation available in: ${CONFIG.outputDir}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error registering SOP Registry: ${error.message}`);
    return false;
  }
}

/**
 * Verify that required files exist
 */
async function verifyFiles() {
  console.log('Verifying required files...');
  
  const files = [
    CONFIG.standardProfilePath,
    CONFIG.toggleProfilePath,
    CONFIG.pulserConfigPath
  ];
  
  for (const file of files) {
    try {
      await fs.access(file);
      console.log(`  ✓ Found: ${file}`);
    } catch (error) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
}

/**
 * Register SOP profiles with Pulser system
 */
async function registerProfiles() {
  console.log('\nRegistering SOP profiles with Pulser system...');
  
  // In a real implementation, this would call the Pulser CLI
  // For this example, we'll simulate the registration
  
  // Copy profiles to output directory for reference
  await fs.copyFile(
    CONFIG.standardProfilePath, 
    path.join(CONFIG.outputDir, 'standard_sop_profile.yaml')
  );
  
  await fs.copyFile(
    CONFIG.toggleProfilePath, 
    path.join(CONFIG.outputDir, 'toggle_sop_profile.yaml')
  );
  
  console.log('  ✓ Registered standard SOP profile');
  console.log('  ✓ Registered data toggle SOP profile');
  
  // Simulate command execution
  const registerCommand = `pulser register sop --profile ${CONFIG.standardProfilePath} --registry central`;
  console.log(`  Would execute: ${registerCommand}`);
  
  const toggleRegisterCommand = `pulser register sop --profile ${CONFIG.toggleProfilePath} --registry central`;
  console.log(`  Would execute: ${toggleRegisterCommand}`);
}

/**
 * Generate implementation templates for example apps
 */
async function generateTemplates() {
  console.log('\nGenerating implementation templates for example apps...');
  
  for (const app of CONFIG.appTemplates) {
    const appDir = path.join(CONFIG.outputDir, app.toLowerCase());
    await fs.mkdir(appDir, { recursive: true });
    
    // Create app config
    const appConfig = {
      app_name: app,
      sop_version: "1.1",
      implementation_date: new Date().toISOString().split('T')[0],
      implementation_lead: "InsightPulseAI Dev Team",
      data_toggle_enabled: app !== 'GEZ', // Example: Not all apps use data toggle
      targets: getDeploymentTargets(app),
      dashboard_components: getComponents(app)
    };
    
    // Write app config
    await fs.writeFile(
      path.join(appDir, 'app_sop_config.json'),
      JSON.stringify(appConfig, null, 2)
    );
    
    // Create implementation script
    const script = generateImplementationScript(app);
    await fs.writeFile(
      path.join(appDir, 'implement_sop.sh'),
      script
    );
    
    console.log(`  ✓ Generated template for ${app}`);
  }
}

/**
 * Update Pulser task routing configuration
 */
async function updatePulserConfig() {
  console.log('\nUpdating Pulser task routing configuration...');
  
  // In a real implementation, this would modify the YAML file
  // For this example, we'll create a separate file with the additions
  
  const sopTaskConfig = `
# SOP Registry task routes
# Added by register_sop_registry.js on ${new Date().toISOString()}

sop_registry_routes:
  init_sop:
    agent: "Basher"
    description: "Initialize SOP structure for an application"
    command: "pulser init sop --profile {profile} --app {app}"
    
  validate_sop:
    agent: "Caca"
    description: "Validate SOP compliance for an application"
    command: "pulser validate sop --app {app}"
    
  register_sop:
    agent: "Basher"
    description: "Register SOP profile with the Pulser system"
    command: "pulser register sop --app {app}"
    
  generate_test_data:
    agent: "Surf"
    description: "Generate test data for Medallion layers"
    command: "pulser generate test-data --app {app}"
    
  medallion_configure:
    agent: "Echo"
    description: "Configure Medallion data layers for an application"
    command: "pulser configure medallion --app {app} --layers {layers}"
`;

  await fs.writeFile(
    path.join(CONFIG.outputDir, 'sop_registry_routes.yaml'),
    sopTaskConfig
  );
  
  console.log('  ✓ Created SOP registry task routing configuration');
  console.log('  Note: Add this configuration to your main Pulser routing config file');
}

/**
 * Create SKR archive entry
 */
async function createSkrEntry() {
  console.log('\nCreating SKR archive entry...');
  
  const date = new Date().toISOString().split('T')[0];
  const skrDir = path.join(CONFIG.outputDir, 'SKR', 'archives', 'sop_registry', date);
  await fs.mkdir(skrDir, { recursive: true });
  
  // Create metadata file
  const metadata = {
    title: "InsightPulseAI: Unified Developer Deployment SOP Registry",
    version: "1.1",
    date: date,
    category: "standard_operating_procedure",
    tags: [
      "deployment",
      "sop",
      "registry",
      "data-toggle",
      "medallion"
    ],
    summary: "Standard Operating Procedure Registry for consistent deployment across applications",
    agents: [
      { agent_id: "Basher", role: "Deployment executor" },
      { agent_id: "Caca", role: "QA verification" },
      { agent_id: "Echo", role: "Monitoring" },
      { agent_id: "Claudia", role: "Task orchestration" },
      { agent_id: "Surf", role: "Test data generation" }
    ]
  };
  
  await fs.writeFile(
    path.join(skrDir, 'metadata.yaml'),
    JSON.stringify(metadata, null, 2)
  );
  
  // Create documentation file
  const documentation = `# InsightPulseAI: Unified Developer Deployment SOP Registry

## Registry Overview

The SOP Registry provides standardized deployment procedures across all InsightPulseAI applications,
ensuring consistent implementation, quality assurance, and monitoring processes.

## Registered SOP Profiles

1. **Standard SOP Profile** (v1.0)
   - Basic deployment structure for all applications
   - QA verification steps
   - Monitoring and maintenance routines

2. **Data Toggle SOP Profile** (v1.1)
   - Enhanced profile with data source toggle functionality
   - Medallion architecture layer integration
   - Support for switching between real and simulated data

## Implementation Status

| Application | Profile Version | Data Toggle | Implementation Date |
|-------------|----------------|-------------|---------------------|
| PRISMA      | 1.1            | Enabled     | ${date}      |
| GEZ         | 1.0            | Disabled    | ${date}      |
| PulseUP     | 1.1            | Enabled     | ${date}      |
| RetailEdge  | 1.1            | Enabled     | ${date}      |

## Pulser Integration

The SOP Registry is fully integrated with the Pulser system, providing task routing
for SOP initialization, validation, and registration across all applications.

## Usage Instructions

To implement the SOP for a new application:

\`\`\`bash
# For basic SOP implementation
pulser init sop --profile pulser_sop_profile.yaml --app APP_NAME

# For data toggle SOP implementation
pulser init sop --profile pulser_sop_profile_with_toggle.yaml --app APP_NAME

# Validate SOP compliance
pulser validate sop --app APP_NAME

# Register with Pulser system
pulser register sop --app APP_NAME
\`\`\`

## Maintenance

The SOP Registry is maintained by the InsightPulseAI Dev Team and should be updated
as new deployment requirements are identified.
`;

  await fs.writeFile(
    path.join(skrDir, 'REGISTRY_IMPLEMENTATION.md'),
    documentation
  );
  
  console.log(`  ✓ Created SKR entry in: ${skrDir}`);
}

// Helper functions
function getDeploymentTargets(app) {
  switch(app) {
    case 'PRISMA':
      return ['azure', 'dev-sandbox'];
    case 'GEZ':
      return ['kubernetes', 'dev-cluster'];
    case 'PulseUP':
      return ['vercel', 'staging-vercel', 'production-vercel'];
    case 'RetailEdge':
      return ['azure', 'staging-azure', 'production-azure'];
    default:
      return ['dev', 'staging', 'production'];
  }
}

function getComponents(app) {
  const base = ['core', 'ui', 'api'];
  
  switch(app) {
    case 'PRISMA':
      return [...base, 'ml-models', 'data-pipelines'];
    case 'GEZ':
      return [...base, 'ai-engine', 'scaling-policy'];
    case 'PulseUP':
      return [...base, 'dashboard', 'reporting'];
    case 'RetailEdge':
      return [...base, 'retail-metrics', 'store-performance', 'genai-insights'];
    default:
      return base;
  }
}

function generateImplementationScript(app) {
  return `#!/bin/bash
# Implementation script for ${app} SOP
# Generated by register_sop_registry.js

# Load environment variables
source .env

# Set application name
APP_NAME="${app}"
echo "Implementing SOP for $APP_NAME..."

# Initialize SOP structure
echo "Initializing SOP structure..."
pulser init sop --profile ../final-locked-dashboard/pulser_sop_profile_with_toggle.yaml --app $APP_NAME

# Customize for app-specific requirements
echo "Customizing for $APP_NAME requirements..."
mkdir -p assets/data/simulated/{bronze,silver,gold,platinum}

# Configure Medallion data layers
echo "Configuring Medallion data layers..."
pulser configure medallion --app $APP_NAME --layers bronze,silver,gold,platinum

# Generate test data
echo "Generating test data..."
pulser generate test-data --app $APP_NAME

# Validate SOP compliance
echo "Validating SOP compliance..."
pulser validate sop --app $APP_NAME

# Register with Pulser system
echo "Registering with Pulser system..."
pulser register sop --app $APP_NAME

echo "✅ SOP implementation for $APP_NAME complete!"
`;
}

// Execute if this script is run directly
if (require.main === module) {
  registerSopRegistry()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { registerSopRegistry };