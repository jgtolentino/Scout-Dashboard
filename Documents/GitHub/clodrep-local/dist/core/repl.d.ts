import { ClodreptConfig } from '../config/index.js';
import { LLMManager } from './llm-manager.js';
import { ToolFramework } from '../tools/index.js';
import { MemorySystem } from '../memory/index.js';
import { SecurityGateway } from '../security/index.js';
import { WorkflowOrchestrator } from '../orchestration/index.js';
export interface REPLContext {
    llmManager: LLMManager;
    tools: ToolFramework;
    memory: MemorySystem;
    orchestrator: WorkflowOrchestrator;
    security: SecurityGateway;
}
export declare class REPLInterface {
    private config;
    private context;
    private rl;
    private sessionId;
    constructor(config: ClodreptConfig, context: REPLContext);
    start(): Promise<void>;
    private handleInput;
    private handleCommand;
    private handleToolCall;
    private handleAIInteraction;
    private buildPrompt;
    private showHelp;
    private showStatus;
    private showTools;
    private handleMemoryCommand;
    private handleBridgeCommand;
    private handleConfigCommand;
    private setupSignalHandlers;
    private generateSessionId;
}
//# sourceMappingURL=repl.d.ts.map