/**
 * Caching Utilities for AI API Optimization
 * 
 * This module provides common caching patterns and utilities for optimizing
 * API calls to various AI services (Claude, OpenAI, local models, etc.)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class CacheManager {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      maxMemorySize: options.maxMemorySize || 100,
      ttl: options.ttl || 300000, // 5 minutes
      persistToDisk: options.persistToDisk || false,
      diskCacheDir: options.diskCacheDir || path.join(os.homedir(), '.ai-cache'),
      ...options
    };
    
    this.memoryCache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      writes: 0,
      evictions: 0,
      diskHits: 0,
      diskWrites: 0
    };
    
    // Ensure disk cache directory exists
    if (this.options.persistToDisk) {
      this.ensureCacheDir();
    }
  }
  
  /**
   * Generate a cache key from content and options
   */
  generateKey(content, options = {}) {
    const keyData = {
      content: typeof content === 'string' ? content : JSON.stringify(content),
      model: options.model || 'default',
      temperature: options.temperature || 0.7,
      systemPrompt: options.systemPrompt || null,
      maxTokens: options.maxTokens || null
    };
    
    const keyString = JSON.stringify(keyData);
    return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
  }
  
  /**
   * Get cached value with memory and disk fallback
   */
  async get(key) {
    if (!this.options.enabled) return null;
    
    // Check memory cache first
    const memoryValue = this.getFromMemory(key);
    if (memoryValue !== null) {
      this.metrics.hits++;
      return memoryValue;
    }
    
    // Check disk cache if enabled
    if (this.options.persistToDisk) {
      const diskValue = await this.getFromDisk(key);
      if (diskValue !== null) {
        this.metrics.diskHits++;
        // Promote to memory cache
        this.setInMemory(key, diskValue);
        return diskValue;
      }
    }
    
    this.metrics.misses++;
    return null;
  }
  
  /**
   * Set cached value in memory and optionally disk
   */
  async set(key, value, ttl = null) {
    if (!this.options.enabled) return;
    
    const finalTtl = ttl || this.options.ttl;
    
    // Set in memory
    this.setInMemory(key, value, finalTtl);
    
    // Set on disk if enabled
    if (this.options.persistToDisk) {
      await this.setOnDisk(key, value, finalTtl);
    }
    
    this.metrics.writes++;
  }
  
  /**
   * Memory cache operations
   */
  getFromMemory(key) {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    // Check expiration
    if (Date.now() > cached.expires) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return cached.value;
  }
  
  setInMemory(key, value, ttl = null) {
    // Evict oldest entries if cache is full
    if (this.memoryCache.size >= this.options.maxMemorySize) {
      this.evictOldestMemoryEntries();
    }
    
    const finalTtl = ttl || this.options.ttl;
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + finalTtl,
      accessed: Date.now()
    });
  }
  
  /**
   * Disk cache operations
   */
  async getFromDisk(key) {
    try {
      const cacheFile = path.join(this.options.diskCacheDir, `${key}.json`);
      if (!fs.existsSync(cacheFile)) return null;
      
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      
      // Check expiration
      if (Date.now() > cached.expires) {
        fs.unlinkSync(cacheFile);
        return null;
      }
      
      return cached.value;
    } catch (error) {
      return null;
    }
  }
  
  async setOnDisk(key, value, ttl = null) {
    try {
      const finalTtl = ttl || this.options.ttl;
      const cacheFile = path.join(this.options.diskCacheDir, `${key}.json`);
      
      const cacheData = {
        value,
        expires: Date.now() + finalTtl,
        created: Date.now()
      };
      
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData));
      this.metrics.diskWrites++;
    } catch (error) {
      // Silently fail disk operations
    }
  }
  
  /**
   * Eviction strategies
   */
  evictOldestMemoryEntries() {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].accessed - b[1].accessed);
    
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
      this.metrics.evictions++;
    }
  }
  
  /**
   * Clean expired disk cache files
   */
  async cleanExpiredDiskCache() {
    if (!this.options.persistToDisk) return;
    
    try {
      const files = fs.readdirSync(this.options.diskCacheDir);
      let cleaned = 0;
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.options.diskCacheDir, file);
        try {
          const cached = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (Date.now() > cached.expires) {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        } catch {
          // Remove corrupted files
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }
      
      console.log(`🧹 Cleaned ${cleaned} expired cache files`);
    } catch (error) {
      // Silently fail
    }
  }
  
  /**
   * Utility methods
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.options.diskCacheDir)) {
      fs.mkdirSync(this.options.diskCacheDir, { recursive: true });
    }
  }
  
  clear() {
    this.memoryCache.clear();
    
    if (this.options.persistToDisk) {
      try {
        const files = fs.readdirSync(this.options.diskCacheDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(this.options.diskCacheDir, file));
          }
        }
      } catch (error) {
        // Silently fail
      }
    }
    
    this.metrics = {
      hits: 0,
      misses: 0,
      writes: 0,
      evictions: 0,
      diskHits: 0,
      diskWrites: 0
    };
  }
  
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests * 100).toFixed(1) : 0;
    
    return {
      ...this.metrics,
      hitRate: parseFloat(hitRate),
      memorySize: this.memoryCache.size,
      maxMemorySize: this.options.maxMemorySize
    };
  }
}

/**
 * Prompt-specific caching utilities
 */
