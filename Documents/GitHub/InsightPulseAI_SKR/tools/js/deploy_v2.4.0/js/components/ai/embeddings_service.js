/**
 * EmbeddingsService - Service for generating and working with vector embeddings
 * Part of the Multi-Model AI Framework for Client360 Dashboard v2.4.0
 */
class EmbeddingsService {
  /**
   * Creates a new EmbeddingsService instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Default configuration
    this.config = {
      apiEndpoint: '/api/ai/embeddings',
      defaultModel: 'text-embedding-ada-002',
      dimensions: 1536,                      // Default embedding dimensions (Ada-002)
      enableCaching: true,
      cacheTTL: 60 * 60 * 1000,              // 1 hour in milliseconds
      maxConcurrentRequests: 5,
      maxBatchSize: 100,                     // Maximum texts in a single batch
      aiEngine: null,                        // Optional AIEngine reference
      debug: false,
      ...config
    };
    
    // Core properties
    this.cache = new Map();
    this.collections = new Map();
    this.pendingRequests = new Map();
    this.activeRequests = 0;
    
    // Event handlers
    this.eventHandlers = new Map();
    
    // Initialize
    this._initializeService();
  }
  
  /**
   * Initialize the embeddings service
   * @private
   */
  _initializeService() {
    if (this.config.debug) {
      console.log('EmbeddingsService initialized with config:', this.config);
    }
    
    // Set up periodic cache cleanup if caching is enabled
    if (this.config.enableCaching) {
      this._setupCacheCleanup();
    }
    
    // Trigger initialized event
    this._triggerEvent('initialized', { config: this.config });
  }
  
  /**
   * Generate embeddings for text
   * @param {string|Array<string>} text - Text to generate embeddings for
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} - Generated embeddings
   */
  async generateEmbeddings(text, options = {}) {
    if (!text || (Array.isArray(text) && text.length === 0)) {
      throw new Error('Text is required to generate embeddings');
    }
    
    // Process options
    const {
      model = this.config.defaultModel,
      dimensions = this.config.dimensions,
      batchSize = this.config.maxBatchSize,
      normalize = true
    } = options;
    
    // Convert single text to array
    const textsArray = Array.isArray(text) ? text : [text];
    
    // Check batch size
    if (textsArray.length > this.config.maxBatchSize) {
      if (this.config.debug) {
        console.log(`Splitting embeddings request into batches. Total texts: ${textsArray.length}`);
      }
      
      // Process in batches
      return this._processBatchEmbeddings(textsArray, options);
    }
    
    try {
      // Check cache first if enabled
      if (this.config.enableCaching) {
        // If all texts are in cache, return combined results
        const cachedResults = this._checkCacheForTexts(textsArray, model);
        if (cachedResults.complete) {
          if (this.config.debug) {
            console.log('Returning cached embeddings');
          }
          
          return {
            model,
            embeddings: cachedResults.embeddings,
            usage: { cached: true, total_tokens: cachedResults.totalTokens || 0 }
          };
        }
      }
      
      // If we have an AI engine, use it
      if (this.config.aiEngine) {
        const result = await this.config.aiEngine.generateEmbeddings({
          text: textsArray,
          modelId: model,
          dimensions
        });
        
        // Cache results if caching is enabled
        if (this.config.enableCaching && result.embeddings) {
          this._cacheEmbeddings(textsArray, result.embeddings, model);
        }
        
        return result;
      }
      
      // Otherwise make the API call directly
      return this._makeEmbeddingsRequest(textsArray, model, dimensions, normalize);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }
  
  /**
   * Create a semantic search collection
   * @param {string} collectionName - Name of the collection
   * @param {Object} options - Collection options
   * @returns {boolean} - Success status
   */
  createCollection(collectionName, options = {}) {
    if (!collectionName) {
      throw new Error('Collection name is required');
    }
    
    if (this.collections.has(collectionName)) {
      console.warn(`Collection ${collectionName} already exists. Use a different name or call updateCollection.`);
      return false;
    }
    
    // Create the collection
    this.collections.set(collectionName, {
      items: [],
      embeddings: [],
      metadata: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        model: options.model || this.config.defaultModel,
        dimensions: options.dimensions || this.config.dimensions,
        ...options
      }
    });
    
    if (this.config.debug) {
      console.log(`Collection created: ${collectionName}`);
    }
    
    // Trigger collection created event
    this._triggerEvent('collectionCreated', { 
      collectionName, 
      options 
    });
    
    return true;
  }
  
