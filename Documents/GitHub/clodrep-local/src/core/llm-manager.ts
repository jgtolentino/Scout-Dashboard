import { Ollama } from 'ollama';
import { ClodreptConfig } from '../config/index.js';
import chalk from 'chalk';

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

export class OllamaProvider implements LLMProvider {
  private ollama: Ollama;
  private modelName: string;
  
  constructor(modelName: string) {
    this.ollama = new Ollama();
    this.modelName = modelName;
  }
  
  async generate(prompt: string, options: any = {}): Promise<LLMResponse> {
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
    } catch (error) {
      throw new Error(`Ollama generation failed: ${error}`);
    }
  }
  
  async isAvailable(): Promise<boolean> {
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
    } catch (error) {
      return false;
    }
  }
  
  async getModelInfo(): Promise<any> {
    try {
      return await this.ollama.show({ model: this.modelName });
    } catch (error) {
      return null;
    }
  }
}

export class ClaudeProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private cacheConfig: any;
  
  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.cacheConfig = {
      enabled: true,
      minChunkSize: 1024,
      systemPromptCaching: true,
      conversationCaching: true,
      extendedTTL: false
    };
  }
  
  async generate(prompt: string, options: any = {}): Promise<LLMResponse> {
    try {
      // Build headers with caching support
      const headers: any = {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      };
      
      // Add beta headers for extended cache features
      if (this.cacheConfig.extendedTTL) {
        headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
      }
      
      // Process content with caching
      const messages = this.buildCachedMessages(prompt, options);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.2,
          messages
        })
      });
      
      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Log cache performance if available
      if (data.usage) {
        this.logCachePerformance(data.usage);
      }
      
      return {
        content: data.content[0].text,
        model: this.model,
        usage: {
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens,
          cache_creation_input_tokens: data.usage.cache_creation_input_tokens,
          cache_read_input_tokens: data.usage.cache_read_input_tokens
        }
      };
    } catch (error) {
      throw new Error(`Claude generation failed: ${error}`);
    }
  }
  
  async isAvailable(): Promise<boolean> {
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
    } catch (error) {
      return false;
    }
  }
  
  async getModelInfo(): Promise<any> {
    return { model: this.model, provider: 'claude' };
  }
  
  private buildCachedMessages(prompt: string, options: any): any[] {
    const messages: any[] = [];
    
    // Add system message with caching if provided
    if (options.systemPrompt) {
      if (this.shouldCache(options.systemPrompt, 'system')) {
        messages.push({
          role: 'system',
          content: [
            {
              type: 'text',
              text: options.systemPrompt,
              cache_control: { type: 'ephemeral' }
            }
          ]
        });
      } else {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }
    }
    
    // Add conversation history with caching if provided
    if (options.history && Array.isArray(options.history)) {
      for (const entry of options.history) {
        if (entry.role === 'user' && this.shouldCache(entry.content, 'history')) {
          messages.push({
            role: 'user',
            content: [
              {
                type: 'text',
                text: entry.content,
                cache_control: { type: 'ephemeral' }
              }
            ]
          });
        } else {
          messages.push(entry);
        }
      }
    }
    
    // Add current prompt (don't cache current input)
    if (this.shouldCache(prompt, 'context')) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
            cache_control: { type: 'ephemeral' }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt
      });
    }
    
    return messages;
  }
  
  private shouldCache(content: string, type: 'system' | 'history' | 'context'): boolean {
    if (!this.cacheConfig.enabled) return false;
    
    switch (type) {
      case 'system':
        return this.cacheConfig.systemPromptCaching && 
               content.length >= this.cacheConfig.minChunkSize;
      
      case 'history':
        return this.cacheConfig.conversationCaching && 
               content.length >= this.cacheConfig.minChunkSize;
      
      case 'context':
        // Cache context if it contains structured data or is very long
        return content.length >= this.cacheConfig.minChunkSize * 2 ||
               content.includes('```') ||
               content.includes('Schema:') ||
               content.includes('Context:');
      
      default:
        return false;
    }
  }
  
  private logCachePerformance(usage: any): void {
    const cacheRead = usage.cache_read_input_tokens || 0;
    const cacheCreation = usage.cache_creation_input_tokens || 0;
    const totalInput = usage.input_tokens || 0;
    
    if (cacheRead > 0 || cacheCreation > 0) {
      const hitRate = totalInput > 0 ? (cacheRead / totalInput * 100).toFixed(1) : 0;
      console.log(chalk.cyan(`🔄 Cache: ${hitRate}% hit rate | Created: ${cacheCreation} | Read: ${cacheRead}`));
    }
  }
  
  setCacheConfig(config: any): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }
  
  getCacheConfig(): any {
    return { ...this.cacheConfig };
  }
}

