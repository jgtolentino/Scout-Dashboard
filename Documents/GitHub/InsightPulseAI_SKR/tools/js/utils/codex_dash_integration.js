/**
 * Codex to Dash Integration Utility
 * 
 * This module provides functionality to connect the Codex agent
 * with the Dash dashboard builder system, enabling automated
 * dashboard generation, updates, and deployments through
 * the guardrails system.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Paths to key configuration files
const DASH_CONFIG_PATH = path.join(__dirname, '../agents/dash.yaml');
const CODEX_CONFIG_PATH = path.join(__dirname, '../agents/codex_guardrails.yml');
const DASH_OUTPUT_DIR = path.join(__dirname, '../dashboards');

/**
 * Verifies that Dash is configured and available
 * @returns {boolean} Whether Dash is available
 */
function isDashAvailable() {
  return fs.existsSync(DASH_CONFIG_PATH);
}

/**
 * Generates a dashboard using Dash based on provided specifications
 * 
 * @param {Object} specs - Dashboard specifications
 * @param {string} specs.source - Path to the data source (JSON, CSV, SQL)
 * @param {string} specs.requirements - Path to requirements markdown file
 * @param {string} specs.outputDir - Directory to output the generated dashboard
 * @param {boolean} specs.deploy - Whether to deploy the dashboard after generation
 * @returns {Object} Result of the dashboard generation process
 */
function generateDashboard(specs) {
  if (!isDashAvailable()) {
    return {
      success: false,
      message: 'Dash agent is not available'
    };
  }
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = specs.outputDir || DASH_OUTPUT_DIR;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Build command for dashboard generation
    const dashCommand = buildDashCommand(specs);
    
    // Execute command
    const result = spawnSync('pulser', dashCommand, {
      encoding: 'utf-8',
      stdio: 'pipe',
      shell: true
    });
    
    if (result.status !== 0) {
      return {
        success: false,
        message: `Dashboard generation failed: ${result.stderr}`,
        command: dashCommand.join(' ')
      };
    }
    
    return {
      success: true,
      message: 'Dashboard generated successfully',
      outputPath: path.join(outputDir, 'generated_dashboard.html'),
      configPath: path.join(outputDir, 'config.json'),
      logs: result.stdout
    };
  } catch (error) {
    return {
      success: false,
      message: `Error generating dashboard: ${error.message}`
    };
  }
}

/**
 * Builds the command array for dashboard generation
 * @param {Object} specs - Dashboard specifications
 * @returns {Array} Command arguments array
 */
function buildDashCommand(specs) {
  const cmd = ['agent', 'dash', 'build'];
  
  if (specs.source) {
    cmd.push('--source', specs.source);
  }
  
  if (specs.requirements) {
    cmd.push('--requirements', specs.requirements);
  }
  
  if (specs.outputDir) {
    cmd.push('--output', specs.outputDir);
  }
  
  if (specs.theme) {
    cmd.push('--theme', specs.theme);
  }
  
  if (specs.deploy) {
    cmd.push('--deploy');
  }
  
  return cmd;
}

/**
 * Deploys a generated dashboard to the specified target
 * 
 * @param {Object} deploySpecs - Deployment specifications
 * @param {string} deploySpecs.dashboardPath - Path to the dashboard HTML file
 * @param {string} deploySpecs.target - Deployment target (azure, vercel, netlify)
 * @param {string} deploySpecs.environment - Deployment environment (dev, canary, production)
 * @returns {Object} Result of the deployment process
 */
function deployDashboard(deploySpecs) {
  if (!isDashAvailable()) {
    return {
      success: false,
      message: 'Dash agent is not available'
    };
  }
  
  try {
    // Build command for dashboard deployment
    const deployCmd = ['agent', 'dash', 'deploy'];
    
    if (deploySpecs.dashboardPath) {
      deployCmd.push('--path', deploySpecs.dashboardPath);
    }
    
    if (deploySpecs.target) {
      deployCmd.push('--target', deploySpecs.target);
    }
    
    if (deploySpecs.environment) {
      deployCmd.push('--environment', deploySpecs.environment);
    }
    
    // Execute command
    const result = spawnSync('pulser', deployCmd, {
      encoding: 'utf-8',
      stdio: 'pipe',
      shell: true
    });
    
    if (result.status !== 0) {
      return {
        success: false,
        message: `Dashboard deployment failed: ${result.stderr}`,
        command: deployCmd.join(' ')
      };
    }
    
    return {
      success: true,
      message: 'Dashboard deployed successfully',
      url: parseDeploymentUrl(result.stdout),
      logs: result.stdout
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deploying dashboard: ${error.message}`
    };
  }
}

/**
 * Parses the deployment URL from command output
 * @param {string} output - Command output
 * @returns {string|null} Deployment URL if found, null otherwise
 */
function parseDeploymentUrl(output) {
  const urlMatch = output.match(/Deployed to: (https:\/\/[^\s]+)/);
  return urlMatch ? urlMatch[1] : null;
}

/**
 * Validates a dashboard against guardrails
 * 
 * @param {string} dashboardPath - Path to the dashboard HTML file
 * @returns {Object} Validation results
 */
function validateDashboard(dashboardPath) {
  try {
    // Check if dashboard exists
    if (!fs.existsSync(dashboardPath)) {
      return {
        success: false,
        message: `Dashboard file not found: ${dashboardPath}`
      };
    }
    
    // Read dashboard content
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    // Validation checks
    const validationResults = {
      hasProperStructure: dashboardContent.includes('<html') && dashboardContent.includes('<body'),
      hasNeededComponents: dashboardContent.includes('<script') && dashboardContent.includes('<style'),
      hasMobileMeta: dashboardContent.includes('viewport'),
      hasAccessibility: dashboardContent.includes('aria-'),
      warnings: [],
      suggestions: []
    };
    
    // Check for potential issues
    if (!dashboardContent.includes('charset=')) {
      validationResults.warnings.push('Missing charset declaration');
    }
    
    if (!dashboardContent.includes('dark-mode') && !dashboardContent.includes('data-theme')) {
      validationResults.suggestions.push('Consider adding dark mode support');
    }
    
    // Overall success
    const success = validationResults.hasProperStructure && 
                    validationResults.hasNeededComponents;
    
    return {
      success,
      message: success ? 'Dashboard validation passed' : 'Dashboard validation failed',
      details: validationResults
    };
  } catch (error) {
    return {
      success: false,
      message: `Error validating dashboard: ${error.message}`
    };
  }
}

/**
 * Registers Dash with Codex in the guardrails policy
 * 
 * @returns {boolean} Whether registration was successful
 */
function registerDashWithCodex() {
  try {
    // Read current Codex configuration
    const codexConfig = fs.readFileSync(CODEX_CONFIG_PATH, 'utf8');
    
    // Check if Dash is already registered
    if (codexConfig.includes('dash:') || codexConfig.includes('dash.yaml')) {
      return true; // Already registered
    }
    
    // Find integrations section to add Dash
    const updatedConfig = codexConfig.replace(
      /integrations:\s*\n/,
      'integrations:\n  dash:\n    enabled: true\n    config_path: ../agents/dash.yaml\n    validation_path: ../utils/codex_dash_integration.js\n\n'
    );
    
    // Write updated configuration
    fs.writeFileSync(CODEX_CONFIG_PATH, updatedConfig, 'utf8');
    
    return true;
  } catch (error) {
    console.error(`Error registering Dash with Codex: ${error.message}`);
    return false;
  }
}

module.exports = {
  isDashAvailable,
  generateDashboard,
  deployDashboard,
  validateDashboard,
  registerDashWithCodex
};