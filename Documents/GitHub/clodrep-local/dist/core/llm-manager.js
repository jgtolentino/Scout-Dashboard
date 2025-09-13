import { Ollama } from 'ollama';
import chalk from 'chalk';
export class OllamaProvider {
    ollama;
    modelName;
    constructor(modelName) {
        this.ollama = new Ollama();
        this.modelName = modelName;
    }
    async generate(prompt, options = {}) {
        try {
            const response = await this.ollama.generate({
                model: this.modelName,
                prompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.2,
                    num_ctx: options.contextWindow || 12000,
                    ...options
                }
            });
            return {
                content: response.response,
                model: this.modelName,
                usage: {
                    prompt_tokens: response.prompt_eval_count || 0,
                    completion_tokens: response.eval_count || 0,
                    total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
                }
            };
        }
        catch (error) {
            throw new Error(`Ollama generation failed: ${error}`);
        }
    }
    async isAvailable() {
        try {
            await this.ollama.list();
            // Check if specific model is available
            const models = await this.ollama.list();
            const hasModel = models.models.some(m => m.name === this.modelName);
            if (!hasModel) {
                console.log(chalk.yellow(`Model ${this.modelName} not found. Pulling...`));
                await this.ollama.pull({ model: this.modelName });
                console.log(chalk.green(`✓ Model ${this.modelName} pulled successfully`));
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getModelInfo() {
        try {
            return await this.ollama.show({ model: this.modelName });
        }
        catch (error) {
            return null;
        }
    }
}
export class ClaudeProvider {
    apiKey;
    model;
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }
    async generate(prompt, options = {}) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: options.maxTokens || 4096,
                    temperature: options.temperature || 0.2,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });
            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return {
                content: data.content[0].text,
                model: this.model,
                usage: {
                    prompt_tokens: data.usage.input_tokens,
                    completion_tokens: data.usage.output_tokens,
                    total_tokens: data.usage.input_tokens + data.usage.output_tokens
                }
            };
        }
        catch (error) {
            throw new Error(`Claude generation failed: ${error}`);
        }
    }
    async isAvailable() {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'test' }]
                })
            });
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
    async getModelInfo() {
        return { model: this.model, provider: 'claude' };
    }
}
export class LLMManager {
    config;
    localProvider;
    cloudProvider;
    constructor(config) {
        this.config = config;
    }
    async initialize() {
        // Initialize local provider
        if (this.config.model.local.provider === 'ollama') {
            this.localProvider = new OllamaProvider(this.config.model.local.name);
        }
        // Initialize cloud provider if API key available
        if (this.config.model.cloud.apiKey) {
            if (this.config.model.cloud.provider === 'claude') {
                this.cloudProvider = new ClaudeProvider(this.config.model.cloud.apiKey, this.config.model.cloud.model);
            }
        }
        // Verify providers
        if (this.localProvider && !this.config.execution.offline) {
            const localAvailable = await this.localProvider.isAvailable();
            if (!localAvailable) {
                console.log(chalk.yellow('⚠ Local LLM not available'));
            }
        }
        if (this.cloudProvider && !this.config.execution.offline) {
            const cloudAvailable = await this.cloudProvider.isAvailable();
            if (!cloudAvailable) {
                console.log(chalk.yellow('⚠ Cloud LLM not available'));
            }
        }
    }
    async generate(prompt, options = {}) {
        const mode = this.config.execution.mode;
        try {
            switch (mode) {
                case 'local':
                    return await this.generateLocal(prompt, options);
                case 'cloud-first':
                    return await this.generateCloudFirst(prompt, options);
                case 'hybrid':
                    return await this.generateHybrid(prompt, options);
                default:
                    throw new Error(`Unknown execution mode: ${mode}`);
            }
        }
        catch (error) {
            console.error(chalk.red('LLM generation failed:'), error);
            throw error;
        }
    }
    async generateLocal(prompt, options) {
        if (!this.localProvider) {
            throw new Error('Local provider not available');
        }
        return await this.localProvider.generate(prompt, options);
    }
    async generateCloudFirst(prompt, options) {
        if (this.cloudProvider && !this.config.execution.offline) {
            try {
                return await this.cloudProvider.generate(prompt, options);
            }
            catch (error) {
                console.log(chalk.yellow('Cloud provider failed, falling back to local...'));
                return await this.generateLocal(prompt, options);
            }
        }
        return await this.generateLocal(prompt, options);
    }
    async generateHybrid(prompt, options) {
        // Intelligent routing based on task complexity
        const complexity = this.assessComplexity(prompt);
        if (complexity > 0.7 && this.cloudProvider && !this.config.execution.offline) {
            try {
                return await this.cloudProvider.generate(prompt, options);
            }
            catch (error) {
                console.log(chalk.yellow('Cloud provider failed, falling back to local...'));
                return await this.generateLocal(prompt, options);
            }
        }
        // Use local for simpler tasks
        if (this.localProvider) {
            try {
                const response = await this.localProvider.generate(prompt, options);
                // Quality check - fall back to cloud if quality is poor
                const quality = this.assessQuality(response, prompt);
                if (quality < this.config.bridge.fallback.qualityThreshold &&
                    this.cloudProvider && !this.config.execution.offline) {
                    console.log(chalk.yellow('Quality threshold not met, using cloud...'));
                    return await this.cloudProvider.generate(prompt, options);
                }
                return response;
            }
            catch (error) {
                if (this.cloudProvider && !this.config.execution.offline) {
                    console.log(chalk.yellow('Local provider failed, falling back to cloud...'));
                    return await this.cloudProvider.generate(prompt, options);
                }
                throw error;
            }
        }
        throw new Error('No providers available');
    }
    assessComplexity(prompt) {
        // Simple heuristics for complexity assessment
        let score = 0;
        // Length factor
        score += Math.min(prompt.length / 1000, 0.3);
        // Complex keywords
        const complexKeywords = [
            'analyze', 'architecture', 'design', 'algorithm', 'optimization',
            'refactor', 'debug', 'performance', 'security', 'scalability'
        ];
        const matches = complexKeywords.filter(keyword => prompt.toLowerCase().includes(keyword)).length;
        score += matches * 0.15;
        // Multi-step indicators
        if (prompt.includes('then') || prompt.includes('and then') || prompt.includes('after')) {
            score += 0.2;
        }
        // Code complexity
        if (prompt.includes('```') || prompt.includes('function') || prompt.includes('class')) {
            score += 0.1;
        }
        return Math.min(score, 1.0);
    }
    assessQuality(response, prompt) {
        // Simple quality assessment
        let score = 0.5; // Base score
        // Length appropriateness
        if (response.content.length > 50)
            score += 0.2;
        if (response.content.length > 200)
            score += 0.1;
        // Code block presence (for coding tasks)
        if (prompt.toLowerCase().includes('code') && response.content.includes('```')) {
            score += 0.2;
        }
        // Coherence (simple check)
        if (!response.content.includes('I cannot') &&
            !response.content.includes('I don\'t know')) {
            score += 0.1;
        }
        return Math.min(score, 1.0);
    }
    getStatus() {
        return {
            mode: this.config.execution.mode,
            localProvider: !!this.localProvider,
            cloudProvider: !!this.cloudProvider,
            offline: this.config.execution.offline
        };
    }
}
//# sourceMappingURL=llm-manager.js.map