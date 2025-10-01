// Project Manager Agent with LangGraph
// Orchestrates project workflows, assigns tasks, and coordinates team efforts

import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define the state interface for our agent
interface ProjectManagerState {
  projectId?: string;
  messages: BaseMessage[];
  currentTask?: string;
  taskQueue: Array<{
    id: string;
    type: string;
    priority: number;
    status: string;
    assignedAgent?: string;
  }>;
  context: {
    project?: any;
    campaign?: any;
    client?: any;
    teamMembers?: any[];
    recentAssets?: any[];
  };
  decision?: {
    action: string;
    reasoning: string;
    nextSteps: string[];
  };
  metrics?: {
    impressions?: number;
    clicks?: number;
    engagement?: number;
    completion?: number;
  };
}

// Agent configuration
export class ProjectManagerAgent {
  private supabase: SupabaseClient;
  private graph: StateGraph<ProjectManagerState>;
  private agentId: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.agentId = 'project-manager-001';
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<ProjectManagerState> {
    const graph = new StateGraph<ProjectManagerState>({
      channels: {
        projectId: null,
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => [...x, ...y],
          default: () => [],
        },
        currentTask: null,
        taskQueue: {
          value: (x, y) => [...x, ...y],
          default: () => [],
        },
        context: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        decision: null,
        metrics: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
      },
    });

    // Define nodes
    graph.addNode('analyze_request', async (state) => {
      console.log('🔍 Analyzing request...');
      const lastMessage = state.messages[state.messages.length - 1];

      // Analyze the request and determine action
      const analysis = await this.analyzeRequest(lastMessage.content as string);

      return {
        decision: analysis,
        messages: [
          new AIMessage(`Analyzed request: ${analysis.action}`),
        ],
      };
    });

