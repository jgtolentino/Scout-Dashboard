// Agent Workflow Coordination System
// Orchestrates complex multi-agent workflows and manages dependencies

import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Import all agents
import { ProjectManagerAgent } from './project-manager';
import { CreativeDirectorAgent } from './creative-director';
import { VisualDesignerAgent } from './visual-designer';
import { DeveloperAgent } from './developer';
import { QATestingAgent } from './qa-testing';
import { DataAnalystAgent } from './data-analyst';
import { SuperClaudeAgentRegistry } from './superclaude-registry';

// Workflow specifications
interface WorkflowSpec {
  id: string;
  name: string;
  description: string;
  type: 'creative_campaign' | 'product_development' | 'analysis_pipeline' | 'quality_assurance' | 'data_driven_optimization' | 'custom';
  stages: WorkflowStage[];
  dependencies: WorkflowDependency[];
  quality_gates: QualityGate[];
  parallel_execution: boolean;
  estimated_duration_minutes: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    created_by: string;
    project_id?: string;
    campaign_id?: string;
    triggers: string[];
    notifications: string[];
  };
}

interface WorkflowStage {
  id: string;
  name: string;
  agent_type: string;
  agent_config: any;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  timeout_minutes: number;
  retry_attempts: number;
  conditions: WorkflowCondition[];
  quality_checks: string[];
}

interface WorkflowDependency {
  from_stage: string;
  to_stage: string;
  dependency_type: 'data' | 'approval' | 'completion' | 'conditional';
  conditions?: any;
  data_mapping?: { [key: string]: string };
}

interface QualityGate {
  id: string;
  stage_id: string;
  name: string;
  type: 'automatic' | 'manual' | 'hybrid';
  criteria: QualityCriteria[];
  threshold_score: number;
  blocking: boolean; // If true, workflow stops on failure
  escalation_rules: EscalationRule[];
}

interface QualityCriteria {
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'between';
  value: number | [number, number];
  weight: number;
}

interface EscalationRule {
  condition: string;
  action: 'notify' | 'reassign' | 'abort' | 'manual_review';
  target: string;
  delay_minutes: number;
}

interface WorkflowInput {
  name: string;
  type: 'string' | 'number' | 'object' | 'array' | 'file' | 'asset';
  required: boolean;
  source: 'user' | 'previous_stage' | 'database' | 'external';
  validation_rules?: any;
}

interface WorkflowOutput {
  name: string;
  type: 'string' | 'number' | 'object' | 'array' | 'file' | 'asset';
  description: string;
  storage_location: string;
  metadata_fields: string[];
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'skip_stage' | 'modify_inputs' | 'change_agent_config';
}

// Workflow execution state
interface WorkflowExecution {
  id: string;
  workflow_spec: WorkflowSpec;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  current_stage?: string;
  stage_results: { [stage_id: string]: StageResult };
  quality_gate_results: { [gate_id: string]: QualityGateResult };
  execution_metadata: {
    started_at: string;
    completed_at?: string;
    total_duration_ms?: number;
    error_message?: string;
    retry_count: number;
  };
  data_context: { [key: string]: any };
  agent_instances: { [agent_type: string]: any };
}

interface StageResult {
  stage_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  agent_output: any;
  execution_time_ms: number;
  quality_scores: { [metric: string]: number };
  artifacts: WorkflowArtifact[];
  error_message?: string;
  retry_count: number;
}

interface QualityGateResult {
  gate_id: string;
  status: 'passed' | 'failed' | 'manual_review' | 'escalated';
  overall_score: number;
  criteria_results: { [criteria_id: string]: { score: number; passed: boolean } };
  reviewer?: string;
  review_notes?: string;
  escalation_actions: string[];
}

interface WorkflowArtifact {
  id: string;
  name: string;
  type: 'asset' | 'report' | 'data' | 'code' | 'documentation';
  file_url: string;
  metadata: any;
  stage_id: string;
  created_at: string;
}

// Workflow Coordinator state
interface WorkflowCoordinatorState {
  projectId?: string;
  campaignId?: string;
  request: string;
  workflow_type?: string;
  context: {
    project?: any;
    campaign?: any;
    existing_workflows?: any[];
    agent_availability?: { [agent_type: string]: boolean };
    resource_constraints?: any;
  };
  workflow_spec?: WorkflowSpec;
  execution?: WorkflowExecution;
  coordination_plan?: {
    parallel_stages: string[][];
    critical_path: string[];
    estimated_duration: number;
    resource_requirements: any;
  };
  messages: BaseMessage[];
  decision?: {
    action: string;
    reasoning: string;
    workflow_strategy: string;
    coordination_approach: string;
    confidence: number;
  };
}

export class WorkflowCoordinator {
  private supabase: SupabaseClient;
  private graph: StateGraph<WorkflowCoordinatorState>;
  private agentId: string;
  private agentRegistry: SuperClaudeAgentRegistry;
  private agentInstances: { [key: string]: any } = {};

