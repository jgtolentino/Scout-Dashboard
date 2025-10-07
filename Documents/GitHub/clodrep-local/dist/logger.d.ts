export interface LogEntry {
    timestamp: string;
    type: 'user' | 'assistant' | 'system';
    content: string;
    handler: string;
}
export declare class SessionLogger {
    private logDir;
    private sessionId;
    private entries;
    constructor(logDirectory?: string);
    private generateSessionId;
    log(type: LogEntry['type'], content: string, handler?: string): void;
    private writeToFile;
    private generateMarkdown;
    getSessionPath(): string;
}
//# sourceMappingURL=logger.d.ts.map