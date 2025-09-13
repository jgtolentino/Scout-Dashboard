// AI Router with Auto-Fallback Logic
// Attempts Claude first, falls back to local LLM on failure

import { createLocalLLMProvider, LocalLLMProvider, GenOpts } from './local_llm';

interface ProviderConfig {
  priority: string[];
  claude?: any; // Claude provider config
  local_llm?: any; // Local LLM config
}

export class AIRouter {
  private localLLM: LocalLLMProvider;
  private config: ProviderConfig;
  private log = console; // Replace with proper logger

  constructor(config: ProviderConfig) {
    this.config = config;
    this.localLLM = createLocalLLMProvider(config.local_llm);
  }

  async generate(prompt: string, opts: GenOpts = {}): Promise<string> {
    const providers = this.config.priority || ['local_llm'];
    
    for (const provider of providers) {
      try {
        switch (provider) {
          case 'claude':
            if (this.claudeAvailable()) {
              return await this.generateWithClaude(prompt, opts);
            }
            break;
            
          case 'local_llm':
            const healthy = await this.localLLM.health();
            if (!healthy) {
              throw new Error('Local LLM server not responding');
            }
            return await this.localLLM.generate(prompt, opts);
            
          default:
            this.log.warn(`Unknown provider: ${provider}`);
        }
      } catch (error) {
        this.log.warn(`Provider ${provider} failed:`, error.message);
        // Continue to next provider
      }
    }
    
    throw new Error('All AI providers failed. Please check your configuration.');
  }

  private claudeAvailable(): boolean {
    // Check if Claude API key exists and is valid
    return !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY);
  }

  private async generateWithClaude(prompt: string, opts: GenOpts): Promise<string> {
    // Placeholder for Claude integration
    // In production, this would use the actual Claude SDK
    throw new Error('Claude provider not implemented in this example');
  }

  async listAvailableModels(): Promise<string[]> {
    return await this.localLLM.listModels();
  }

  async health(): Promise<{ provider: string; status: string }[]> {
    const results = [];
    
    // Check Claude
    if (this.claudeAvailable()) {
      results.push({ provider: 'claude', status: 'configured' });
    } else {
      results.push({ provider: 'claude', status: 'not configured' });
    }
    
    // Check local LLM
    const localHealth = await this.localLLM.health();
    results.push({ 
      provider: 'local_llm', 
      status: localHealth ? 'healthy' : 'offline' 
    });
    
    return results;
  }
}

// Export for CLI integration
export function createAIRouter(config: ProviderConfig) {
  return new AIRouter(config);
}