  // Predefined workflow templates
  private readonly workflowTemplates = {
    'creative_campaign': {
      name: 'Creative Campaign Development',
      description: 'End-to-end creative campaign development workflow',
      stages: [
        { agent: 'project-manager', name: 'Project Planning' },
        { agent: 'visual-designer', name: 'Visual Asset Creation' },
        { agent: 'creative-director', name: 'Creative Review' },
        { agent: 'developer', name: 'Implementation' },
        { agent: 'qa-testing', name: 'Quality Assurance' },
        { agent: 'data-analyst', name: 'Performance Analysis' },
      ],
    },
    'product_development': {
      name: 'Product Development Pipeline',
      description: 'Complete product development from concept to launch',
      stages: [
        { agent: 'project-manager', name: 'Requirements Analysis' },
        { agent: 'developer', name: 'Development' },
        { agent: 'qa-testing', name: 'Testing & Validation' },
        { agent: 'creative-director', name: 'Design Review' },
        { agent: 'data-analyst', name: 'Launch Analytics' },
      ],
    },
    'analysis_pipeline': {
      name: 'Data Analysis Pipeline',
      description: 'Comprehensive data analysis and insights generation',
      stages: [
        { agent: 'data-analyst', name: 'Data Collection & Analysis' },
        { agent: 'creative-director', name: 'Insights Review' },
        { agent: 'project-manager', name: 'Action Planning' },
      ],
    },
    'quality_assurance': {
      name: 'Quality Assurance Workflow',
      description: 'Comprehensive quality validation across all aspects',
      stages: [
        { agent: 'qa-testing', name: 'Technical Testing' },
        { agent: 'creative-director', name: 'Creative Quality Review' },
        { agent: 'data-analyst', name: 'Performance Validation' },
        { agent: 'project-manager', name: 'Final Approval' },
      ],
    },
  };

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiApiKey?: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.agentId = 'workflow-coordinator-001';
    this.agentRegistry = new SuperClaudeAgentRegistry(supabaseUrl, supabaseKey);
    this.graph = this.buildGraph();