  /**
   * Add items to a collection
   * @param {string} collectionName - Name of the collection
   * @param {Array<Object>} items - Items to add
   * @returns {Promise<Object>} - Result with added item IDs
   */
  async addItems(collectionName, items) {
    if (!collectionName || !this.collections.has(collectionName)) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Items must be a non-empty array');
    }
    
    const collection = this.collections.get(collectionName);
    const model = collection.metadata.model;
    const itemIDs = [];
    const textItems = [];
    
    // Extract text from items and assign IDs
    for (const item of items) {
      if (!item.text) {
        console.warn('Skipping item without text property:', item);
        continue;
      }
      
      // Generate ID if not provided
      const id = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      textItems.push(item.text);
      itemIDs.push(id);
    }
    
    // Generate embeddings for all texts
    const embeddingResult = await this.generateEmbeddings(textItems, { 
      model: collection.metadata.model,
      dimensions: collection.metadata.dimensions
    });
    
    // Add items with their embeddings to the collection
    for (let i = 0; i < items.length; i++) {
      const id = itemIDs[i];
      const embedding = embeddingResult.embeddings[i];
      
      // Create collection item
      const collectionItem = {
        id,
        text: items[i].text,
        metadata: items[i].metadata || {},
        timestamp: new Date().toISOString()
      };
      
      // Add to collection
      collection.items.push(collectionItem);
      collection.embeddings.push(embedding);
    }
    
    // Update collection metadata
    collection.metadata.lastUpdated = new Date().toISOString();
    collection.metadata.count = collection.items.length;
    
    // Trigger collection updated event
    this._triggerEvent('collectionUpdated', { 
      collectionName, 
      itemCount: items.length,
      totalItems: collection.items.length
    });
    
