/**
 * Client360 Dashboard v2.4.0
 * Main dashboard initialization and integration module
 */

// Configuration
const DASHBOARD_VERSION = '2.4.0';
const DEBUG_MODE = false;

// Core Dashboard Class
class Client360Dashboard {
  constructor(config = {}) {
    // Default configuration
    this.config = {
      debug: DEBUG_MODE,
      version: DASHBOARD_VERSION,
      containerSelector: '#dashboard-container',
      enabledFeatures: {
        multiModelAI: true,
        enhancedMaps: true,
        userPersonalization: true,
        streaming: true
      },
      apiEndpoints: {
        base: '/api',
        insights: '/api/insights',
        ai: '/api/ai',
        preferences: '/api/preferences',
        data: '/api/data'
      },
      ...config
    };
    
    // Core components
    this.components = {
      ai: null,               // AI components
      map: null,              // Map components
      user: null,             // User personalization components
      data: null,             // Data connectors
      visualizations: null    // Chart and visualization components
    };
    
    // User state
    this.userState = {
      isAuthenticated: false,
      preferences: null,
      currentView: null,
      lastActivity: Date.now()
    };
    
    // System state
    this.systemState = {
      isLoading: true,
      initializationTime: null,
      errors: [],
      serverStatus: null
    };
    
    // Analytics & Telemetry
    this.analytics = {
      sessionStartTime: Date.now(),
      events: [],
      errors: [],
      performance: {}
    };
    
    // Event handlers
    this.eventHandlers = new Map();
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the dashboard
   */
  async init() {
    try {
      console.log(`Client360 Dashboard v${this.config.version} initializing...`);
      this.systemState.initializationTime = Date.now();
      
      // 1. Set up event handlers
      this._setupEventHandlers();
      
      // 2. Log dashboard startup
      this._logEvent('dashboard_init_start', { version: this.config.version });
      
      // 3. Check feature flags and configure dashboard based on enabled features
      await this._checkFeatureFlags();
      
      // 4. Initialize core components in parallel
      await this._initCoreComponents();
      
      // 5. Run post-initialization tasks
      await this._runPostInitTasks();
      
      // 6. Complete initialization
      this.systemState.isLoading = false;
      this._logEvent('dashboard_init_complete', {
        duration: Date.now() - this.systemState.initializationTime,
        enabledFeatures: this.config.enabledFeatures
      });
      
      // 7. Trigger ready event
      this._triggerEvent('ready', { 
        version: this.config.version,
        loadTime: Date.now() - this.systemState.initializationTime
      });
      
      console.log(`Client360 Dashboard v${this.config.version} initialized successfully.`);
    } catch (error) {
      this.systemState.errors.push({
        timestamp: Date.now(),
        phase: 'initialization',
        error: error.message,
        stack: error.stack
      });
      
      this._logEvent('dashboard_init_error', { 
        error: error.message,
        stack: error.stack
      });
      
      console.error('Dashboard initialization failed:', error);
      this._triggerEvent('error', { phase: 'initialization', error });
    }
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
    return this; // For chaining
  }
  
  /**
   * Unregister event handler
   * @param {string} eventName - Event name
   * @param {Function} handler - Handler function to remove
   */
  off(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      return this;
    }
    
    const handlers = this.eventHandlers.get(eventName);
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    
    return this; // For chaining
  }
  
  /**
   * Get a component instance
   * @param {string} componentType - Component type (ai, map, user, data, visualizations)
   * @param {string} componentName - Specific component name
   * @returns {Object|null} - Component instance or null if not found
   */
  getComponent(componentType, componentName = null) {
    if (!this.components[componentType]) {
      console.warn(`Component type ${componentType} not found`);
      return null;
    }
    
    if (componentName && this.components[componentType][componentName]) {
      return this.components[componentType][componentName];
    }
    
    return this.components[componentType];
  }
  