export class PromptCache extends CacheManager {
  constructor(options = {}) {
    super({
      ...options,
      ttl: options.ttl || 1800000, // 30 minutes for prompts
      maxMemorySize: options.maxMemorySize || 50
    });
  }
  
  /**
   * Cache system prompts with extended TTL
   */
  async cacheSystemPrompt(prompt, options = {}) {
    const key = this.generateKey(`system:${prompt}`, options);
    return await this.set(key, prompt, 3600000); // 1 hour for system prompts
  }
  
  /**
   * Get cached system prompt
   */
  async getSystemPrompt(prompt, options = {}) {
    const key = this.generateKey(`system:${prompt}`, options);
    return await this.get(key);
  }
  
  /**
   * Cache conversation history
   */
  async cacheConversation(history, options = {}) {
    const key = this.generateKey(`conversation:${JSON.stringify(history)}`, options);
    return await this.set(key, history, 900000); // 15 minutes for conversations
  }
  
  /**
   * Get cached conversation
   */
  async getConversation(history, options = {}) {
    const key = this.generateKey(`conversation:${JSON.stringify(history)}`, options);
    return await this.get(key);
  }
}

/**
 * Response caching for API calls
 */
export class ResponseCache extends CacheManager {
  constructor(options = {}) {
    super({
      ...options,
      ttl: options.ttl || 600000, // 10 minutes for responses
      maxMemorySize: options.maxMemorySize || 200,
      persistToDisk: options.persistToDisk !== false // Default to true for responses
    });
  }
  
  /**
   * Cache API response with metadata
   */
  async cacheResponse(prompt, response, metadata = {}) {
    const key = this.generateKey(prompt, metadata);
    const cacheData = {
      response,
      metadata: {
        ...metadata,
        cached_at: Date.now(),
        model: metadata.model || 'unknown'
      }
    };
    
    return await this.set(key, cacheData);
  }
  
  /**
   * Get cached response
   */
  async getCachedResponse(prompt, metadata = {}) {
    const key = this.generateKey(prompt, metadata);
    return await this.get(key);
  }
  
  /**
   * Check if response should be cached based on quality heuristics
   */
  shouldCacheResponse(prompt, response, metadata = {}) {
    // Don't cache very short responses (likely errors)
    if (response.length < 50) return false;
    
    // Don't cache if response contains error indicators
    if (response.toLowerCase().includes('error') || 
        response.toLowerCase().includes('sorry') ||
        response.toLowerCase().includes('cannot')) {
      return false;
    }
    
    // Cache substantial responses
    if (response.length > 200) return true;
    
    // Cache code responses
    if (response.includes('```') || response.includes('function')) return true;
    
    // Cache responses to complex prompts
    if (prompt.length > 500) return true;
    
    return false;
  }
}

