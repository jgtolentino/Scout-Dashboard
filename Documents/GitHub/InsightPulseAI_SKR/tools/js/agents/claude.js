/**
 * agents/claude.js
 * 
 * Integration with Claude API for Pulser CLI
 * Used for handling complex tasks or as a fallback when DeepSeekr1 fails
 */

const axios = require('axios');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Configuration file path
const CONFIG_DIR = path.join(os.homedir(), '.pulser');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const CLAUDE_CONFIG_PATH = path.join(CONFIG_DIR, 'claude_config.json');

// Default Claude configuration
const DEFAULT_CLAUDE_CONFIG = {
  api: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    timeout: 120000, // Increased timeout for cached requests
  },
  model: {
    name: 'claude-3-5-sonnet-20241022', // Updated to latest model with better caching support
    temperature: 0.7,
    max_tokens: 4000,
  },
  caching: {
    enabled: true,
    minChunkSize: 1024, // Aligned with model minimum cache requirements
    maxCachedChunks: 4, // Max breakpoints supported by API
    systemPromptCaching: true, // Cache system prompts by default
    conversationCaching: true, // Cache conversation history
    extendedTTL: false, // Use 1-hour cache when available
    costOptimization: true, // Enable intelligent caching decisions
  },
};

/**
 * Get Claude API configuration
 * @returns {object} - Configuration object
 */
function getClaudeConfig() {
  try {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    // Get Claude-specific config if it exists
    if (fs.existsSync(CLAUDE_CONFIG_PATH)) {
      const content = fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf8');
      return JSON.parse(content);
    }
    
    // Get general config as fallback
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      const config = JSON.parse(content);
      
      // Check if it has Claude config
      if (config.claude) {
        return config.claude;
      }
    }
  } catch (error) {
    console.error('Error reading Claude config file:', error);
  }
  
  // Create default config if none exists
  try {
    fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(DEFAULT_CLAUDE_CONFIG, null, 2));
  } catch (error) {
    console.error('Error creating default Claude config:', error);
  }
  
  return DEFAULT_CLAUDE_CONFIG;
}

/**
 * Get Claude API key from environment or config
 * @returns {string|null} - API key or null if not found
 */
function getClaudeApiKey() {
  // Check environment variable first
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  
  // Check for API key file
  const apiKeyPath = path.join(CONFIG_DIR, 'claude_api_key.txt');
  if (fs.existsSync(apiKeyPath)) {
    try {
      const key = fs.readFileSync(apiKeyPath, 'utf8').trim();
      // Basic validation - Claude API keys usually start with "sk-ant-" 
      // and should be at least 30 characters
      if (key && (key.startsWith('sk-ant-') || key.length >= 30)) {
        return key;
      } else if (key && key.length > 0) {
        console.warn('⚠️ Claude API key appears to be invalid format');
        // Return it anyway, as format validation is best-effort
        return key;
      }
    } catch (error) {
      console.error('Error reading Claude API key file:', error);
    }
  }
  
  return null;
}

/**
 * Save a Claude API key to the config file
 * @param {string} apiKey - The API key to save
 * @returns {Promise<boolean>} - True if successful
 */
async function saveClaudeApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('Invalid API key provided');
  }
  
  try {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    const apiKeyPath = path.join(CONFIG_DIR, 'claude_api_key.txt');
    fs.writeFileSync(apiKeyPath, apiKey.trim());
    return true;
  } catch (error) {
    console.error('Error saving Claude API key:', error);
    throw error;
  }
}

/**
 * Validate a Claude API key by making a test request
 * @param {string} apiKey - The API key to validate
 * @returns {Promise<boolean>} - True if key is valid
 */
