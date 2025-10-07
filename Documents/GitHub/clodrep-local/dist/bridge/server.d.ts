import { ClodreptConfig } from '../config/index.js';
import { ToolFramework } from '../tools/index.js';
export interface MCPMessage {
    jsonrpc: string;
    id?: string | number;
    method?: string;
    params?: any;
    result?: any;
    error?: any;
}
export interface BridgeSession {
    id: string;
    clientId: string;
    tools: string[];
    created: Date;
    lastActivity: Date;
}
export declare class BridgeServer {
    private app;
    private server;
    private wss?;
    private config;
    private tools;
    private port;
    private sessions;
    private connections;
    constructor(config: ClodreptConfig, tools: ToolFramework, port?: number);
    private setupMiddleware;
    private setupRoutes;
    private authenticateToken;
    private handleMCPMessage;
    start(): Promise<void>;
    stop(): Promise<void>;
    private generateSessionId;
    getStatus(): any;
    generateToken(clientId: string): string;
}
//# sourceMappingURL=server.d.ts.map