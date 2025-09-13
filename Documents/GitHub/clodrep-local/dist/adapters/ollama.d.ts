import type { LLMAdapter, GenerateOptions } from '../types.js';
export declare class OllamaAdapter implements LLMAdapter {
    private baseUrl;
    private modelName;
    constructor(modelName: string, baseUrl?: string);
    isAvailable(): Promise<boolean>;
    generate(prompt: string, options?: GenerateOptions): Promise<string>;
}
//# sourceMappingURL=ollama.d.ts.map