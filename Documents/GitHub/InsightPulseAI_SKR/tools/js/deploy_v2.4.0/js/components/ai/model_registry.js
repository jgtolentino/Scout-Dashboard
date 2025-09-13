/**
 * ModelRegistry - Component for registering and managing AI models
 * Part of the Multi-Model AI Framework for Client360 Dashboard v2.4.0
 */
class ModelRegistry {
  /**
   * Creates a new ModelRegistry instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Default configuration
    this.config = {
      aiEngine: null,        // Reference to AIEngine instance
      autoDiscover: true,    // Auto-discover models during initialization
      configEndpoint: '/api/ai/models/config',
      apiEndpoints: {
        register: '/api/ai/models/register',
        list: '/api/ai/models/list',
        update: '/api/ai/models/update',
        delete: '/api/ai/models/delete'
      },
      debug: false,
      ...config
    };
    
    // Core properties
    this.modelsByProvider = new Map();
    this.modelsByCapability = new Map();
    this.modelFilters = new Map();
    this.eventHandlers = new Map();
    
    // Reference to AI engine
    this.aiEngine = this.config.aiEngine;
    
    // Initialize
    if (this.aiEngine) {
      this._initializeRegistry();
    } else {
      console.warn('ModelRegistry initialized without AIEngine reference. Some functionality may be limited.');
    }
  }
  
  /**
   * Initialize the model registry
   * @private
   */
  async _initializeRegistry() {
    if (this.config.debug) {
      console.log('Initializing ModelRegistry...');
    }
    
    // Set up event handlers
    this._setupEventHandlers();
    
    // Auto-discover models if enabled
    if (this.config.autoDiscover) {
      try {
        await this.discoverModels();
      } catch (error) {
        console.error('Error during model auto-discovery:', error);
      }
    }
    
    // Trigger initialized event
    this._triggerEvent('initialized');
  }
  
  /**
   * Set up event handlers for AI engine events
   * @private
   */
  _setupEventHandlers() {
    if (!this.aiEngine) return;
    
    // Listen for model registration events
    this.aiEngine.on('modelRegistered', (data) => {
      this._addModelToIndices(data.model);
    });
    
    // Listen for model unregistration events
    this.aiEngine.on('modelUnregistered', (data) => {
      this._removeModelFromIndices(data.modelId);
    });
    
    // Listen for model status changes
    this.aiEngine.on('modelStatusChanged', (data) => {
      this._updateModelIndices(data.modelId, { status: data.newStatus });
    });
  }
  
  /**
   * Discover available models from the server
   * @returns {Promise<Array>} - Discovered models
   */
  async discoverModels() {
    try {
      if (this.config.debug) {
        console.log('Discovering available models...');
      }
      
      // Fetch model configurations from the server
      const response = await fetch(this.config.configEndpoint);
      
      if (!response.ok) {
        throw new Error(`Model discovery failed: ${response.status} ${response.statusText}`);
      }
      
      const models = await response.json();
      
      if (!Array.isArray(models)) {
        throw new Error('Invalid response format from model discovery endpoint');
      }
      
      if (this.config.debug) {
        console.log(`Discovered ${models.length} models:`, models);
      }
      
      // Register each discovered model
      for (const model of models) {
        this.registerModel(model);
      }
      
      // Trigger models discovered event
      this._triggerEvent('modelsDiscovered', { models });
      
      return models;
    } catch (error) {
      console.error('Error discovering models:', error);
      throw error;
    }
  }
  
  /**
   * Register a model with the registry and the AI engine
   * @param {Object} model - Model configuration
   * @returns {boolean} - Success status
   */
  registerModel(model) {
    if (!model || !model.id || !model.name) {
      console.error('Invalid model configuration. Model must have id and name properties.');
      return false;
    }
    
    // Check for required properties
    const requiredProps = ['provider', 'capabilities', 'priority'];
    for (const prop of requiredProps) {
      if (!model[prop]) {
        console.warn(`Model ${model.id} is missing recommended property: ${prop}`);
      }
    }
    
    // Register with AI engine if available
    if (this.aiEngine) {
      const success = this.aiEngine.registerModel(model);
      if (!success) {
        return false;
      }
    } else {
      console.warn('No AIEngine available to register model. Only updating registry indices.');
      // Add to indices even without AI engine
      this._addModelToIndices(model);
    }
    
    if (this.config.debug) {
      console.log(`Model registered: ${model.id} (${model.name})`);
    }
    
    return true;
  }
  
