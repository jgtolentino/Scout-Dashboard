/**
 * @file model_router.js
 * @description Routes requests to the appropriate AI model based on capabilities and availability
 * @version v2.4.0
 */

class ModelRouter {
  constructor(config = {}) {
    this.config = {
      aiEngine: null,
      modelRegistry: null,
      preferredModels: {},
      fallbackStrategy: 'priority', // 'priority', 'random', 'round-robin'
      logRouting: true,
      ...config
    };

    this.routeHistory = new Map();
    this.routeStats = {
      totalRequests: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      modelUsage: new Map()
    };

    this._initializeRouter();
  }

  /**
   * Initialize the router
   * @private
   */
  _initializeRouter() {
    if (!this.config.aiEngine) {
      console.warn('ModelRouter: No AI engine provided. Router will not function until setAIEngine is called.');
    }
    
    if (!this.config.modelRegistry) {
      console.warn('ModelRouter: No model registry provided. Router will use direct model IDs only.');
    }
    
    // Initialize model usage stats for all available models
    if (this.config.modelRegistry) {
      const allModels = this.config.modelRegistry.getAllModels();
      allModels.forEach(model => {
        this.routeStats.modelUsage.set(model.id, {
          requests: 0,
          successes: 0,
          failures: 0,
          latency: []
        });
      });
    }
    
    console.log('ModelRouter initialized with fallback strategy:', this.config.fallbackStrategy);
  }

  /**
   * Set the AI engine after initialization
   * @param {Object} aiEngine - The AI engine instance
   */
  setAIEngine(aiEngine) {
    this.config.aiEngine = aiEngine;
    console.log('ModelRouter: AI engine has been set');
  }

  /**
   * Set the model registry after initialization
   * @param {Object} modelRegistry - The model registry instance
   */
  setModelRegistry(modelRegistry) {
    this.config.modelRegistry = modelRegistry;
    
    // Update model usage stats for all available models
    const allModels = this.config.modelRegistry.getAllModels();
    allModels.forEach(model => {
      if (!this.routeStats.modelUsage.has(model.id)) {
        this.routeStats.modelUsage.set(model.id, {
          requests: 0,
          successes: 0,
          failures: 0,
          latency: []
        });
      }
    });
    
    console.log('ModelRouter: Model registry has been set');
  }

