#!/bin/bash
# patch_v2.4.0_deployment.sh
# Script to fix structure issues in the Client360 Dashboard v2.4.0 deployment

set -e  # Exit on any error

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define deployment directory
DEPLOY_DIR="deploy_v2.4.0"

echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}= Client360 Dashboard v2.4.0 Deployment Patch         =${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "Started at: $(date)"
echo -e "Deployment directory: $DEPLOY_DIR"
echo ""

# 1. Ensure the engine directory exists
echo -e "${YELLOW}Creating AI engine directory structure...${NC}"
mkdir -p "$DEPLOY_DIR/js/components/ai/engine"

# 2. Copy AI files to the correct location
echo -e "${YELLOW}Copying AI files to the engine directory...${NC}"
cp "$DEPLOY_DIR/js/components/ai/ai_engine.js" "$DEPLOY_DIR/js/components/ai/engine/ai_engine.js"
cp "$DEPLOY_DIR/js/components/ai/model_registry.js" "$DEPLOY_DIR/js/components/ai/engine/model_registry.js"
cp "$DEPLOY_DIR/js/components/ai/embeddings_service.js" "$DEPLOY_DIR/js/components/ai/engine/embeddings_service.js"
cp "$DEPLOY_DIR/js/components/ai/streaming_client.js" "$DEPLOY_DIR/js/components/ai/engine/streaming_client.js"

# 3. Create model_router.js file (which doesn't exist yet)
echo -e "${YELLOW}Creating model_router.js file...${NC}"
cat > "$DEPLOY_DIR/js/components/ai/engine/model_router.js" << 'EOF'
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
EOF

# 4. Ensure all component directories exist
echo -e "${YELLOW}Ensuring all component directories exist...${NC}"
mkdir -p "$DEPLOY_DIR/data/simulated/ai/insights"
mkdir -p "$DEPLOY_DIR/data/live/ai/insights"

# 5. Check if the placeholder file for model_router.js was actually created
if [ -f "$DEPLOY_DIR/js/components/ai/engine/model_router.js" ]; then
  echo -e "${GREEN}✓ model_router.js created successfully${NC}"
else
  echo -e "${RED}✗ Failed to create model_router.js${NC}"
  exit 1
fi

# 6. Add some placeholder data files
echo -e "${YELLOW}Creating placeholder data files...${NC}"
# Create a placeholder AI insights file
cat > "$DEPLOY_DIR/data/simulated/ai/insights/sample_insights.json" << 'EOF'
{
  "metadata": {
    "version": "v2.4.0",
    "generatedAt": "2025-05-22T10:30:00Z",
    "dataSource": "simulated"
  },
  "insights": [
    {
      "id": "ins_001",
      "type": "trend",
      "category": "sales",
      "title": "Rising Product Category",
      "description": "Personal care products have shown a 15% increase in sales over the last quarter, significantly outperforming other categories.",
      "confidence": 0.92,
      "relevance": "high",
      "actionable": true,
      "relatedEntities": ["personal_care", "Q2_2025"]
    },
    {
      "id": "ins_002",
      "type": "anomaly",
      "category": "inventory",
      "title": "Unusual Stock Depletion",
      "description": "Store #1052 is experiencing unusually rapid depletion of dairy products compared to historical patterns and nearby stores.",
      "confidence": 0.87,
      "relevance": "medium",
      "actionable": true,
      "relatedEntities": ["store_1052", "dairy", "inventory_alert"]
    },
    {
      "id": "ins_003",
      "type": "correlation",
      "category": "marketing",
      "title": "Promotion Effectiveness",
      "description": "Digital coupon campaigns show 1.8x higher conversion rates than print media for the 18-34 demographic across all regions.",
      "confidence": 0.95,
      "relevance": "high",
      "actionable": true,
      "relatedEntities": ["digital_coupons", "print_media", "demographics_18_34"]
    }
  ]
}
EOF

cat > "$DEPLOY_DIR/data/live/ai/insights/latest_insights.json" << 'EOF'
{
  "metadata": {
    "version": "v2.4.0",
    "generatedAt": "2025-05-22T10:35:00Z",
    "dataSource": "live"
  },
  "insights": [
    {
      "id": "ins_live_001",
      "type": "prediction",
      "category": "demand",
      "title": "Projected Stock Shortfall",
      "description": "Based on current sales velocity, Store #2103 will experience stockouts of fresh produce within 48 hours if not replenished.",
      "confidence": 0.89,
      "relevance": "critical",
      "actionable": true,
      "relatedEntities": ["store_2103", "fresh_produce", "stockout_risk"]
    },
    {
      "id": "ins_live_002",
      "type": "opportunity",
      "category": "cross_sell",
      "title": "Bundle Opportunity",
      "description": "Customers purchasing premium coffee brands are 3.2x more likely to also purchase specialty creamers when recommended.",
      "confidence": 0.91,
      "relevance": "medium",
      "actionable": true,
      "relatedEntities": ["premium_coffee", "specialty_creamers", "bundle_recommendations"]
    }
  ]
}
EOF

# 7. Ensure staticwebapp.config.json exists
if [ ! -f "$DEPLOY_DIR/staticwebapp.config.json" ]; then
  echo -e "${YELLOW}Creating staticwebapp.config.json...${NC}"
  cat > "$DEPLOY_DIR/staticwebapp.config.json" << 'EOF'
{
  "routes": [
    {
      "route": "/api/*",
      "methods": ["GET", "POST", "PUT", "DELETE"],
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/data/live/*",
      "methods": ["GET"],
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/data/simulated/*",
      "methods": ["GET"],
      "allowedRoles": ["anonymous", "authenticated"]
    },
    {
      "route": "/*",
      "methods": ["GET"],
      "allowedRoles": ["anonymous", "authenticated"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/js/*", "/*.ico"]
  },
  "globalHeaders": {
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://*.googleapis.com https://*.gstatic.com; connect-src 'self' https://*.azure-api.net https://*.cognitiveservices.azure.com https://*.openai.azure.com",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)"
  },
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/{TENANT_ID}/v2.0",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/error/404.html"
    },
    "500": {
      "rewrite": "/error/500.html",
      "statusCode": 500
    }
  },
  "platform": {
    "apiRuntime": "node:16"
  },
  "networking": {
    "allowedIpRanges": ["all"]
  }
}
EOF
fi

# 8. Ensure index.html exists
if [ ! -f "$DEPLOY_DIR/index.html" ]; then
  echo -e "${YELLOW}Creating index.html...${NC}"
  cat > "$DEPLOY_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client360 Dashboard v2.4.0</title>
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/css/theme-tbwa.css">
  <meta name="description" content="Client360 Dashboard - Comprehensive client analytics and insights platform">
  <link rel="icon" href="/favicon.ico">
</head>
<body>
  <div id="app">
    <header>
      <div class="logo-container">
        <img src="/images/logo.png" alt="Client360 Dashboard Logo" class="logo">
        <h1>Client360 Dashboard <span class="version">v2.4.0</span></h1>
      </div>
      <div class="user-controls">
        <div id="user-profile"></div>
        <div id="notifications"></div>
        <div id="settings"></div>
      </div>
    </header>
    
    <nav id="main-navigation">
      <ul>
        <li><a href="#overview" class="active">Overview</a></li>
        <li><a href="#analytics">Analytics</a></li>
        <li><a href="#insights">AI Insights</a></li>
        <li><a href="#geo">Geo Analytics</a></li>
        <li><a href="#reports">Reports</a></li>
        <li><a href="#settings">Settings</a></li>
      </ul>
    </nav>
    
    <main id="dashboard-container">
      <div id="loading-overlay">Loading Dashboard...</div>
      
      <!-- Dashboard content will be dynamically loaded here -->
    </main>
    
    <footer>
      <div class="copyright">© 2025 TBWA Client360</div>
      <div class="version-info">Version 2.4.0 | Last Updated: May 22, 2025</div>
    </footer>
  </div>
  
  <!-- Core scripts -->
  <script src="/js/config.js"></script>
  <script src="/js/dashboard.js"></script>
  
  <!-- Initialize the dashboard when DOM is ready -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize the dashboard with configuration
      const dashboard = new Dashboard({
        version: 'v2.4.0',
        environment: 'production',
        features: {
          aiInsights: true,
          enhancedMaps: true,
          userPersonalization: true
        }
      });
      
      // Start the dashboard initialization
      dashboard.init().catch(error => {
        console.error('Dashboard initialization failed:', error);
        document.getElementById('loading-overlay').innerHTML = 
          'Failed to load dashboard. Please refresh the page or contact support.';
      });
    });
  </script>
</body>
</html>
EOF
fi

# 9. Run the verification script again to see if our fixes worked
echo -e "${YELLOW}Running verification script to check fixes...${NC}"
./verify_v2.4.0_deployment.sh

echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}= Patch Completed                                     =${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "Finished at: $(date)"
echo -e "If verification still fails, please check the logs for details."