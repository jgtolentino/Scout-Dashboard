import { Tool, ToolResult, ToolContext } from '../index.js';
export declare class TaskTool implements Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            description: {
                type: string;
                description: string;
            };
            prompt: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
//# sourceMappingURL=index.d.ts.map