    return {
      added: itemIDs.length,
      itemIDs
    };
  }
  
  /**
   * Search a collection for similar items
   * @param {string} collectionName - Name of the collection
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Search results
   */
  async searchCollection(collectionName, query, options = {}) {
    if (!collectionName || !this.collections.has(collectionName)) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }
    
    if (!query) {
      throw new Error('Search query is required');
    }
    
    const collection = this.collections.get(collectionName);
    const {
      limit = 10,
      threshold = 0.7,
      includeEmbeddings = false,
      includeScores = true,
      filter = null
    } = options;
    
    // Generate embedding for the query
    const queryEmbedding = (await this.generateEmbeddings(query, {
      model: collection.metadata.model
    })).embeddings[0];
    
    // Calculate similarity scores
    const scores = collection.embeddings.map(embedding => 
      this._cosineSimilarity(queryEmbedding, embedding)
    );
    
    // Create result items with scores
    let results = collection.items.map((item, index) => ({
      ...item,
      score: scores[index],
      embedding: includeEmbeddings ? collection.embeddings[index] : undefined
    }));
    
    // Apply filter if provided
    if (filter && typeof filter === 'function') {
      results = results.filter(filter);
    }
    
    // Filter by threshold
    results = results.filter(item => item.score >= threshold);
    
    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);
    
    // Apply limit
    if (limit > 0) {
      results = results.slice(0, limit);
    }
    
    // Remove scores if not requested
    if (!includeScores) {
      results.forEach(item => {
        delete item.score;
      });
    }
    
    // Trigger search event
    this._triggerEvent('collectionSearched', { 
      collectionName, 
      query,
      resultCount: results.length
    });
    
    return results;
  }
  
  /**
   * Delete a collection
   * @param {string} collectionName - Name of the collection to delete
   * @returns {boolean} - Success status
   */
  deleteCollection(collectionName) {
    if (!collectionName || !this.collections.has(collectionName)) {
      console.warn(`Collection ${collectionName} does not exist`);
      return false;
    }
    
    // Delete the collection
    this.collections.delete(collectionName);
    
    if (this.config.debug) {
      console.log(`Collection deleted: ${collectionName}`);
    }
    
    // Trigger collection deleted event
    this._triggerEvent('collectionDeleted', { collectionName });
    
    return true;
  }
  
  /**
   * Get information about a collection
   * @param {string} collectionName - Name of the collection
   * @returns {Object|null} - Collection information or null if not found
   */
  getCollectionInfo(collectionName) {
    if (!collectionName || !this.collections.has(collectionName)) {
      return null;
    }
    
    const collection = this.collections.get(collectionName);
    
    return {
      name: collectionName,
      metadata: { ...collection.metadata },
      itemCount: collection.items.length
    };
  }
  
  /**
   * Get all collection names
   * @returns {Array<string>} - Array of collection names
   */
  getCollectionNames() {
    return Array.from(this.collections.keys());
  }
  
  /**
   * Calculate similarity between two texts
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @param {Object} options - Options
   * @returns {Promise<number>} - Similarity score (0-1)
   */
  async calculateSimilarity(text1, text2, options = {}) {
    if (!text1 || !text2) {
      throw new Error('Both text arguments are required');
    }
    
    // Generate embeddings for both texts
    const embeddingResult = await this.generateEmbeddings([text1, text2], options);
    
    // Calculate cosine similarity
    const similarity = this._cosineSimilarity(
      embeddingResult.embeddings[0],
      embeddingResult.embeddings[1]
    );
    
    return similarity;
  }
  
  /**
   * Register event handler
   * @param {string} eventName - Event name to listen for
   * @param {Function} handler - Handler function
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    this.eventHandlers.get(eventName).push(handler);
  }
  
  /**
   * Unregister event handler
   * @param {string} eventName - Event name
   * @param {Function} handler - Handler function to remove
   */
  off(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(eventName);
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  /**
   * Clear the embeddings cache
   */
  clearCache() {
    this.cache.clear();
    
    if (this.config.debug) {
      console.log('Embeddings cache cleared');
    }
    
    this._triggerEvent('cacheCleared');
  }
  
  /**
   * Export collections to JSON
   * @param {Array<string>} collectionNames - Names of collections to export
   * @returns {Object} - Exported collections
   */
  exportCollections(collectionNames = null) {
    const collections = {};
    
    // If no collections specified, export all
    const names = collectionNames || Array.from(this.collections.keys());
    
    for (const name of names) {
      if (this.collections.has(name)) {
        collections[name] = this.collections.get(name);
      }
    }
    
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      collections
    };
  }
  
  /**
   * Import collections from exported JSON
   * @param {Object} data - Exported collections data
   * @param {boolean} overwrite - Whether to overwrite existing collections
   * @returns {Object} - Import result
   */
  importCollections(data, overwrite = false) {
    if (!data || !data.collections) {
      throw new Error('Invalid import data format');
    }
    
    const result = {
      imported: 0,
      skipped: 0,
      collections: []
    };
    
    for (const [name, collection] of Object.entries(data.collections)) {
      // Skip existing collections unless overwrite is true
      if (this.collections.has(name) && !overwrite) {
        result.skipped++;
        continue;
      }
      
      // Import the collection
      this.collections.set(name, collection);
      result.imported++;
      result.collections.push(name);
      
      // Trigger collection imported event
      this._triggerEvent('collectionImported', { 
        collectionName: name,
        itemCount: collection.items.length
      });
    }
    
    return result;
  }
  
  /**
   * Process embeddings in batches
   * @param {Array<string>} texts - Texts to process
   * @param {Object} options - Options for embedding generation
   * @returns {Promise<Object>} - Combined results
   * @private
   */
  async _processBatchEmbeddings(texts, options) {
    const batchSize = options.batchSize || this.config.maxBatchSize;
    const model = options.model || this.config.defaultModel;
    const batches = [];
    
    // Split texts into batches
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }
    
    if (this.config.debug) {
      console.log(`Processing ${batches.length} batches of embeddings`);
    }
    
    // Process each batch
    const batchResults = await Promise.all(
      batches.map(batch => this.generateEmbeddings(batch, options))
    );
    
    // Combine results
    const combinedEmbeddings = [];
    let totalTokens = 0;
    
    for (const result of batchResults) {
      combinedEmbeddings.push(...result.embeddings);
      totalTokens += result.usage?.total_tokens || 0;
    }
    
    return {
      model,
      embeddings: combinedEmbeddings,
      usage: {
        total_tokens: totalTokens
      }
    };
  }
  
  /**
   * Make an API request for embeddings
   * @param {Array<string>} texts - Texts to embed
   * @param {string} model - Model to use
   * @param {number} dimensions - Embedding dimensions
   * @param {boolean} normalize - Whether to normalize embeddings
   * @returns {Promise<Object>} - API response
   * @private
   */
  async _makeEmbeddingsRequest(texts, model, dimensions, normalize) {
    // Check if we're at the concurrent request limit
    while (this.activeRequests >= this.config.maxConcurrentRequests) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Increment active requests
    this.activeRequests++;
    
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          texts,
          model,
          dimensions,
          normalize
        })
      });
      
      if (!response.ok) {
        throw new Error(`Embeddings API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Cache results if caching is enabled
      if (this.config.enableCaching && result.embeddings) {
        this._cacheEmbeddings(texts, result.embeddings, model);
      }
      
      return result;
    } catch (error) {
      console.error('Error making embeddings API request:', error);
      throw error;
    } finally {
      // Decrement active requests
      this.activeRequests--;
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vec1 - First vector
   * @param {Array<number>} vec2 - Second vector
   * @returns {number} - Similarity score (0-1)
   * @private
   */
  _cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      console.error('Invalid vectors for similarity calculation');
      return 0;
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    
    return dotProduct / (mag1 * mag2);
  }
  
  /**
   * Check cache for a set of texts
   * @param {Array<string>} texts - Texts to check
   * @param {string} model - Model used for embeddings
   * @returns {Object} - Cache check result
   * @private
   */
  _checkCacheForTexts(texts, model) {
    const embeddings = [];
    let totalTokens = 0;
    
    for (const text of texts) {
      const cacheKey = this._generateCacheKey(text, model);
      
      if (!this.cache.has(cacheKey)) {
        return { complete: false };
      }
      
      const cachedItem = this.cache.get(cacheKey);
      embeddings.push(cachedItem.embedding);
      totalTokens += cachedItem.tokenCount || 0;
    }
    
    return {
      complete: true,
      embeddings,
      totalTokens
    };
  }
  
  /**
   * Cache embeddings for texts
   * @param {Array<string>} texts - Texts to cache
   * @param {Array<Array<number>>} embeddings - Embeddings to cache
   * @param {string} model - Model used for embeddings
   * @private
   */
  _cacheEmbeddings(texts, embeddings, model) {
    if (!texts || !embeddings || texts.length !== embeddings.length) {
      console.error('Invalid data for caching embeddings');
      return;
    }
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const embedding = embeddings[i];
      const cacheKey = this._generateCacheKey(text, model);
      
      this.cache.set(cacheKey, {
        text,
        embedding,
        model,
        timestamp: Date.now(),
        // Rough token count estimation (1 token ≈ 4 chars)
        tokenCount: Math.ceil(text.length / 4)
      });
    }
  }
  
  /**
   * Generate a cache key for text and model
   * @param {string} text - Text to generate key for
   * @param {string} model - Model used for embeddings
   * @returns {string} - Cache key
   * @private
   */
  _generateCacheKey(text, model) {
    // Use a simple hash of text and model for the key
    const hash = this._simpleHash(`${text}:${model}`);
    return `emb_${model}_${hash}`;
  }
  
  /**
   * Generate a simple hash for a string
   * @param {string} str - String to hash
   * @returns {string} - Hash string
   * @private
   */
  _simpleHash(str) {
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Set up periodic cache cleanup
   * @private
   */
  _setupCacheCleanup() {
    // Clean cache every TTL/2 time
    const cleanupInterval = Math.max(this.config.cacheTTL / 2, 60000); // At least every minute
    
    setInterval(() => {
      this._cleanupCache();
    }, cleanupInterval);
  }
  
  /**
   * Clean up expired cache items
   * @private
   */
  _cleanupCache() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (this.config.debug && expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired cache items`);
    }
  }
  
  /**
   * Trigger an event to all registered handlers
   * @param {string} eventName - Name of the event
   * @param {*} data - Event data
   * @private
   */
  _triggerEvent(eventName, data = null) {
    if (!this.eventHandlers.has(eventName)) return;
    
    for (const handler of this.eventHandlers.get(eventName)) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in embeddings service event handler for ${eventName}:`, error);
      }
    }
  }
}

// Export for ESM and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmbeddingsService;
} else if (typeof window !== 'undefined') {
  window.EmbeddingsService = EmbeddingsService;
}