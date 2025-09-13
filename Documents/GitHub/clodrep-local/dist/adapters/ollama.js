import fetch from 'node-fetch';
export class OllamaAdapter {
    baseUrl;
    modelName;
    constructor(modelName, baseUrl = 'http://localhost:11434') {
        this.modelName = modelName;
        this.baseUrl = baseUrl;
    }
    async isAvailable() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async generate(prompt, options = {}) {
        const payload = {
            model: this.modelName,
            prompt,
            stream: false,
            options: {
                temperature: options.temperature ?? 0.2,
                num_predict: options.max_tokens ?? 4096,
            }
        };
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }
            const data = await response.json();
            return data.response || '';
        }
        catch (error) {
            throw new Error(`Failed to generate response: ${error}`);
        }
    }
}
//# sourceMappingURL=ollama.js.map