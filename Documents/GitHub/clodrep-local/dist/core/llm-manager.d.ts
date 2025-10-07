import { ClodreptConfig } from '../config/index.js';
export interface LLMResponse {
    content: string;
    model: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface LLMProvider {
    generate(prompt: string, options?: any): Promise<LLMResponse>;
    isAvailable(): Promise<boolean>;
    getModelInfo(): Promise<any>;
}
export declare class OllamaProvider implements LLMProvider {
    private ollama;
    private modelName;
    constructor(modelName: string);
    generate(prompt: string, options?: any): Promise<LLMResponse>;
    isAvailable(): Promise<boolean>;
    getModelInfo(): Promise<any>;
}
export declare class ClaudeProvider implements LLMProvider {
    private apiKey;
    private model;
    constructor(apiKey: string, model: string);
    generate(prompt: string, options?: any): Promise<LLMResponse>;
    isAvailable(): Promise<boolean>;
    getModelInfo(): Promise<any>;
}
export declare class LLMManager {
    private config;
    private localProvider?;
    private cloudProvider?;
    constructor(config: ClodreptConfig);
    initialize(): Promise<void>;
    generate(prompt: string, options?: any): Promise<LLMResponse>;
    private generateLocal;
    private generateCloudFirst;
    private generateHybrid;
    private assessComplexity;
    private assessQuality;
    getStatus(): any;
}
//# sourceMappingURL=llm-manager.d.ts.map