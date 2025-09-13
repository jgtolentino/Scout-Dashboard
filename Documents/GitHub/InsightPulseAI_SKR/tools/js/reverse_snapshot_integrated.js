/**
 * Reverse Snapshot - Product Reverse Engineering Tool with Agent Routing
 * 
 * This tool simulates Pulser's "reverse" command which analyzes products
 * and generates PRD-style documentation of their features, architecture,
 * and strategic positioning.
 */

const AgentRouter = require('./agent_router');
const MarkdownFormatter = require('./utils/markdown_formatter');

class ReverseSnapshot {
  constructor(config = {}) {
    this.config = {
      agentRouting: config.agentRouting || true,
      outputFormat: config.outputFormat || 'markdown',
      includeAgents: config.includeAgents || ['maya', 'claudia', 'kalaw', 'echo', 'deckgen'],
      ...config
    };
    
    this.targetProduct = null;
    this.analysisResults = null;
    
    // Set up agent router if enabled
    if (this.config.agentRouting) {
      this.agentRouter = new AgentRouter({
        logRouting: config.logAgentRouting || false
      });
    }
  }

  /**
   * Set the target product to reverse engineer
   * @param {string} productName - Name of the product
   * @param {Object} options - Additional context
   */
  setTarget(productName, options = {}) {
    this.targetProduct = {
      name: productName,
      owner: options.owner || null,
      industry: options.industry || null,
      competitors: options.competitors || [],
      context: options.context || null,
      type: options.type || 'software',
      taskDomains: options.taskDomains || ['product-planning', 'market-analysis', 'ui-ux-design']
    };
    
    return this;
  }

  /**
   * Run the reverse engineering analysis
   */
  analyze() {
    if (!this.targetProduct) {
      throw new Error('No target product set. Call setTarget() first.');
    }
    
    console.log(`Beginning reverse analysis of ${this.targetProduct.name}...`);
    
    // Simulate product analysis
    this.analysisResults = {
      productOverview: this._generateProductOverview(),
      strategicImprovements: this._generateStrategicImprovements(),
      keyFeatures: this._generateKeyFeatures(),
      uiUxAnalysis: this._generateUiUxAnalysis(),
      suggestedEnhancements: this._generateSuggestions(),
      goToMarket: this._generateGTM(),
      risksAssumptions: this._generateRisks()
    };
    
    if (this.config.agentRouting) {
      this.analysisResults.agentSuggestions = this._generateAgentSuggestions();
      this.analysisResults.routingHistory = this.agentRouter.getRoutingHistory();
    }
    
    return this;
  }

  /**
   * Generate the output in the specified format
   * @returns {string} Formatted output
   */
  generateOutput() {
    if (!this.analysisResults) {
      throw new Error('No analysis results available. Call analyze() first.');
    }
    
    switch (this.config.outputFormat) {
      case 'markdown':
        return this._formatMarkdown();
      case 'json':
        return JSON.stringify(this.analysisResults, null, 2);
      case 'yaml':
        return this._formatYaml();
      default:
        return this._formatMarkdown();
    }
  }
  
  /**
   * Internal method to generate product overview
   */
  _generateProductOverview() {
    // This would normally use LLM reasoning or data analysis
    // Simplified for demonstration
    const productSegment = this.targetProduct.type === 'developer-tool' 
      ? 'autonomous software engineering agent'
      : 'product in its category';

    return {
      productName: `${this.targetProduct.name}`,
      owner: this.targetProduct.owner || 'Unknown',
      objective: `To become the industry-standard ${productSegment} by combining ${this.targetProduct.owner}'s LLMs with acquired technology, offering end-to-end capability in a cloud-isolated environment.`
    };
  }
  
  /**
   * Internal method to generate strategic improvements
   */
  _generateStrategicImprovements() {
    // These would be based on product category in a real implementation
    const improvements = [
      {
        area: 'Core Function',
        original: 'Code completion',
        improved: 'Autonomous agent for software development'
      },
      {
        area: 'UX',
        original: 'VSCode plug-in (basic autocomplete)',
        improved: 'Cloud IDE with full agent execution sandbox'
      },
      {
        area: 'Backend',
        original: 'GPT-3.5–like Codex model',
        improved: 'o3 model with parallel task orchestration'
      },
      {
        area: 'Task Handling',
        original: 'Single task (code assist)',
        improved: 'Multi-tasking (feature write, test, PR, debug)'
      },
      {
        area: 'Acquisition Lift',
        original: 'N/A',
        improved: 'Inherited Windsurf\'s Cascade + Supercomplete'
      }
    ];

    // Apply any product-specific overrides
    if (this.targetProduct.strategicImprovements) {
      return [...this.targetProduct.strategicImprovements, ...improvements];
    }

    return improvements;
  }
  
