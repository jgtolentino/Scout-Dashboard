/**
 * Model Registry Component for Client360 Dashboard v2.4.0
 * Manages AI model registrations, configurations, and versioning
 */

class ModelRegistry {
  constructor(config = {}) {
    this.models = [];
    this.config = {
      persistModels: true,
      localStorageKey: 'client360_model_registry',
      ...config
    };
    
    this.isInitialized = false;
  }
  
  /**
   * Initialize the model registry
   * @returns {Promise<void>}
   */
  async init() {
    console.log('📋 Initializing Model Registry');
    
    // Load persisted models if enabled
    if (this.config.persistModels) {
      await this.loadModels();
    }
    
    this.isInitialized = true;
    console.log(`✅ Model Registry initialized with ${this.models.length} models`);
  }
  
  /**
   * Load models from local storage
   * @returns {Promise<void>}
   */
  async loadModels() {
    try {
      const storedModels = localStorage.getItem(this.config.localStorageKey);
      if (storedModels) {
        this.models = JSON.parse(storedModels);
        console.log(`Loaded ${this.models.length} models from storage`);
      }
    } catch (error) {
      console.error('Failed to load models from storage:', error);
      // Start with empty model list
      this.models = [];
    }
  }
  
  /**
   * Save models to local storage
   * @returns {Promise<void>}
   */
  async saveModels() {
    if (!this.config.persistModels) return;
    
    try {
      localStorage.setItem(this.config.localStorageKey, JSON.stringify(this.models));
    } catch (error) {
      console.error('Failed to save models to storage:', error);
    }
  }
  
  /**
   * Register a new model
   * @param {Object} model - Model configuration
   * @returns {Promise<boolean>} Success status
   */
  async registerModel(model) {
    // Validate model data
    if (!this.validateModel(model)) {
      console.error('Invalid model data:', model);
      return false;
    }
    
    // Check if model already exists
    if (this.modelExists(model.id)) {
      // Update existing model
      const index = this.models.findIndex(m => m.id === model.id);
      this.models[index] = model;
      console.log(`Updated existing model: ${model.id}`);
    } else {
      // Add new model
      this.models.push(model);
      console.log(`Registered new model: ${model.id}`);
    }
    
    // Save to storage
    await this.saveModels();
    
    return true;
  }
  
  /**
   * Update an existing model
   * @param {string} modelId - Model ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<boolean>} Success status
   */
  async updateModel(modelId, updates) {
    // Check if model exists
    if (!this.modelExists(modelId)) {
      console.error(`Model not found: ${modelId}`);
      return false;
    }
    
    // Get existing model
    const index = this.models.findIndex(m => m.id === modelId);
    
    // Apply updates
    this.models[index] = {
      ...this.models[index],
      ...updates
    };
    
    // Save to storage
    await this.saveModels();
    
    console.log(`Updated model: ${modelId}`);
    return true;
  }
  
  /**
   * Remove a model
   * @param {string} modelId - Model ID to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeModel(modelId) {
    // Check if model exists
    if (!this.modelExists(modelId)) {
      console.error(`Model not found: ${modelId}`);
      return false;
    }
    
    // Remove model
    this.models = this.models.filter(m => m.id !== modelId);
    
    // Save to storage
    await this.saveModels();
    
    console.log(`Removed model: ${modelId}`);
    return true;
  }
  
  /**
   * Get a model by ID
   * @param {string} modelId - Model ID
   * @returns {Object|null} Model configuration or null if not found
   */
  getModel(modelId) {
    return this.models.find(m => m.id === modelId) || null;
  }
  
  /**
   * Get all registered models
   * @returns {Array<Object>} All models
   */
  getAllModels() {
    return [...this.models];
  }
  
  /**
   * Get models filtered by provider
   * @param {string} provider - Provider ID
   * @returns {Array<Object>} Filtered models
   */
  getModelsByProvider(provider) {
    return this.models.filter(m => m.provider === provider);
  }
  
  /**
   * Get models filtered by capability
   * @param {string} capability - Required capability
   * @returns {Array<Object>} Filtered models
   */
  getModelsByCapability(capability) {
    return this.models.filter(m => 
      m.capabilities && 
      m.capabilities.includes(capability)
    );
  }
  
  /**
   * Check if a model exists
   * @param {string} modelId - Model ID
   * @returns {boolean} True if model exists
   */
  modelExists(modelId) {
    return this.models.some(m => m.id === modelId);
  }
  
  /**
   * Validate model configuration
   * @param {Object} model - Model to validate
   * @returns {boolean} Is valid
   */
  validateModel(model) {
    // Required fields
    if (!model.id || !model.provider) {
      return false;
    }
    
    // Validate capabilities if present
    if (model.capabilities && !Array.isArray(model.capabilities)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get model schema for validation
   * @returns {Object} JSON schema for model validation
   */
  getModelSchema() {
    return {
      type: 'object',
      required: ['id', 'provider'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        version: { type: 'string' },
        provider: { type: 'string' },
        capabilities: { 
          type: 'array', 
          items: { type: 'string' } 
        },
        maxTokens: { type: 'number' },
        temperature: { type: 'number' },
        priority: { type: 'number' }
      }
    };
  }
}

// Export to window
window.ModelRegistry = ModelRegistry;