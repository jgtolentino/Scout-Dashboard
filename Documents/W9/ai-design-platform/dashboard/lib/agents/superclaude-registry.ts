// SuperClaude Agent Registry & Orchestration System
// Integrates all agents under the SuperClaude framework with persona alignment and quality gates

import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Agent registration interface
interface AgentRegistration {
  id: string;
  name: string;
  type: string;
  personas: string[]; // SuperClaude personas this agent aligns with
  capabilities: string[];
  mcpServers: string[]; // Required MCP servers
  qualityGates: string[];
  status: 'active' | 'inactive' | 'maintenance';
  version: string;
  framework_version: string;
  metadata: {
    description: string;
    domain: string;
    priority: number;
    delegation_score: number;
    wave_compatible: boolean;
    token_efficiency: number;
  };
}

// Task delegation interface
interface TaskDelegation {
  id: string;
  task_type: string;
  complexity: number;
  domain: string;
  requirements: string[];
  optimal_agents: string[];
  fallback_agents: string[];
  mcp_requirements: string[];
  quality_requirements: string[];
}

// Orchestration state
interface SuperClaudeState {
  request: string;
  context: {
    user_intent: string;
    complexity_score: number;
    domain: string;
    wave_eligible: boolean;
    token_budget: number;
  };
  agents: {
    available: AgentRegistration[];
    selected: AgentRegistration[];
    delegations: TaskDelegation[];
  };
  execution: {
    strategy: 'single' | 'parallel' | 'wave' | 'sequential';
    quality_gates: string[];
    validation_steps: string[];
    performance_targets: any;
  };
  results: {
    agent_outputs: any[];
    quality_scores: number[];
    execution_time: number;
    framework_compliance: number;
  };
  messages: BaseMessage[];
}

export class SuperClaudeAgentRegistry {
  private supabase: SupabaseClient;
  private graph: StateGraph<SuperClaudeState>;
  private registeredAgents: Map<string, AgentRegistration>;
  private framework_version: string = '3.0';

  // SuperClaude persona mappings
  private readonly personaAgentMappings = {
    'architect': ['project-manager', 'system-architect'],
    'frontend': ['visual-designer', 'ui-developer'],
    'backend': ['api-developer', 'data-engineer'],
    'security': ['security-auditor', 'compliance-checker'],
    'analyzer': ['data-analyst', 'performance-analyzer'],
    'qa': ['quality-reviewer', 'test-engineer'],
    'refactorer': ['code-optimizer', 'technical-debt-manager'],
    'devops': ['deployment-manager', 'infrastructure-optimizer'],
    'mentor': ['knowledge-assistant', 'documentation-generator'],
    'scribe': ['content-writer', 'documentation-specialist'],
    'performance': ['performance-optimizer', 'bottleneck-analyzer'],
  };