  /**
   * Unregister a model from the registry and the AI engine
   * @param {string} modelId - ID of the model to unregister
   * @returns {boolean} - Success status
   */
  unregisterModel(modelId) {
    // Unregister from AI engine if available
    if (this.aiEngine) {
      const success = this.aiEngine.unregisterModel(modelId);
      if (!success) {
        return false;
      }
    } else {
      // Remove from indices even without AI engine
      this._removeModelFromIndices(modelId);
    }
    
    if (this.config.debug) {
      console.log(`Model unregistered: ${modelId}`);
    }
    
    return true;
  }
  
  /**
   * Get models by provider
   * @param {string} provider - Provider name
   * @returns {Array} - Array of models from the specified provider
   */
  getModelsByProvider(provider) {
    if (!provider) {
      return [];
    }
    
    return this.modelsByProvider.has(provider) 
      ? [...this.modelsByProvider.get(provider)]
      : [];
  }
  
  /**
   * Get models by capability
   * @param {string} capability - Capability name
   * @returns {Array} - Array of models with the specified capability
   */
  getModelsByCapability(capability) {
    if (!capability) {
      return [];
    }
    
    return this.modelsByCapability.has(capability)
      ? [...this.modelsByCapability.get(capability)]
      : [];
  }
  
  /**
   * Get all available models
   * @param {Object} filters - Optional filters to apply
   * @returns {Array} - Array of models
   */
  getAllModels(filters = {}) {
    if (!this.aiEngine) {
      console.warn('No AIEngine available. Model information may be limited.');
      // Return from indices
      const allModels = new Set();
      
      // Gather from provider index
      for (const models of this.modelsByProvider.values()) {
        for (const modelId of models) {
          allModels.add(modelId);
        }
      }
      
      return Array.from(allModels);
    }
    
    // Get from AI engine
    const models = this.aiEngine.getAllModels();
    
    // Apply filters if provided
    if (Object.keys(filters).length > 0) {
      return this._applyFilters(models, filters);
    }
    
    return models;
  }
  
  /**
   * Add a model filter
   * @param {string} name - Filter name
   * @param {Function} filterFn - Filter function that takes a model and returns boolean
   */
  addModelFilter(name, filterFn) {
    if (!name || typeof filterFn !== 'function') {
      console.error('Invalid filter. Name and function are required.');
      return;
    }
    
    this.modelFilters.set(name, filterFn);
    
    if (this.config.debug) {
      console.log(`Model filter added: ${name}`);
    }
  }
  
  /**
   * Remove a model filter
   * @param {string} name - Filter name
   */
  removeModelFilter(name) {
    if (!name || !this.modelFilters.has(name)) {
      return;
    }
    
    this.modelFilters.delete(name);
    
    if (this.config.debug) {
      console.log(`Model filter removed: ${name}`);
    }
  }
  