  /**
   * Internal method to generate key features
   */
  _generateKeyFeatures() {
    return [
      'Parallel Agent Execution: Write code, debug, test, and PR—all handled simultaneously in cloud.',
      'Cascade System (via Windsurf): Agent router with specialized flows for frontend, backend, and infra.',
      'Supercomplete: Context-aware code generation across entire repo, not just local files.',
      'Pull Request Autonomy: Codex proposes changes and raises PRs with explanations.',
      'Team Support: Designed for solo devs, teams, and enterprise with role-based workflows.'
    ];
  }
  
  /**
   * Internal method to generate UI/UX analysis
   */
  _generateUiUxAnalysis() {
    // Use our agent router to route this task to the best agent
    if (this.config.agentRouting) {
      const uiUxTask = {
        description: `Analyze UI/UX for ${this.targetProduct.name}`,
        domains: ['ui-ux-design', 'user-interface', 'interaction-design']
      };

      // This should usually route to echo, our UI/UX specialist
      const routingResult = this.agentRouter.routeTask(
        uiUxTask.description, 
        uiUxTask.domains
      );

      console.log(`UI/UX analysis routed to: ${routingResult.assignedAgent}`);
    }

    return [
      'One-Click "Try Codex" Button: Immediate project boot in cloud IDE.',
      'Taskboard View: Kanban-like panel for seeing what Codex is executing.',
      'Inline Explanation Pane: Side panel with LLM reasoning + logs.',
      'Safe Mode Execution: Cloud-isolated, no local file modification without confirmation.'
    ];
  }
  
  /**
   * Internal method to generate suggestions
   */
  _generateSuggestions() {
    // Use our agent router to route this task to the best agent(s)
    if (this.config.agentRouting) {
      // Define tasks for different suggestion categories
      const suggestionTasks = [
        {
          description: `Generate UI/UX improvement suggestions for ${this.targetProduct.name}`,
          domains: ['ui-ux-design', 'user-interface']
        },
        {
          description: `Generate strategic product enhancements for ${this.targetProduct.name}`,
          domains: ['product-planning', 'market-analysis']
        },
        {
          description: `Generate technical improvement suggestions for ${this.targetProduct.name}`,
          domains: ['development', 'engineering']
        }
      ];

      // Route all tasks in a batch
      const routingResults = this.agentRouter.routeBatch(suggestionTasks);
      
      console.log(`Received suggestions from ${routingResults.length} agents`);
    }

    return [
      'Add Prompt Replay + Versioning',
      'Integration with GitHub Copilot as fallback',
      'Exportable dev journal logs for team audits',
      'LLM Token Optimizer Panel (track cost live)',
      'CLI Companion Tool (e.g., `codex-cli`) for offline control'
    ];
  }
  
  /**
   * Internal method to generate go-to-market strategy
   */
  _generateGTM() {
    // Use our agent router to route this task
    if (this.config.agentRouting) {
      const gtmTask = {
        description: `Define Go-to-Market strategy for ${this.targetProduct.name}`,
        domains: ['market-analysis', 'pricing', 'segmentation'],
        preferredAgent: 'claudia' // Override to explicitly use Claudia for GTM
      };

      const routingResult = this.agentRouter.routeTask(
        gtmTask.description, 
        gtmTask.domains, 
        gtmTask.preferredAgent
      );

      console.log(`GTM strategy routed to: ${routingResult.assignedAgent} (confidence: ${routingResult.confidence.toFixed(2)})`);
    }

    return [
      {
        segment: 'Indie Devs',
        strategy: 'Free Tier for hobbyists'
      },
      {
        segment: 'Pro Users',
        strategy: 'GitHub + Codex cloud sync'
      },
      {
        segment: 'Enterprise IT',
        strategy: 'Audit, SOC2, on-prem mode'
      }
    ];
  }
  
  /**
   * Internal method to generate risks and assumptions
   */
  _generateRisks() {
    return [
      {
        risk: 'Overlap with Copilot',
        mitigation: 'Differentiate by full-agent architecture'
      },
      {
        risk: 'Cost of compute for cloud IDE',
        mitigation: 'Token optimizer and tiered pricing'
      },
      {
        risk: 'Trust in auto-PRs',
        mitigation: 'Add review checkpoints + Slack alerts'
      },
      {
        risk: 'Market skepticism (Codex v1)',
        mitigation: 'Position clearly as Codex v2 via Windsurf'
      }
    ];
  }
  
