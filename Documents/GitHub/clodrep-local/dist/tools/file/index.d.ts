import { Tool, ToolResult, ToolContext } from '../index.js';
export declare class ReadTool implements Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            file_path: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
export declare class WriteTool implements Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            file_path: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
export declare class EditTool implements Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            file_path: {
                type: string;
                description: string;
            };
            old_string: {
                type: string;
                description: string;
            };
            new_string: {
                type: string;
                description: string;
            };
            expected_replacements: {
                type: string;
                description: string;
                default: number;
            };
        };
        required: string[];
    };
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
export declare class GlobTool implements Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            pattern: {
                type: string;
                description: string;
            };
            path: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
export declare class GrepTool implements Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            pattern: {
                type: string;
                description: string;
            };
            path: {
                type: string;
                description: string;
            };
            include: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
export declare class FileOperationsTool implements Tool {
    name: string;
    description: string;
    parameters: {};
    private tools;
    constructor();
    execute(params: any, context: ToolContext): Promise<ToolResult>;
}
//# sourceMappingURL=index.d.ts.map