import { ClodreptConfig } from '../config/index.js';
import { SecurityGateway } from '../security/index.js';
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
export declare class ToolFramework {
    private tools;
    private config;
    private security;
    constructor(config: ClodreptConfig, security: SecurityGateway);
    initialize(): Promise<void>;
    registerTool(tool: Tool): void;
    getTool(name: string): Tool | undefined;
    listTools(): Tool[];
    executeTool(call: ToolCall, context?: Partial<ToolContext>): Promise<ToolResult>;
    executeParallel(calls: ToolCall[], context?: Partial<ToolContext>): Promise<ToolResult[]>;
    private hasDependencies;
    getToolSchema(): any;
    getStatus(): any;
}
//# sourceMappingURL=index.d.ts.map