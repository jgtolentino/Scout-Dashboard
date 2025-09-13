import type { Config, LLMAdapter } from './types.js';
export declare class REPL {
    private rl;
    private context;
    private config;
    private llm;
    private router;
    constructor(config: Config, llm: LLMAdapter);
    start(): Promise<void>;
    private handleInput;
    private handleCommand;
    private handleFileOperation;
    private readFile;
    private displayResponse;
    private showHelp;
    private showStatus;
}
//# sourceMappingURL=repl.d.ts.map