export class LLMManager {
  private config: ClodreptConfig;
  private localProvider?: LLMProvider;
  private cloudProvider?: LLMProvider;
  
  constructor(config: ClodreptConfig) {
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    // Initialize local provider
    if (this.config.model.local.provider === 'ollama') {
      this.localProvider = new OllamaProvider(this.config.model.local.name);
    }
    
    // Initialize cloud provider if API key available
    if (this.config.model.cloud.apiKey) {
      if (this.config.model.cloud.provider === 'claude') {
        this.cloudProvider = new ClaudeProvider(
          this.config.model.cloud.apiKey,
          this.config.model.cloud.model
        );
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
  
  async generate(prompt: string, options: any = {}): Promise<LLMResponse> {
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
    } catch (error) {
      console.error(chalk.red('LLM generation failed:'), error);
      throw error;
    }
  }
  
  private async generateLocal(prompt: string, options: any): Promise<LLMResponse> {
    if (!this.localProvider) {
      throw new Error('Local provider not available');
    }
    
    return await this.localProvider.generate(prompt, options);
  }
  
  private async generateCloudFirst(prompt: string, options: any): Promise<LLMResponse> {
    if (this.cloudProvider && !this.config.execution.offline) {
      try {
        return await this.cloudProvider.generate(prompt, options);
      } catch (error) {
        console.log(chalk.yellow('Cloud provider failed, falling back to local...'));
        return await this.generateLocal(prompt, options);
      }
    }
    
    return await this.generateLocal(prompt, options);
  }
  
  private async generateHybrid(prompt: string, options: any): Promise<LLMResponse> {
    // Intelligent routing based on task complexity
    const complexity = this.assessComplexity(prompt);
    
    if (complexity > 0.7 && this.cloudProvider && !this.config.execution.offline) {
      try {
        return await this.cloudProvider.generate(prompt, options);
      } catch (error) {
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
      } catch (error) {
        if (this.cloudProvider && !this.config.execution.offline) {
          console.log(chalk.yellow('Local provider failed, falling back to cloud...'));
          return await this.cloudProvider.generate(prompt, options);
        }
        throw error;
      }
    }
    
    throw new Error('No providers available');
  }
  
  private assessComplexity(prompt: string): number {
    // Simple heuristics for complexity assessment
    let score = 0;
    
    // Length factor
    score += Math.min(prompt.length / 1000, 0.3);
    
    // Complex keywords
    const complexKeywords = [
      'analyze', 'architecture', 'design', 'algorithm', 'optimization',
      'refactor', 'debug', 'performance', 'security', 'scalability'
    ];
    
    const matches = complexKeywords.filter(keyword => 
      prompt.toLowerCase().includes(keyword)
    ).length;
    
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
  
  private assessQuality(response: LLMResponse, prompt: string): number {
    // Simple quality assessment
    let score = 0.5; // Base score
    
    // Length appropriateness
    if (response.content.length > 50) score += 0.2;
    if (response.content.length > 200) score += 0.1;
    
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
  
  getStatus(): any {
    const status = {
      mode: this.config.execution.mode,
      localProvider: !!this.localProvider,
      cloudProvider: !!this.cloudProvider,
      offline: this.config.execution.offline
    };
    
    // Add cache configuration if Claude provider is available
    if (this.cloudProvider && 'getCacheConfig' in this.cloudProvider) {
      status.cacheConfig = (this.cloudProvider as any).getCacheConfig();
    }
    
    return status;
  }
  
  /**
   * Configure caching for Claude provider
   */
  configureCaching(config: any): void {
    if (this.cloudProvider && 'setCacheConfig' in this.cloudProvider) {
      (this.cloudProvider as any).setCacheConfig(config);
      console.log(chalk.green('✓ Cache configuration updated'));
    } else {
      console.log(chalk.yellow('⚠ Caching only available for Claude provider'));
    }
  }
  
  /**
   * Enable or disable caching
   */
  toggleCaching(enabled: boolean): void {
    this.configureCaching({ enabled });
    console.log(chalk.green(`✓ Caching ${enabled ? 'enabled' : 'disabled'}`));
  }
  
  /**
   * Get cache configuration
   */
  getCacheConfig(): any {
    if (this.cloudProvider && 'getCacheConfig' in this.cloudProvider) {
      return (this.cloudProvider as any).getCacheConfig();
    }
    return null;
  }
}