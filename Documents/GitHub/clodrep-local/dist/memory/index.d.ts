import { ClodreptConfig } from '../config/index.js';
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    sessionId: string;
}
export declare class MemorySystem {
    private config;
    private messages;
    constructor(config: ClodreptConfig);
    initialize(): Promise<void>;
    addMessage(role: 'user' | 'assistant' | 'system', content: string, sessionId: string): Promise<void>;
    getContext(sessionId: string): Promise<any>;
    clearSession(sessionId: string): Promise<void>;
    getStatus(): any;
}
//# sourceMappingURL=index.d.ts.map