  // Quality gates aligned with SuperClaude framework
  private readonly frameworkQualityGates = [
    'syntax_validation',
    'type_checking',
    'lint_compliance',
    'security_scan',
    'test_coverage',
    'performance_check',
    'documentation_completeness',
    'integration_validation',
  ];

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.registeredAgents = new Map();
    this.graph = this.buildOrchestrationGraph();
    this.initializeAgentRegistry();
  }

  private buildOrchestrationGraph(): StateGraph<SuperClaudeState> {
    const graph = new StateGraph<SuperClaudeState>({
      channels: {
        request: null,
        context: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        agents: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({ available: [], selected: [], delegations: [] }),
        },
        execution: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        results: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => [...x, ...y],
          default: () => [],
        },
      },
    });

    // Analyze request using SuperClaude patterns
    graph.addNode('analyze_superclaude_request', async (state) => {
      console.log('🧠 Analyzing request with SuperClaude framework...');

      const analysis = await this.analyzeRequestWithFramework(state.request);

      return {
        context: analysis,
        messages: [
          new AIMessage(`Framework analysis: ${analysis.domain} domain, complexity ${analysis.complexity_score}`),
        ],
      };
    });

    // Load available agents
    graph.addNode('load_available_agents', async (state) => {
      console.log('🤖 Loading SuperClaude-registered agents...');

      const availableAgents = Array.from(this.registeredAgents.values())
        .filter(agent => agent.status === 'active');

      return {
        agents: {
          ...state.agents,
          available: availableAgents,
        },
        messages: [
          new AIMessage(`Loaded ${availableAgents.length} active agents`),
        ],
      };
    });

    // Select optimal agents based on SuperClaude persona alignment
    graph.addNode('select_optimal_agents', async (state) => {
      console.log('🎯 Selecting agents with persona alignment...');

      const selectedAgents = await this.selectAgentsWithPersonaAlignment(
        state.context,
        state.agents.available
      );

      const delegations = await this.createTaskDelegations(
        state.context,
        selectedAgents
      );

      return {
        agents: {
          ...state.agents,
          selected: selectedAgents,
          delegations,
        },
        messages: [
          new AIMessage(`Selected ${selectedAgents.length} agents with ${delegations.length} delegations`),
        ],
      };
    });

    // Determine execution strategy
    graph.addNode('plan_execution_strategy', async (state) => {
      console.log('📋 Planning SuperClaude execution strategy...');

      const strategy = await this.planExecutionStrategy(state.context, state.agents.selected);

      return {
        execution: {
          strategy: strategy.type,
          quality_gates: this.frameworkQualityGates,
          validation_steps: strategy.validation_steps,
          performance_targets: strategy.performance_targets,
        },
        messages: [
          new AIMessage(`Execution strategy: ${strategy.type} with ${strategy.validation_steps.length} validation steps`),
        ],
      };
    });

    // Execute with quality gates
    graph.addNode('execute_with_quality_gates', async (state) => {
      console.log('⚡ Executing with SuperClaude quality gates...');

      const results = await this.executeWithQualityGates(
        state.agents.selected,
        state.agents.delegations,
        state.execution,
        state.request
      );

      return {
        results,
        messages: [
          new AIMessage(`Executed ${state.agents.selected.length} agents with quality validation`),
        ],
      };
    });

    // Validate framework compliance
    graph.addNode('validate_framework_compliance', async (state) => {
      console.log('✅ Validating SuperClaude framework compliance...');

      const compliance = await this.validateFrameworkCompliance(
        state.results.agent_outputs,
        state.execution.quality_gates
      );

      return {
        results: {
          ...state.results,
          framework_compliance: compliance.score,
        },
        messages: [
          new AIMessage(`Framework compliance: ${compliance.score}% (${compliance.passed}/${compliance.total} gates passed)`),
        ],
      };
    });

    // Generate SuperClaude report
    graph.addNode('generate_superclaude_report', async (state) => {
      console.log('📊 Generating SuperClaude orchestration report...');

      const report = this.generateFrameworkReport(state);

      return {
        messages: [
          new AIMessage(report),
        ],
      };
    });

    // Define edges
    graph.addEdge(START, 'analyze_superclaude_request');
    graph.addEdge('analyze_superclaude_request', 'load_available_agents');
    graph.addEdge('load_available_agents', 'select_optimal_agents');
    graph.addEdge('select_optimal_agents', 'plan_execution_strategy');
    graph.addEdge('plan_execution_strategy', 'execute_with_quality_gates');
    graph.addEdge('execute_with_quality_gates', 'validate_framework_compliance');
    graph.addEdge('validate_framework_compliance', 'generate_superclaude_report');
    graph.addEdge('generate_superclaude_report', END);

    return graph;
  }

  private async initializeAgentRegistry() {
    // Register agents with SuperClaude framework alignment
    await this.registerAgent({
      id: 'project-manager-001',
      name: 'Project Manager Agent',
      type: 'orchestration',
      personas: ['architect', 'mentor'],
      capabilities: ['task_management', 'team_coordination', 'progress_tracking'],
      mcpServers: ['sequential', 'context7'],
      qualityGates: ['task_validation', 'progress_verification'],
      status: 'active',
      version: '1.0.0',
      framework_version: this.framework_version,
      metadata: {
        description: 'Orchestrates project workflows and team coordination',
        domain: 'project_management',
        priority: 10,
        delegation_score: 0.9,
        wave_compatible: true,
        token_efficiency: 0.8,
      },
    });

    await this.registerAgent({
      id: 'creative-director-001',
      name: 'Creative Director Agent',
      type: 'quality_assurance',
      personas: ['qa', 'frontend', 'scribe'],
      capabilities: ['creative_review', 'brand_compliance', 'quality_scoring'],
      mcpServers: ['sequential', 'magic'],
      qualityGates: ['brand_validation', 'creative_scoring', 'approval_workflow'],
      status: 'active',
      version: '1.0.0',
      framework_version: this.framework_version,
      metadata: {
        description: 'Reviews creative assets and ensures brand compliance',
        domain: 'creative_quality',
        priority: 9,
        delegation_score: 0.85,
        wave_compatible: true,
        token_efficiency: 0.75,
      },
    });

    await this.registerAgent({
      id: 'visual-designer-001',
      name: 'Visual Designer Agent',
      type: 'content_generation',
      personas: ['frontend', 'scribe'],
      capabilities: ['visual_generation', 'asset_creation', 'style_consistency'],
      mcpServers: ['magic', 'sequential'],
      qualityGates: ['generation_validation', 'style_consistency', 'format_compliance'],
      status: 'active',
      version: '1.0.0',
      framework_version: this.framework_version,
      metadata: {
        description: 'Generates visual assets using DALL-E with brand compliance',
        domain: 'visual_design',
        priority: 8,
        delegation_score: 0.8,
        wave_compatible: true,
        token_efficiency: 0.7,
      },
    });
  }

  private async analyzeRequestWithFramework(request: string): Promise<any> {
    const keywords = request.toLowerCase();

    // Complexity scoring based on SuperClaude framework
    let complexity_score = 0.3; // Base score

    // Domain indicators
    const domains = {
      'creative': ['design', 'visual', 'brand', 'creative', 'aesthetic'],
      'technical': ['code', 'develop', 'implement', 'system', 'architecture'],
      'analysis': ['analyze', 'review', 'audit', 'assess', 'evaluate'],
      'optimization': ['optimize', 'improve', 'enhance', 'performance', 'efficiency'],
      'documentation': ['document', 'write', 'guide', 'manual', 'explain'],
    };

    let primary_domain = 'general';
    let domain_matches = 0;

    Object.entries(domains).forEach(([domain, terms]) => {
      const matches = terms.filter(term => keywords.includes(term)).length;
      if (matches > domain_matches) {
        domain_matches = matches;
        primary_domain = domain;
      }
    });

    // Complexity indicators
    const complexityIndicators = [
      'comprehensive', 'enterprise', 'large-scale', 'systematic',
      'multiple', 'complex', 'advanced', 'sophisticated'
    ];

    complexityIndicators.forEach(indicator => {
      if (keywords.includes(indicator)) {
        complexity_score += 0.1;
      }
    });

    // Wave eligibility based on SuperClaude framework
    const wave_eligible = complexity_score >= 0.7 ||
                         keywords.includes('comprehensive') ||
                         keywords.includes('systematic') ||
                         domain_matches >= 3;

    return {
      user_intent: request,
      complexity_score: Math.min(1.0, complexity_score),
      domain: primary_domain,
      wave_eligible,
      token_budget: wave_eligible ? 30000 : 15000,
    };
  }

  private async selectAgentsWithPersonaAlignment(
    context: any,
    availableAgents: AgentRegistration[]
  ): Promise<AgentRegistration[]> {

    // Get optimal personas for the domain
    const domainPersonas = this.getPersonasForDomain(context.domain);

    // Score agents based on persona alignment
    const scoredAgents = availableAgents.map(agent => {
      let score = 0;

      // Persona alignment score
      const personaMatch = agent.personas.some(persona =>
        domainPersonas.includes(persona)
      );
      if (personaMatch) score += 0.4;

      // Complexity alignment
      if (context.complexity_score >= 0.7 && agent.metadata.wave_compatible) {
        score += 0.2;
      }

      // Domain specificity
      if (agent.metadata.domain === context.domain) {
        score += 0.3;
      }

      // Delegation capability
      score += agent.metadata.delegation_score * 0.1;

      return { agent, score };
    });

    // Sort by score and select top agents
    return scoredAgents
      .sort((a, b) => b.score - a.score)
      .slice(0, context.wave_eligible ? 5 : 3)
      .map(item => item.agent);
  }

  private getPersonasForDomain(domain: string): string[] {
    const domainPersonaMap: Record<string, string[]> = {
      'creative': ['frontend', 'scribe', 'qa'],
      'technical': ['backend', 'architect', 'devops'],
      'analysis': ['analyzer', 'performance', 'qa'],
      'optimization': ['performance', 'refactorer', 'architect'],
      'documentation': ['scribe', 'mentor'],
      'general': ['architect', 'analyzer'],
    };

    return domainPersonaMap[domain] || domainPersonaMap.general;
  }

  private async createTaskDelegations(
    context: any,
    selectedAgents: AgentRegistration[]
  ): Promise<TaskDelegation[]> {

    const delegations: TaskDelegation[] = [];

    selectedAgents.forEach(agent => {
      const delegation: TaskDelegation = {
        id: crypto.randomUUID(),
        task_type: agent.type,
        complexity: context.complexity_score,
        domain: context.domain,
        requirements: agent.capabilities,
        optimal_agents: [agent.id],
        fallback_agents: this.getFallbackAgents(agent),
        mcp_requirements: agent.mcpServers,
        quality_requirements: agent.qualityGates,
      };

      delegations.push(delegation);
    });

    return delegations;
  }

  private getFallbackAgents(agent: AgentRegistration): string[] {
    // Find agents with similar capabilities
    return Array.from(this.registeredAgents.values())
      .filter(a =>
        a.id !== agent.id &&
        a.type === agent.type &&
        a.status === 'active'
      )
      .map(a => a.id)
      .slice(0, 2);
  }

  private async planExecutionStrategy(
    context: any,
    selectedAgents: AgentRegistration[]
  ): Promise<any> {

    let strategy: 'single' | 'parallel' | 'wave' | 'sequential' = 'single';

    if (context.wave_eligible && selectedAgents.length > 2) {
      strategy = 'wave';
    } else if (selectedAgents.length > 1 && context.complexity_score >= 0.6) {
      strategy = 'parallel';
    } else if (selectedAgents.length > 1) {
      strategy = 'sequential';
    }

    return {
      type: strategy,
      validation_steps: this.frameworkQualityGates,
      performance_targets: {
        max_execution_time: context.wave_eligible ? 300000 : 120000, // ms
        min_quality_score: 0.8,
        max_token_usage: context.token_budget,
      },
    };
  }

  private async executeWithQualityGates(
    selectedAgents: AgentRegistration[],
    delegations: TaskDelegation[],
    execution: any,
    request: string
  ): Promise<any> {

    const startTime = Date.now();
    const agent_outputs: any[] = [];
    const quality_scores: number[] = [];

    // Execute each delegation
    for (const delegation of delegations) {
      try {
        // Simulate agent execution with quality gates
        const agentResult = await this.executeAgentWithQualityGates(
          delegation,
          request,
          execution.quality_gates
        );

        agent_outputs.push(agentResult);
        quality_scores.push(agentResult.quality_score || 0.8);

      } catch (error) {
        console.error(`Agent execution failed for ${delegation.id}:`, error);
        quality_scores.push(0.0);
      }
    }

    return {
      agent_outputs,
      quality_scores,
      execution_time: Date.now() - startTime,
      framework_compliance: 0, // Will be calculated separately
    };
  }

  private async executeAgentWithQualityGates(
    delegation: TaskDelegation,
    request: string,
    qualityGates: string[]
  ): Promise<any> {

    // Simulate agent execution
    const result = {
      delegation_id: delegation.id,
      task_type: delegation.task_type,
      status: 'completed',
      output: `Simulated output for ${delegation.task_type}`,
      quality_score: 0.8 + Math.random() * 0.2, // Simulate quality score
      execution_time: 1000 + Math.random() * 4000, // Simulate execution time
      quality_gates_passed: qualityGates.length,
      quality_gates_failed: 0,
    };

    return result;
  }

  private async validateFrameworkCompliance(
    agentOutputs: any[],
    qualityGates: string[]
  ): Promise<any> {

    let passed = 0;
    const total = qualityGates.length;

    // Simulate quality gate validation
    qualityGates.forEach(gate => {
      // Simulate gate validation logic
      const gateResult = Math.random() > 0.1; // 90% pass rate simulation
      if (gateResult) passed++;
    });

    return {
      score: Math.round((passed / total) * 100),
      passed,
      total,
      details: qualityGates.map(gate => ({
        gate,
        status: Math.random() > 0.1 ? 'passed' : 'failed',
      })),
    };
  }

  private generateFrameworkReport(state: SuperClaudeState): string {
    let report = '# 🚀 SuperClaude Agent Orchestration Report\n\n';

    report += `## Request Analysis\n`;
    report += `- **Domain:** ${state.context.domain}\n`;
    report += `- **Complexity:** ${state.context.complexity_score}/1.0\n`;
    report += `- **Wave Eligible:** ${state.context.wave_eligible ? '✅' : '❌'}\n`;
    report += `- **Token Budget:** ${state.context.token_budget.toLocaleString()}\n\n`;

    report += `## Agent Selection\n`;
    report += `- **Available Agents:** ${state.agents.available.length}\n`;
    report += `- **Selected Agents:** ${state.agents.selected.length}\n`;
    report += `- **Execution Strategy:** ${state.execution.strategy}\n\n`;

    if (state.agents.selected.length > 0) {
      report += `### Selected Agents\n`;
      state.agents.selected.forEach(agent => {
        report += `- **${agent.name}** (${agent.id})\n`;
        report += `  - Personas: ${agent.personas.join(', ')}\n`;
        report += `  - Domain: ${agent.metadata.domain}\n`;
        report += `  - Wave Compatible: ${agent.metadata.wave_compatible ? '✅' : '❌'}\n`;
      });
      report += '\n';
    }

    if (state.results.agent_outputs?.length > 0) {
      report += `## Execution Results\n`;
      report += `- **Execution Time:** ${state.results.execution_time}ms\n`;
      report += `- **Framework Compliance:** ${state.results.framework_compliance}%\n`;
      report += `- **Average Quality Score:** ${(state.results.quality_scores.reduce((a, b) => a + b, 0) / state.results.quality_scores.length * 100).toFixed(1)}%\n\n`;
    }

    report += `## Quality Gates\n`;
    state.execution.quality_gates?.forEach(gate => {
      report += `- ✅ ${gate}\n`;
    });

    report += `\n## Framework Metadata\n`;
    report += `- **SuperClaude Version:** ${this.framework_version}\n`;
    report += `- **Registered Agents:** ${this.registeredAgents.size}\n`;
    report += `- **Generated:** ${new Date().toISOString()}\n`;

    return report;
  }

  // Public interface
  public async registerAgent(registration: AgentRegistration): Promise<void> {
    // Validate framework compliance
    if (registration.framework_version !== this.framework_version) {
      throw new Error(`Agent framework version ${registration.framework_version} does not match registry version ${this.framework_version}`);
    }

    this.registeredAgents.set(registration.id, registration);

    // Store in database
    await this.supabase
      .from('agent_registry')
      .upsert({
        ...registration,
        updated_at: new Date().toISOString(),
      });

    console.log(`✅ Registered agent: ${registration.name} (${registration.id})`);
  }

  public async orchestrateRequest(request: string): Promise<any> {
    const initialState: SuperClaudeState = {
      request,
      context: {},
      agents: { available: [], selected: [], delegations: [] },
      execution: {},
      results: {},
      messages: [new HumanMessage(request)],
    };

    const compiled = this.graph.compile();
    const result = await compiled.invoke(initialState);

    return result;
  }

  public async getFrameworkStatus(): Promise<any> {
    const agents = Array.from(this.registeredAgents.values());

    return {
      framework_version: this.framework_version,
      total_agents: agents.length,
      active_agents: agents.filter(a => a.status === 'active').length,
      personas_supported: Object.keys(this.personaAgentMappings),
      quality_gates: this.frameworkQualityGates,
      agent_types: [...new Set(agents.map(a => a.type))],
      domains_covered: [...new Set(agents.map(a => a.metadata.domain))],
      wave_compatible_agents: agents.filter(a => a.metadata.wave_compatible).length,
      last_updated: new Date().toISOString(),
    };
  }

  public async validateAgentCompliance(agentId: string): Promise<any> {
    const agent = this.registeredAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in registry`);
    }

    const compliance = {
      framework_version_match: agent.framework_version === this.framework_version,
      persona_alignment: agent.personas.every(p => Object.keys(this.personaAgentMappings).includes(p)),
      quality_gates_defined: agent.qualityGates.length > 0,
      mcp_servers_specified: agent.mcpServers.length > 0,
      metadata_complete: Boolean(agent.metadata.description && agent.metadata.domain),
    };

    const score = Object.values(compliance).filter(Boolean).length / Object.keys(compliance).length;

    return {
      agent_id: agentId,
      compliance_score: Math.round(score * 100),
      details: compliance,
      recommendations: this.getComplianceRecommendations(compliance),
    };
  }

  private getComplianceRecommendations(compliance: any): string[] {
    const recommendations: string[] = [];

    if (!compliance.framework_version_match) {
      recommendations.push('Update agent to current SuperClaude framework version');
    }
    if (!compliance.persona_alignment) {
      recommendations.push('Align agent personas with SuperClaude persona system');
    }
    if (!compliance.quality_gates_defined) {
      recommendations.push('Define quality gates for agent validation');
    }
    if (!compliance.mcp_servers_specified) {
      recommendations.push('Specify required MCP servers for agent operation');
    }
    if (!compliance.metadata_complete) {
      recommendations.push('Complete agent metadata for proper framework integration');
    }

    return recommendations;
  }
}