/**
 * AIEngine - Core component for managing multi-model AI capabilities
 * Part of the Multi-Model AI Framework for Client360 Dashboard v2.4.0
 */
class AIEngine {
  /**
   * Creates a new AIEngine instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Default configuration
    this.config = {
      apiEndpoint: '/api/ai',
      enableCaching: true,
      cacheTTL: 30 * 60 * 1000, // 30 minutes in milliseconds
      defaultModelId: null,
      maxConcurrentRequests: 3,
      defaultTimeout: 30000, // 30 seconds in milliseconds
      debug: false,
      ...config
    };
    
    // Core state
    this.cache = new Map();
    this.activeRequests = new Map();
    this.models = new Map();
    this.requestQueue = [];
    this.lastError = null;
    
    // Event handlers
    this.eventHandlers = new Map();
    
    // Initialize
    this._initializeEngine();
  }
  
  /**
   * Initialize the AI engine
   * @private
   */
  _initializeEngine() {
    if (this.config.debug) {
      console.log('AIEngine initialized with config:', this.config);
    }
    
    // Set up periodic cache cleanup if caching is enabled
    if (this.config.enableCaching) {
      this._setupCacheCleanup();
    }
    
    // Trigger initialized event
    this._triggerEvent('initialized', { config: this.config });
  }
  
  /**
   * Register an AI model
   * @param {Object} model - Model configuration
   * @param {string} model.id - Unique identifier for the model
   * @param {string} model.name - Display name of the model
   * @param {string} model.provider - Provider name (e.g., openai, anthropic, google)
   * @param {Array<string>} model.capabilities - Array of model capabilities
   * @param {number} model.priority - Priority (lower number = higher priority)
   * @param {Object} model.config - Model-specific configuration
   * @returns {boolean} - Success status
   */
  registerModel(model) {
    if (!model || !model.id) {
      console.error('Invalid model configuration. Model ID is required.');
      return false;
    }
    
    // Ensure the model has the required properties
    const requiredProps = ['name', 'provider', 'capabilities', 'priority'];
    for (const prop of requiredProps) {
      if (!model[prop]) {
        console.warn(`Model ${model.id} is missing property: ${prop}`);
      }
    }
    
    // Add the model to the registry
    this.models.set(model.id, {
      ...model,
      lastUsed: null,
      usageCount: 0,
      errorCount: 0,
      status: 'available'
    });
    
    if (this.config.debug) {
      console.log(`Model registered: ${model.id} (${model.name})`);
    }
    
    // Set as default model if none is set and this model supports insights
    if (!this.config.defaultModelId && 
        model.capabilities && 
        model.capabilities.includes('insights')) {
      this.config.defaultModelId = model.id;
      if (this.config.debug) {
        console.log(`Set ${model.id} as default model`);
      }
    }
    
    // Trigger model registered event
    this._triggerEvent('modelRegistered', { model });
    
    return true;
  }
  
  /**
   * Unregister an AI model
   * @param {string} modelId - ID of the model to unregister
   * @returns {boolean} - Success status
   */
  unregisterModel(modelId) {
    if (!this.models.has(modelId)) {
      console.warn(`Model ${modelId} not found in registry`);
      return false;
    }
    
    // Get the model before removing it (for event)
    const model = this.models.get(modelId);
    
    // Remove the model
    this.models.delete(modelId);
    
    if (this.config.debug) {
      console.log(`Model unregistered: ${modelId}`);
    }
    
    // If this was the default model, clear the default
    if (this.config.defaultModelId === modelId) {
      this.config.defaultModelId = null;
      
      // Find a new default model if available
      const availableModels = Array.from(this.models.values())
        .filter(m => m.capabilities && m.capabilities.includes('insights'))
        .sort((a, b) => a.priority - b.priority);
      
      if (availableModels.length > 0) {
        this.config.defaultModelId = availableModels[0].id;
        if (this.config.debug) {
          console.log(`New default model set: ${this.config.defaultModelId}`);
        }
      }
    }
    
    // Trigger model unregistered event
    this._triggerEvent('modelUnregistered', { modelId, model });
    
    return true;
  }
  
  /**
   * Update a model's status
   * @param {string} modelId - ID of the model to update
   * @param {string} status - New status ('available', 'unavailable', 'error')
   * @param {Object} data - Additional data about the status change
   * @returns {boolean} - Success status
   */
  updateModelStatus(modelId, status, data = {}) {
    if (!this.models.has(modelId)) {
      console.warn(`Model ${modelId} not found in registry`);
      return false;
    }
    
    const model = this.models.get(modelId);
    const oldStatus = model.status;
    
    // Update the model status
    model.status = status;
    
    // Additional updates based on status
    if (status === 'error') {
      model.errorCount = (model.errorCount || 0) + 1;
      model.lastError = {
        timestamp: Date.now(),
        ...data
      };
    }
    
    // Trigger status changed event
    this._triggerEvent('modelStatusChanged', { 
      modelId, 
      oldStatus, 
      newStatus: status,
      data
    });
    
    return true;
  }
  
