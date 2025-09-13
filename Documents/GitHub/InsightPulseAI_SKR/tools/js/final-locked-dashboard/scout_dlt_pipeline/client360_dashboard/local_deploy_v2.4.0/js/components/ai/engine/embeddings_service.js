/**
 * Embeddings Service Component for Client360 Dashboard v2.4.0
 * Provides vector embeddings functionality for AI insights
 */

class EmbeddingsService {
  constructor(config = {}) {
    this.config = {
      model: 'text-embedding-3-small',
      dimensions: 1536,
      provider: 'azure-openai',
      normalizeVectors: true,
      ...config
    };
    
    this.cache = new Map();
    this.isInitialized = false;
    
    // Function for computing embeddings with provider
    this.embedFn = null;
  }
  
  /**
   * Initialize the embeddings service
   * @returns {Promise<void>}
   */
  async init() {
    console.log('🧠 Initializing Embeddings Service');
    
    try {
      // Set up the embedding function based on provider
      if (this.config.provider === 'azure-openai') {
        // Check if Azure OpenAI client is available
        if (window.AzureOpenAIClient) {
          // Create client instance if needed
          if (!window.azureOpenAIClient) {
            window.azureOpenAIClient = new window.AzureOpenAIClient({
              apiKey: window.config?.azureOpenAI?.apiKey,
              endpoint: window.config?.azureOpenAI?.endpoint,
              apiVersion: window.config?.azureOpenAI?.apiVersion || '2023-05-15'
            });
          }
          
          // Use Azure OpenAI for embeddings
          this.embedFn = async (text) => {
            return await window.azureOpenAIClient.createEmbedding({
              model: this.config.model,
              input: text
            });
          };
        } else {
          throw new Error('Azure OpenAI client not available');
        }
      } else {
        // Fallback to local implementation
        this.embedFn = this.simpleEmbedding;
      }
      
      this.isInitialized = true;
      console.log('✅ Embeddings Service initialized');
    } catch (error) {
      console.error('Failed to initialize embeddings service:', error);
      // Set fallback embedding function
      this.embedFn = this.simpleEmbedding;
    }
  }
  
  /**
   * Create embedding vector for text
   * @param {string} text - Text to embed
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async embed(text) {
    // Check if initialized
    if (!this.isInitialized) {
      console.warn('Embeddings service not initialized. Using fallback.');
      return this.simpleEmbedding(text);
    }
    
    // Check cache
    const cacheKey = this.generateCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      // Generate embedding using provider
      const embedding = await this.embedFn(text);
      
      // Normalize if configured
      const finalEmbedding = this.config.normalizeVectors ? 
        this.normalizeVector(embedding) : embedding;
      
      // Cache result
      this.cache.set(cacheKey, finalEmbedding);
      
      return finalEmbedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fall back to simple embedding
      return this.simpleEmbedding(text);
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vector1 - First vector
   * @param {Array<number>} vector2 - Second vector
   * @returns {number} Similarity score (0-1)
   */
  similarity(vector1, vector2) {
    // Check vectors
    if (!vector1 || !vector2 || vector1.length !== vector2.length) {
      return 0;
    }
    
    try {
      // Compute dot product
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;
      
      for (let i = 0; i < vector1.length; i++) {
        dotProduct += vector1[i] * vector2[i];
        norm1 += vector1[i] * vector1[i];
        norm2 += vector2[i] * vector2[i];
      }
      
      // Calculate cosine similarity
      norm1 = Math.sqrt(norm1);
      norm2 = Math.sqrt(norm2);
      
      if (norm1 === 0 || norm2 === 0) {
        return 0;
      }
      
      return dotProduct / (norm1 * norm2);
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return 0;
    }
  }
  
  /**
   * Find most similar text from a list
   * @param {string} query - Query text
   * @param {Array<Object>} items - List of items with text property
   * @param {string} textKey - Key for text in items
   * @param {number} topK - Number of results to return
   * @returns {Promise<Array<Object>>} Most similar items with scores
   */
  async findSimilar(query, items, textKey = 'text', topK = 5) {
    if (!items || !items.length) {
      return [];
    }
    
    try {
      // Generate query embedding
      const queryEmbedding = await this.embed(query);
      
      // Calculate similarities for all items
      const results = [];
      
      for (const item of items) {
        const itemText = item[textKey];
        if (!itemText) continue;
        
        // Generate or retrieve item embedding
        const itemEmbedding = await this.embed(itemText);
        
        // Calculate similarity
        const score = this.similarity(queryEmbedding, itemEmbedding);
        
        results.push({
          item,
          score
        });
      }
      
      // Sort by score (descending)
      results.sort((a, b) => b.score - a.score);
      
      // Return top K results
      return results.slice(0, topK);
    } catch (error) {
      console.error('Error finding similar items:', error);
      return [];
    }
  }
  
  /**
   * Simple fallback embedding function
   * @param {string} text - Text to embed
   * @returns {Array<number>} Simple embedding vector
   */
  simpleEmbedding(text) {
    const dimension = this.config.dimensions || 1536;
    const embedding = new Array(dimension).fill(0);
    
    // Generate a simple deterministic embedding
    // This is just a fallback and not meant for production use
    if (text) {
      // Use character codes to initialize the embedding
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        embedding[i % dimension] += charCode / 255; // Normalize to 0-1 range
      }
    }
    
    return this.normalizeVector(embedding);
  }
  
  /**
   * Normalize a vector to unit length
   * @param {Array<number>} vector - Vector to normalize
   * @returns {Array<number>} Normalized vector
   */
  normalizeVector(vector) {
    // Calculate magnitude
    let sumSquared = 0;
    for (const value of vector) {
      sumSquared += value * value;
    }
    
    const magnitude = Math.sqrt(sumSquared);
    
    // Avoid division by zero
    if (magnitude === 0) {
      return vector;
    }
    
    // Normalize
    return vector.map(value => value / magnitude);
  }
  
  /**
   * Generate cache key for text
   * @param {string} text - Input text
   * @returns {string} Cache key
   */
  generateCacheKey(text) {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `embed_${this.config.model}_${hash}`;
  }
  
  /**
   * Clear the embedding cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export to window
window.EmbeddingsService = EmbeddingsService;