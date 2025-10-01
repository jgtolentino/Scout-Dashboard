// SuperClaude Agent System Exports
// Centralized export of all agents and registry

export { ProjectManagerAgent } from './project-manager';
export { CreativeDirectorAgent } from './creative-director';
export { VisualDesignerAgent } from './visual-designer';
export { DeveloperAgent } from './developer';
export { QATestingAgent } from './qa-testing';
export { DataAnalystAgent } from './data-analyst';
export { WorkflowCoordinator } from './workflow-coordinator';
export { SuperClaudeAgentRegistry } from './superclaude-registry';

// Type exports
export type {
  AgentRegistration,
  TaskDelegation,
  SuperClaudeState,
} from './superclaude-registry';

export type {
  QualityRubric,
  CreativeDirectorState,
} from './creative-director';

export type {
  VisualSpec,
  GenerationResult,
  VisualDesignerState,
} from './visual-designer';

export type {
  ProjectManagerState,
} from './project-manager';

export type {
  QATestingState,
} from './qa-testing';

export type {
  DataAnalystState,
} from './data-analyst';

export type {
  WorkflowCoordinatorState,
} from './workflow-coordinator';

// Agent configuration constants
export const SUPERCLAUDE_FRAMEWORK_VERSION = '3.0';

export const AGENT_TYPES = {
  ORCHESTRATION: 'orchestration',
  QUALITY_ASSURANCE: 'quality_assurance',
  CONTENT_GENERATION: 'content_generation',
  CODE_GENERATION: 'code_generation',
  ANALYSIS: 'analysis',
  OPTIMIZATION: 'optimization',
} as const;

export const SUPERCLAUDE_PERSONAS = {
  ARCHITECT: 'architect',
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  SECURITY: 'security',
  ANALYZER: 'analyzer',
  QA: 'qa',
  REFACTORER: 'refactorer',
  DEVOPS: 'devops',
  MENTOR: 'mentor',
  SCRIBE: 'scribe',
  PERFORMANCE: 'performance',
} as const;

export const MCP_SERVERS = {
  SEQUENTIAL: 'sequential',
  CONTEXT7: 'context7',
  MAGIC: 'magic',
  PLAYWRIGHT: 'playwright',
  MORPHLLM: 'morphllm',
  SERENA: 'serena',
} as const;

export const QUALITY_GATES = {
  SYNTAX_VALIDATION: 'syntax_validation',
  TYPE_CHECKING: 'type_checking',
  LINT_COMPLIANCE: 'lint_compliance',
  SECURITY_SCAN: 'security_scan',
  TEST_COVERAGE: 'test_coverage',
  PERFORMANCE_CHECK: 'performance_check',
  DOCUMENTATION_COMPLETENESS: 'documentation_completeness',
  INTEGRATION_VALIDATION: 'integration_validation',
} as const;

// Utility functions
export function createAgentRegistry(supabaseUrl: string, supabaseKey: string): SuperClaudeAgentRegistry {
  return new SuperClaudeAgentRegistry(supabaseUrl, supabaseKey);
}

export function createProjectManager(supabaseUrl: string, supabaseKey: string): ProjectManagerAgent {
  return new ProjectManagerAgent(supabaseUrl, supabaseKey);
}

export function createCreativeDirector(supabaseUrl: string, supabaseKey: string): CreativeDirectorAgent {
  return new CreativeDirectorAgent(supabaseUrl, supabaseKey);
}

export function createVisualDesigner(
  supabaseUrl: string,
  supabaseKey: string,
  openaiApiKey: string
): VisualDesignerAgent {
  return new VisualDesignerAgent(supabaseUrl, supabaseKey, openaiApiKey);
}

export function createDeveloper(
  supabaseUrl: string,
  supabaseKey: string,
  openaiApiKey: string
): DeveloperAgent {
  return new DeveloperAgent(supabaseUrl, supabaseKey, openaiApiKey);
}

export function createQATesting(
  supabaseUrl: string,
  supabaseKey: string
): QATestingAgent {
  return new QATestingAgent(supabaseUrl, supabaseKey);
}

export function createDataAnalyst(
  supabaseUrl: string,
  supabaseKey: string,
  openaiApiKey: string
): DataAnalystAgent {
  return new DataAnalystAgent(supabaseUrl, supabaseKey, openaiApiKey);
}

export function createWorkflowCoordinator(
  supabaseUrl: string,
  supabaseKey: string,
  openaiApiKey?: string
): WorkflowCoordinator {
  return new WorkflowCoordinator(supabaseUrl, supabaseKey, openaiApiKey);
}

// Agent factory with automatic registration
export async function createRegisteredAgent(
  type: string,
  config: {
    supabaseUrl: string;
    supabaseKey: string;
    openaiApiKey?: string;
  }
): Promise<any> {
  const registry = createAgentRegistry(config.supabaseUrl, config.supabaseKey);

  switch (type) {
    case AGENT_TYPES.ORCHESTRATION:
      const projectManager = createProjectManager(config.supabaseUrl, config.supabaseKey);
      return projectManager;

    case AGENT_TYPES.QUALITY_ASSURANCE:
      const creativeDirector = createCreativeDirector(config.supabaseUrl, config.supabaseKey);
      return creativeDirector;

    case AGENT_TYPES.CONTENT_GENERATION:
      if (!config.openaiApiKey) {
        throw new Error('OpenAI API key required for Visual Designer Agent');
      }
      const visualDesigner = createVisualDesigner(
        config.supabaseUrl,
        config.supabaseKey,
        config.openaiApiKey
      );
      return visualDesigner;

    case AGENT_TYPES.CODE_GENERATION:
      if (!config.openaiApiKey) {
        throw new Error('OpenAI API key required for Developer Agent');
      }
      const developer = createDeveloper(
        config.supabaseUrl,
        config.supabaseKey,
        config.openaiApiKey
      );
      return developer;

    case 'testing':
      const qaTesting = createQATesting(config.supabaseUrl, config.supabaseKey);
      return qaTesting;

    case AGENT_TYPES.ANALYSIS:
      if (!config.openaiApiKey) {
        throw new Error('OpenAI API key required for Data Analyst Agent');
      }
      const dataAnalyst = createDataAnalyst(
        config.supabaseUrl,
        config.supabaseKey,
        config.openaiApiKey
      );
      return dataAnalyst;

    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

// Agent status monitoring
export async function getSystemStatus(registry: SuperClaudeAgentRegistry): Promise<any> {
  const frameworkStatus = await registry.getFrameworkStatus();

  return {
    framework: frameworkStatus,
    timestamp: new Date().toISOString(),
    health: 'operational',
  };
}