async function validateClaudeApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return false;
  }
  
  try {
    const config = getClaudeConfig();
    
    // Make a minimal test request to the API
    const response = await axios.post(
      config.api.endpoint,
      {
        model: config.model.name,
        max_tokens: 5,
        temperature: 0.0,
        messages: [
          { role: 'system', content: 'You are Claude, an AI assistant.' },
          { role: 'user', content: 'Respond with OK' }
        ]
      },
      {
        timeout: 10000, // Short timeout for validation
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
        },
      }
    );
    
    // If we got a valid response structure, key is valid
    return !!(response.data && response.data.content);
  } catch (error) {
    // Check if this is specifically an auth error
    if (error.response && error.response.status === 401) {
      return false;
    }
    
    // For other errors, log but don't automatically invalidate the key
    // (could be network issues, rate limiting, etc.)
    console.warn('API key validation warning:', error.message);
    return false;
  }
}

/**
 * Execute a request using Claude API
 * @param {string} input - User input to process
 * @param {object} context - Current session context
 * @param {object} options - Additional options
 * @returns {Promise<string>} - Model response
 */
async function executeClaudeAPI(input, context, options = {}) {
  const config = getClaudeConfig();
  const apiKey = getClaudeApiKey();
  
  if (!apiKey) {
    throw new Error(
      'Claude API key not found. Please use the command "/apikey set YOUR_API_KEY" to configure your API key.'
    );
  }
  
  // Override caching if specified in options or context
  let cachingEnabled = config.caching?.enabled;
  if (options.useCache !== undefined) {
    cachingEnabled = options.useCache;
  } else if (context.usePromptCache !== undefined) {
    cachingEnabled = context.usePromptCache;
  }
  
  // Update the config for this request
  const requestConfig = {
    ...config,
    caching: {
      ...config.caching,
      enabled: cachingEnabled
    }
  };
  
  try {
    // Build message history
    const messages = buildMessages(input, context);
    
    // Track if we're using caching for logging
    const usingCache = messages.some(msg => {
      if (Array.isArray(msg.content)) {
        return msg.content.some(item => item.cache_control?.type === 'ephemeral');
      }
      return false;
    });
    
    if (usingCache) {
      console.log('📦 Using prompt caching for this request');
    }
    
    // Build the API request
    const requestBody = {
      model: requestConfig.model.name,
      temperature: requestConfig.model.temperature,
      max_tokens: requestConfig.model.max_tokens,
      messages: messages,
    };
    
    // Build headers with caching support
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
    
    // Add beta headers for extended cache features
    if (requestConfig.caching.extendedTTL) {
      headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
    }
    
    // Make API request
    const response = await axios.post(
      requestConfig.api.endpoint,
      requestBody,
      {
        timeout: requestConfig.api.timeout,
        headers,
      }
    );
    
    // Log cache performance metrics
    if (response.data.usage) {
      const usage = response.data.usage;
      const cacheCreation = usage.cache_creation_input_tokens || 0;
      const cacheRead = usage.cache_read_input_tokens || 0;
      const totalInput = usage.input_tokens || 0;
      
      if (cacheCreation > 0 || cacheRead > 0) {
        const cacheHitRate = totalInput > 0 ? (cacheRead / totalInput * 100).toFixed(1) : 0;
        console.log(`📊 Cache Metrics: ${cacheHitRate}% hit rate | Created: ${cacheCreation} | Read: ${cacheRead}`);
        
        // Log cache efficiency to file for analysis
        logCacheMetrics({
          timestamp: new Date().toISOString(),
          hitRate: parseFloat(cacheHitRate),
          cacheCreation,
          cacheRead,
          totalInput,
          model: requestConfig.model.name
        });
      }
    }
    
    // Extract and return the response content
    if (response.data && response.data.content && response.data.content.length > 0) {
      const contentBlock = response.data.content[0];
      if (contentBlock.type === 'text') {
        return contentBlock.text;
      }
    }
    
    throw new Error('Invalid response format from Claude API');
  } catch (error) {
    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage = error.response.data?.error?.message || 'Unknown error';
      
      if (statusCode === 401) {
        // Log to a file for diagnostics
        try {
          const logDir = path.join(os.homedir(), '.pulser', 'logs');
          if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
          }
          
          const logFile = path.join(logDir, 'claude_api_errors.log');
          fs.appendFileSync(logFile, `${new Date().toISOString()} | Authentication error: ${errorMessage}\n`);
        } catch (logError) {
          // Silently fail if logging fails
        }
        
        throw new Error('Claude API authentication failed. Please use the command "/apikey set YOUR_API_KEY" to update your API key.');
      } else if (statusCode === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Claude API error (${statusCode}): ${errorMessage}`);
      }
    } else if (error.request) {
      throw new Error(`Network error connecting to Claude API: ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Log cache performance metrics to file
 * @param {object} metrics - Cache performance data
 */
function logCacheMetrics(metrics) {
  try {
    const logDir = path.join(CONFIG_DIR, 'cache_metrics');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'cache_performance.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(metrics) + '\n');
  } catch (error) {
    // Silently fail if logging fails
  }
}

/**
 * Apply intelligent caching to text content
 * @param {string} text - Text content to potentially cache
 * @param {object} cacheConfig - Caching configuration
 * @param {string} contentType - Type of content (system, history, context)
 * @returns {object} - Text content object with potential caching
 */
function applyCaching(text, cacheConfig, contentType = 'user') {
  // If caching is disabled, return simple text object
  if (!cacheConfig.enabled) {
    return { type: 'text', text };
  }
  
  // Intelligent caching decisions based on content type and cost optimization
  const shouldCache = decideCaching(text, cacheConfig, contentType);
  
  if (!shouldCache) {
    return { type: 'text', text };
  }
  
  // Apply caching to content
  return {
    type: 'text',
    text,
    cache_control: {
      type: 'ephemeral'
    }
  };
}

/**
 * Make intelligent caching decisions
 * @param {string} text - Text content
 * @param {object} cacheConfig - Caching configuration
 * @param {string} contentType - Type of content
 * @returns {boolean} - Whether to cache this content
 */
function decideCaching(text, cacheConfig, contentType) {
  // Always cache system prompts if enabled
  if (contentType === 'system' && cacheConfig.systemPromptCaching) {
    return text.length >= cacheConfig.minChunkSize;
  }
  
  // Cache conversation history if enabled and substantial
  if (contentType === 'history' && cacheConfig.conversationCaching) {
    return text.length >= cacheConfig.minChunkSize;
  }
  
  // For user content, use cost optimization logic
  if (cacheConfig.costOptimization) {
    // Cache if content is substantial and likely to be reused
    const hasReusablePatterns = 
      text.includes('```') || // Code blocks
      text.includes('Context:') || // Context sections
      text.includes('Schema:') || // Schema definitions
      text.length > cacheConfig.minChunkSize * 2; // Very long content
    
    return hasReusablePatterns;
  }
  
  // Default: cache if above minimum size
  return text.length >= cacheConfig.minChunkSize;
}

/**
 * Process system message content with enhanced caching
 * @param {string|object} content - System message content
 * @param {object} cacheConfig - Caching configuration
 * @returns {Array|string} - Processed content
 */
function processSystemContent(content, cacheConfig) {
  // If content is already an object or array, return as is
  if (typeof content !== 'string') {
    return content;
  }
  
  // For system prompts, use direct caching if substantial
  if (cacheConfig.systemPromptCaching && content.length >= cacheConfig.minChunkSize) {
    return [applyCaching(content, cacheConfig, 'system')];
  }
  
  // If caching is disabled or content is small, return as string
  if (!cacheConfig.enabled || content.length < cacheConfig.minChunkSize) {
    return content;
  }
  
  // For very long system prompts, split strategically
  if (content.length > 4000) {
    return splitLongSystemPrompt(content, cacheConfig);
  }
  
  // Default: return as cached content
  return [applyCaching(content, cacheConfig, 'system')];
}

/**
 * Split very long system prompts into cacheable chunks
 * @param {string} content - System prompt content
 * @param {object} cacheConfig - Caching configuration
 * @returns {Array} - Array of content chunks
 */
function splitLongSystemPrompt(content, cacheConfig) {
  const chunks = [];
  const sections = content.split(/\n\n+/); // Split on double newlines
  let currentChunk = '';
  
  for (const section of sections) {
    // If adding this section would exceed reasonable chunk size
    if (currentChunk.length > 0 && currentChunk.length + section.length > 2000) {
      chunks.push(applyCaching(currentChunk.trim(), cacheConfig, 'system'));
      currentChunk = section + '\n\n';
    } else {
      currentChunk += section + '\n\n';
    }
  }
  
  // Add the final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(applyCaching(currentChunk.trim(), cacheConfig, 'system'));
  }
  
  // Limit to maxCachedChunks
  return chunks.slice(0, cacheConfig.maxCachedChunks);
}

/**
 * Combine conversation history into cacheable blocks
 * @param {Array} history - Array of conversation entries
 * @param {object} cacheConfig - Caching configuration
 * @returns {Array} - Array of combined history blocks
 */
function combineHistoryForCaching(history, cacheConfig) {
  const blocks = [];
  let currentBlock = {
    content: '',
    entries: [],
    cached: false
  };
  
  for (const entry of history) {
    const entryText = `User: ${entry.input || ''}\nAssistant: ${entry.response || ''}\n\n`;
    
    // If adding this entry would make the block too large, finalize current block
    if (currentBlock.content.length > 0 && 
        currentBlock.content.length + entryText.length > 3000) {
      
      // Decide if current block should be cached
      currentBlock.cached = currentBlock.content.length >= cacheConfig.minChunkSize;
      blocks.push(currentBlock);
      
      // Start new block
      currentBlock = {
        content: entryText,
        entries: [entry],
        cached: false
      };
    } else {
      currentBlock.content += entryText;
      currentBlock.entries.push(entry);
    }
  }
  
  // Add the final block
  if (currentBlock.content.length > 0) {
    currentBlock.cached = currentBlock.content.length >= cacheConfig.minChunkSize;
    blocks.push(currentBlock);
  }
  
  return blocks;
}

/**
 * Build message history from context for Claude API
 * @param {string} input - Current user input
 * @param {object} context - Session context
 * @returns {Array} - Array of messages for Claude API
 */
function buildMessages(input, context) {
  const messages = [];
  const config = getClaudeConfig();
  const cacheConfig = config.caching || { enabled: false, minChunkSize: 500 };
  
  // Add system message if exists in context
  if (context.system) {
    const processedContent = processSystemContent(context.system, cacheConfig);
    messages.push({
      role: 'system',
      content: processedContent,
    });
  } else {
    // Default system message
    messages.push({
      role: 'system',
      content: 'You are Claude, a helpful and thoughtful AI assistant. Respond accurately, concisely, and with personality when appropriate.',
    });
  }
  
  // Add context history with intelligent caching (limited to last 10 exchanges)
  if (context.history && context.history.length > 0) {
    const recentHistory = context.history.slice(-10);
    let cachedChunksUsed = 0;
    
    // Combine similar/related history into cacheable blocks if cost optimization is enabled
    if (cacheConfig.costOptimization && cacheConfig.conversationCaching) {
      const combinedHistory = combineHistoryForCaching(recentHistory, cacheConfig);
      
      for (const historyBlock of combinedHistory) {
        if (historyBlock.cached && cachedChunksUsed < cacheConfig.maxCachedChunks) {
          messages.push({
            role: 'user',
            content: [applyCaching(historyBlock.content, cacheConfig, 'history')]
          });
          cachedChunksUsed++;
        } else {
          // Add as individual messages
          for (const entry of historyBlock.entries) {
            if (entry.input) messages.push({ role: 'user', content: entry.input });
            if (entry.response) messages.push({ role: 'assistant', content: entry.response });
          }
        }
      }
    } else {
      // Standard individual message processing
      for (const entry of recentHistory) {
        if (entry.input && typeof entry.input === 'string') {
          const shouldCacheInput = decideCaching(entry.input, cacheConfig, 'history');
          if (shouldCacheInput && cachedChunksUsed < cacheConfig.maxCachedChunks) {
            messages.push({ 
              role: 'user', 
              content: [applyCaching(entry.input, cacheConfig, 'history')]
            });
            cachedChunksUsed++;
          } else {
            messages.push({ role: 'user', content: entry.input });
          }
        }
        
        if (entry.response && typeof entry.response === 'string') {
          messages.push({ role: 'assistant', content: entry.response });
        }
      }
    }
  }
  
  // Add current input - don't cache current input as it's new
  messages.push({ role: 'user', content: input });
  
  return messages;
}

/**
 * Toggle prompt caching
 * @param {boolean} enabled - Whether caching should be enabled
 * @returns {Promise<void>}
 */
async function togglePromptCaching(enabled) {
  try {
    // Get current config
    const config = getClaudeConfig();
    
    // Update caching setting
    config.caching = {
      ...config.caching,
      enabled: enabled
    };
    
    // Save updated config
    await fs.writeFile(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2));
    
    return enabled ? 'Prompt caching enabled' : 'Prompt caching disabled';
  } catch (error) {
    console.error('Error toggling prompt caching:', error);
    throw error;
  }
}