  /**
   * Set up core event handlers
   * @private
   */
  _setupEventHandlers() {
    // Window events
    window.addEventListener('resize', this._handleResize.bind(this));
    window.addEventListener('error', this._handleGlobalError.bind(this));
    
    // User activity tracking for session management
    document.addEventListener('click', this._updateUserActivity.bind(this));
    document.addEventListener('keydown', this._updateUserActivity.bind(this));
    document.addEventListener('mousemove', this._throttle(this._updateUserActivity.bind(this), 60000)); // Throttle to once per minute
    
    // Handle beforeunload to save state if needed
    window.addEventListener('beforeunload', this._handleBeforeUnload.bind(this));
  }
  
  /**
   * Check enabled feature flags
   * @private
   */
  async _checkFeatureFlags() {
    try {
      // In a real implementation, this would fetch feature flags from a server
      // Here we just use the configured values
      
      this._logEvent('feature_flags_loaded', { flags: this.config.enabledFeatures });
    } catch (error) {
      console.error('Error loading feature flags:', error);
      // Fall back to default feature flags
    }
  }
  
  /**
   * Initialize all core components in parallel
   * @private
   */
  async _initCoreComponents() {
    try {
      const startTime = Date.now();
      
      // Initialize component objects
      this.components.ai = {};
      this.components.map = {};
      this.components.user = {};
      this.components.data = {};
      this.components.visualizations = {};
      
      // Execute component initialization in parallel
      await Promise.all([
        this._initAIComponents(),
        this._initMapComponents(),
        this._initUserComponents(),
        this._initDataConnectors(),
        this._initVisualizations()
      ]);
      
      this._logEvent('components_initialized', { 
        duration: Date.now() - startTime
      });
    } catch (error) {
      console.error('Error initializing core components:', error);
      throw error; // Re-throw to be caught by main init method
    }
  }
  