  /**
   * Get the best model for a specific capability
   * @param {string} capability - Required capability
   * @param {Object} preferences - Optional preferences to consider
   * @returns {Object|null} - Best model or null if none found
   */
  getBestModelForCapability(capability, preferences = {}) {
    if (!capability) {
      return null;
    }
    
    // Get models with this capability
    let models;
    
    if (this.aiEngine) {
      models = this.aiEngine.getAvailableModels(capability);
    } else {
      // Fallback to index if no AI engine
      if (!this.modelsByCapability.has(capability)) {
        return null;
      }
      
      models = Array.from(this.modelsByCapability.get(capability))
        .map(modelId => ({ id: modelId }));
    }
    
    if (!models.length) {
      return null;
    }
    
    // If preference for specific provider is given, filter by that
    if (preferences.provider) {
      const providerModels = models.filter(model => model.provider === preferences.provider);
      if (providerModels.length > 0) {
        models = providerModels;
      }
    }
    
    // Sort by priority (lower number = higher priority)
    models.sort((a, b) => {
      // If priority is specified, use it
      if (a.priority !== undefined && b.priority !== undefined) {
        return a.priority - b.priority;
      }
      
      // Fall back to order in the array
      return 0;
    });
    
    return models[0];
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
   * Add a model to the registry indices
   * @param {Object} model - The model to add
   * @private
   */
  _addModelToIndices(model) {
    // Add to provider index
    if (model.provider) {
      if (!this.modelsByProvider.has(model.provider)) {
        this.modelsByProvider.set(model.provider, new Set());
      }
      
      this.modelsByProvider.get(model.provider).add(model.id);
    }
    
    // Add to capabilities index
    if (model.capabilities && Array.isArray(model.capabilities)) {
      for (const capability of model.capabilities) {
        if (!this.modelsByCapability.has(capability)) {
          this.modelsByCapability.set(capability, new Set());
        }
        
        this.modelsByCapability.get(capability).add(model.id);
      }
    }
  }
  
  /**
   * Remove a model from the registry indices
   * @param {string} modelId - ID of the model to remove
   * @private
   */
  _removeModelFromIndices(modelId) {
    // Remove from provider index
    for (const [provider, models] of this.modelsByProvider.entries()) {
      if (models.has(modelId)) {
        models.delete(modelId);
        
        // Remove provider entry if empty
        if (models.size === 0) {
          this.modelsByProvider.delete(provider);
        }
      }
    }
    
    // Remove from capabilities index
    for (const [capability, models] of this.modelsByCapability.entries()) {
      if (models.has(modelId)) {
        models.delete(modelId);
        
        // Remove capability entry if empty
        if (models.size === 0) {
          this.modelsByCapability.delete(capability);
        }
      }
    }
  }
  
  /**
   * Update model indices with new information
   * @param {string} modelId - ID of the model to update
   * @param {Object} updates - Updates to apply
   * @private
   */
  _updateModelIndices(modelId, updates) {
    // For most updates, we don't need to modify the indices
    // This method exists for future extensions where we might
    // need to update indices based on model changes
    
    // If capabilities change, we would need to update the capability index
    if (updates.capabilities && Array.isArray(updates.capabilities)) {
      // First remove from all capability sets
      this._removeModelFromIndices(modelId);
      
      // Then re-add with new capabilities
      // This assumes we have the full model object, which we may not
      // For now, we'll rely on the AI engine to provide this information
    }
  }
  
  /**
   * Apply filters to a list of models
   * @param {Array} models - Models to filter
   * @param {Object} filters - Filters to apply
   * @returns {Array} - Filtered models
   * @private
   */
  _applyFilters(models, filters) {
    let filteredModels = [...models];
    
    // Apply built-in filters
    
    // Filter by provider
    if (filters.provider) {
      filteredModels = filteredModels.filter(model => model.provider === filters.provider);
    }
    
    // Filter by capability
    if (filters.capability) {
      filteredModels = filteredModels.filter(model => 
        model.capabilities && model.capabilities.includes(filters.capability)
      );
    }
    
    // Filter by status
    if (filters.status) {
      filteredModels = filteredModels.filter(model => model.status === filters.status);
    }
    
    // Apply custom filters
    if (filters.customFilters && Array.isArray(filters.customFilters)) {
      for (const filterName of filters.customFilters) {
        if (this.modelFilters.has(filterName)) {
          const filterFn = this.modelFilters.get(filterName);
          filteredModels = filteredModels.filter(filterFn);
        }
      }
    }
    
    return filteredModels;
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
        console.error(`Error in model registry event handler for ${eventName}:`, error);
      }
    }
  }
}

// Export for ESM and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModelRegistry;
} else if (typeof window !== 'undefined') {
  window.ModelRegistry = ModelRegistry;
}