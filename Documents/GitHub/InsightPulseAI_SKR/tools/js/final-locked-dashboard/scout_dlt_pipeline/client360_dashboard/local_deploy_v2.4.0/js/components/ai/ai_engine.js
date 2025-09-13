/**
 * AI Engine Component for Client360 Dashboard v2.4.0
 * Core component that manages the Multi-Model AI framework
 * Provides support for multiple AI models with fallback capability
 */

class AIEngine {
  constructor(config = {}) {
    this.models = [];
    this.providers = [];
    this.config = {
      defaultModel: 'azure-openai',
      enableStreaming: true,
      enableCaching: true,
      cacheLifetime: 3600, // 1 hour in seconds
      ...config
    };
    
    this.cache = new Map();
    this.modelRegistry = null;
    this.embeddingsService = null;
    
    this.init();
  }
  
  /**
   * Initialize the AI engine
   */
  async init() {
    console.log('🧠 Initializing AI Engine v2.4.0');
    
    // Initialize model registry
    await this.initModelRegistry();
    
    // Initialize embeddings service
    await this.initEmbeddingsService();
    
    // Register default models
    await this.registerDefaultModels();
    
    // Set up cache cleanup interval
    if (this.config.enableCaching) {
      setInterval(() => this.cleanupCache(), 300000); // Run every 5 minutes
    }
    
    console.log('✅ AI Engine initialized successfully');
  }
  
  /**
   * Initialize the model registry
   */
  async initModelRegistry() {
    try {
      // Create model registry
      this.modelRegistry = new window.ModelRegistry({
        persistModels: true,
        localStorageKey: 'client360_ai_models'
      });
      
      await this.modelRegistry.init();
      console.log('✅ Model Registry initialized');
    } catch (error) {
      console.error('Failed to initialize Model Registry:', error);
      // Create fallback simple registry
      this.modelRegistry = {
        registerModel: (model) => this.models.push(model),
        getModel: (modelId) => this.models.find(m => m.id === modelId),
        getAllModels: () => this.models,
        modelExists: (modelId) => this.models.some(m => m.id === modelId)
      };
    }
  }
  
  /**
   * Initialize the embeddings service
   */
  async initEmbeddingsService() {
    try {
      // Create embeddings service
      this.embeddingsService = new window.EmbeddingsService({
        model: 'text-embedding-3-small',
        dimensions: 1536,
        provider: this.config.defaultModel
      });
      
      await this.embeddingsService.init();
      console.log('✅ Embeddings Service initialized');
    } catch (error) {
      console.error('Failed to initialize Embeddings Service:', error);
      // Create fallback embeddings service with basic functionality
      this.embeddingsService = {
        embed: async (text) => new Array(1536).fill(0), // Return zero vector
        similarity: (vec1, vec2) => 0.5, // Return average similarity
        isInitialized: false
      };
    }
  }
  
  /**
   * Register default models
   */
  async registerDefaultModels() {
    // Register Azure OpenAI model
    await this.registerModel({
      id: 'azure-openai',
      name: 'Azure OpenAI',
      version: 'gpt-4o',
      provider: 'azure',
      capabilities: ['completion', 'chat', 'embedding'],
      maxTokens: 8192,
      temperature: 0.7,
      priority: 1 // Primary model
    });
    
    // Register local model fallback
    await this.registerModel({
      id: 'parquet-fallback',
      name: 'Parquet Data Store',
      version: 'local',
      provider: 'local',
      capabilities: ['completion'],
      priority: 2 // First fallback
    });
    
    // Register synthetic model fallback (generates mock responses)
    await this.registerModel({
      id: 'synthetic-insights',
      name: 'Synthetic Insights Generator',
      version: 'local',
      provider: 'local',
      capabilities: ['completion', 'chat'],
      priority: 3 // Last resort fallback
    });
    
    console.log(`✅ Registered ${this.models.length} default models`);
  }
  
