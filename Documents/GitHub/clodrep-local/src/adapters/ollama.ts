import fetch from 'node-fetch';
import type { LLMAdapter, GenerateOptions } from '../types.js';

export class OllamaAdapter implements LLMAdapter {
  private baseUrl: string;
  private modelName: string;

  constructor(modelName: string, baseUrl = 'http://localhost:11434') {
    this.modelName = modelName;
    this.baseUrl = baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(prompt: string, options: GenerateOptions = {}): Promise<string> {
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

      const data = await response.json() as any;
      return data.response || '';
    } catch (error) {
      throw new Error(`Failed to generate response: ${error}`);
    }
  }
}