export interface ClodreptConfig {
    execution: {
        mode: 'local' | 'cloud-first' | 'hybrid';
        offline: boolean;
        maxConcurrentTasks: number;
        timeout: number;
    };
    model: {
        local: {
            provider: 'ollama' | 'lmstudio' | 'openai-compat';
            name: string;
            temperature: number;
            contextWindow: number;
        };
        cloud: {
            provider: 'claude' | 'openai' | 'anthropic';
            apiKey?: string;
            model: string;
        };
        vision: {
            local: string;
            cloud: string;
        };
    };
    bridge: {
        enabled: boolean;
        port: number;
        security: {
            enableMutualTLS: boolean;
            tokenRotationInterval: number;
            allowedOrigins: string[];
        };
        fallback: {
            qualityThreshold: number;
            performanceThreshold: number;
            enabled: boolean;
        };
    };
    tools: {
        fileAccess: {
            readPaths: string[];
            writePaths: string[];
            blockedPaths: string[];
        };
        execution: {
            allowedCommands: string[];
            blockedCommands: string[];
            requireConfirmation: string[];
            sandbox: boolean;
        };
        network: {
            allowedDomains: string[];
            blockedDomains: string[];
            enableWebSearch: boolean;
        };
    };
    security: {
        confirmBeforeWrite: boolean;
        auditLogging: boolean;
        logRetentionDays: number;
        sandboxMode: 'docker' | 'chroot' | 'none';
    };
    memory: {
        sessionHistory: number;
        persistentMemory: boolean;
        enableVectorSearch: boolean;
        embeddingModel: string;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        enableFileLogging: boolean;
        logDirectory: string;
    };
}
declare const DEFAULT_CONFIG: ClodreptConfig;
export declare function getConfigPath(): string;
export declare function getConfigDir(): string;
export declare function ensureConfigDir(): void;
export declare function loadConfig(): ClodreptConfig;
export declare function saveConfig(config: ClodreptConfig): void;
export { DEFAULT_CONFIG };
//# sourceMappingURL=index.d.ts.map