    // Initialize agent instances
    this.initializeAgents(supabaseUrl, supabaseKey, openaiApiKey);
  }

  private initializeAgents(supabaseUrl: string, supabaseKey: string, openaiApiKey?: string) {
    this.agentInstances = {
      'project-manager': new ProjectManagerAgent(supabaseUrl, supabaseKey, openaiApiKey || ''),
      'creative-director': new CreativeDirectorAgent(supabaseUrl, supabaseKey),
      'visual-designer': new VisualDesignerAgent(supabaseUrl, supabaseKey, openaiApiKey || ''),
      'developer': new DeveloperAgent(supabaseUrl, supabaseKey, openaiApiKey || ''),
      'qa-testing': new QATestingAgent(supabaseUrl, supabaseKey),
      'data-analyst': new DataAnalystAgent(supabaseUrl, supabaseKey, openaiApiKey || ''),
    };
  }

  private buildGraph(): StateGraph<WorkflowCoordinatorState> {
    const graph = new StateGraph<WorkflowCoordinatorState>({
      channels: {
        projectId: null,
        campaignId: null,
        request: null,
        workflow_type: null,
        context: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        workflow_spec: null,
        execution: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        coordination_plan: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => [...x, ...y],
          default: () => [],
        },
        decision: null,
      },
    });

    // Analyze workflow requirements
    graph.addNode('analyze_workflow_requirements', async (state) => {
      console.log('🔄 Analyzing workflow requirements...');

      const analysis = await this.analyzeWorkflowRequirements(state.request, state.context);

      return {
        decision: analysis,
        workflow_type: analysis.workflow_strategy,
        messages: [
          new AIMessage(`Workflow analysis: ${analysis.action} - ${analysis.workflow_strategy}`),
        ],
      };
    });

    // Load workflow context
    graph.addNode('load_workflow_context', async (state) => {
      console.log('📂 Loading workflow context...');

      let context: any = {};

      // Load project and campaign data
      if (state.projectId) {
        const { data: project } = await this.supabase
          .from('projects')
          .select('*, client:client_accounts(*), campaigns(*)')
          .eq('id', state.projectId)
          .single();

        context.project = project;
        context.campaigns = project?.campaigns || [];
      }

      // Check agent availability
      context.agent_availability = await this.checkAgentAvailability();

      // Load existing workflows
      const { data: existingWorkflows } = await this.supabase
        .from('creative_assets')
        .select('*')
        .eq('project_id', state.projectId)
        .eq('type', 'workflow')
        .order('created_at', { ascending: false })
        .limit(5);

      context.existing_workflows = existingWorkflows;

      // Assess resource constraints
      context.resource_constraints = await this.assessResourceConstraints();

      return {
        context,
        messages: [
          new AIMessage('Workflow context loaded successfully'),
        ],
      };
    });

    // Create workflow specification
    graph.addNode('create_workflow_specification', async (state) => {
      console.log('📋 Creating workflow specification...');

      if (!state.decision || !state.workflow_type) {
        return {
          messages: [new AIMessage('No workflow analysis available')],
        };
      }

      const workflowSpec = await this.createWorkflowSpecification(
        state.workflow_type,
        state.decision,
        state.context,
        state.request
      );

      return {
        workflow_spec: workflowSpec,
        messages: [
          new AIMessage(`Created workflow specification with ${workflowSpec.stages.length} stages`),
        ],
      };
    });

    // Plan coordination strategy
    graph.addNode('plan_coordination_strategy', async (state) => {
      console.log('🎯 Planning coordination strategy...');

      if (!state.workflow_spec) {
        return {
          messages: [new AIMessage('No workflow specification available')],
        };
      }

      const coordinationPlan = await this.planCoordinationStrategy(
        state.workflow_spec,
        state.context
      );

      return {
        coordination_plan: coordinationPlan,
        messages: [
          new AIMessage(`Coordination plan created - ${coordinationPlan.parallel_stages.length} parallel stages identified`),
        ],
      };
    });

    // Execute workflow
    graph.addNode('execute_workflow', async (state) => {
      console.log('🚀 Executing workflow...');

      if (!state.workflow_spec || !state.coordination_plan) {
        return {
          messages: [new AIMessage('Missing workflow specification or coordination plan')],
        };
      }

      const execution = await this.executeWorkflow(
        state.workflow_spec,
        state.coordination_plan,
        state.context
      );

      return {
        execution,
        messages: [
          new AIMessage(`Workflow execution ${execution.status} - ${Object.keys(execution.stage_results).length} stages completed`),
        ],
      };
    });

    // Validate quality gates
    graph.addNode('validate_quality_gates', async (state) => {
      console.log('✅ Validating quality gates...');

      if (!state.execution || !state.workflow_spec) {
        return {
          messages: [new AIMessage('No execution results available for validation')],
        };
      }

      const updatedExecution = await this.validateQualityGates(
        state.execution,
        state.workflow_spec
      );

      return {
        execution: updatedExecution,
        messages: [
          new AIMessage(`Quality validation complete - ${Object.keys(updatedExecution.quality_gate_results).length} gates processed`),
        ],
      };
    });

    // Store workflow results
    graph.addNode('store_workflow_results', async (state) => {
      console.log('💾 Storing workflow results...');

      if (!state.execution || !state.workflow_spec) {
        return {
          messages: [new AIMessage('No workflow results to store')],
        };
      }

      const storedAssets = await this.storeWorkflowResults(
        state.execution,
        state.workflow_spec,
        state.projectId
      );

      return {
        context: {
          ...state.context,
          storedAssets,
        },
        messages: [
          new AIMessage(`Stored ${storedAssets.length} workflow assets`),
        ],
      };
    });

    // Generate coordination report
    graph.addNode('generate_coordination_report', async (state) => {
      console.log('📋 Generating coordination report...');

      const report = this.generateCoordinationReport(state);

      return {
        messages: [
          new AIMessage(report),
        ],
      };
    });

    // Define workflow edges
    graph.addEdge(START, 'analyze_workflow_requirements');
    graph.addEdge('analyze_workflow_requirements', 'load_workflow_context');
    graph.addEdge('load_workflow_context', 'create_workflow_specification');
    graph.addEdge('create_workflow_specification', 'plan_coordination_strategy');
    graph.addEdge('plan_coordination_strategy', 'execute_workflow');
    graph.addEdge('execute_workflow', 'validate_quality_gates');
    graph.addEdge('validate_quality_gates', 'store_workflow_results');
    graph.addEdge('store_workflow_results', 'generate_coordination_report');
    graph.addEdge('generate_coordination_report', END);

    return graph;
  }

  // Helper methods
  private async analyzeWorkflowRequirements(request: string, context: any): Promise<any> {
    const keywords = request.toLowerCase();

    if (keywords.includes('campaign') || keywords.includes('creative')) {
      return {
        action: 'coordinate_creative_campaign',
        reasoning: 'Focus on creative campaign development workflow',
        workflow_strategy: 'creative_campaign',
        coordination_approach: 'sequential_with_parallel_optimization',
        confidence: 0.9,
      };
    } else if (keywords.includes('develop') || keywords.includes('build') || keywords.includes('product')) {
      return {
        action: 'coordinate_product_development',
        reasoning: 'Focus on product development pipeline',
        workflow_strategy: 'product_development',
        coordination_approach: 'agile_iterative',
        confidence: 0.85,
      };
    } else if (keywords.includes('analyze') || keywords.includes('data') || keywords.includes('insights')) {
      return {
        action: 'coordinate_analysis_pipeline',
        reasoning: 'Focus on data analysis and insights generation',
        workflow_strategy: 'analysis_pipeline',
        coordination_approach: 'data_driven',
        confidence: 0.9,
      };
    } else if (keywords.includes('test') || keywords.includes('quality') || keywords.includes('validate')) {
      return {
        action: 'coordinate_quality_assurance',
        reasoning: 'Focus on comprehensive quality validation',
        workflow_strategy: 'quality_assurance',
        coordination_approach: 'quality_first',
        confidence: 0.85,
      };
    } else if (keywords.includes('optimize') || keywords.includes('improve')) {
      return {
        action: 'coordinate_optimization_workflow',
        reasoning: 'Focus on data-driven optimization',
        workflow_strategy: 'data_driven_optimization',
        coordination_approach: 'iterative_improvement',
        confidence: 0.8,
      };
    }

    return {
      action: 'coordinate_custom_workflow',
      reasoning: 'Create custom workflow based on specific requirements',
      workflow_strategy: 'custom',
      coordination_approach: 'adaptive',
      confidence: 0.7,
    };
  }

  private async checkAgentAvailability(): Promise<{ [agent_type: string]: boolean }> {
    const availability: { [agent_type: string]: boolean } = {};

    for (const [agentType, agent] of Object.entries(this.agentInstances)) {
      try {
        const status = await agent.getAgentStatus();
        availability[agentType] = status.status === 'operational';
      } catch (error) {
        availability[agentType] = false;
      }
    }

    return availability;
  }

  private async assessResourceConstraints(): Promise<any> {
    // Assess system resource constraints
    return {
      max_parallel_agents: 3,
      memory_limit_mb: 2048,
      execution_timeout_minutes: 60,
      api_rate_limits: {
        openai: { requests_per_minute: 60, tokens_per_minute: 90000 },
        supabase: { requests_per_second: 100 },
      },
    };
  }

  private async createWorkflowSpecification(
    workflowType: string,
    decision: any,
    context: any,
    request: string
  ): Promise<WorkflowSpec> {

    const template = this.workflowTemplates[workflowType];
    if (!template) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    const stages: WorkflowStage[] = template.stages.map((stageTemplate, index) => ({
      id: `stage-${index + 1}`,
      name: stageTemplate.name,
      agent_type: stageTemplate.agent,
      agent_config: this.generateAgentConfig(stageTemplate.agent, request, context),
      inputs: this.generateStageInputs(stageTemplate.agent, index),
      outputs: this.generateStageOutputs(stageTemplate.agent),
      timeout_minutes: 30,
      retry_attempts: 2,
      conditions: [],
      quality_checks: this.generateQualityChecks(stageTemplate.agent),
    }));

    const dependencies = this.generateDependencies(stages);
    const qualityGates = this.generateQualityGates(stages);

    return {
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description,
      type: workflowType as any,
      stages,
      dependencies,
      quality_gates: qualityGates,
      parallel_execution: true,
      estimated_duration_minutes: stages.length * 25, // Rough estimate
      priority: 'medium',
      metadata: {
        created_by: this.agentId,
        project_id: context.project?.id,
        triggers: ['manual'],
        notifications: ['email', 'in_app'],
      },
    };
  }

  private generateAgentConfig(agentType: string, request: string, context: any): any {
    const baseConfig = {
      request,
      project_id: context.project?.id,
      campaign_id: context.campaign?.id,
    };

    switch (agentType) {
      case 'project-manager':
        return { ...baseConfig, focus: 'project_planning' };
      case 'creative-director':
        return { ...baseConfig, review_type: 'comprehensive' };
      case 'visual-designer':
        return { ...baseConfig, style: 'modern', format: 'web' };
      case 'developer':
        return { ...baseConfig, framework: 'react', language: 'typescript' };
      case 'qa-testing':
        return { ...baseConfig, test_types: ['unit', 'integration', 'e2e'] };
      case 'data-analyst':
        return { ...baseConfig, analysis_type: 'comprehensive' };
      default:
        return baseConfig;
    }
  }

  private generateStageInputs(agentType: string, index: number): WorkflowInput[] {
    const inputs: WorkflowInput[] = [
      {
        name: 'request',
        type: 'string',
        required: true,
        source: index === 0 ? 'user' : 'previous_stage',
      },
    ];

    if (index > 0) {
      inputs.push({
        name: 'previous_output',
        type: 'object',
        required: true,
        source: 'previous_stage',
      });
    }

    return inputs;
  }

  private generateStageOutputs(agentType: string): WorkflowOutput[] {
    return [
      {
        name: 'result',
        type: 'object',
        description: `Output from ${agentType} agent`,
        storage_location: 'database',
        metadata_fields: ['execution_time', 'quality_score', 'status'],
      },
      {
        name: 'artifacts',
        type: 'array',
        description: 'Generated artifacts and assets',
        storage_location: 'file_storage',
        metadata_fields: ['file_type', 'size', 'created_at'],
      },
    ];
  }

  private generateQualityChecks(agentType: string): string[] {
    const common = ['execution_time', 'error_rate', 'output_quality'];

    switch (agentType) {
      case 'creative-director':
        return [...common, 'brand_compliance', 'creative_quality'];
      case 'visual-designer':
        return [...common, 'design_quality', 'accessibility'];
      case 'developer':
        return [...common, 'code_quality', 'test_coverage'];
      case 'qa-testing':
        return [...common, 'test_coverage', 'bug_detection'];
      case 'data-analyst':
        return [...common, 'data_quality', 'insight_accuracy'];
      default:
        return common;
    }
  }

  private generateDependencies(stages: WorkflowStage[]): WorkflowDependency[] {
    const dependencies: WorkflowDependency[] = [];

    for (let i = 1; i < stages.length; i++) {
      dependencies.push({
        from_stage: stages[i - 1].id,
        to_stage: stages[i].id,
        dependency_type: 'completion',
        data_mapping: {
          'result': 'previous_output',
          'artifacts': 'input_artifacts',
        },
      });
    }

    return dependencies;
  }

  private generateQualityGates(stages: WorkflowStage[]): QualityGate[] {
    return stages.map(stage => ({
      id: `gate-${stage.id}`,
      stage_id: stage.id,
      name: `Quality Gate for ${stage.name}`,
      type: 'automatic' as const,
      criteria: [
        { metric: 'output_quality', operator: 'greater_than' as const, value: 7.0, weight: 0.4 },
        { metric: 'execution_time', operator: 'less_than' as const, value: stage.timeout_minutes * 60000, weight: 0.3 },
        { metric: 'error_rate', operator: 'less_than' as const, value: 0.1, weight: 0.3 },
      ],
      threshold_score: 7.0,
      blocking: false,
      escalation_rules: [
        {
          condition: 'score < 5.0',
          action: 'manual_review',
          target: 'creative-director',
          delay_minutes: 5,
        },
      ],
    }));
  }

  private async planCoordinationStrategy(
    workflowSpec: WorkflowSpec,
    context: any
  ): Promise<any> {

    // Identify parallel execution opportunities
    const parallelStages = this.identifyParallelStages(workflowSpec);

    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(workflowSpec);

    // Estimate resource requirements
    const resourceRequirements = this.estimateResourceRequirements(workflowSpec);

    // Calculate total estimated duration
    const estimatedDuration = this.calculateEstimatedDuration(workflowSpec, parallelStages);

    return {
      parallel_stages: parallelStages,
      critical_path: criticalPath,
      estimated_duration: estimatedDuration,
      resource_requirements: resourceRequirements,
    };
  }

  private identifyParallelStages(workflowSpec: WorkflowSpec): string[][] {
    // Simple implementation - identify stages that can run in parallel
    // In a more sophisticated implementation, would analyze dependencies
    const parallelGroups: string[][] = [];

    // Group stages that don't have direct dependencies
    const processed = new Set<string>();

    for (const stage of workflowSpec.stages) {
      if (processed.has(stage.id)) continue;

      const parallelGroup = [stage.id];
      processed.add(stage.id);

      // Find other stages that can run in parallel
      for (const otherStage of workflowSpec.stages) {
        if (processed.has(otherStage.id)) continue;

        const hasDirectDependency = workflowSpec.dependencies.some(dep =>
          (dep.from_stage === stage.id && dep.to_stage === otherStage.id) ||
          (dep.from_stage === otherStage.id && dep.to_stage === stage.id)
        );

        if (!hasDirectDependency) {
          parallelGroup.push(otherStage.id);
          processed.add(otherStage.id);
        }
      }

      if (parallelGroup.length > 1) {
        parallelGroups.push(parallelGroup);
      }
    }

    return parallelGroups;
  }

  private calculateCriticalPath(workflowSpec: WorkflowSpec): string[] {
    // Simple critical path calculation
    // In a real implementation, would use proper critical path method
    return workflowSpec.stages.map(stage => stage.id);
  }

  private estimateResourceRequirements(workflowSpec: WorkflowSpec): any {
    return {
      cpu_cores: Math.min(workflowSpec.stages.length, 4),
      memory_mb: workflowSpec.stages.length * 512,
      storage_gb: 10,
      api_calls: workflowSpec.stages.length * 50,
    };
  }

  private calculateEstimatedDuration(workflowSpec: WorkflowSpec, parallelStages: string[][]): number {
    // Calculate duration considering parallel execution
    const sequentialDuration = workflowSpec.stages.reduce((total, stage) => total + stage.timeout_minutes, 0);
    const parallelOptimization = parallelStages.reduce((total, group) => total + (group.length - 1) * 15, 0);

    return Math.max(sequentialDuration - parallelOptimization, workflowSpec.stages.length * 10);
  }

  private async executeWorkflow(
    workflowSpec: WorkflowSpec,
    coordinationPlan: any,
    context: any
  ): Promise<WorkflowExecution> {

    const execution: WorkflowExecution = {
      id: crypto.randomUUID(),
      workflow_spec: workflowSpec,
      status: 'running',
      stage_results: {},
      quality_gate_results: {},
      execution_metadata: {
        started_at: new Date().toISOString(),
        retry_count: 0,
      },
      data_context: { ...context },
      agent_instances: this.agentInstances,
    };

    try {
      // Execute stages according to coordination plan
      for (const stage of workflowSpec.stages) {
        execution.current_stage = stage.id;

        const stageResult = await this.executeStage(stage, execution, workflowSpec);
        execution.stage_results[stage.id] = stageResult;

        if (stageResult.status === 'failed') {
          execution.status = 'failed';
          execution.execution_metadata.error_message = stageResult.error_message;
          break;
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.execution_metadata.completed_at = new Date().toISOString();
        execution.execution_metadata.total_duration_ms =
          new Date().getTime() - new Date(execution.execution_metadata.started_at).getTime();
      }

    } catch (error) {
      execution.status = 'failed';
      execution.execution_metadata.error_message = error instanceof Error ? error.message : 'Unknown error';
    }

    return execution;
  }

  private async executeStage(
    stage: WorkflowStage,
    execution: WorkflowExecution,
    workflowSpec: WorkflowSpec
  ): Promise<StageResult> {

    const startTime = Date.now();

    try {
      const agent = this.agentInstances[stage.agent_type];
      if (!agent) {
        throw new Error(`Agent not available: ${stage.agent_type}`);
      }

      // Prepare inputs from previous stages
      const inputs = this.prepareStageInputs(stage, execution);

      // Execute agent
      let agentOutput;
      switch (stage.agent_type) {
        case 'project-manager':
          agentOutput = await agent.runWorkflow(inputs.project_id, inputs.request);
          break;
        case 'creative-director':
          agentOutput = await agent.reviewCreative(inputs.asset_id, inputs.project_id, inputs.request);
          break;
        case 'visual-designer':
          agentOutput = await agent.generateVisuals(inputs.request, inputs.project_id, inputs.campaign_id);
          break;
        case 'developer':
          agentOutput = await agent.generateCode(inputs.request, inputs.project_id);
          break;
        case 'qa-testing':
          agentOutput = await agent.runQATests(inputs.request, inputs.project_id, inputs.asset_id);
          break;
        case 'data-analyst':
          agentOutput = await agent.analyzeData(inputs.request, inputs.project_id, inputs.campaign_id);
          break;
        default:
          throw new Error(`Unknown agent type: ${stage.agent_type}`);
      }

      // Calculate quality scores
      const qualityScores = this.calculateStageQualityScores(agentOutput, stage);

      return {
        stage_id: stage.id,
        status: 'completed',
        agent_output: agentOutput,
        execution_time_ms: Date.now() - startTime,
        quality_scores: qualityScores,
        artifacts: this.extractArtifacts(agentOutput, stage),
        retry_count: 0,
      };

    } catch (error) {
      return {
        stage_id: stage.id,
        status: 'failed',
        agent_output: null,
        execution_time_ms: Date.now() - startTime,
        quality_scores: {},
        artifacts: [],
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: 0,
      };
    }
  }

  private prepareStageInputs(stage: WorkflowStage, execution: WorkflowExecution): any {
    const inputs: any = {
      request: execution.data_context.request || stage.agent_config.request,
      project_id: execution.data_context.project?.id,
      campaign_id: execution.data_context.campaign?.id,
    };

    // Add outputs from previous stages
    for (const [stageId, result] of Object.entries(execution.stage_results)) {
      if (result.status === 'completed') {
        inputs[`stage_${stageId}_output`] = result.agent_output;
        inputs[`stage_${stageId}_artifacts`] = result.artifacts;
      }
    }

    return inputs;
  }

  private calculateStageQualityScores(agentOutput: any, stage: WorkflowStage): { [metric: string]: number } {
    // Simulate quality scoring - in real implementation would analyze actual output
    const scores: { [metric: string]: number } = {};

    stage.quality_checks.forEach(check => {
      switch (check) {
        case 'execution_time':
          scores[check] = 8.5;
          break;
        case 'error_rate':
          scores[check] = 9.0;
          break;
        case 'output_quality':
          scores[check] = 8.0;
          break;
        case 'brand_compliance':
          scores[check] = 7.5;
          break;
        case 'creative_quality':
          scores[check] = 8.2;
          break;
        case 'code_quality':
          scores[check] = 8.8;
          break;
        case 'test_coverage':
          scores[check] = 8.5;
          break;
        case 'data_quality':
          scores[check] = 9.0;
          break;
        default:
          scores[check] = 8.0;
      }
    });

    return scores;
  }

  private extractArtifacts(agentOutput: any, stage: WorkflowStage): WorkflowArtifact[] {
    // Extract artifacts from agent output
    const artifacts: WorkflowArtifact[] = [];

    // This would be more sophisticated in a real implementation
    if (agentOutput?.context?.storedAssets) {
      agentOutput.context.storedAssets.forEach((asset: any) => {
        artifacts.push({
          id: asset.id,
          name: asset.name || 'Generated Asset',
          type: asset.type || 'asset',
          file_url: asset.file_url || '',
          metadata: asset.metadata || {},
          stage_id: stage.id,
          created_at: new Date().toISOString(),
        });
      });
    }

    return artifacts;
  }

  private async validateQualityGates(
    execution: WorkflowExecution,
    workflowSpec: WorkflowSpec
  ): Promise<WorkflowExecution> {

    for (const gate of workflowSpec.quality_gates) {
      const stageResult = execution.stage_results[gate.stage_id];
      if (!stageResult) continue;

      const gateResult = await this.evaluateQualityGate(gate, stageResult);
      execution.quality_gate_results[gate.id] = gateResult;

      // Handle gate failures
      if (gateResult.status === 'failed' && gate.blocking) {
        execution.status = 'failed';
        execution.execution_metadata.error_message = `Quality gate failed: ${gate.name}`;
        break;
      }
    }

    return execution;
  }

  private async evaluateQualityGate(
    gate: QualityGate,
    stageResult: StageResult
  ): Promise<QualityGateResult> {

    const criteriaResults: { [criteria_id: string]: { score: number; passed: boolean } } = {};
    let totalScore = 0;
    let totalWeight = 0;

    gate.criteria.forEach((criteria, index) => {
      const criteriaId = `criteria-${index}`;
      const score = stageResult.quality_scores[criteria.metric] || 0;
      const passed = this.evaluateCriteria(criteria, score);

      criteriaResults[criteriaId] = { score, passed };
      totalScore += score * criteria.weight;
      totalWeight += criteria.weight;
    });

    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const status = overallScore >= gate.threshold_score ? 'passed' : 'failed';

    return {
      gate_id: gate.id,
      status,
      overall_score: overallScore,
      criteria_results: criteriaResults,
      escalation_actions: status === 'failed' ? gate.escalation_rules.map(rule => rule.action) : [],
    };
  }

  private evaluateCriteria(criteria: QualityCriteria, value: number): boolean {
    switch (criteria.operator) {
      case 'greater_than':
        return value > (criteria.value as number);
      case 'less_than':
        return value < (criteria.value as number);
      case 'equals':
        return value === (criteria.value as number);
      case 'between':
        const [min, max] = criteria.value as [number, number];
        return value >= min && value <= max;
      default:
        return false;
    }
  }

  private async storeWorkflowResults(
    execution: WorkflowExecution,
    workflowSpec: WorkflowSpec,
    projectId?: string
  ): Promise<any[]> {

    const storedAssets = [];

    // Store workflow execution record
    const { data: workflowAsset } = await this.supabase
      .from('creative_assets')
      .insert({
        project_id: projectId,
        type: 'workflow',
        subtype: workflowSpec.type,
        name: workflowSpec.name,
        metadata: {
          workflow_spec: workflowSpec,
          execution: execution,
          stages_completed: Object.keys(execution.stage_results).length,
          quality_gates_passed: Object.values(execution.quality_gate_results).filter(g => g.status === 'passed').length,
          total_duration_ms: execution.execution_metadata.total_duration_ms,
        },
        created_by: this.agentId,
        status: execution.status === 'completed' ? 'active' : 'review_required',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    storedAssets.push(workflowAsset);

    // Store individual stage artifacts
    for (const [stageId, stageResult] of Object.entries(execution.stage_results)) {
      for (const artifact of stageResult.artifacts) {
        try {
          const { data: artifactAsset } = await this.supabase
            .from('creative_assets')
            .insert({
              project_id: projectId,
              type: 'workflow_artifact',
              subtype: artifact.type,
              name: artifact.name,
              file_url: artifact.file_url,
              metadata: {
                ...artifact.metadata,
                workflow_id: execution.id,
                stage_id: stageId,
                quality_scores: stageResult.quality_scores,
              },
              created_by: this.agentId,
              status: 'active',
              created_at: artifact.created_at,
            })
            .select()
            .single();

          storedAssets.push(artifactAsset);
        } catch (error) {
          console.error('Error storing workflow artifact:', error);
        }
      }
    }

    return storedAssets;
  }

  private generateCoordinationReport(state: WorkflowCoordinatorState): string {
    let report = '# 🔄 Workflow Coordination Report\n\n';

    if (state.context.project) {
      report += `**Project:** ${state.context.project.name}\n`;
      report += `**Workflow Type:** ${state.workflow_type}\n\n`;
    }

    if (state.decision) {
      report += `## Coordination Strategy\n`;
      report += `**Action:** ${state.decision.action}\n`;
      report += `**Strategy:** ${state.decision.workflow_strategy}\n`;
      report += `**Approach:** ${state.decision.coordination_approach}\n`;
      report += `**Confidence:** ${Math.round(state.decision.confidence * 100)}%\n\n`;
    }

    if (state.workflow_spec) {
      report += `## Workflow Specification\n`;
      report += `**Name:** ${state.workflow_spec.name}\n`;
      report += `**Stages:** ${state.workflow_spec.stages.length}\n`;
      report += `**Dependencies:** ${state.workflow_spec.dependencies.length}\n`;
      report += `**Quality Gates:** ${state.workflow_spec.quality_gates.length}\n`;
      report += `**Estimated Duration:** ${state.workflow_spec.estimated_duration_minutes} minutes\n\n`;
    }

    if (state.coordination_plan) {
      report += `## Coordination Plan\n`;
      report += `**Parallel Stages:** ${state.coordination_plan.parallel_stages.length} groups\n`;
      report += `**Critical Path:** ${state.coordination_plan.critical_path.length} stages\n`;
      report += `**Optimized Duration:** ${state.coordination_plan.estimated_duration} minutes\n\n`;
    }

    if (state.execution) {
      const exec = state.execution;
      report += `## Execution Results\n`;
      report += `**Status:** ${exec.status}\n`;
      report += `**Stages Completed:** ${Object.keys(exec.stage_results).length}\n`;

      if (exec.execution_metadata.total_duration_ms) {
        report += `**Total Duration:** ${Math.round(exec.execution_metadata.total_duration_ms / 60000)} minutes\n`;
      }

      const completedStages = Object.values(exec.stage_results).filter(r => r.status === 'completed').length;
      const successRate = Object.keys(exec.stage_results).length > 0
        ? (completedStages / Object.keys(exec.stage_results).length * 100).toFixed(1)
        : '0';
      report += `**Success Rate:** ${successRate}%\n\n`;

      // Quality gates summary
      const qualityGatesPassed = Object.values(exec.quality_gate_results).filter(g => g.status === 'passed').length;
      const totalQualityGates = Object.keys(exec.quality_gate_results).length;
      if (totalQualityGates > 0) {
        report += `### Quality Validation\n`;
        report += `**Gates Passed:** ${qualityGatesPassed}/${totalQualityGates}\n`;

        const avgQualityScore = Object.values(exec.quality_gate_results).reduce((sum, gate) =>
          sum + gate.overall_score, 0) / totalQualityGates;
        report += `**Average Quality Score:** ${avgQualityScore.toFixed(1)}/10\n\n`;
      }

      // Stage details
      if (Object.keys(exec.stage_results).length > 0) {
        report += `### Stage Details\n`;
        Object.entries(exec.stage_results).forEach(([stageId, result]) => {
          const status = result.status === 'completed' ? '✅' : result.status === 'failed' ? '❌' : '⏳';
          report += `${status} **${stageId}:** ${result.status} (${result.execution_time_ms}ms)\n`;
        });
        report += '\n';
      }

      // Artifacts summary
      const totalArtifacts = Object.values(exec.stage_results).reduce((sum, stage) =>
        sum + stage.artifacts.length, 0);
      if (totalArtifacts > 0) {
        report += `### Generated Artifacts\n`;
        report += `**Total Artifacts:** ${totalArtifacts}\n`;

        const artifactTypes = Object.values(exec.stage_results)
          .flatMap(stage => stage.artifacts.map(a => a.type));
        const uniqueTypes = [...new Set(artifactTypes)];
        report += `**Artifact Types:** ${uniqueTypes.join(', ')}\n\n`;
      }
    }

    // Agent availability summary
    if (state.context.agent_availability) {
      const availableAgents = Object.entries(state.context.agent_availability)
        .filter(([_, available]) => available).length;
      const totalAgents = Object.keys(state.context.agent_availability).length;

      report += `## System Status\n`;
      report += `**Available Agents:** ${availableAgents}/${totalAgents}\n`;

      Object.entries(state.context.agent_availability).forEach(([agent, available]) => {
        const status = available ? '✅' : '❌';
        report += `${status} ${agent}\n`;
      });
      report += '\n';
    }

    report += `\n---\n*Generated by Workflow Coordinator at ${new Date().toISOString()}*`;

    return report;
  }

  // Public interface
  public async coordinateWorkflow(request: string, projectId?: string, campaignId?: string) {
    const initialState: WorkflowCoordinatorState = {
      projectId,
      campaignId,
      request,
      context: {},
      messages: [new HumanMessage(request)],
    };

    const compiled = this.graph.compile();
    const result = await compiled.invoke(initialState);

    return result;
  }

  public async getWorkflowTemplates(): Promise<any> {
    return this.workflowTemplates;
  }

  public async getAgentStatus() {
    const agentStatuses = {};

    for (const [agentType, agent] of Object.entries(this.agentInstances)) {
      try {
        agentStatuses[agentType] = await agent.getAgentStatus();
      } catch (error) {
        agentStatuses[agentType] = { status: 'error', error: error.message };
      }
    }

    const { data: recentWorkflows } = await this.supabase
      .from('creative_assets')
      .select('*')
      .eq('created_by', this.agentId)
      .eq('type', 'workflow')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      agentId: this.agentId,
      status: 'operational',
      recentWorkflows: recentWorkflows?.length || 0,
      availableAgents: Object.keys(this.agentInstances),
      workflowTemplates: Object.keys(this.workflowTemplates),
      agentStatuses,
      lastActive: new Date().toISOString(),
    };
  }

  // Standardized interface for SuperClaude framework
  public async processRequest(request: string, projectId?: string, campaignId?: string): Promise<any> {
    try {
      const result = await this.coordinateWorkflow(request, projectId, campaignId);

      return {
        status: 'success',
        agentId: this.agentId,
        result: result.messages?.[result.messages.length - 1]?.content || 'Workflow coordinated successfully',
        metadata: {
          workflowId: result.workflowId,
          steps: result.steps,
          estimatedDuration: result.estimatedDuration,
          assignedAgents: result.assignedAgents,
          dependencies: result.dependencies,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        agentId: this.agentId,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }

  public getState(): WorkflowCoordinatorState {
    return {
      messages: [],
      context: {},
      workflowId: '',
      steps: [],
      estimatedDuration: 0,
      assignedAgents: [],
      dependencies: [],
      lastUpdated: new Date().toISOString()
    } as WorkflowCoordinatorState & { lastUpdated: string };
  }
}

export type { WorkflowCoordinatorState };