  /**
   * Internal method to generate agent suggestions
   */
  _generateAgentSuggestions() {
    if (this.agentRouter) {
      // Use the agent router to suggest agents for this product
      // based on task domains defined in the target product
      return this.agentRouter.getSuggestedAgents(
        this.targetProduct.name,
        this.targetProduct.taskDomains
      );
    }

    // Fallback to hardcoded suggestions if agent router is disabled
    return [
      {
        id: 'maya',
        role: 'Process Architect',
        task: 'Structure PRD, workflow improvements, version history'
      },
      {
        id: 'claudia',
        role: 'Strategic Orchestrator',
        task: 'Align Codex GTM, enterprise segmentation, pricing logic'
      },
      {
        id: 'kalaw',
        role: 'Research Indexer',
        task: 'Store Codex 1 vs 2 benchmark data, Windsurf acquisition archive'
      },
      {
        id: 'echo',
        role: 'Multimodal Analyzer',
        task: 'UI/UX deltas, video demo analysis, agent logs'
      },
      {
        id: 'deckgen',
        role: 'Visualizer',
        task: 'Generate Codex relaunch roadmap deck (from PRD+Echo data)'
      }
    ];
  }
  
  /**
   * Format the analysis results as markdown
   */
  _formatMarkdown() {
    const md = [];
    
    md.push('**Pulser Reverse Snapshot**');
    md.push(`\`:reverse --target "${this.targetProduct.name}"\``);
    
    if (this.config.includeAgents.length > 0) {
      md.push(`*(Agents involved: ${this.config.includeAgents.join(', ')})*`);
    }
    
    md.push('\n---\n');
    
    md.push(`### **Product PRD: ${this.analysisResults.productOverview.productName} (Post-Windsurf Acquisition)**`);
    md.push('');
    md.push(`**Product Name:** ${this.analysisResults.productOverview.productName}`);
    md.push(`**Owner:** ${this.analysisResults.productOverview.owner}`);
    md.push(`**Launch Context:** ${this.targetProduct.context || 'Standard market release'}`);
    
    md.push('\n---\n');
    
    md.push('### **1. Product Objective**');
    md.push('');
    md.push(this.analysisResults.productOverview.objective);
    
    md.push('\n---\n');
    
    md.push('### **2. Strategic Improvements over Previous Codex**');
    md.push('');
    
    // Use the markdown formatter utility for the table
    md.push(MarkdownFormatter.createMarkdownTable(
      this.analysisResults.strategicImprovements,
      {
        headers: ['Area', 'Original Codex', 'Codex Relaunch'],
        columns: ['area', 'original', 'improved']
      }
    ));
    
    md.push('\n---\n');
    
    md.push('### **3. Key Features**');
    md.push('');
    this.analysisResults.keyFeatures.forEach(feature => {
      md.push(`* **${feature.split(':')[0]}:** ${feature.split(':')[1]}`);
    });
    
    md.push('\n---\n');
    
    md.push('### **4. UI/UX Simplification Plan (Echo + Deckgen)**');
    md.push('');
    this.analysisResults.uiUxAnalysis.forEach(feature => {
      md.push(`* **${feature.split(':')[0]}:** ${feature.split(':')[1]}`);
    });
    
    md.push('\n---\n');
    
    md.push('### **5. Suggested Enhancements (Maya + Claudia)**');
    md.push('');
    this.analysisResults.suggestedEnhancements.forEach(enhancement => {
      md.push(`* **${enhancement}**`);
    });
    
    md.push('\n---\n');
    
    md.push('### **6. Go-to-Market (Claudia)**');
    md.push('');
    this.analysisResults.goToMarket.forEach(gtm => {
      md.push(`* **Segment ${gtm.segment}:** ${gtm.strategy}`);
    });
    
    md.push('\n---\n');
    
    md.push('### **7. Risks / Assumptions**');
    md.push('');
    
    // Use the markdown formatter utility for the table
    md.push(MarkdownFormatter.createMarkdownTable(
      this.analysisResults.risksAssumptions,
      {
        headers: ['Risk', 'Mitigation'],
        columns: ['risk', 'mitigation']
      }
    ));
    
    if (this.config.agentRouting) {
      md.push('\n---\n');
      
      md.push('### **Agent Suggestions (Pulser-Formatted YAML)**');
      md.push('');
      md.push('```yaml');
      md.push('agents:');
      
      this.analysisResults.agentSuggestions.forEach(agent => {
        md.push(`  - id: ${agent.id}`);
        md.push(`    role: ${agent.role}`);
        md.push(`    task: ${agent.task}`);
      });
      
      md.push('```');
    }
    
    md.push('\n---\n');
    md.push('Codex is no longer a "completion tool"—it\'s a full AI software engineer in a box.');
    
    return md.join('\n');
  }
  
  /**
   * Format the analysis results as YAML
   */
  _formatYaml() {
    return MarkdownFormatter.objectToYaml({
      product: this.analysisResults.productOverview,
      strategic_improvements: this.analysisResults.strategicImprovements,
      key_features: this.analysisResults.keyFeatures,
      ui_ux: this.analysisResults.uiUxAnalysis,
      enhancements: this.analysisResults.suggestedEnhancements,
      go_to_market: this.analysisResults.goToMarket,
      risks: this.analysisResults.risksAssumptions,
      agent_suggestions: this.analysisResults.agentSuggestions
    });
  }
}

// Export the class
module.exports = ReverseSnapshot;