  /**
   * Route a request to the appropriate model
   * @param {Object} params - Parameters for the request
   * @param {string} capability - The capability required
   * @param {Function} requestFn - The function to call with the selected model
   * @returns {Promise<any>} - The result of the request
   */
  async routeRequest(params, capability, requestFn) {
    if (!this.config.aiEngine) {
      throw new Error('ModelRouter: Cannot route request - AI engine not set');
    }
    
    this.routeStats.totalRequests++;
    const requestId = `req_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const startTime = performance.now();
    
    try {
      // Get prioritized models for this capability
      const models = this._getPrioritizedModels(capability, params.modelId);
      
      if (models.length === 0) {
        throw new Error(`No models available for capability: ${capability}`);
      }
      
      // Try each model in order until one succeeds
      let lastError = null;
      
      for (const modelId of models) {
        try {
          // Log the routing decision
          if (this.config.logRouting) {
            console.log(`ModelRouter: Routing request ${requestId} to model ${modelId} for capability ${capability}`);
          }
          
          // Update usage stats
          this._updateModelUsageStats(modelId, 'requests');
          
          // Execute the request with the selected model
          const modelStartTime = performance.now();
          const result = await requestFn(modelId);
          const modelEndTime = performance.now();
          
          // Update success stats
          this._updateModelUsageStats(modelId, 'successes');
          this._recordLatency(modelId, modelEndTime - modelStartTime);
          
          // Record successful route
          this.routeHistory.set(requestId, {
            capability,
            modelId,
            params,
            success: true,
            timestamp: new Date().toISOString(),
            duration: modelEndTime - modelStartTime
          });
          
          this.routeStats.successfulRoutes++;
          return result;
        } catch (error) {
          // Update failure stats
          this._updateModelUsageStats(modelId, 'failures');
          
          // Record the error and try the next model
          lastError = error;
          console.warn(`ModelRouter: Model ${modelId} failed for capability ${capability}. Error: ${error.message}`);
          
          // Continue to the next model
          continue;
        }
      }
      
      // If we get here, all models failed
      this.routeStats.failedRoutes++;
      
      // Record failed route
      this.routeHistory.set(requestId, {
        capability,
        params,
        success: false,
        timestamp: new Date().toISOString(),
        error: lastError.message
      });
      
      throw lastError || new Error(`All models failed for capability: ${capability}`);
    } finally {
      const endTime = performance.now();
      if (this.config.logRouting) {
        console.log(`ModelRouter: Request ${requestId} took ${endTime - startTime}ms to complete`);
      }
    }
  }

  /**
   * Get prioritized models for a capability
   * @param {string} capability - The capability required
   * @param {string} preferredModelId - Optional preferred model ID
   * @returns {Array<string>} - Array of model IDs in priority order
   * @private
   */
  _getPrioritizedModels(capability, preferredModelId = null) {
    let availableModels = [];
    
    if (this.config.modelRegistry) {
      // Get models from registry based on capability
      availableModels = this.config.modelRegistry.getModelsForCapability(capability);
    } else if (this.config.aiEngine) {
      // Fall back to AI engine's available models
      availableModels = this.config.aiEngine.getAvailableModels();
    }
    
    // Filter out unavailable models
    availableModels = availableModels.filter(model => {
      return this.config.aiEngine.isModelAvailable(model.id || model);
    });
    
    // Convert to array of model IDs if needed
    const modelIds = availableModels.map(model => model.id || model);
    
    // Apply prioritization strategy
    let prioritizedModels = [...modelIds];
    
    // If there's a preferred model and it's in the list, prioritize it
    if (preferredModelId && modelIds.includes(preferredModelId)) {
      prioritizedModels = [
        preferredModelId,
        ...modelIds.filter(id => id !== preferredModelId)
      ];
    }
    
    // Apply preferred models from config
    if (this.config.preferredModels[capability] && 
        modelIds.includes(this.config.preferredModels[capability])) {
      const preferred = this.config.preferredModels[capability];
      prioritizedModels = [
        preferred,
        ...prioritizedModels.filter(id => id !== preferred)
      ];
    }
    
    // Sort remaining models by strategy
    switch (this.config.fallbackStrategy) {
      case 'priority':
        // Models are already in priority order from the registry
        break;
        
      case 'random':
        // Shuffle models (except the first one if it's preferred)
        const remaining = prioritizedModels.slice(preferredModelId ? 1 : 0);
        this._shuffleArray(remaining);
        prioritizedModels = preferredModelId ? 
          [preferredModelId, ...remaining] : 
          remaining;
        break;
        
      case 'round-robin':
        // Sort by least recently used
        const usage = this.routeStats.modelUsage;
        const sortedByUsage = prioritizedModels.slice(preferredModelId ? 1 : 0)
          .sort((a, b) => {
            const aUsage = usage.get(a)?.requests || 0;
            const bUsage = usage.get(b)?.requests || 0;
            return aUsage - bUsage;
          });
        
        prioritizedModels = preferredModelId ? 
          [preferredModelId, ...sortedByUsage] : 
          sortedByUsage;
        break;
    }
    
    return prioritizedModels;
  }

  /**
   * Shuffle array in place
   * @param {Array} array - The array to shuffle
   * @private
   */
  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Update usage stats for a model
   * @param {string} modelId - The model ID
   * @param {string} metric - The metric to update ('requests', 'successes', 'failures')
   * @private
   */
  _updateModelUsageStats(modelId, metric) {
    if (!this.routeStats.modelUsage.has(modelId)) {
      this.routeStats.modelUsage.set(modelId, {
        requests: 0,
        successes: 0,
        failures: 0,
        latency: []
      });
    }
    
    const stats = this.routeStats.modelUsage.get(modelId);
    stats[metric]++;
  }

  /**
   * Record latency for a model
   * @param {string} modelId - The model ID
   * @param {number} latencyMs - The latency in milliseconds
   * @private
   */
  _recordLatency(modelId, latencyMs) {
    const stats = this.routeStats.modelUsage.get(modelId);
    stats.latency.push(latencyMs);
    
    // Keep only the last 100 latency measurements
    if (stats.latency.length > 100) {
      stats.latency.shift();
    }
  }

  /**
   * Get routing statistics
   * @returns {Object} - Routing statistics
   */
  getRoutingStats() {
    const modelStats = {};
    this.routeStats.modelUsage.forEach((stats, modelId) => {
      const avgLatency = stats.latency.length > 0 ? 
        stats.latency.reduce((sum, lat) => sum + lat, 0) / stats.latency.length : 
        0;
      
      modelStats[modelId] = {
        requests: stats.requests,
        successes: stats.successes,
        failures: stats.failures,
        successRate: stats.requests > 0 ? (stats.successes / stats.requests) * 100 : 0,
        avgLatencyMs: Math.round(avgLatency * 100) / 100
      };
    });
    
    return {
      totalRequests: this.routeStats.totalRequests,
      successfulRoutes: this.routeStats.successfulRoutes,
      failedRoutes: this.routeStats.failedRoutes,
      successRate: this.routeStats.totalRequests > 0 ? 
        (this.routeStats.successfulRoutes / this.routeStats.totalRequests) * 100 : 0,
      modelStats
    };
  }

  /**
   * Get routing history
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} - Array of routing history entries
   */
  getRoutingHistory(limit = 50) {
    const history = [];
    const keys = Array.from(this.routeHistory.keys()).slice(-limit);
    
    for (const key of keys) {
      history.push({
        requestId: key,
        ...this.routeHistory.get(key)
      });
    }
    
    return history;
  }

  /**
   * Clear routing history
   */
  clearRoutingHistory() {
    this.routeHistory.clear();
    console.log('ModelRouter: Routing history cleared');
  }

  /**
   * Reset routing statistics
   */
  resetRoutingStats() {
    this.routeStats = {
      totalRequests: 0,
      successfulRoutes: 0, 
      failedRoutes: 0,
      modelUsage: new Map()
    };
    
    // Re-initialize model usage stats
    if (this.config.modelRegistry) {
      const allModels = this.config.modelRegistry.getAllModels();
      allModels.forEach(model => {
        this.routeStats.modelUsage.set(model.id, {
          requests: 0,
          successes: 0,
          failures: 0,
          latency: []
        });
      });
    }
    
    console.log('ModelRouter: Routing statistics reset');
  }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModelRouter;
} else {
  window.ModelRouter = ModelRouter;
}
