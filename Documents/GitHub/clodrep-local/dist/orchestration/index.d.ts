import { ClodreptConfig } from '../config/index.js';
import { ToolFramework } from '../tools/index.js';
import { MemorySystem } from '../memory/index.js';
export declare class WorkflowOrchestrator {
    private config;
    private tools;
    private memory;
    constructor(config: ClodreptConfig, tools: ToolFramework, memory: MemorySystem);
    initialize(): Promise<void>;
    shouldOrchestrate(input: string): Promise<boolean>;
    execute(input: string, context: any): Promise<string>;
}
//# sourceMappingURL=index.d.ts.map