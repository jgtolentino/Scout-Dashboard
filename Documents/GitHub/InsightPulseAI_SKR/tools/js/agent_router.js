/**
 * Agent Router for Pulser Simulation
 * 
 * This module simulates Pulser's agent routing capabilities,
 * allowing tasks to be delegated to specialized AI agents.
 * 
 * Enhanced with MCP integration and improved routing algorithm.
 */

class AgentRouter {
  constructor(config = {}) {
    this.config = {
      defaultAgent: 'claudia',
      logRouting: true,
      routingHistory: [],
      historyPath: './.mcp/routing_history.jsonl',
      mcpEnabled: true,
      mcpPort: 9315,
      mcpAuthToken: 'claude-code-cli-token',
      ...config
    };
    
    // Define available agents and their specialties
    this.agents = {
      claudia: {
        description: 'Strategic Orchestrator',
        expertise: ['business-strategy', 'market-analysis', 'product-planning'],
        domains: ['enterprise', 'pricing', 'segmentation'],
        environments: ['all'],
        skillLevel: 9
      },
      maya: {
        description: 'Process Architect',
        expertise: ['workflow-design', 'documentation', 'prd-creation'],
        domains: ['sdlc', 'version-control', 'project-flow'],
        environments: ['vscode', 'blender', 'orchestrator'],
        skillLevel: 9
      },
      kalaw: {
        description: 'Research Indexer',
        expertise: ['data-storage', 'knowledge-management', 'archiving'],
        domains: ['metrics', 'benchmarks', 'competitive-data'],
        environments: ['vscode', 'terminal'],
        skillLevel: 8
      },
      echo: {
        description: 'Multimodal Analyzer',
        expertise: ['ui-ux-testing', 'visual-analysis', 'interaction-flow'],
        domains: ['interface-design', 'web-testing', 'user-feedback'],
        environments: ['terminal', 'media processors'],
        skillLevel: 8
      },
      deckgen: {
        description: 'Visualizer',
        expertise: ['presentation-creation', 'visual-design', 'data-viz'],
        domains: ['slides', 'infographics', 'diagrams'],
        environments: ['vscode', 'terminal'],
        skillLevel: 7
      },
      caca: {
        description: 'Quality Assurance',
        expertise: ['testing', 'validation', 'qa-automation'],
        domains: ['quality', 'testing', 'verification'],
        environments: ['vscode', 'terminal', 'database'],
        skillLevel: 7
      },
      tide: {
        description: 'Data Analyst',
        expertise: ['sql', 'data-validation', 'health-monitoring'],
        domains: ['analytics', 'database', 'metrics'],
        environments: ['database', 'jupyter', 'dashboard'],
        skillLevel: 9
      },
      surf: {
        description: 'Engineering Expert',
        expertise: ['complex-engineering', 'autonomous-coding', 'debugging'],
        domains: ['development', 'engineering', 'code-analysis'],
        environments: ['vscode', 'terminal'],
        skillLevel: 10
      },
      basher: {
        description: 'Systems Automator',
        expertise: ['shell-commands', 'system-automation', 'deployment'],
        domains: ['devops', 'automation', 'infrastructure'],
        environments: ['terminal'],
        skillLevel: 9
      },
      claude: {
        description: 'General Purpose AI',
        expertise: ['code-generation', 'creative-tasks', '3d-design-guidance'],
        domains: ['general', 'creative', 'technical'],
        environments: ['vscode', 'blender', 'terminal', 'jupyter'],
        skillLevel: 10
      }
    };
    
    // Intent patterns based on the YAML configuration
    this.intentPatterns = {
      '3d_manipulation': {
        keywords: ["render", "3D", "model", "scene", "object", "texture", "animation", "blender"],
        phrases: ["create a 3D", "model a", "render the scene", "add material to", "position the camera"]
      },
      'code_editing': {
        keywords: ["code", "function", "class", "bug", "feature", "implementation", "algorithm"],
        phrases: ["write a function", "fix the bug in", "create a new class", "implement the algorithm", "refactor the code"]
      },
      'terminal_automation': {
        keywords: ["run", "execute", "script", "command", "shell", "bash", "terminal", "deploy"],
        phrases: ["run the command", "execute the script", "deploy the application", "build the project"]
      },
      'data_validation': {
        keywords: ["data", "validate", "query", "database", "SQL", "metrics", "device", "customer"],
        phrases: ["query the database", "check device health", "validate customer data", "find missing entries"]
      },
      'documentation': {
        keywords: ["document", "wiki", "guide", "manual", "help", "reference"],
        phrases: ["create documentation", "update the guide", "document the process", "write the manual"]
      },
      'testing': {
        keywords: ["test", "quality", "qa", "verification", "validation", "bugs"],
        phrases: ["run tests", "validate functionality", "check for bugs", "verify the behavior"]
      },
      'visualization': {
        keywords: ["chart", "graph", "visual", "display", "present", "diagram"],
        phrases: ["create a chart", "display the data", "visualize the metrics", "generate a graph"]
      }
    };
    
    // Fallback cascades as defined in the YAML
    this.fallbackCascades = {
      'creative': ["maya", "claude", "echo", "claudia"],
      'technical': ["surf", "claude", "basher", "claudia"],
      'analytical': ["tide", "claude", "kalaw", "claudia"]
    };
    
    // Environment capabilities for security checks
    this.environmentCapabilities = {
      'blender': {
        filesystem: "project_only",
        network: "disabled"
      },
      'vscode': {
        filesystem: "workspace_only",
        terminalExecution: "prompt_user"
      },
      'terminal': {
        dangerousCommands: "prompt_user",
        networkAccess: "local_only"
      },
      'database': {
        operations: ["SELECT", "ANALYZE"],
        writeAccess: false
      }
    };
  }

