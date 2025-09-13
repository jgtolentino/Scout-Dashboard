/**
 * Plan-Act Parser for Pulser CLI
 * Automatically detects and executes PLAN/ACT blocks from ChatGPT/Claude responses
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PlanActParser {
  constructor(options = {}) {
    this.autoApprove = options.autoApprove || false;
    this.configPath = options.configPath || '.pulserrc';
    this.envPath = options.envPath || '.env';
    this.secretsPath = options.secretsPath || 'secrets.yaml';
    this.variables = {};
    this.loadVariables();
  }

  /**
   * Load variables from multiple sources
   */
  loadVariables() {
    // Load from environment
    this.variables = { ...process.env };

    // Load from .pulserrc
    if (fs.existsSync(this.configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.variables = { ...this.variables, ...config.variables };
      } catch (e) {
        console.warn(`Warning: Could not parse ${this.configPath}`);
      }
    }

    // Load from .env
    if (fs.existsSync(this.envPath)) {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const envVars = this.parseEnvFile(envContent);
      this.variables = { ...this.variables, ...envVars };
    }

    // Load from secrets.yaml (if exists)
    if (fs.existsSync(this.secretsPath)) {
      try {
        const yaml = require('js-yaml');
        const secrets = yaml.load(fs.readFileSync(this.secretsPath, 'utf8'));
        this.variables = { ...this.variables, ...secrets };
      } catch (e) {
        console.warn(`Warning: Could not parse ${this.secretsPath}`);
      }
    }

    // Add dynamic variables
    this.variables.REPO_ROOT = process.cwd();
    this.variables.TIMESTAMP = new Date().toISOString();
    this.variables.USER = process.env.USER || process.env.USERNAME;
  }

  /**
   * Parse .env file format
   */
  parseEnvFile(content) {
    const vars = {};
    content.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    return vars;
  }

  /**
   * Parse input text for PLAN/ACT blocks
   */
  parse(input) {
    const planMatch = input.match(/##\s*PLAN:\s*([\s\S]*?)(?=##\s*ACT:|$)/i);
    const actMatch = input.match(/##\s*ACT:\s*([\s\S]*?)(?=##|$)/i);

    return {
      plan: planMatch ? planMatch[1].trim() : null,
      act: actMatch ? actMatch[1].trim() : null,
      hasPlanAct: !!(planMatch || actMatch)
    };
  }

  /**
   * Substitute variables in text
   */
  substituteVariables(text) {
    let substituted = text;
    
    // Replace {{VAR_NAME}} patterns
    substituted = substituted.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      if (this.variables[varName] !== undefined) {
        return this.variables[varName];
      }
      
      // Check for missing required variables
      if (this.isRequiredVariable(varName)) {
        throw new Error(`Required variable '${varName}' not found in configuration`);
      }
      
      console.warn(`Warning: Variable '${varName}' not found, keeping placeholder`);
      return match;
    });

    // Replace $VAR_NAME patterns (bash-style)
    substituted = substituted.replace(/\$(\w+)/g, (match, varName) => {
      if (this.variables[varName] !== undefined) {
        return this.variables[varName];
      }
      return match;
    });

    return substituted;
  }

  /**
   * Check if a variable is required (contains sensitive keywords)
   */
  isRequiredVariable(varName) {
    const requiredPatterns = ['TOKEN', 'KEY', 'SECRET', 'PASSWORD', 'API'];
    return requiredPatterns.some(pattern => varName.includes(pattern));
  }

  /**
   * Execute ACT block commands
   */
  async execute(actBlock, options = {}) {
    const commands = this.parseCommands(actBlock);
    const results = [];

    for (const command of commands) {
      try {
        // Substitute variables
        const substitutedCommand = this.substituteVariables(command);
        
        // Log command (hiding sensitive values)
        console.log(`Executing: ${this.sanitizeForLogging(substitutedCommand)}`);
        
        // Execute command
        const output = execSync(substitutedCommand, {
          encoding: 'utf8',
          stdio: options.silent ? 'pipe' : 'inherit'
        });
        
        results.push({
          command: command,
          success: true,
          output: output
        });
      } catch (error) {
        results.push({
          command: command,
          success: false,
          error: error.message
        });
        
        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Parse commands from ACT block
   */
  parseCommands(actBlock) {
    return actBlock
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }

  /**
   * Sanitize command for logging (hide sensitive values)
   */
  sanitizeForLogging(command) {
    let sanitized = command;
    
    // Hide tokens and keys
    const sensitivePatterns = [
      /([A-Za-z0-9]{32,})/g,  // Long alphanumeric strings
      /(token|key|secret|password)=([^\s]+)/gi  // Key-value pairs
    ];
    
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match, ...groups) => {
        if (groups.length > 1) {
          return `${groups[0]}=***`;
        }
        return '***';
      });
    });
    
    return sanitized;
  }

  /**
   * Process full plan-act input
   */
  async process(input, options = {}) {
    const parsed = this.parse(input);
    
    if (!parsed.hasPlanAct) {
      console.log('No PLAN/ACT blocks detected');
      return null;
    }

    // Display plan
    if (parsed.plan) {
      console.log('\n📋 PLAN:');
      console.log(parsed.plan);
      console.log('');
    }

    // Check for auto-approve or wait for confirmation
    if (parsed.act) {
      if (!this.autoApprove && !options.skipConfirmation) {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const confirmed = await new Promise(resolve => {
          rl.question('Execute ACT block? (y/n): ', answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
          });
        });

        if (!confirmed) {
          console.log('Execution cancelled');
          return null;
        }
      }

      console.log('\n🚀 EXECUTING:');
      const results = await this.execute(parsed.act, options);
      return results;
    }

    return null;
  }

  /**
   * Add or update a variable
   */
  setVariable(key, value) {
    this.variables[key] = value;
  }

  /**
   * Get current variables (for debugging)
   */
  getVariables() {
    // Return non-sensitive variables only
    const safe = {};
    Object.keys(this.variables).forEach(key => {
      if (!this.isRequiredVariable(key)) {
        safe[key] = this.variables[key];
      } else {
        safe[key] = '***';
      }
    });
    return safe;
  }
}

module.exports = PlanActParser;