    graph.addNode('fetch_context', async (state) => {
      console.log('📊 Fetching project context...');

      if (!state.projectId) {
        return state;
      }

      // Fetch project data
      const { data: project } = await this.supabase
        .from('projects')
        .select('*, client:client_accounts(*), campaigns(*)')
        .eq('id', state.projectId)
        .single();

      // Fetch team members
      const { data: teamMembers } = await this.supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true);

      // Fetch recent assets
      const { data: recentAssets } = await this.supabase
        .from('creative_assets')
        .select('*')
        .eq('project_id', state.projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        context: {
          project,
          teamMembers,
          recentAssets,
        },
        messages: [
          new AIMessage('Context loaded successfully'),
        ],
      };
    });

    graph.addNode('prioritize_tasks', async (state) => {
      console.log('📋 Prioritizing tasks...');

      const prioritizedTasks = state.taskQueue.sort((a, b) => {
        // Priority logic: higher priority and earlier creation
        return b.priority - a.priority;
      });

      return {
        taskQueue: prioritizedTasks,
        messages: [
          new AIMessage(`Prioritized ${prioritizedTasks.length} tasks`),
        ],
      };
    });

    graph.addNode('assign_agents', async (state) => {
      console.log('🤖 Assigning specialized agents...');

      const assignments = await Promise.all(
        state.taskQueue.map(async (task) => {
          if (!task.assignedAgent) {
            const agent = await this.selectBestAgent(task.type);
            return { ...task, assignedAgent: agent };
          }
          return task;
        })
      );

      return {
        taskQueue: assignments,
        messages: [
          new AIMessage(`Assigned agents to ${assignments.length} tasks`),
        ],
      };
    });

    graph.addNode('execute_task', async (state) => {
      console.log('⚡ Executing current task...');

      const currentTask = state.taskQueue.find(t => t.status === 'pending');

      if (!currentTask) {
        return {
          messages: [new AIMessage('No pending tasks to execute')],
        };
      }

      // Create agent task record
      const { data: agentTask } = await this.supabase
        .from('agent_tasks')
        .insert({
          agent_id: this.agentId,
          project_id: state.projectId,
          task_type: currentTask.type,
          status: 'running',
          priority: currentTask.priority,
          input_data: { task: currentTask },
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Simulate task execution
      const result = await this.executeTask(currentTask, state.context);

      // Update task status
      await this.supabase
        .from('agent_tasks')
        .update({
          status: 'completed',
          output_data: result,
          completed_at: new Date().toISOString(),
          execution_time_ms: Date.now() - new Date(agentTask.started_at).getTime(),
        })
        .eq('id', agentTask.id);

      // Update task in queue
      const updatedQueue = state.taskQueue.map(t =>
        t.id === currentTask.id ? { ...t, status: 'completed' } : t
      );

      return {
        taskQueue: updatedQueue,
        currentTask: currentTask.id,
        messages: [
          new AIMessage(`Completed task: ${currentTask.type}`),
        ],
      };
    });

    graph.addNode('update_metrics', async (state) => {
      console.log('📈 Updating performance metrics...');

      if (!state.projectId) return state;

      // Fetch latest metrics
      const { data: metrics } = await this.supabase
        .from('performance_metrics')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', state.projectId)
        .order('timestamp', { ascending: false })
        .limit(100);

      // Aggregate metrics
      const aggregated = this.aggregateMetrics(metrics || []);

      // Store aggregated metrics
      if (Object.keys(aggregated).length > 0) {
        await this.supabase
          .from('performance_metrics')
          .insert({
            entity_type: 'project',
            entity_id: state.projectId,
            metric_type: 'aggregate',
            metric_value: aggregated.total,
            dimensions: aggregated,
            timestamp: new Date().toISOString(),
          });
      }

      return {
        metrics: aggregated,
        messages: [
          new AIMessage('Metrics updated successfully'),
        ],
      };
    });

    graph.addNode('generate_report', async (state) => {
      console.log('📄 Generating status report...');

      const report = this.generateStatusReport(state);

      return {
        messages: [
          new AIMessage(report),
        ],
      };
    });

    // Define edges
    graph.addEdge(START, 'analyze_request');
    graph.addEdge('analyze_request', 'fetch_context');
    graph.addEdge('fetch_context', 'prioritize_tasks');
    graph.addEdge('prioritize_tasks', 'assign_agents');
    graph.addEdge('assign_agents', 'execute_task');
    graph.addEdge('execute_task', 'update_metrics');
    graph.addEdge('update_metrics', 'generate_report');
    graph.addEdge('generate_report', END);

    return graph;
  }

  // Helper methods
  private async analyzeRequest(content: string): Promise<any> {
    // Analyze the request and determine appropriate action
    const keywords = content.toLowerCase();

    if (keywords.includes('create') || keywords.includes('generate')) {
      return {
        action: 'create_content',
        reasoning: 'User wants to create new content',
        nextSteps: ['fetch_context', 'assign_creative_agent', 'generate_assets'],
      };
    } else if (keywords.includes('analyze') || keywords.includes('report')) {
      return {
        action: 'analyze_performance',
        reasoning: 'User wants performance analysis',
        nextSteps: ['fetch_metrics', 'analyze_data', 'generate_report'],
      };
    } else if (keywords.includes('optimize') || keywords.includes('improve')) {
      return {
        action: 'optimize_campaign',
        reasoning: 'User wants to optimize performance',
        nextSteps: ['analyze_current', 'identify_opportunities', 'implement_changes'],
      };
    }

    return {
      action: 'general_assistance',
      reasoning: 'General project management assistance',
      nextSteps: ['understand_request', 'provide_guidance'],
    };
  }

  private async selectBestAgent(taskType: string): Promise<string> {
    // Map task types to specialized agents
    const agentMapping: Record<string, string> = {
      'creative': 'creative-director-agent',
      'analysis': 'data-analyst-agent',
      'strategy': 'strategist-agent',
      'review': 'quality-reviewer-agent',
      'generation': 'content-generator-agent',
      'optimization': 'performance-optimizer-agent',
    };

    return agentMapping[taskType] || 'general-assistant-agent';
  }

  private async executeTask(task: any, context: any): Promise<any> {
    // Simulate task execution based on type
    console.log(`Executing task: ${task.type} with agent: ${task.assignedAgent}`);

    // In a real implementation, this would delegate to specialized agents
    return {
      success: true,
      taskId: task.id,
      result: `Task ${task.type} completed successfully`,
      timestamp: new Date().toISOString(),
    };
  }

  private aggregateMetrics(metrics: any[]): any {
    if (metrics.length === 0) return {};

    const aggregated = metrics.reduce((acc, metric) => {
      const type = metric.metric_type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += metric.metric_value || 0;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...aggregated,
      total: Object.values(aggregated).reduce((sum, val) => sum + val, 0),
      count: metrics.length,
    };
  }

  private generateStatusReport(state: ProjectManagerState): string {
    const completedTasks = state.taskQueue.filter(t => t.status === 'completed').length;
    const pendingTasks = state.taskQueue.filter(t => t.status === 'pending').length;

    let report = '## Project Status Report\n\n';

    if (state.context.project) {
      report += `**Project:** ${state.context.project.name}\n`;
      report += `**Client:** ${state.context.project.client?.name || 'N/A'}\n`;
      report += `**Status:** ${state.context.project.status}\n\n`;
    }

    report += `### Task Summary\n`;
    report += `- Completed: ${completedTasks}\n`;
    report += `- Pending: ${pendingTasks}\n`;
    report += `- Total: ${state.taskQueue.length}\n\n`;

    if (state.metrics && Object.keys(state.metrics).length > 0) {
      report += `### Performance Metrics\n`;
      Object.entries(state.metrics).forEach(([key, value]) => {
        report += `- ${key}: ${value}\n`;
      });
    }

    if (state.decision) {
      report += `\n### Current Action\n`;
      report += `**Action:** ${state.decision.action}\n`;
      report += `**Reasoning:** ${state.decision.reasoning}\n`;
    }

    return report;
  }

  // Public interface
  public async runWorkflow(projectId: string, message: string) {
    const initialState: ProjectManagerState = {
      projectId,
      messages: [new HumanMessage(message)],
      taskQueue: [],
      context: {},
    };

    const compiled = this.graph.compile();
    const result = await compiled.invoke(initialState);

    return result;
  }

  public async addTask(task: Omit<ProjectManagerState['taskQueue'][0], 'id'>) {
    const taskWithId = {
      ...task,
      id: crypto.randomUUID(),
      status: task.status || 'pending',
    };

    // Store task in database
    await this.supabase
      .from('agent_tasks')
      .insert({
        agent_id: this.agentId,
        task_type: task.type,
        priority: task.priority,
        status: 'queued',
        input_data: { task: taskWithId },
        created_at: new Date().toISOString(),
      });

    return taskWithId;
  }

  public async getAgentStatus() {
    const { data: agent } = await this.supabase
      .from('agents')
      .select('*')
      .eq('id', this.agentId)
      .single();

    const { data: recentTasks } = await this.supabase
      .from('agent_tasks')
      .select('*')
      .eq('agent_id', this.agentId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      agent,
      recentTasks,
      status: 'operational',
    };
  }

  // Standardized interface for SuperClaude framework
  public async processRequest(request: string, projectId?: string): Promise<any> {
    try {
      const result = await this.runWorkflow(projectId || 'default', request);

      return {
        status: 'success',
        agentId: this.agentId,
        result: result.messages?.[result.messages.length - 1]?.content || 'Task completed successfully',
        metadata: {
          taskQueue: result.taskQueue,
          context: result.context,
          metrics: result.metrics,
          decision: result.decision,
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

  public getState(): ProjectManagerState {
    return {
      messages: [],
      taskQueue: [],
      context: {},
      lastUpdated: new Date().toISOString()
    } as ProjectManagerState & { lastUpdated: string };
  }
}