  /**
   * Get a list of available models
   * @param {string} capability - Optional capability to filter by
   * @returns {Array} - Array of available models
   */
  getAvailableModels(capability = null) {
    let models = Array.from(this.models.values())
      .filter(model => model.status === 'available');
    
    // Filter by capability if specified
    if (capability) {
      models = models.filter(model => 
        model.capabilities && model.capabilities.includes(capability)
      );
    }
    
    // Sort by priority
    models.sort((a, b) => a.priority - b.priority);
    
    return models;
  }
  
  /**
   * Get a prioritized list of models to try
   * @param {string} modelId - Optional specific model to use first
   * @param {string} capability - Required capability
   * @returns {Array} - Prioritized array of model IDs
   * @private
   */
  getPrioritizedModels(modelId = null, capability = 'insights') {
    // Start with the specified model if provided
    const prioritizedModels = [];
    
    if (modelId && this.models.has(modelId)) {
      const model = this.models.get(modelId);
      if (model.status === 'available' && 
          model.capabilities && 
          model.capabilities.includes(capability)) {
        prioritizedModels.push(model);
      }
    }
    
    // Add all other available models with the required capability
    const otherModels = Array.from(this.models.values())
      .filter(model => 
        model.id !== modelId && 
        model.status === 'available' && 
        model.capabilities && 
        model.capabilities.includes(capability)
      )
      .sort((a, b) => a.priority - b.priority);
    
    return [...prioritizedModels, ...otherModels].map(model => model.id);
  }
  
  /**
   * Generate AI insights using the specified or default model
   * @param {Object} params - Parameters for insight generation
   * @param {string} params.prompt - The prompt or query to generate insights for
   * @param {string} params.modelId - Optional specific model to use
   * @param {string} params.insightType - Type of insights to generate
   * @param {Object} params.context - Additional context data
   * @param {number} params.timeout - Optional request timeout in milliseconds
   * @returns {Promise<Object>} - Generated insights
   */
  async generateInsights(params) {
    const { 
      prompt, 
      modelId = this.config.defaultModelId, 
      insightType = 'general',
      context = {},
      timeout = this.config.defaultTimeout
    } = params;
    
    if (!prompt) {
      throw new Error('Prompt is required to generate insights');
    }
    
    try {
      // Generate cache key
      const cacheKey = this._generateCacheKey(prompt, modelId, insightType);
      
      // Check cache first if enabled
      if (this.config.enableCaching) {
        const cachedResult = this._getFromCache(cacheKey);
        if (cachedResult) {
          if (this.config.debug) {
            console.log('Returning cached insights');
          }
          
          this._triggerEvent('insightsFromCache', { 
            prompt, 
            modelId, 
            insightType 
          });
          
          return cachedResult;
        }
      }
      
      // Get prioritized list of models to try
      const prioritizedModels = this.getPrioritizedModels(modelId, 'insights');
      
      if (prioritizedModels.length === 0) {
        throw new Error('No suitable models available for generating insights');
      }
      
      // Try models in order until successful
      let result = null;
      let lastError = null;
      
      for (const currentModelId of prioritizedModels) {
        try {
          if (this.config.debug) {
            console.log(`Attempting to generate insights with model: ${currentModelId}`);
          }
          
          // Create request options
          const requestOptions = {
            modelId: currentModelId,
            prompt,
            insightType,
            context,
            timeout
          };
          
          // Make the API request
          result = await this._makeApiRequest('/generate-insights', requestOptions);
          
          // Update model usage statistics
          this._updateModelUsage(currentModelId);
          
          // Cache the result if caching is enabled
          if (this.config.enableCaching) {
            this._addToCache(cacheKey, result);
          }
          
          // Trigger success event
          this._triggerEvent('insightsGenerated', { 
            modelId: currentModelId, 
            prompt, 
            insightType,
            result
          });
          
          return result;
        } catch (error) {
          console.error(`Error generating insights with model ${currentModelId}:`, error);
          lastError = error;
          
          // Update model error count and status
          this.updateModelStatus(currentModelId, 'error', {
            error: error.message,
            operation: 'generateInsights'
          });
          
          // Continue to next model
          continue;
        }
      }
      
      // If we get here, all models failed
      this.lastError = {
        timestamp: Date.now(),
        operation: 'generateInsights',
        prompt,
        error: lastError?.message || 'All models failed to generate insights'
      };
      
      // Trigger error event
      this._triggerEvent('error', this.lastError);
      
      throw new Error(`Failed to generate insights: ${this.lastError.error}`);
    } catch (error) {
      console.error('Error in generateInsights:', error);
      throw error;
    }
  }
  
