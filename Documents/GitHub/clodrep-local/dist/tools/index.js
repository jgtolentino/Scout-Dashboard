import { FileOperationsTool } from './file/index.js';
import { ExecutionTool } from './execution/index.js';
import { WebTool } from './web/index.js';
import { NotebookTool } from './notebooks/index.js';
import { TaskTool } from './tasks/index.js';
export class ToolFramework {
    tools = new Map();
    config;
    security;
    constructor(config, security) {
        this.config = config;
        this.security = security;
    }
    async initialize() {
        // Register core tools
        this.registerTool(new FileOperationsTool());
        this.registerTool(new ExecutionTool());
        this.registerTool(new WebTool());
        this.registerTool(new NotebookTool());
        this.registerTool(new TaskTool());
        console.log(`Registered ${this.tools.size} tools`);
    }
    registerTool(tool) {
        this.tools.set(tool.name, tool);
    }
    getTool(name) {
        return this.tools.get(name);
    }
    listTools() {
        return Array.from(this.tools.values());
    }
    async executeTool(call, context = {}) {
        const tool = this.getTool(call.name);
        if (!tool) {
            return {
                success: false,
                error: `Tool '${call.name}' not found`
            };
        }
        const fullContext = {
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
        }
        catch (error) {
            return {
                success: false,
                error: `Tool execution failed: ${error}`
            };
        }
    }
    async executeParallel(calls, context = {}) {
        // Group calls by dependencies
        const independentCalls = calls.filter(call => !this.hasDependencies(call, calls));
        const dependentCalls = calls.filter(call => this.hasDependencies(call, calls));
        // Execute independent calls in parallel
        const independentResults = await Promise.all(independentCalls.map(call => this.executeTool(call, context)));
        // Execute dependent calls sequentially
        const dependentResults = [];
        for (const call of dependentCalls) {
            const result = await this.executeTool(call, context);
            dependentResults.push(result);
        }
        // Merge results in original order
        const results = [];
        let independentIndex = 0;
        let dependentIndex = 0;
        for (const call of calls) {
            if (this.hasDependencies(call, calls)) {
                results.push(dependentResults[dependentIndex++]);
            }
            else {
                results.push(independentResults[independentIndex++]);
            }
        }
        return results;
    }
    hasDependencies(call, allCalls) {
        // Simple dependency detection - file operations that might conflict
        if (call.name === 'Write' || call.name === 'Edit') {
            const filePath = call.parameters.file_path || call.parameters.filePath;
            if (filePath) {
                return allCalls.some(other => other !== call &&
                    (other.name === 'Read' || other.name === 'Write' || other.name === 'Edit') &&
                    (other.parameters.file_path === filePath || other.parameters.filePath === filePath));
            }
        }
        return false;
    }
    getToolSchema() {
        const schema = {
            tools: {}
        };
        for (const [name, tool] of this.tools) {
            schema.tools[name] = {
                description: tool.description,
                parameters: tool.parameters
            };
        }
        return schema;
    }
    getStatus() {
        return {
            toolCount: this.tools.size,
            tools: Array.from(this.tools.keys()),
            security: this.security.getStatus()
        };
    }
}
//# sourceMappingURL=index.js.map