  /**
   * Initialize AI components
   * @private
   */
  async _initAIComponents() {
    if (!this.config.enabledFeatures.multiModelAI) {
      console.log('Multi-Model AI feature is disabled, skipping initialization');
      return;
    }
    
    try {
      // Load AI Engine
      const AIEngine = window.AIEngine || (await this._dynamicImport('/js/components/ai/ai_engine.js'));
      this.components.ai.engine = new AIEngine({
        apiEndpoint: this.config.apiEndpoints.ai,
        enableCaching: true,
        debug: this.config.debug
      });
      
      // Load Model Registry
      const ModelRegistry = window.ModelRegistry || (await this._dynamicImport('/js/components/ai/model_registry.js'));
      this.components.ai.modelRegistry = new ModelRegistry({
        aiEngine: this.components.ai.engine
      });
      
      // Load Embeddings Service if available
      if (window.EmbeddingsService) {
        this.components.ai.embeddings = new window.EmbeddingsService({
          apiEndpoint: `${this.config.apiEndpoints.ai}/embeddings`
        });
      }
      
      // Load StreamingClient if streaming is enabled
      if (this.config.enabledFeatures.streaming && window.StreamingClient) {
        this.components.ai.streamingClient = new window.StreamingClient({
          apiEndpoint: `${this.config.apiEndpoints.ai}/streaming`
        });
      }
      
      // Register default models
      this._registerDefaultModels();
      
      this._logEvent('ai_components_initialized');
    } catch (error) {
      console.error('Error initializing AI components:', error);
      this.systemState.errors.push({
        timestamp: Date.now(),
        phase: 'ai_initialization',
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Initialize Map components
   * @private
   */
  async _initMapComponents() {
    if (!this.config.enabledFeatures.enhancedMaps) {
      console.log('Enhanced Maps feature is disabled, skipping initialization');
      return;
    }
    
    try {
      // Load MapEngine
      const MapEngine = window.MapEngine || (await this._dynamicImport('/js/components/map/map_engine.js'));
      this.components.map.engine = new MapEngine({
        containerId: 'map-container',
        debug: this.config.debug
      });
      
      // Load additional map components if available
      if (window.HeatmapLayer) {
        this.components.map.heatmap = new window.HeatmapLayer({
          mapEngine: this.components.map.engine
        });
      }
      
      this._logEvent('map_components_initialized');
    } catch (error) {
      console.error('Error initializing Map components:', error);
      this.systemState.errors.push({
        timestamp: Date.now(),
        phase: 'map_initialization',
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Initialize User Personalization components
   * @private
   */
  async _initUserComponents() {
    if (!this.config.enabledFeatures.userPersonalization) {
      console.log('User Personalization feature is disabled, skipping initialization');
      return;
    }
    
    try {
      // Load UserPreferences
      const UserPreferences = window.UserPreferences || (await this._dynamicImport('/js/components/user/preferences.js'));
      this.components.user.preferences = new UserPreferences({
        storageKey: 'client360_user_preferences_v2_4_0',
        syncWithServer: true,
        serverEndpoint: this.config.apiEndpoints.preferences
      });
      
      // Load DashboardLayouts
      const DashboardLayouts = window.DashboardLayouts || (await this._dynamicImport('/js/components/user/dashboard_layouts.js'));
      this.components.user.layouts = new DashboardLayouts({
        userPreferences: this.components.user.preferences
      });
      
      // Load SavedFilters
      const SavedFilters = window.SavedFilters || (await this._dynamicImport('/js/components/user/saved_filters.js'));
      this.components.user.savedFilters = new SavedFilters({
        userPreferences: this.components.user.preferences
      });
      
      // Load RecentViews
      const RecentViews = window.RecentViews || (await this._dynamicImport('/js/components/user/recent_views.js'));
      this.components.user.recentViews = new RecentViews({
        userPreferences: this.components.user.preferences
      });
      
      // Load ExportTemplates
      const ExportTemplates = window.ExportTemplates || (await this._dynamicImport('/js/components/user/export_templates.js'));
      this.components.user.exportTemplates = new ExportTemplates({
        userPreferences: this.components.user.preferences
      });
      
      this._logEvent('user_components_initialized');
    } catch (error) {
      console.error('Error initializing User Personalization components:', error);
      this.systemState.errors.push({
        timestamp: Date.now(),
        phase: 'user_initialization',
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Initialize Data Connectors
   * @private
   */
  async _initDataConnectors() {
    try {
      // Initialize data connectors here
      // This is placeholder code that would be replaced with actual data connector initialization
      this.components.data = {
        // Sample structure only
        connectors: {},
        cache: new Map(),
        lastFetch: {}
      };
      
      this._logEvent('data_connectors_initialized');
    } catch (error) {
      console.error('Error initializing Data Connectors:', error);
      this.systemState.errors.push({
        timestamp: Date.now(),
        phase: 'data_connector_initialization',
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Initialize Visualizations
   * @private
   */
  async _initVisualizations() {
    try {
      // Initialize visualization components here
      // This is placeholder code that would be replaced with actual visualization initialization
      this.components.visualizations = {
        // Sample structure only
        charts: {},
        renderers: {}
      };
      
      this._logEvent('visualizations_initialized');
    } catch (error) {
      console.error('Error initializing Visualizations:', error);
      this.systemState.errors.push({
        timestamp: Date.now(),
        phase: 'visualization_initialization',
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Register default AI models
   * @private
   */
  _registerDefaultModels() {
    if (!this.components.ai || !this.components.ai.modelRegistry) {
      return;
    }
    
    // Register models available in the system
    const defaultModels = [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        capabilities: ['insights', 'completion', 'chat'],
        priority: 1,
        config: {
          maxTokens: 4096
        }
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        capabilities: ['insights', 'completion', 'chat'],
        priority: 2,
        config: {
          maxTokens: 4096
        }
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        capabilities: ['insights', 'completion'],
        priority: 3,
        config: {
          maxTokens: 2048
        }
      },
      // Text embeddings model
      {
        id: 'text-embedding-ada-002',
        name: 'Ada Embeddings',
        provider: 'openai',
        capabilities: ['embeddings'],
        priority: 1,
        config: {
          dimensions: 1536
        }
      }
    ];
    
    // Register each model with the registry
    defaultModels.forEach(model => {
      this.components.ai.modelRegistry.registerModel(model);
    });
  }
  
  /**
   * Run post-initialization tasks
   * @private
   */
  async _runPostInitTasks() {
    try {
      // Apply saved user preferences if available
      if (this.components.user && this.components.user.preferences) {
        await this._applyUserPreferences();
      }
      
      // Connect components as needed
      this._wireComponents();
      
      // Initialize UI elements
      this._initUIElements();
      
      this._logEvent('post_init_tasks_complete');
    } catch (error) {
      console.error('Error running post-initialization tasks:', error);
      this.systemState.errors.push({
        timestamp: Date.now(),
        phase: 'post_initialization',
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Apply saved user preferences
   * @private
   */
  async _applyUserPreferences() {
    if (!this.components.user || !this.components.user.preferences) {
      return;
    }
    
    try {
      // Load preferences
      const preferences = this.components.user.preferences.getAllPreferences();
      
      // Apply theme
      if (preferences.theme) {
        document.documentElement.setAttribute('data-theme', preferences.theme);
      }
      
      // Apply language
      if (preferences.language) {
        document.documentElement.setAttribute('lang', preferences.language);
      }
      
      // Apply saved layout if available
      if (this.components.user.layouts && preferences.currentLayout) {
        await this.components.user.layouts.applyLayout(preferences.currentLayout);
      }
      
      this.userState.preferences = preferences;
      this._logEvent('user_preferences_applied', { preferences });
    } catch (error) {
      console.error('Error applying user preferences:', error);
    }
  }
  
  /**
   * Connect components together
   * @private
   */
  _wireComponents() {
    // Wire up inter-component connections and event handlers
    // This is highly dependent on the specific components being used
    
    // Example: Wire map to AI insights
    if (this.components.map && this.components.map.engine && 
        this.components.ai && this.components.ai.engine) {
      
      // Set up map selection to trigger AI insights
      this.components.map.engine.on('regionSelected', async (region) => {
        try {
          // Generate insights for the selected region
          const insights = await this.components.ai.engine.generateInsights({
            type: 'region',
            region: region.properties.name,
            regionId: region.id,
            dataPoints: region.properties.metrics
          });
          
          // Display insights in UI
          this._displayInsights(insights);
          
          // Add to recent views
          if (this.components.user && this.components.user.recentViews) {
            this.components.user.recentViews.addItem({
              id: region.id,
              type: 'region',
              name: region.properties.name,
              metadata: {
                metrics: region.properties.metrics
              }
            });
          }
        } catch (error) {
          console.error('Error generating insights for region:', error);
        }
      });
    }
    
    // Wire up user preferences events
    if (this.components.user && this.components.user.preferences) {
      this.components.user.preferences.on('preferenceChanged', (change) => {
        if (change.key === 'theme') {
          document.documentElement.setAttribute('data-theme', change.newValue);
        } else if (change.key === 'language') {
          document.documentElement.setAttribute('lang', change.newValue);
        }
        
        // Update local user state
        this.userState.preferences = {
          ...this.userState.preferences,
          [change.key]: change.newValue
        };
        
        this._triggerEvent('preferenceChanged', change);
      });
    }
  }
  
  /**
   * Initialize UI elements
   * @private
   */
  _initUIElements() {
    // This would be implementation-specific initialization of UI elements
    // For now, just simulate this with a log message
    console.log('Initializing UI elements for dashboard');
    
    // In a real implementation, this would create UI elements like:
    // - Navigation panels
    // - Dashboard widgets
    // - Control panels
    // - etc.
  }
  
  /**
   * Display insights in the UI
   * @param {Object} insights - The insights to display
   * @private
   */
  _displayInsights(insights) {
    // Implementation-specific code to display insights
    // This would update the insights panel in the UI
    console.log('Displaying insights:', insights);
    
    // Trigger insights updated event
    this._triggerEvent('insightsUpdated', insights);
  }
  
  /**
   * Dynamically import a module
   * @param {string} path - Path to the module
   * @returns {Promise<Object>} - The imported module
   * @private
   */
  async _dynamicImport(path) {
    try {
      // If ESM is supported, use dynamic import
      if (typeof import === 'function') {
        const module = await import(path);
        return module.default || module;
      }
      
      // Fallback to traditional script loading
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;
        script.async = true;
        
        script.onload = () => {
          // Assume the script exposes a global object with the same name as the file
          const filename = path.split('/').pop().replace('.js', '');
          const capitalizedName = filename.charAt(0).toUpperCase() + filename.slice(1);
          resolve(window[capitalizedName]);
        };
        
        script.onerror = () => {
          reject(new Error(`Failed to load script: ${path}`));
        };
        
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error(`Error importing module ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Log an event for analytics
   * @param {string} eventName - Name of the event
   * @param {Object} data - Event data
   * @private
   */
  _logEvent(eventName, data = {}) {
    const event = {
      timestamp: Date.now(),
      event: eventName,
      data
    };
    
    this.analytics.events.push(event);
    
    if (this.config.debug) {
      console.log(`Event: ${eventName}`, data);
    }
    
    // In a real implementation, this would send events to an analytics service
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
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    }
  }
  
  /**
   * Handle window resize event
   * @param {Event} event - The resize event
   * @private
   */
  _handleResize(event) {
    // Update layout and components based on new window size
    if (this.components.map && this.components.map.engine) {
      this.components.map.engine.resize();
    }
    
    this._triggerEvent('resize', {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }
  
  /**
   * Handle global error event
   * @param {Event} event - The error event
   * @private
   */
  _handleGlobalError(event) {
    const errorInfo = {
      timestamp: Date.now(),
      message: event.message || 'Unknown error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error ? event.error.stack : null
    };
    
    this.systemState.errors.push(errorInfo);
    this.analytics.errors.push(errorInfo);
    
    console.error('Dashboard error:', errorInfo);
    this._triggerEvent('error', errorInfo);
    
    // Prevent default to allow custom error handling
    event.preventDefault();
  }
  
  /**
   * Update user activity timestamp
   * @private
   */
  _updateUserActivity() {
    this.userState.lastActivity = Date.now();
  }
  
  /**
   * Handle beforeunload event
   * @param {Event} event - The beforeunload event
   * @private
   */
  _handleBeforeUnload(event) {
    // Save any unsaved state if needed
    if (this.components.user && this.components.user.preferences) {
      this.components.user.preferences.saveAll();
    }
    
    // Log session end
    this._logEvent('session_end', {
      duration: Date.now() - this.analytics.sessionStartTime,
      eventCount: this.analytics.events.length
    });
  }
  
  /**
   * Create a throttled function that doesn't execute more than once per wait period
   * @param {Function} func - The function to throttle
   * @param {number} wait - The throttle period in milliseconds
   * @returns {Function} - Throttled function
   * @private
   */
  _throttle(func, wait) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create global dashboard instance
  window.dashboard = new Client360Dashboard();
  
  // Log initialization in console
  console.log(`
  ┌─────────────────────────────────────────────┐
  │                                             │
  │  Client360 Dashboard v2.4.0                 │
  │                                             │
  │  • Multi-Model AI Support                   │
  │  • Enhanced Map Visualization               │
  │  • User Personalization Framework           │
  │                                             │
  └─────────────────────────────────────────────┘
  `);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Client360Dashboard;
} else if (typeof window !== 'undefined') {
  window.Client360Dashboard = Client360Dashboard;
}