  /**
   * Generate embedded vectors for text
   * @param {Object} params - Parameters for embedding generation
   * @param {string|Array<string>} params.text - Text to generate embeddings for
   * @param {string} params.modelId - Optional specific model to use
   * @param {number} params.dimensions - Optional embedding dimensions
   * @returns {Promise<Object>} - Generated embeddings
   */
  async generateEmbeddings(params) {
    const { 
      text, 
      modelId = null, 
      dimensions = null 
    } = params;
    
    if (!text) {
      throw new Error('Text is required to generate embeddings');
    }
    
    try {
      // Find suitable embedding models
      const models = this.getPrioritizedModels(modelId, 'embeddings');
      
      if (models.length === 0) {
        throw new Error('No suitable models available for generating embeddings');
      }
      
      // Try models in order until successful
      let result = null;
      let lastError = null;
      
      for (const currentModelId of models) {
        try {
          if (this.config.debug) {
            console.log(`Attempting to generate embeddings with model: ${currentModelId}`);
          }
          
          // Create request options
          const requestOptions = {
            modelId: currentModelId,
            text: Array.isArray(text) ? text : [text],
            dimensions
          };
          
          // Make the API request
          result = await this._makeApiRequest('/generate-embeddings', requestOptions);
          
          // Update model usage statistics
          this._updateModelUsage(currentModelId);
          
          // Trigger success event
          this._triggerEvent('embeddingsGenerated', { 
            modelId: currentModelId, 
            textCount: Array.isArray(text) ? text.length : 1,
            result
          });
          
          return result;
        } catch (error) {
          console.error(`Error generating embeddings with model ${currentModelId}:`, error);
          lastError = error;
          
          // Update model error count
          this.updateModelStatus(currentModelId, 'error', {
            error: error.message,
            operation: 'generateEmbeddings'
          });
          
          // Continue to next model
          continue;
        }
      }
      
      // If we get here, all models failed
      this.lastError = {
        timestamp: Date.now(),
        operation: 'generateEmbeddings',
        error: lastError?.message || 'All models failed to generate embeddings'
      };
      
      // Trigger error event
      this._triggerEvent('error', this.lastError);
      
      throw new Error(`Failed to generate embeddings: ${this.lastError.error}`);
    } catch (error) {
      console.error('Error in generateEmbeddings:', error);
      throw error;
    }
  }
  
  /**
   * Generate streaming response
   * @param {Object} params - Parameters for streaming response
   * @param {string} params.prompt - The prompt or query
   * @param {string} params.modelId - Optional specific model to use
   * @param {Function} params.onToken - Callback for each token received
   * @param {Function} params.onComplete - Callback when streaming is complete
   * @param {Function} params.onError - Callback for errors
   * @returns {Object} - Control object with abort method
   */
  streamResponse(params) {
    const { 
      prompt, 
      modelId = this.config.defaultModelId, 
      onToken, 
      onComplete, 
      onError 
    } = params;
    
    if (!prompt) {
      if (onError) {
        onError(new Error('Prompt is required for streaming response'));
      }
      throw new Error('Prompt is required for streaming response');
    }
    
    if (!onToken || typeof onToken !== 'function') {
      throw new Error('onToken callback is required for streaming');
    }
    
    // Get suitable streaming models
    const models = this.getPrioritizedModels(modelId, 'streaming');
    
    if (models.length === 0) {
      const error = new Error('No suitable models available for streaming');
      if (onError) {
        onError(error);
      }
      throw error;
    }
    
    // Variables to track streaming state
    let aborted = false;
    let currentStream = null;
    let currentModelIndex = 0;
    let tokens = [];
    
    // Function to try streaming with the next model
    const tryNextModel = () => {
      if (aborted || currentModelIndex >= models.length) {
        const error = new Error('All models failed to stream response');
        if (onError) {
          onError(error);
        }
        return;
      }
      
      const currentModelId = models[currentModelIndex];
      currentModelIndex++;
      
      if (this.config.debug) {
        console.log(`Attempting to stream with model: ${currentModelId}`);
      }
      
      // Reset tokens for new attempt
      tokens = [];
      
      // Make streaming request
      this._makeStreamingRequest({
        modelId: currentModelId,
        prompt,
        onToken: (token) => {
          if (aborted) return;
          
          // Store token
          tokens.push(token);
          
          // Call callback
          onToken(token);
        },
        onComplete: () => {
          if (aborted) return;
          
          // Update model usage statistics
          this._updateModelUsage(currentModelId);
          
          // Trigger success event
          this._triggerEvent('streamingComplete', { 
            modelId: currentModelId, 
            prompt,
            tokenCount: tokens.length
          });
          
          // Call callback if provided
          if (onComplete) {
            onComplete(tokens.join(''));
          }
        },
        onError: (error) => {
          if (aborted) return;
          
          console.error(`Error streaming with model ${currentModelId}:`, error);
          
          // Update model error count
          this.updateModelStatus(currentModelId, 'error', {
            error: error.message,
            operation: 'streamResponse'
          });
          
          // Try next model
          tryNextModel();
        }
      });
    };
    
    // Start with first model
    tryNextModel();
    
    // Return control object
    return {
      abort: () => {
        aborted = true;
        if (currentStream && typeof currentStream.abort === 'function') {
          currentStream.abort();
        }
      }
    };
  }
  
