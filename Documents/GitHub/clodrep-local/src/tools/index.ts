import { ClodreptConfig } from '../config/index.js';
import { SecurityGateway } from '../security/index.js';
import { FileOperationsTool } from './file/index.js';
import { ExecutionTool } from './execution/index.js';
import { WebTool } from './web/index.js';
import { NotebookTool } from './notebooks/index.js';
import { TaskTool } from './tasks/index.js';

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  content?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute(params: Record<string, any>, context: ToolContext): Promise<ToolResult>;
}

export interface ToolContext {
  security: SecurityGateway;
  config: ClodreptConfig;
  workingDirectory: string;
  sessionId: string;
}

export class ToolFramework {
  private tools: Map<string, Tool> = new Map();
  private config: ClodreptConfig;
  private security: SecurityGateway;
  
  constructor(config: ClodreptConfig, security: SecurityGateway) {
    this.config = config;
    this.security = security;
  }
  
  async initialize(): Promise<void> {
    // Register core tools
    this.registerTool(new FileOperationsTool());
    this.registerTool(new ExecutionTool());
    this.registerTool(new WebTool());
    this.registerTool(new NotebookTool());
    this.registerTool(new TaskTool());
    
    console.log(`Registered ${this.tools.size} tools`);
  }
  
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }
  
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  async executeTool(call: ToolCall, context: Partial<ToolContext> = {}): Promise<ToolResult> {
    const tool = this.getTool(call.name);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${call.name}' not found`
      };
    }
    
    const fullContext: ToolContext = {
      security: this.security,
      config: this.config,
      workingDirectory: process.cwd(),
      sessionId: 'default',
      ...context
    };
    
    try {
      // Validate tool call with security gateway
      const allowed = await this.security.validateToolCall(call, fullContext);
      if (!allowed) {
        return {
          success: false,
          error: `Tool call '${call.name}' not permitted by security policy`
        };
      }
      
      return await tool.execute(call.parameters, fullContext);
    } catch (error) {
      return {
        success: false,
        error: `Tool execution failed: ${error}`
      };
    }
  }
  
  async executeParallel(calls: ToolCall[], context: Partial<ToolContext> = {}): Promise<ToolResult[]> {
    // Group calls by dependencies
    const independentCalls = calls.filter(call => !this.hasDependencies(call, calls));
    const dependentCalls = calls.filter(call => this.hasDependencies(call, calls));
    
    // Execute independent calls in parallel
    const independentResults = await Promise.all(
      independentCalls.map(call => this.executeTool(call, context))
    );
    
    // Execute dependent calls sequentially
    const dependentResults: ToolResult[] = [];
    for (const call of dependentCalls) {
      const result = await this.executeTool(call, context);
      dependentResults.push(result);
    }
    
    // Merge results in original order
    const results: ToolResult[] = [];
    let independentIndex = 0;
    let dependentIndex = 0;
    
    for (const call of calls) {
      if (this.hasDependencies(call, calls)) {
        results.push(dependentResults[dependentIndex++]);
      } else {
        results.push(independentResults[independentIndex++]);
      }
    }
    
    return results;
  }
  
  private hasDependencies(call: ToolCall, allCalls: ToolCall[]): boolean {
    // Simple dependency detection - file operations that might conflict
    if (call.name === 'Write' || call.name === 'Edit') {
      const filePath = call.parameters.file_path || call.parameters.filePath;
      if (filePath) {
        return allCalls.some(other => 
          other !== call && 
          (other.name === 'Read' || other.name === 'Write' || other.name === 'Edit') &&
          (other.parameters.file_path === filePath || other.parameters.filePath === filePath)
        );
      }
    }
    
    return false;
  }
  
  getToolSchema(): any {
    const schema = {
      tools: {} as Record<string, any>
    };
    
    for (const [name, tool] of this.tools) {
      schema.tools[name] = {
        description: tool.description,
        parameters: tool.parameters
      };
    }
    
    return schema;
  }
  
  getStatus(): any {
    return {
      toolCount: this.tools.size,
      tools: Array.from(this.tools.keys()),
      security: this.security.getStatus()
    };
  }
}