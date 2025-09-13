import { ClodreptConfig } from '../config/index.js';
import { ToolCall, ToolContext } from '../tools/index.js';
export declare class SecurityGateway {
    private config;
    private auditLog;
    constructor(config: ClodreptConfig);
    initialize(): Promise<void>;
    isPathAllowed(path: string, operation: 'read' | 'write'): boolean;
    validateToolCall(call: ToolCall, context: ToolContext): Promise<boolean>;
    private validateBashCommand;
    private validateWebRequest;
    requestConfirmation(message: string): Promise<boolean>;
    createBackup(filePath: string): Promise<void>;
    private logAuditEvent;
    getAuditLog(): AuditEvent[];
    getStatus(): any;
}
interface AuditEvent {
    type: string;
    timestamp: Date;
    [key: string]: any;
}
export {};
//# sourceMappingURL=index.d.ts.map