/**
 * Configuration management
 */
export class CacheConfig {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(os.homedir(), '.ai-cache-config.json');
    this.config = this.loadConfig();
  }
  
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      // Fall back to defaults
    }
    
    return {
      global: {
        enabled: true,
        ttl: 300000,
        maxMemorySize: 100,
        persistToDisk: false
      },
      claude: {
        enabled: true,
        systemPromptCaching: true,
        conversationCaching: true,
        extendedTTL: false,
        minChunkSize: 1024
      },
      ollama: {
        enabled: true,
        maxCacheSize: 50,
        cacheTTL: 300000,
        systemPromptCaching: true
      }
    };
  }
  
  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save cache config:', error);
    }
  }
  
  get(section, key = null) {
    if (key) {
      return this.config[section]?.[key];
    }
    return this.config[section];
  }
  
  set(section, key, value = null) {
    if (value === null && typeof key === 'object') {
      this.config[section] = { ...this.config[section], ...key };
    } else {
      if (!this.config[section]) this.config[section] = {};
      this.config[section][key] = value;
    }
    this.saveConfig();
  }
}

/**
 * Utility functions
 */
export function createCacheKey(content, options = {}) {
  const manager = new CacheManager();
  return manager.generateKey(content, options);
}

export function calculateCacheSavings(hits, misses, tokensPerRequest = 1000) {
  const totalRequests = hits + misses;
  if (totalRequests === 0) return { savings: 0, percentage: 0 };
  
  const hitRate = hits / totalRequests;
  const tokensSaved = hits * tokensPerRequest;
  
  // Estimated cost savings (using Claude Sonnet pricing as baseline)
  const baseCostPerMillion = 3.0;
  const cacheHitCostPerMillion = 0.3;
  const savingsPerToken = (baseCostPerMillion - cacheHitCostPerMillion) / 1000000;
  const dollarSavings = tokensSaved * savingsPerToken;
  
  return {
    tokensSaved,
    dollarSavings: parseFloat(dollarSavings.toFixed(4)),
    hitRate: parseFloat((hitRate * 100).toFixed(1)),
    percentage: parseFloat(((dollarSavings / (totalRequests * tokensPerRequest * baseCostPerMillion / 1000000)) * 100).toFixed(1))
  };
}

export function isClaudeModel(model) {
  return model && (model.includes('claude') || model.includes('anthropic'));
}

export function isOpenAIModel(model) {
  return model && (model.includes('gpt') || model.includes('openai'));
}

/**
 * Default cache instances for convenience
 */
export const defaultCache = new CacheManager();
export const promptCache = new PromptCache();
export const responseCache = new ResponseCache();
export const cacheConfig = new CacheConfig();

/**
 * Easy-to-use wrapper functions
 */
export async function getCached(key) {
  return await defaultCache.get(key);
}

export async function setCached(key, value, ttl = null) {
  return await defaultCache.set(key, value, ttl);
}

export async function cachePromptResponse(prompt, response, options = {}) {
  return await responseCache.cacheResponse(prompt, response, options);
}

export async function getCachedPromptResponse(prompt, options = {}) {
  return await responseCache.getCachedResponse(prompt, options);
}

export function getCacheStats() {
  return {
    default: defaultCache.getStats(),
    prompts: promptCache.getStats(),
    responses: responseCache.getStats()
  };
}

export function clearAllCaches() {
  defaultCache.clear();
  promptCache.clear();
  responseCache.clear();
  console.log('🧹 All caches cleared');
}

export default {
  CacheManager,
  PromptCache,
  ResponseCache,
  CacheConfig,
  createCacheKey,
  calculateCacheSavings,
  isClaudeModel,
  isOpenAIModel,
  defaultCache,
  promptCache,
  responseCache,
  cacheConfig,
  getCached,
  setCached,
  cachePromptResponse,
  getCachedPromptResponse,
  getCacheStats,
  clearAllCaches
};