  /**
   * Get model information
   * @param {string} modelId - ID of the model to get
   * @returns {Object|null} - Model information or null if not found
   */
  getModel(modelId) {
    if (!modelId || !this.models.has(modelId)) {
      return null;
    }
    
    return { ...this.models.get(modelId) };
  }
  
  /**
   * Get all registered models
   * @returns {Array} - Array of all registered models
   */
  getAllModels() {
    return Array.from(this.models.values());
  }
  
  /**
   * Clear the insights cache
   */
  clearCache() {
    this.cache.clear();
    
    if (this.config.debug) {
      console.log('Cache cleared');
    }
    
    this._triggerEvent('cacheCleared');
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
   * Make an API request
   * @param {string} endpoint - API endpoint to call
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - API response
   * @private
   */
  async _makeApiRequest(endpoint, data) {
    const url = `${this.config.apiEndpoint}${endpoint}`;
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to active requests
    this.activeRequests.set(requestId, {
      url,
      data,
      startTime: Date.now()
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Remove from active requests
      this.activeRequests.delete(requestId);
      
      return result;
    } catch (error) {
      // Remove from active requests
      this.activeRequests.delete(requestId);
      
      throw error;
    }
  }
  
  /**
   * Make a streaming API request
   * @param {Object} params - Streaming parameters
   * @private
   */
  _makeStreamingRequest(params) {
    const { modelId, prompt, onToken, onComplete, onError } = params;
    const url = `${this.config.apiEndpoint}/stream`;
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const eventSource = new EventSource(
        `${url}?modelId=${encodeURIComponent(modelId)}&prompt=${encodeURIComponent(prompt)}`
      );
      
      // Add to active requests
      this.activeRequests.set(requestId, {
        url,
        modelId,
        prompt,
        startTime: Date.now(),
        eventSource
      });
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.token) {
            onToken(data.token);
          }
          
          if (data.done) {
            eventSource.close();
            this.activeRequests.delete(requestId);
            onComplete();
          }
        } catch (error) {
          console.error('Error parsing streaming data:', error);
          eventSource.close();
          this.activeRequests.delete(requestId);
          onError(error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        this.activeRequests.delete(requestId);
        onError(new Error('Streaming connection error'));
      };
      
      return {
        abort: () => {
          eventSource.close();
          this.activeRequests.delete(requestId);
        }
      };
    } catch (error) {
      this.activeRequests.delete(requestId);
      onError(error);
      
      return {
        abort: () => {}
      };
    }
  }
  
  /**
   * Generate a cache key for the given parameters
   * @param {string} prompt - The prompt or query
   * @param {string} modelId - The model ID
   * @param {string} insightType - The insight type
   * @returns {string} - Cache key
   * @private
   */
  _generateCacheKey(prompt, modelId, insightType) {
    return `${modelId || 'default'}_${insightType}_${prompt}`;
  }
  
  /**
   * Get an item from the cache
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached item or null if not found or expired
   * @private
   */
  _getFromCache(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const cachedItem = this.cache.get(key);
    const now = Date.now();
    
    // Check if item is expired
    if (now - cachedItem.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }
  
  /**
   * Add an item to the cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @private
   */
  _addToCache(key, data) {
    this.cache.set(key, {
      timestamp: Date.now(),
      data
    });
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
   * Update model usage statistics
   * @param {string} modelId - ID of the model to update
   * @private
   */
  _updateModelUsage(modelId) {
    if (!this.models.has(modelId)) {
      return;
    }
    
    const model = this.models.get(modelId);
    
    model.usageCount = (model.usageCount || 0) + 1;
    model.lastUsed = Date.now();
    
    // Ensure the model is marked as available
    if (model.status !== 'available') {
      this.updateModelStatus(modelId, 'available');
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
        console.error(`Error in AI engine event handler for ${eventName}:`, error);
      }
    }
  }
}

// Export for ESM and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIEngine;
} else if (typeof window !== 'undefined') {
  window.AIEngine = AIEngine;
}