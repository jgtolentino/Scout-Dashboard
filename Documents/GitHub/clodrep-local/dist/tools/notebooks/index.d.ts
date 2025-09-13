import { Tool, ToolResult, ToolContext } from '../index.js';
export declare class NotebookReadTool implements Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            notebook_path: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
export declare class NotebookTool implements Tool {
    name: string;
    description: string;
    parameters: {};
    private notebookReadTool;
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
//# sourceMappingURL=index.d.ts.map