  /**
   * Register a new AI model
   * @param {Object} model - Model configuration
   * @returns {Promise<boolean>} Success status
   */
  async registerModel(model) {
    try {
      // Validate model config
      if (!model.id || !model.provider) {
        throw new Error('Invalid model configuration: id and provider are required');
      }
      
      // Register with registry if available
      if (this.modelRegistry) {
        await this.modelRegistry.registerModel(model);
      }
      
      // Add to local array as well
      this.models.push(model);
      
      // Initialize provider if needed
      if (!this.providers.some(p => p.id === model.provider)) {
        await this.initProvider(model.provider);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to register model ${model.id}:`, error);
      return false;
    }
  }
  
  /**
   * Initialize a provider
   * @param {string} providerId - Provider ID
   * @returns {Promise<void>}
   */
  async initProvider(providerId) {
    try {
      let provider;
      
      switch (providerId) {
        case 'azure':
          // Initialize Azure provider
          provider = new window.AzureOpenAIClient({
            apiKey: window.config?.azureOpenAI?.apiKey,
            endpoint: window.config?.azureOpenAI?.endpoint,
            apiVersion: window.config?.azureOpenAI?.apiVersion || '2023-05-15'
          });
          break;
          
        case 'local':
          // Initialize local provider (parquet/synthetic)
          provider = new window.AIInsightsProvider({
            enableParquet: true,
            enableSynthetic: true
          });
          break;
          
        default:
          throw new Error(`Unknown provider: ${providerId}`);
      }
      
      // Initialize the provider
      await provider.init();
      
      // Add to providers list
      this.providers.push({
        id: providerId,
        instance: provider
      });
      
      console.log(`✅ Initialized provider: ${providerId}`);
    } catch (error) {
      console.error(`Failed to initialize provider ${providerId}:`, error);
    }
  }
  
  /**
   * Get a model by ID
   * @param {string} modelId - Model ID
   * @returns {Object|null} Model object
   */
  getModel(modelId) {
    // Try registry first
    if (this.modelRegistry && this.modelRegistry.modelExists(modelId)) {
      return this.modelRegistry.getModel(modelId);
    }
    
    // Fallback to local array
    return this.models.find(m => m.id === modelId) || null;
  }
  
  /**
   * Get provider for a model
   * @param {string} modelId - Model ID
   * @returns {Object|null} Provider instance
   */
  getProviderForModel(modelId) {
    const model = this.getModel(modelId);
    if (!model) return null;
    
    const provider = this.providers.find(p => p.id === model.provider);
    return provider ? provider.instance : null;
  }
  
  /**
   * Generate insights using the appropriate model
   * @param {Object} params - Request parameters
   * @param {string} params.prompt - The prompt to process
   * @param {string} [params.modelId] - Specific model ID to use
   * @param {string} [params.insightType] - Type of insight to generate
   * @param {boolean} [params.stream] - Whether to stream the response
   * @param {Function} [params.onProgress] - Progress callback for streaming
   * @returns {Promise<Object|null>} Generated insights
   */
  async generateInsights(params) {
    const {
      prompt,
      modelId = this.config.defaultModel,
      insightType = 'general',
      stream = this.config.enableStreaming,
      onProgress = null
    } = params;
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(prompt, modelId, insightType);
    
    // Check cache first if enabled
    if (this.config.enableCaching) {
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        console.log('📄 Returning cached insights');
        return cachedResult;
      }
    }
    
    // Try all models in order of priority until successful
    const prioritizedModels = this.getPrioritizedModels(modelId);
    
    for (const model of prioritizedModels) {
      try {
        console.log(`🔄 Attempting to generate insights with model: ${model.id}`);
        
        // Get provider for this model
        const provider = this.getProviderForModel(model.id);
        if (!provider) {
          console.warn(`No provider found for model ${model.id}`);
          continue;
        }
        
        // Generate insights based on model type
        let insights;
        
        if (model.provider === 'azure') {
          // Generate using Azure OpenAI
          insights = await provider.generateInsights({
            prompt,
            modelVersion: model.version,
            maxTokens: model.maxTokens,
            temperature: model.temperature,
            stream,
            onProgress
          });
        } else if (model.id === 'parquet-fallback') {
          // Load from parquet file
          insights = await provider.loadParquetInsights();
        } else if (model.id === 'synthetic-insights') {
          // Generate synthetic insights
          insights = await provider.generateMockInsights();
        }
        
        // Store successful result in cache
        if (insights && this.config.enableCaching) {
          this.addToCache(cacheKey, insights);
        }
        
        return insights;
      } catch (error) {
        console.error(`Error generating insights with model ${model.id}:`, error);
        // Continue to next model
      }
    }
    
    // All models failed
    console.error('All AI models failed to generate insights');
    return null;
  }
  
  /**
   * Generate embeddings for text
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<Array<number>|null>} Embedding vector
   */
  async generateEmbeddings(text) {
    try {
      if (!this.embeddingsService || !this.embeddingsService.isInitialized) {
        throw new Error('Embeddings service not initialized');
      }
      
      return await this.embeddingsService.embed(text);
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      return null;
    }
  }
  
  /**
   * Get models in order of priority
   * @param {string} preferredModelId - Preferred model ID
   * @returns {Array<Object>} Prioritized list of models
   */
  getPrioritizedModels(preferredModelId) {
    // Create a copy of the models array
    const modelsCopy = [...this.models];
    
    // Sort by priority (lower number = higher priority)
    modelsCopy.sort((a, b) => {
      // Preferred model always comes first
      if (a.id === preferredModelId) return -1;
      if (b.id === preferredModelId) return 1;
      
      // Otherwise sort by priority
      return (a.priority || 999) - (b.priority || 999);
    });
    
    return modelsCopy;
  }
  
  /**
   * Generate a cache key
   * @param {string} prompt - The prompt
   * @param {string} modelId - Model ID
   * @param {string} insightType - Insight type
   * @returns {string} Cache key
   */
  generateCacheKey(prompt, modelId, insightType) {
    // Create a hash of the input parameters
    const input = `${prompt}|${modelId}|${insightType}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `ai_${hash}`;
  }
  
  /**
   * Add result to cache
   * @param {string} key - Cache key
   * @param {Object} value - Value to cache
   */
  addToCache(key, value) {
    if (!this.config.enableCaching) return;
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Object|null} Cached value or null if not found/expired
   */
  getFromCache(key) {
    if (!this.config.enableCaching) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    const now = Date.now();
    const age = now - cached.timestamp;
    if (age > this.config.cacheLifetime * 1000) {
      // Expired
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }
  
  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    if (!this.config.enableCaching) return;
    
    const now = Date.now();
    const expiry = this.config.cacheLifetime * 1000;
    
    // Check each cache entry
    this.cache.forEach((value, key) => {
      const age = now - value.timestamp;
      if (age > expiry) {
        this.cache.delete(key);
      }
    });
  }
}

// Export to window
window.AIEngine = AIEngine;