  /**
   * Route a task to the most appropriate agent
   * @param {string} task - Description of the task
   * @param {Array<string>} domains - Relevant domains (optional)
   * @param {string} preferredAgent - Preferred agent (optional)
   * @param {Object} context - Additional context information (optional)
   * @returns {Object} Routing result with agent and confidence
   */
  routeTask(task, domains = [], preferredAgent = null, context = {}) {
    // If preferred agent is specified and exists, route to them
    if (preferredAgent && this.agents[preferredAgent]) {
      const routingResult = {
        task,
        assignedAgent: preferredAgent,
        confidence: 1.0,
        reasoning: `Explicitly routed to preferred agent: ${preferredAgent}`,
        target: this._determineTargetEnvironment(preferredAgent, task, context),
        timestamp: new Date().toISOString()
      };
      
      this._logRouting(routingResult);
      return routingResult;
    }
    
    // Analyze intent if domains not provided
    if (!domains || domains.length === 0) {
      domains = [this._analyzeIntent(task)];
    }
    
    // Extract context information if available
    const filename = context.filename || '';
    const filetype = this._getFiletype(filename);
    const environment = context.environment || 'terminal';
    
    // Calculate scores for each agent
    const scores = {};
    const reasonings = {};
    
    for (const [agentId, agent] of Object.entries(this.agents)) {
      let score = 0;
      let reasons = [];
      
      // Check for domain matches
      const domainMatches = domains.filter(domain => 
        agent.domains.includes(domain)
      );
      
      if (domainMatches.length > 0) {
        const domainScore = domainMatches.length / domains.length;
        score += domainScore * 0.3; // Domain matching is 30% of the score
        reasons.push(`Domain match: ${domainMatches.join(', ')}`);
      }
      
      // Check for environment capability
      if (agent.environments.includes(environment) || agent.environments.includes('all')) {
        score += 0.2; // Environment capability is 20% of the score
        reasons.push(`Environment match: ${environment}`);
      }
      
      // Check for expertise match
      const expertiseMatches = agent.expertise.filter(exp => 
        task.toLowerCase().includes(exp.replace('-', ' '))
      );
      
      if (expertiseMatches.length > 0) {
        const expertiseScore = expertiseMatches.length / agent.expertise.length;
        score += expertiseScore * 0.3; // Expertise matching is 30% of the score
        reasons.push(`Expertise match: ${expertiseMatches.join(', ')}`);
      }
      
      // Consider skill level (normalizing to 0-0.2 range)
      const skillScore = (agent.skillLevel / 10) * 0.2;
      score += skillScore;
      reasons.push(`Skill level: ${agent.skillLevel}/10`);
      
      // If filetype is provided, check for filetype specialization
      if (filetype) {
        const filetypeScore = this._checkFiletypeSpecialization(agentId, filetype);
        if (filetypeScore > 0) {
          score += filetypeScore * 0.2; // Filetype specialization is up to 20% extra
          reasons.push(`Filetype match: ${filetype}`);
        }
      }
      
      scores[agentId] = score;
      reasonings[agentId] = reasons;
    }
    
    // Find the agent with the highest score
    let bestAgent = this.config.defaultAgent;
    let bestScore = 0;
    
    for (const [agentId, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    }
    
    // If the best score is too low, use the default agent
    if (bestScore < 0.3) {
      bestAgent = this.config.defaultAgent;
      bestScore = 0.3;
      reasonings[bestAgent] = ['Default routing due to low confidence in other agents'];
    }
    
    // Determine target environment
    const targetEnvironment = this._determineTargetEnvironment(bestAgent, task, context);
    
    const routingResult = {
      task,
      assignedAgent: bestAgent,
      confidence: bestScore,
      reasoning: reasonings[bestAgent].join('; '),
      target: targetEnvironment,
      bridge: this._determineBridge(targetEnvironment),
      timestamp: new Date().toISOString(),
      fallbackChain: this._getFallbackChain(bestAgent)
    };
    
    this._logRouting(routingResult);
    return routingResult;
  }
  
  /**
   * Route multiple tasks to appropriate agents
   * @param {Array<Object>} tasks - Array of task objects with description and optional domains
   * @returns {Array<Object>} Array of routing results
   */
  routeBatch(tasks) {
    return tasks.map(task => {
      return this.routeTask(
        task.description, 
        task.domains || [], 
        task.preferredAgent,
        task.context || {}
      );
    });
  }
  
  /**
   * Get suggested agent assignments for a product
   * @param {string} productName - Name of the product
   * @param {Array<string>} tasksTypes - Types of tasks needed
   * @returns {Array<Object>} Suggested agent assignments
   */
  getSuggestedAgents(productName, taskTypes = []) {
    // Default task types if none provided
    const types = taskTypes.length > 0 ? taskTypes : [
      'product-planning',
      'market-analysis',
      'ui-ux-design',
      'research',
      'visualization'
    ];
    
    const suggestions = [];
    
    // Create a routing task for each type
    const routingTasks = types.map(type => ({
      description: `${type} for ${productName}`,
      domains: [type]
    }));
    
    // Route each task
    const routingResults = this.routeBatch(routingTasks);
    
    // Convert to suggested agents format
    routingResults.forEach((result, index) => {
      const agent = this.agents[result.assignedAgent];
      
      suggestions.push({
        id: result.assignedAgent,
        role: agent.description,
        task: this._generateTaskDescription(result.assignedAgent, types[index], productName),
        confidence: result.confidence,
        target: result.target,
        bridge: result.bridge
      });
    });
    
    return suggestions;
  }
  
  /**
   * Check if an operation is allowed for an agent on a target environment
   * @param {string} agent - The agent name
   * @param {string} operation - The operation type
   * @param {string} target - The target environment
   * @returns {boolean} Whether the operation is allowed
   */
  isOperationAllowed(agent, operation, target) {
    // Admin agents can do anything
    if (agent === 'claudia' || agent === 'claude') {
      return true;
    }
    
    // Get environment restrictions
    const envRestrictions = this.environmentCapabilities[target] || {};
    
    // Database operations check
    if (target === 'database') {
      if (operation === 'query') {
        return envRestrictions.operations?.includes('SELECT') || false;
      } else if (operation === 'write') {
        return envRestrictions.writeAccess || false;
      }
    }
    
    // Terminal dangerous command check
    if (target === 'terminal' && operation === 'execute_command') {
      if (envRestrictions.dangerousCommands === 'prompt_user') {
        // This would require user confirmation in a real implementation
        return true;
      }
    }
    
    // File system operations
    if (operation.startsWith('file_')) {
      const fsAccess = envRestrictions.filesystem;
      if (fsAccess === 'disabled') {
        return false;
      }
      // Would validate path restrictions in real implementation
      return true;
    }
    
    // Default to allowed
    return true;
  }
  
  /**
   * Connect to MCP server for agent execution
   * @param {Object} routingResult - The routing result from routeTask
   * @param {Object} parameters - Parameters for the agent
   * @returns {Promise<Object>} The result of the agent execution
   */
  async executeThroughMCP(routingResult, parameters) {
    if (!this.config.mcpEnabled) {
      return Promise.reject(new Error('MCP is not enabled'));
    }
    
    const { assignedAgent, target, bridge } = routingResult;
    
    try {
      // In a real implementation, this would make a HTTP request to the MCP server
      console.log(`[AgentRouter] Executing ${assignedAgent} on target ${target} using bridge ${bridge}`);
      console.log(`[AgentRouter] Parameters: ${JSON.stringify(parameters)}`);
      
      // Simulate MCP execution
      return Promise.resolve({
        status: 'success',
        agent: assignedAgent,
        target,
        bridge,
        executionId: `exec-${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[AgentRouter] MCP execution failed: ${error.message}`);
      
      // Try fallback if available
      const fallbackChain = routingResult.fallbackChain || [];
      if (fallbackChain.length > 0) {
        const fallbackAgent = fallbackChain[0];
        console.log(`[AgentRouter] Trying fallback agent: ${fallbackAgent}`);
        
        // Create a new routing result with the fallback agent
        const fallbackRoutingResult = {
          ...routingResult,
          assignedAgent: fallbackAgent,
          fallbackChain: fallbackChain.slice(1),
          reasoning: `Fallback from ${assignedAgent} due to execution error: ${error.message}`
        };
        
        // Log the fallback
        this._logRouting(fallbackRoutingResult);
        
        // Execute with the fallback agent
        return this.executeThroughMCP(fallbackRoutingResult, parameters);
      }
      
      return Promise.reject(error);
    }
  }
  
  /**
   * Generate a specific task description for an agent
   * @private
   */
  _generateTaskDescription(agentId, taskType, productName) {
    const taskTemplates = {
      claudia: {
        'product-planning': `Align ${productName} GTM, enterprise segmentation, pricing logic`,
        'market-analysis': `Analyze competitive positioning for ${productName}`,
        'default': `Strategic planning for ${productName}`
      },
      maya: {
        'product-planning': `Structure PRD, workflow improvements, version history`,
        'default': `Document architecture and process flow for ${productName}`
      },
      kalaw: {
        'research': `Store ${productName} benchmark data and competitive analysis`,
        'default': `Index and organize research for ${productName}`
      },
      echo: {
        'ui-ux-design': `UI/UX deltas, video demo analysis, agent logs`,
        'default': `Analyze user experience for ${productName}`
      },
      deckgen: {
        'visualization': `Generate ${productName} roadmap deck and visuals`,
        'default': `Create visual assets for ${productName}`
      },
      caca: {
        'testing': `QA validation, feature verification, regression testing`,
        'default': `Quality assurance for ${productName}`
      },
      tide: {
        'data-analysis': `SQL queries, health metrics, analytics dashboard`,
        'default': `Data analysis for ${productName}`
      },
      surf: {
        'coding': `Implementation, debugging, architecture design`,
        'default': `Engineering work for ${productName}`
      },
      basher: {
        'automation': `Shell scripts, deployment pipelines, system integration`,
        'default': `System automation for ${productName}`
      },
      claude: {
        'general': `Full-stack development and analysis`,
        'default': `General AI assistance for ${productName}`
      }
    };
    
    // Get the agent's task templates
    const agentTemplates = taskTemplates[agentId] || {};
    
    // Return the specific template or default
    return agentTemplates[taskType] || agentTemplates.default || `Work on ${taskType} for ${productName}`;
  }
  
  /**
   * Analyze intent from task description
   * @private
   */
  _analyzeIntent(task) {
    // Convert task to lowercase for matching
    const taskLower = task.toLowerCase();
    
    // Score each intent based on keywords and phrases
    const intentScores = {};
    
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      let score = 0;
      
      // Check for keywords
      for (const keyword of patterns.keywords || []) {
        if (taskLower.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      
      // Check for phrases (stronger signals)
      for (const phrase of patterns.phrases || []) {
        if (taskLower.includes(phrase.toLowerCase())) {
          score += 2;
        }
      }
      
      intentScores[intent] = score;
    }
    
    // Find the intent with the highest score
    let bestIntent = 'general';
    let bestScore = 0;
    
    for (const [intent, score] of Object.entries(intentScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }
    
    return bestIntent;
  }
  
  /**
   * Get the file extension from a filename
   * @private
   */
  _getFiletype(filename) {
    if (!filename) return '';
    
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    
    return `.${parts[parts.length - 1].toLowerCase()}`;
  }
  
  /**
   * Check if an agent has specialization for a filetype
   * @private
   */
  _checkFiletypeSpecialization(agentId, filetype) {
    // Mapping of filetypes to agent specializations
    const filetypeSpecializations = {
      '.js': ['surf', 'claude'],
      '.py': ['surf', 'claude', 'tide'],
      '.html': ['surf', 'claude'],
      '.css': ['surf', 'claude'],
      '.md': ['kalaw', 'maya'],
      '.sql': ['tide'],
      '.json': ['surf', 'tide'],
      '.ipynb': ['tide'],
      '.blend': ['claude'],
      '.sh': ['basher'],
      '.yaml': ['basher', 'surf'],
      '.yml': ['basher', 'surf']
    };
    
    const specialists = filetypeSpecializations[filetype] || [];
    return specialists.includes(agentId) ? 1 : 0;
  }
  
  /**
   * Determine the appropriate target environment for an agent and task
   * @private
   */
  _determineTargetEnvironment(agentId, task, context) {
    // Check if context provides a specific environment
    if (context.environment) {
      return context.environment;
    }
    
    // Analyze task to determine environment
    const taskLower = task.toLowerCase();
    
    // Check for environment-specific keywords
    if (taskLower.includes('code') || taskLower.includes('file') || taskLower.includes('editor')) {
      return 'vscode';
    }
    
    if (taskLower.includes('3d') || taskLower.includes('render') || taskLower.includes('model')) {
      return 'blender';
    }
    
    if (taskLower.includes('sql') || taskLower.includes('database') || taskLower.includes('query')) {
      return 'database';
    }
    
    if (taskLower.includes('jupyter') || taskLower.includes('notebook') || taskLower.includes('data analysis')) {
      return 'jupyter';
    }
    
    // Default environment based on agent
    const environmentMap = {
      'claudia': 'terminal',
      'maya': 'vscode',
      'kalaw': 'vscode',
      'echo': 'terminal',
      'deckgen': 'vscode',
      'caca': 'vscode',
      'tide': 'database',
      'surf': 'vscode',
      'basher': 'terminal',
      'claude': 'terminal'
    };
    
    return environmentMap[agentId] || 'terminal';
  }
  
  /**
   * Determine the appropriate bridge for a target environment
   * @private
   */
  _determineBridge(environment) {
    const bridgeMap = {
      'terminal': 'terminal_mcp_bridge',
      'vscode': 'vscode_mcp_bridge',
      'blender': 'blender_mcp_bridge',
      'database': 'sql_query_router',
      'jupyter': 'jupyter_mcp_bridge',
      'dashboard': 'dashboard_mcp_bridge',
      'orchestrator': 'mcp_orchestrator',
      'mcp': 'mcp_bridge'
    };
    
    return bridgeMap[environment] || 'terminal_mcp_bridge';
  }
  
  /**
   * Get the fallback chain for an agent based on the fallback cascades
   * @private
   */
  _getFallbackChain(agentId) {
    // Check each cascade to see if it contains the agent
    for (const [cascadeName, sequence] of Object.entries(this.fallbackCascades)) {
      const index = sequence.indexOf(agentId);
      if (index !== -1 && index < sequence.length - 1) {
        // Return the agents that come after this one in the cascade
        return sequence.slice(index + 1);
      }
    }
    
    // Default fallback is claudia
    return ['claudia'];
  }
  
  /**
   * Log routing information
   * @private
   */
  _logRouting(routingResult) {
    if (this.config.logRouting) {
      console.log(`[AgentRouter] Task "${routingResult.task.substring(0, 50)}..." routed to ${routingResult.assignedAgent} (confidence: ${routingResult.confidence.toFixed(2)})`);
      console.log(`[AgentRouter] Target: ${routingResult.target || 'unspecified'}, Bridge: ${routingResult.bridge || 'unspecified'}`);
      console.log(`[AgentRouter] Reasoning: ${routingResult.reasoning}`);
    }
    
    // Add to routing history
    this.config.routingHistory.push({
      timestamp: new Date().toISOString(),
      ...routingResult
    });
    
    // Limit history size to prevent memory issues
    if (this.config.routingHistory.length > 100) {
      this.config.routingHistory = this.config.routingHistory.slice(-100);
    }
  }
  
  /**
   * Get routing history
   * @returns {Array<Object>} Routing history
   */
  getRoutingHistory() {
    return this.config.routingHistory;
  }
  
  /**
   * Save routing history to disk
   * @returns {boolean} Success status
   */
  saveRoutingHistory() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Ensure directory exists
      const historyDir = path.dirname(this.config.historyPath);
      if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
      }
      
      // Write history as JSONL
      const historyLines = this.config.routingHistory.map(entry => JSON.stringify(entry)).join('\n');
      fs.writeFileSync(this.config.historyPath, historyLines + '\n', { flag: 'a' });
      
      return true;
    } catch (error) {
      console.error(`[AgentRouter] Failed to save routing history: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Sync routing information with Claudia's memory system
   * @returns {boolean} Success status
   */
  syncWithClaudia() {
    try {
      const fs = require('fs');
      const memoryLocation = '/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/.pulser_context.json';
      
      if (!fs.existsSync(memoryLocation)) {
        return false;
      }
      
      // Read current memory
      const memory = JSON.parse(fs.readFileSync(memoryLocation, 'utf8'));
      
      // Update routing information
      memory.mcp_routing = {
        last_sync: new Date().toISOString(),
        available_agents: Object.keys(this.agents),
        routing_history_size: this.config.routingHistory.length,
        intent_patterns: Object.keys(this.intentPatterns),
        fallback_cascades: this.fallbackCascades
      };
      
      // Write updated memory
      fs.writeFileSync(memoryLocation, JSON.stringify(memory, null, 2));
      
      console.log(`[AgentRouter] Synchronized routing information with Claudia's memory`);
      return true;
    } catch (error) {
      console.error(`[AgentRouter] Failed to sync with Claudia's memory: ${error.message}`);
      return false;
    }
  }
}

module.exports = AgentRouter;