import { Tool, ToolResult, ToolContext } from '../index.js';
export declare class BashTool implements Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            command: {
                type: string;
                description: string;
            };
            timeout: {
                type: string;
                description: string;
                default: number;
            };
        };
        required: string[];
    };
    execute(params: any, context: ToolContext): Promise<ToolResult>;
    private executeCommand;
}
export declare class ExecutionTool implements Tool {
    name: string;
    description: string;
    parameters: {};
    private bashTool;
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
//# sourceMappingURL=index.d.ts.map