/**
 * Get prompt caching status with analytics
 * @returns {Promise<object>} - Current caching status and performance
 */
async function getCachingStatus() {
  const config = getClaudeConfig();
  const analytics = await getCacheAnalytics();
  
  return {
    enabled: config.caching?.enabled || false,
    minChunkSize: config.caching?.minChunkSize || 1024,
    maxCachedChunks: config.caching?.maxCachedChunks || 4,
    systemPromptCaching: config.caching?.systemPromptCaching || false,
    conversationCaching: config.caching?.conversationCaching || false,
    extendedTTL: config.caching?.extendedTTL || false,
    costOptimization: config.caching?.costOptimization || false,
    analytics
  };
}

/**
 * Get cache performance analytics
 * @returns {Promise<object>} - Cache performance data
 */
async function getCacheAnalytics() {
  try {
    const logFile = path.join(CONFIG_DIR, 'cache_metrics', 'cache_performance.jsonl');
    
    if (!fs.existsSync(logFile)) {
      return {
        totalRequests: 0,
        averageHitRate: 0,
        totalTokensSaved: 0,
        estimatedCostSavings: 0
      };
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return {
        totalRequests: 0,
        averageHitRate: 0,
        totalTokensSaved: 0,
        estimatedCostSavings: 0
      };
    }
    
    const metrics = lines.map(line => JSON.parse(line));
    const totalRequests = metrics.length;
    const totalHitRate = metrics.reduce((sum, m) => sum + m.hitRate, 0);
    const averageHitRate = totalHitRate / totalRequests;
    
    // Calculate cost savings (approximate for Claude Sonnet)
    const baseCostPerMillion = 3.0; // $3 per million tokens
    const cacheHitCostPerMillion = 0.3; // $0.30 per million tokens (90% savings)
    
    let totalTokensSaved = 0;
    let estimatedCostSavings = 0;
    
    for (const metric of metrics) {
      const tokensSaved = metric.cacheRead;
      const costSaved = (tokensSaved / 1000000) * (baseCostPerMillion - cacheHitCostPerMillion);
      
      totalTokensSaved += tokensSaved;
      estimatedCostSavings += costSaved;
    }
    
    return {
      totalRequests,
      averageHitRate: parseFloat(averageHitRate.toFixed(2)),
      totalTokensSaved,
      estimatedCostSavings: parseFloat(estimatedCostSavings.toFixed(4)),
      recentPerformance: metrics.slice(-10) // Last 10 requests
    };
  } catch (error) {
    return {
      totalRequests: 0,
      averageHitRate: 0,
      totalTokensSaved: 0,
      estimatedCostSavings: 0,
      error: error.message
    };
  }
}

/**
 * Clear cache analytics
 * @returns {Promise<boolean>} - Success status
 */
async function clearCacheAnalytics() {
  try {
    const logFile = path.join(CONFIG_DIR, 'cache_metrics', 'cache_performance.jsonl');
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
    return true;
  } catch (error) {
    console.error('Error clearing cache analytics:', error);
    return false;
  }
}

module.exports = {
  executeClaudeAPI,
  getClaudeConfig,
  getClaudeApiKey,
  saveClaudeApiKey,
  validateClaudeApiKey,
  togglePromptCaching,
  getCachingStatus,
  getCacheAnalytics,
  clearCacheAnalytics
};