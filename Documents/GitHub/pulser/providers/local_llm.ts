// Local LLM Provider for Pulser CLI
// Routes all AI requests to Ollama or compatible local inference servers

import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Simple async queue to prevent concurrent Ollama requests
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrency: number;

  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, this.concurrency);
    
    await Promise.all(batch.map(fn => fn()));
    
    this.processing = false;
    if (this.queue.length > 0) {
      this.process();
    }
  }
}

export interface GenOpts {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
  logMetrics?: boolean;
  onChunk?: (chunk: string) => void;
}

export interface LocalLLMConfig {
  endpoint: string;
  defaultModel: string;
  contextSize: number;
  timeout?: number;
  concurrency?: number;
}

const DEFAULT_CONFIG: LocalLLMConfig = {
  endpoint: 'http://127.0.0.1:11434',
  defaultModel: 'deepseek-coder:6.7b-instruct-q4_K_M',
  contextSize: 3584, // Safe margin: 4096 - 512
  timeout: 30000,
  concurrency: 1
};

export class LocalLLMProvider {
  private config: LocalLLMConfig;
  private requestQueue: RequestQueue;

  constructor(config?: Partial<LocalLLMConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.requestQueue = new RequestQueue(this.config.concurrency || 1);
  }

  async generate(prompt: string, opts: GenOpts = {}): Promise<string> {
    // Queue the request to prevent concurrent Ollama calls
    return this.requestQueue.add(async () => {
      const startTime = Date.now();
      const model = opts.model || this.config.defaultModel;
      const endpoint = `${this.config.endpoint}/api/generate`;

      // Guard against context window overflow
      const fullPrompt = opts.systemPrompt ? `${opts.systemPrompt}\n\n${prompt}` : prompt;
      const truncatedPrompt = this.truncateToContextWindow(fullPrompt, model);
      
      if (fullPrompt.length !== truncatedPrompt.length) {
        console.warn(`⚠️  Prompt truncated from ${fullPrompt.length} to ${truncatedPrompt.length} tokens to fit context window`);
      }

      const streamEnabled = opts.stream ?? (opts.onChunk !== undefined);
      const requestBody = {
        model,
        prompt: truncatedPrompt,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 2048,
        stream: streamEnabled
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout!);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
        }

        let responseText = '';
        
        if (streamEnabled && response.body) {
          // Handle streaming response
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.response) {
                  responseText += json.response;
                  opts.onChunk?.(json.response);
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        } else {
          // Non-streaming response
          const data = await response.json();
          responseText = data.response || '';
        }
        
        // Log metrics if requested
        if (opts.logMetrics) {
          const endTime = Date.now();
          await this.logMetrics({
            timestamp: new Date().toISOString(),
            model,
            promptTokens: truncatedPrompt.length,
            responseTokens: responseText.length,
            latencyMs: endTime - startTime,
            temperature: opts.temperature ?? 0.2
          });
        }

        return responseText;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error(`Local LLM request timed out after ${this.config.timeout}ms`);
        }
        throw new Error(`Local LLM error: ${error.message}`);
      }
    });
  }

  private truncateToContextWindow(prompt: string, model: string): string {
    // Simple character-based truncation (1 char ≈ 0.25 tokens for code)
    const maxChars = this.config.contextSize * 4;
    if (prompt.length <= maxChars) return prompt;
    
    // Truncate from the middle to preserve context
    const halfSize = Math.floor(maxChars / 2) - 50;
    const start = prompt.slice(0, halfSize);
    const end = prompt.slice(-halfSize);
    return `${start}\n\n[... ${prompt.length - maxChars} characters truncated ...]\n\n${end}`;
  }

  private async logMetrics(metrics: any): Promise<void> {
    try {
      const logPath = join(homedir(), '.pulser', 'metrics.log');
      await fs.mkdir(join(homedir(), '.pulser'), { recursive: true });
      await fs.appendFile(logPath, JSON.stringify(metrics) + '\n');
    } catch (error) {
      // Silently fail metrics logging
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Factory function for CLI integration
export function createLocalLLMProvider(config?: Partial<LocalLLMConfig>) {
  return new LocalLLMProvider(config);
}