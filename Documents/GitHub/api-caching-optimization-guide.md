# API Caching Optimization Guide

## Overview

Your codebase now has comprehensive prompt caching optimizations implemented across multiple AI service integrations. This guide explains how to use and benefit from these optimizations.

## What Was Optimized

### 1. Claude API Client (`InsightPulseAI_SKR/tools/js/agents/claude.js`)

**Enhanced Features:**
- ✅ **Intelligent Prompt Caching**: Automatically caches system prompts, conversation history, and large context blocks
- ✅ **Cost Optimization**: Smart decisions on what to cache based on content patterns
- ✅ **Extended TTL Support**: Option for 1-hour cache lifetime (beta feature)
- ✅ **Performance Monitoring**: Real-time cache hit rate tracking and cost savings calculation
- ✅ **Conversation History Caching**: Combines related history into efficient cache blocks

**Key Improvements:**
```javascript
// Enhanced configuration with intelligent defaults
const config = {
  caching: {
    enabled: true,
    minChunkSize: 1024,              // Aligned with Claude's requirements
    maxCachedChunks: 4,              // Maximum API limit
    systemPromptCaching: true,       // Cache system prompts by default
    conversationCaching: true,       // Cache conversation history
    extendedTTL: false,             // Use 1-hour cache when available
    costOptimization: true          // Intelligent caching decisions
  }
}
```

### 2. LLM Manager (`clodrep-local/src/core/llm-manager.ts`)

**Enhanced Features:**
- ✅ **Multi-Provider Caching**: Works with both Claude and local models
- ✅ **Intelligent Content Detection**: Automatically identifies cacheable content types
- ✅ **Performance Logging**: Visual cache performance feedback
- ✅ **Configuration Management**: Easy cache configuration updates

**Usage Example:**
```typescript
// Configure caching for Claude provider
llmManager.configureCaching({
  enabled: true,
  systemPromptCaching: true,
  conversationCaching: true,
  minChunkSize: 1024
});

// Generate with caching
const response = await llmManager.generate(prompt, {
  systemPrompt: "Your expert system prompt...",
  history: conversationHistory
});
```

### 3. Ollama Client (`bruno-agentic-cli/core/ollamaClient.js`)

**Enhanced Features:**
- ✅ **Local Response Caching**: In-memory cache for frequently used responses
- ✅ **Smart Cache Management**: Automatic eviction and TTL management
- ✅ **Context-Aware Caching**: Identifies system prompts and structured data
- ✅ **Performance Metrics**: Hit rate tracking and cache statistics

**Configuration:**
```javascript
const client = new OllamaClient({
  enableLocalCaching: true,
  maxCacheSize: 100,
  cacheTTL: 300000,  // 5 minutes
  systemPromptCaching: true
});
```

### 4. Caching Utilities (`caching-utils.js`)

**New Comprehensive Module:**
- ✅ **Universal Cache Manager**: Works with any AI service
- ✅ **Memory + Disk Caching**: Two-tier caching strategy
- ✅ **Specialized Caches**: Separate caches for prompts, responses, and conversations
- ✅ **Cost Calculation**: Automatic savings estimation
- ✅ **Configuration Management**: Centralized cache settings

## How to Use the Optimizations

### 1. Claude API Caching

The Claude client now automatically optimizes caching. You can control it with:

```javascript
const claude = require('./agents/claude.js');

// Check current caching status
const status = await claude.getCachingStatus();
console.log('Cache enabled:', status.enabled);
console.log('Average hit rate:', status.analytics.averageHitRate);
console.log('Estimated savings:', status.analytics.estimatedCostSavings);

// Configure caching
await claude.togglePromptCaching(true);

// Clear analytics
await claude.clearCacheAnalytics();
```

### 2. LLM Manager Integration

```typescript
import { LLMManager } from './core/llm-manager';

const manager = new LLMManager(config);
await manager.initialize();

// Configure caching
manager.configureCaching({
  enabled: true,
  systemPromptCaching: true,
  conversationCaching: true
});

// Use with automatic caching
const response = await manager.generate(prompt, {
  systemPrompt: "Long system prompt here...",
  history: [
    { role: 'user', content: 'Previous question' },
    { role: 'assistant', content: 'Previous response' }
  ]
});
```

### 3. Ollama Local Caching

```javascript
import { OllamaClient } from './core/ollamaClient';

const client = new OllamaClient({
  enableLocalCaching: true,
  maxCacheSize: 100,
  cacheTTL: 300000
});

// Use with automatic caching
const response = await client.generate("Your prompt here", {
  systemContext: "Important context that should be cached"
});

// Check cache performance
const stats = client.getCacheStats();
console.log(`Hit rate: ${stats.hitRate}%`);
console.log(`Cache size: ${stats.cacheSize}/${stats.maxCacheSize}`);

// Clear cache if needed
client.clearCache();
```

### 4. Universal Caching Utilities

```javascript
import { 
  responseCache, 
  promptCache, 
  cachePromptResponse, 
  getCachedPromptResponse,
  calculateCacheSavings 
} from './caching-utils';

// Cache any API response
await cachePromptResponse("Your prompt", "API response", {
  model: "claude-3-5-sonnet",
  temperature: 0.7
});

// Retrieve cached response
const cached = await getCachedPromptResponse("Your prompt", {
  model: "claude-3-5-sonnet",
  temperature: 0.7
});

// Get comprehensive statistics
const stats = getCacheStats();
console.log('Cache performance:', stats);

// Calculate savings
const savings = calculateCacheSavings(stats.responses.hits, stats.responses.misses);
console.log(`Token savings: ${savings.tokensSaved}`);
console.log(`Dollar savings: $${savings.dollarSavings}`);
```

