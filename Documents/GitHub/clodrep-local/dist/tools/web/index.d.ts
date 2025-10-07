import { Tool, ToolResult, ToolContext } from '../index.js';
export declare class WebFetchTool implements Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            url: {
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
export declare class WebTool implements Tool {
    name: string;
    description: string;
    parameters: {};
    private webFetchTool;
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
//# sourceMappingURL=index.d.ts.map