## Performance Benefits

### Expected Improvements

1. **Cost Reduction**: 70-90% savings on repeated prompts
2. **Latency Improvement**: 50-80% faster response times for cached content
3. **Token Efficiency**: Significant reduction in input token usage

### Real-World Scenarios

**Dashboard Generation:**
- System prompts cached for entire session
- Schema definitions cached across multiple queries
- Conversation history efficiently managed

**Code Analysis:**
- Large codebases cached as context
- System prompts for code review cached
- Repeated analysis patterns optimized

**Document Processing:**
- Large documents cached for multiple queries
- Template prompts cached across sessions
- Analysis results cached for similar content

## Monitoring and Analytics

### Cache Performance Metrics

```javascript
// Claude API metrics
const claudeStatus = await claude.getCachingStatus();
console.log(`
Cache Performance:
- Hit Rate: ${claudeStatus.analytics.averageHitRate}%
- Total Requests: ${claudeStatus.analytics.totalRequests}
- Tokens Saved: ${claudeStatus.analytics.totalTokensSaved}
- Cost Savings: $${claudeStatus.analytics.estimatedCostSavings}
`);

// Ollama metrics
const ollamaStats = ollamaClient.getCacheStats();
console.log(`
Local Cache Performance:
- Hit Rate: ${ollamaStats.hitRate}%
- Cache Size: ${ollamaStats.cacheSize}/${ollamaStats.maxCacheSize}
- Evictions: ${ollamaStats.evictions}
`);
```

### Log Files

Cache performance is automatically logged to:
- `~/.pulser/cache_metrics/cache_performance.jsonl` (Claude API)
- Memory-only for Ollama (configurable to disk)

## Configuration Reference

### Claude Caching Configuration

```javascript
{
  "caching": {
    "enabled": true,
    "minChunkSize": 1024,        // Minimum tokens to cache
    "maxCachedChunks": 4,        // Max cache breakpoints per request
    "systemPromptCaching": true,  // Cache system prompts
    "conversationCaching": true,  // Cache conversation history
    "extendedTTL": false,        // Use 1-hour cache (beta)
    "costOptimization": true     // Intelligent caching decisions
  }
}
```

### Ollama Caching Configuration

```javascript
{
  "enableLocalCaching": true,
  "maxCacheSize": 100,          // Max cached responses
  "cacheTTL": 300000,          // 5 minutes
  "systemPromptCaching": true,  // Cache system prompts
  "contextCaching": true       // Cache context-heavy queries
}
```

### Universal Cache Configuration

```javascript
// ~/.ai-cache-config.json
{
  "global": {
    "enabled": true,
    "ttl": 300000,
    "maxMemorySize": 100,
    "persistToDisk": false
  },
  "claude": {
    "enabled": true,
    "systemPromptCaching": true,
    "conversationCaching": true,
    "extendedTTL": false,
    "minChunkSize": 1024
  },
  "ollama": {
    "enabled": true,
    "maxCacheSize": 50,
    "cacheTTL": 300000,
    "systemPromptCaching": true
  }
}
```

## Best Practices

### 1. Cache Strategy by Content Type

- **System Prompts**: Always cache (long TTL)
- **Conversation History**: Cache recent history (medium TTL)
- **Large Documents**: Cache for session (short TTL)
- **Code Context**: Cache for analysis session (medium TTL)

### 2. Cache Management

```javascript
// Regular cleanup
await responseCache.cleanExpiredDiskCache();

// Clear when switching contexts
if (newProject) {
  client.clearCache();
  await claude.clearCacheAnalytics();
}

// Monitor performance
setInterval(() => {
  const stats = getCacheStats();
  if (stats.responses.hitRate < 20) {
    console.log('⚠️ Low cache hit rate - consider adjusting strategy');
  }
}, 60000); // Check every minute
```

### 3. Cost Optimization

```javascript
// Enable cost optimization for intelligent caching
await claude.togglePromptCaching(true);
manager.configureCaching({ costOptimization: true });

// Monitor savings
const savings = calculateCacheSavings(hits, misses, avgTokensPerRequest);
console.log(`Monthly savings estimate: $${savings.dollarSavings * 30}`);
```

## Troubleshooting

### Common Issues

1. **Low Hit Rate**: Check if content is changing slightly between requests
2. **Memory Usage**: Monitor cache size and adjust maxCacheSize if needed
3. **Disk Space**: Clean expired cache files regularly
4. **Performance**: Balance cache size vs. hit rate

### Debug Commands

```javascript
// Claude debugging
console.log(await claude.getCachingStatus());

// Ollama debugging
console.log(client.getCacheStats());

// Universal cache debugging
console.log(getCacheStats());
```

## Migration Guide

If you're upgrading from the previous implementation:

1. **Claude API**: Configuration automatically migrated to new format
2. **LLM Manager**: Add cache configuration calls where needed
3. **Ollama**: Add caching configuration to constructor options
4. **New Features**: Import and use caching utilities for advanced scenarios

## Future Enhancements

The caching system is designed to be extensible:

- **Additional Providers**: Easy to add OpenAI, Anthropic, etc.
- **Advanced Strategies**: LRU, LFU, time-based eviction
- **Distributed Caching**: Redis, Memcached support
- **ML-Based Optimization**: Predict cache hits using usage patterns

## Support

For issues or questions about the caching optimizations:

1. Check cache performance with monitoring commands
2. Review configuration settings
3. Examine log files for debugging information
4. Consider adjusting cache parameters based on usage patterns