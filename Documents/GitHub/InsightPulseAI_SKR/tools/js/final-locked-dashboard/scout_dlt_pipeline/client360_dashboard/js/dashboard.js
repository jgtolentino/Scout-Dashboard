/**
 * @file dashboard.js
 * @description Main dashboard initialization and integration module for Client360 Dashboard
 * @version v2.4.0
 */

/**
 * Dashboard class that initializes and manages the Client360 Dashboard
 */
class Dashboard {
  /**
   * Create a new Dashboard instance
   * @param {Object} config - Dashboard configuration options
   */
  constructor(config = {}) {
    this.config = {
      version: 'v2.4.0',
      environment: 'production',
      debug: false,
      apiBase: '/api',
      features: {
        aiInsights: true,
        enhancedMaps: true,
        userPersonalization: true,
        realtimeUpdates: false
      },
      paths: {
        components: '/js/components',
        data: '/data'
      },
      defaultView: 'overview',
      ...config
    };

    // Component references
    this.components = {
      ai: {},
      map: {},
      user: {}
    };

    // Event bus for component communication
    this.events = {
      listeners: new Map(),
      subscribe: (event, callback) => {
        if (!this.events.listeners.has(event)) {
          this.events.listeners.set(event, []);
        }
        this.events.listeners.get(event).push(callback);
        return () => this.events.unsubscribe(event, callback);
      },
      unsubscribe: (event, callback) => {
        if (!this.events.listeners.has(event)) return;
        const listeners = this.events.listeners.get(event);
        this.events.listeners.set(
          event, 
          listeners.filter(cb => cb !== callback)
        );
      },
      publish: (event, data) => {
        if (!this.events.listeners.has(event)) return;
        this.events.listeners.get(event).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error publishing event ${event}:`, error);
          }
        });
      }
    };

    // Dashboard state
    this.state = {
      initialized: false,
      loading: true,
      currentView: null,
      user: null,
      filters: {},
      lastUpdated: null
    };

    // Bind methods
    this._handleError = this._handleError.bind(this);
    this._handleViewChange = this._handleViewChange.bind(this);
    this._logEvent = this._logEvent.bind(this);
  }

  /**
   * Initialize the dashboard
   * @returns {Promise<void>} - Promise that resolves when initialization is complete
   */
  async init() {
    try {
      // 1. Set up event handlers
      this._setupEventHandlers();
      
      // 2. Log dashboard startup
      this._logEvent('dashboard_init_start', { version: this.config.version });
      
      // 3. Check feature flags
      await this._checkFeatureFlags();
      
      // 4. Initialize core components in parallel
      await this._initCoreComponents();
      
      // 5. Initialize selected view
      await this._initView(this.config.defaultView);
      
      // 6. Run post-initialization tasks
      await this._runPostInitTasks();
      
      // 7. Mark as initialized
      this.state.initialized = true;
      this.state.loading = false;
      this.state.lastUpdated = new Date();
      
      // 8. Remove loading overlay
      this._hideLoadingOverlay();
      
      // 9. Log initialization complete
      this._logEvent('dashboard_init_complete', { 
        version: this.config.version,
        duration: performance.now() - this._initStartTime
      });
      
      // 10. Publish initialization complete event
      this.events.publish('dashboard:initialized', { 
        version: this.config.version,
        features: this.config.features
      });
      
      return true;
    } catch (error) {
      return this._handleError(error, 'dashboard_init_failed');
    }
  }

  /**
   * Set up dashboard event handlers
   * @private
   */
  _setupEventHandlers() {
    // Navigation events
    document.querySelectorAll('#main-navigation a').forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const view = event.target.getAttribute('href').substring(1);
        this._handleViewChange(view);
      });
    });
    
    // Window resize events
    window.addEventListener('resize', this._debounce(() => {
      this.events.publish('window:resized', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 250));
    
    // Error logging
    window.addEventListener('error', (event) => {
      this._logEvent('dashboard_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  /**
   * Initialize all core components (AI, Map, User)
   * @private
   * @returns {Promise<void>}
   */
  async _initCoreComponents() {
    // Create an array of initialization promises
    const initPromises = [];
    
    // Only init components that are enabled in features
    if (this.config.features.aiInsights) {
      initPromises.push(this._initAIComponents());
    }
    
    if (this.config.features.enhancedMaps) {
      initPromises.push(this._initMapComponents());
    }
    
    if (this.config.features.userPersonalization) {
      initPromises.push(this._initUserComponents());
    }
    
    // Wait for all component initializations to complete
    await Promise.all(initPromises);
  }

  /**
   * Initialize AI components
   * @private
   * @returns {Promise<void>}
   */
  async _initAIComponents() {
    try {
      // Show loading message
      this._updateLoadingOverlay('Initializing AI components...');
      
      // Dynamically import AI Engine components
      const AIEngine = window.AIEngine || 
        (await this._dynamicImport(
          `${this.config.paths.components}/ai/engine/ai_engine.js`
        ));
      
      const ModelRegistry = window.ModelRegistry || 
        (await this._dynamicImport(
          `${this.config.paths.components}/ai/engine/model_registry.js`
        ));
      
      const ModelRouter = window.ModelRouter || 
        (await this._dynamicImport(
          `${this.config.paths.components}/ai/engine/model_router.js`
        ));
      
      const EmbeddingsService = window.EmbeddingsService || 
        (await this._dynamicImport(
          `${this.config.paths.components}/ai/engine/embeddings_service.js`
        ));
      
      const StreamingClient = window.StreamingClient || 
        (await this._dynamicImport(
          `${this.config.paths.components}/ai/engine/streaming_client.js`
        ));
      
      // Initialize Model Registry first
      this.components.ai.modelRegistry = new ModelRegistry({
        apiBase: `${this.config.apiBase}/ai/models`,
        onModelAdded: (model) => {
          this.events.publish('ai:model_added', { model });
        }
      });
      
      // Initialize AI Engine
      this.components.ai.engine = new AIEngine({
        apiBase: `${this.config.apiBase}/ai`,
        modelRegistry: this.components.ai.modelRegistry,
        debug: this.config.debug
      });
      
      // Initialize Model Router
      this.components.ai.modelRouter = new ModelRouter({
        aiEngine: this.components.ai.engine,
        modelRegistry: this.components.ai.modelRegistry,
        fallbackStrategy: 'priority'
      });
      
      // Initialize Embeddings Service
      this.components.ai.embeddings = new EmbeddingsService({
        aiEngine: this.components.ai.engine,
        cacheEnabled: true
      });
      
      // Initialize Streaming Client
      this.components.ai.streaming = new StreamingClient({
        aiEngine: this.components.ai.engine
      });
      
      // Register the default models
      await this._registerDefaultAIModels();
      
      // Log AI components initialized
      this._logEvent('ai_components_initialized', {
        modelCount: this.components.ai.modelRegistry.getModelCount()
      });
      
      return true;
    } catch (error) {
      return this._handleError(error, 'ai_components_init_failed');
    }
  }

  /**
   * Initialize map components
   * @private
   * @returns {Promise<void>}
   */
  async _initMapComponents() {
    try {
      // Show loading message
      this._updateLoadingOverlay('Initializing map components...');
      
      // Dynamically import Map components
      const MapEngine = window.MapEngine || 
        (await this._dynamicImport(
          `${this.config.paths.components}/map/map_engine.js`
        ));
      
      const GeoLayers = window.GeoLayers || 
        (await this._dynamicImport(
          `${this.config.paths.components}/map/geo_layers.js`
        ));
      
      const RegionSelector = window.RegionSelector || 
        (await this._dynamicImport(
          `${this.config.paths.components}/map/region_selector.js`
        ));
      
      const HeatVisualization = window.HeatVisualization || 
        (await this._dynamicImport(
          `${this.config.paths.components}/map/heat_visualization.js`
        ));
      
      const LocationSearch = window.LocationSearch || 
        (await this._dynamicImport(
          `${this.config.paths.components}/map/location_search.js`
        ));
      
      // Initialize Map Engine
      this.components.map.engine = new MapEngine({
        containerId: 'map-container',
        apiKey: this.config.mapApiKey,
        initialView: {
          center: [121.0, 14.5], // Philippines center
          zoom: 6
        }
      });
      
      // Initialize Geo Layers
      this.components.map.geoLayers = new GeoLayers({
        mapEngine: this.components.map.engine,
        layersApiBase: `${this.config.apiBase}/geo/layers`
      });
      
      // Initialize Region Selector
      this.components.map.regionSelector = new RegionSelector({
        mapEngine: this.components.map.engine,
        geoLayers: this.components.map.geoLayers,
        onRegionSelected: (region) => {
          this.events.publish('map:region_selected', { region });
        }
      });
      
      // Initialize Heat Visualization
      this.components.map.heatMap = new HeatVisualization({
        mapEngine: this.components.map.engine,
        colorPalette: 'heat'
      });
      
      // Initialize Location Search
      this.components.map.locationSearch = new LocationSearch({
        mapEngine: this.components.map.engine,
        searchApiBase: `${this.config.apiBase}/geo/search`,
        onLocationSelected: (location) => {
          this.events.publish('map:location_selected', { location });
        }
      });
      
      // Load default layers
      await this._loadDefaultMapLayers();
      
      // Log Map components initialized
      this._logEvent('map_components_initialized', {
        engineType: this.components.map.engine.getType()
      });
      
      return true;
    } catch (error) {
      return this._handleError(error, 'map_components_init_failed');
    }
  }

  /**
   * Initialize user personalization components
   * @private
   * @returns {Promise<void>}
   */
  async _initUserComponents() {
    try {
      // Show loading message
      this._updateLoadingOverlay('Initializing user personalization...');
      
      // Dynamically import User components
      const UserPreferences = window.UserPreferences || 
        (await this._dynamicImport(
          `${this.config.paths.components}/user/preferences.js`
        ));
      
      const DashboardLayouts = window.DashboardLayouts || 
        (await this._dynamicImport(
          `${this.config.paths.components}/user/dashboard_layouts.js`
        ));
      
      const SavedFilters = window.SavedFilters || 
        (await this._dynamicImport(
          `${this.config.paths.components}/user/saved_filters.js`
        ));
      
      const RecentViews = window.RecentViews || 
        (await this._dynamicImport(
          `${this.config.paths.components}/user/recent_views.js`
        ));
      
      const ExportTemplates = window.ExportTemplates || 
        (await this._dynamicImport(
          `${this.config.paths.components}/user/export_templates.js`
        ));
      
      // Initialize User Preferences (core component)
      this.components.user.preferences = new UserPreferences({
        storageKey: 'client360_user_preferences',
        apiBase: `${this.config.apiBase}/user/preferences`,
        useLocalStorage: true
      });
      
      // Initialize Dashboard Layouts
      this.components.user.layouts = new DashboardLayouts({
        userPreferences: this.components.user.preferences,
        storageKey: 'client360_dashboard_layouts',
        defaultLayouts: await this._loadDefaultLayouts()
      });
      
      // Initialize Saved Filters
      this.components.user.savedFilters = new SavedFilters({
        userPreferences: this.components.user.preferences,
        storageKey: 'client360_saved_filters',
        maxFilters: 20
      });
      
      // Initialize Recent Views
      this.components.user.recentViews = new RecentViews({
        userPreferences: this.components.user.preferences,
        storageKey: 'client360_recent_views',
        maxItemsPerType: 10
      });
      
      // Initialize Export Templates
      this.components.user.exportTemplates = new ExportTemplates({
        userPreferences: this.components.user.preferences,
        storageKey: 'client360_export_templates',
        maxTemplates: 10
      });
      
      // Apply user preferences
      await this._applyUserPreferences();
      
      // Log User components initialized
      this._logEvent('user_components_initialized', {
        hasExistingPreferences: this.components.user.preferences.hasStoredPreferences()
      });
      
      return true;
    } catch (error) {
      return this._handleError(error, 'user_components_init_failed');
    }
  }

  /**
   * Register default AI models with the model registry
   * @private
   * @returns {Promise<void>}
   */
  async _registerDefaultAIModels() {
    // Register Azure OpenAI models
    this.components.ai.modelRegistry.registerModel({
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'azure',
      version: '0125-preview',
      capabilities: ['completion', 'chat', 'embeddings', 'insights'],
      priority: 1,
      quotaConfig: {
        tokensPerMinute: 10000,
        requestsPerMinute: 50
      }
    });
    
    this.components.ai.modelRegistry.registerModel({
      id: 'gpt-35-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'azure',
      version: '0125',
      capabilities: ['completion', 'chat', 'insights'],
      priority: 2,
      quotaConfig: {
        tokensPerMinute: 60000,
        requestsPerMinute: 200
      }
    });
    
    // Register Azure AI services
    this.components.ai.modelRegistry.registerModel({
      id: 'text-embedding-ada-002',
      name: 'Text Embedding Ada 002',
      provider: 'azure',
      version: '2',
      capabilities: ['embeddings'],
      priority: 1,
      quotaConfig: {
        tokensPerMinute: 100000,
        requestsPerMinute: 300
      }
    });
    
    // Optional local models for offline mode
    if (this.config.features.offlineSupport) {
      this.components.ai.modelRegistry.registerModel({
        id: 'offline-insights',
        name: 'Offline Insights Engine',
        provider: 'local',
        version: '1.0',
        capabilities: ['insights'],
        priority: 3,
        offline: true
      });
    }
  }

  /**
   * Load default map layers for the map engine
   * @private
   * @returns {Promise<void>}
   */
  async _loadDefaultMapLayers() {
    try {
      // Load Philippines administrative boundaries
      await this.components.map.geoLayers.loadLayer('philippines_administrative', {
        url: `${this.config.paths.data}/geo/philippines_administrative.geojson`,
        idProperty: 'ADM1_EN',
        nameProperty: 'ADM1_EN',
        styleProperty: 'ADM1_PCODE'
      });
      
      // Load store locations
      await this.components.map.geoLayers.loadLayer('store_locations', {
        url: `${this.config.apiBase}/geo/stores`,
        idProperty: 'store_id',
        nameProperty: 'store_name',
        cluster: true,
        minZoom: 8
      });
      
      // Set default visible layers
      this.components.map.geoLayers.setVisibleLayers(['philippines_administrative']);
    } catch (error) {
      console.error('Error loading default map layers:', error);
      // Non-critical error, continue without failing
    }
  }

  /**
   * Load default dashboard layouts
   * @private
   * @returns {Promise<Object>} - Default layouts object
   */
  async _loadDefaultLayouts() {
    try {
      const response = await fetch(`${this.config.paths.data}/defaults/layouts.json`);
      if (response.ok) {
        return await response.json();
      }
      // Fallback to hardcoded defaults if fetch fails
      return {
        overview: {
          name: 'Overview',
          layout: [
            { id: 'kpi-summary', width: 12, height: 1, x: 0, y: 0 },
            { id: 'sales-trend', width: 8, height: 2, x: 0, y: 1 },
            { id: 'ai-insights', width: 4, height: 2, x: 8, y: 1 },
            { id: 'regional-map', width: 6, height: 2, x: 0, y: 3 },
            { id: 'top-products', width: 6, height: 2, x: 6, y: 3 }
          ]
        },
        analytics: {
          name: 'Analytics',
          layout: [
            { id: 'data-filters', width: 12, height: 1, x: 0, y: 0 },
            { id: 'sales-analysis', width: 8, height: 3, x: 0, y: 1 },
            { id: 'product-metrics', width: 4, height: 3, x: 8, y: 1 },
            { id: 'store-performance', width: 12, height: 2, x: 0, y: 4 }
          ]
        }
      };
    } catch (error) {
      console.error('Error loading default layouts:', error);
      // Return minimal default layout on error
      return {
        overview: {
          name: 'Overview',
          layout: [
            { id: 'kpi-summary', width: 12, height: 1, x: 0, y: 0 },
            { id: 'sales-trend', width: 12, height: 2, x: 0, y: 1 }
          ]
        }
      };
    }
  }

  /**
   * Apply user preferences to the dashboard
   * @private
   * @returns {Promise<void>}
   */
  async _applyUserPreferences() {
    // Load user preferences
    const preferences = this.components.user.preferences.getAllPreferences();
    
    // Apply theme preference
    if (preferences.theme) {
      document.documentElement.setAttribute('data-theme', preferences.theme);
    }
    
    // Apply layout preference
    if (preferences.layout && this.components.user.layouts.hasLayout(preferences.layout)) {
      await this.components.user.layouts.applyLayout(preferences.layout);
    }
    
    // Apply language preference
    if (preferences.language) {
      await this._setLanguage(preferences.language);
    }
    
    // Apply dashboard density preference
    if (preferences.density) {
      document.documentElement.setAttribute('data-density', preferences.density);
    }
  }

  /**
   * Initialize a specific dashboard view
   * @param {string} viewName - Name of the view to initialize
   * @private
   * @returns {Promise<void>}
   */
  async _initView(viewName) {
    try {
      this._updateLoadingOverlay(`Loading ${viewName} view...`);
      
      // Update navigation
      document.querySelectorAll('#main-navigation a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${viewName}`) {
          link.classList.add('active');
        }
      });
      
      // Get container element
      const container = document.getElementById('dashboard-container');
      
      // Load view content
      const response = await fetch(`/views/${viewName}.html`);
      if (response.ok) {
        container.innerHTML = await response.text();
        
        // Initialize view-specific components
        await this._initViewComponents(viewName);
        
        // Update state
        this.state.currentView = viewName;
        
        // Publish view change event
        this.events.publish('dashboard:view_changed', { view: viewName });
        
        // Log view initialization
        this._logEvent('view_initialized', { view: viewName });
      } else {
        throw new Error(`Failed to load view: ${viewName}`);
      }
    } catch (error) {
      this._handleError(error, 'view_init_failed');
      
      // Fallback to empty container with error message
      const container = document.getElementById('dashboard-container');
      container.innerHTML = `
        <div class="error-container">
          <h2>Error Loading View</h2>
          <p>Failed to load the ${viewName} view. Please try again later.</p>
          <button id="retry-view-btn" class="btn btn-primary">Retry</button>
        </div>
      `;
      
      // Add retry button handler
      document.getElementById('retry-view-btn').addEventListener('click', () => {
        this._initView(viewName);
      });
    }
  }

  /**
   * Initialize view-specific components
   * @param {string} viewName - Name of the view
   * @private
   * @returns {Promise<void>}
   */
  async _initViewComponents(viewName) {
    switch (viewName) {
      case 'overview':
        // Initialize KPI summary
        if (document.getElementById('kpi-summary')) {
          await this._initKPISummary();
        }
        
        // Initialize AI insights panel
        if (document.getElementById('ai-insights')) {
          await this._initAIInsightsPanel();
        }
        
        // Initialize regional map
        if (document.getElementById('regional-map')) {
          await this._initRegionalMap();
        }
        break;
        
      case 'analytics':
        // Initialize analytics filters
        if (document.getElementById('data-filters')) {
          await this._initAnalyticsFilters();
        }
        
        // Initialize sales analysis
        if (document.getElementById('sales-analysis')) {
          await this._initSalesAnalysis();
        }
        break;
        
      case 'insights':
        // Initialize insights dashboard
        if (document.getElementById('insights-container')) {
          await this._initInsightsDashboard();
        }
        break;
        
      case 'geo':
        // Initialize geo analytics dashboard
        if (document.getElementById('geo-analytics')) {
          await this._initGeoAnalytics();
        }
        break;
        
      case 'reports':
        // Initialize reports manager
        if (document.getElementById('reports-manager')) {
          await this._initReportsManager();
        }
        break;
        
      case 'settings':
        // Initialize settings panel
        if (document.getElementById('settings-panel')) {
          await this._initSettingsPanel();
        }
        break;
        
      default:
        console.warn(`No specific initialization for view: ${viewName}`);
    }
  }

  /**
   * Check feature flags from the server
   * @private
   * @returns {Promise<void>}
   */
  async _checkFeatureFlags() {
    try {
      const response = await fetch(`${this.config.apiBase}/features`);
      if (response.ok) {
        const features = await response.json();
        
        // Merge with default features, server takes precedence
        this.config.features = {
          ...this.config.features,
          ...features
        };
        
        // Log feature flags
        this._logEvent('feature_flags_loaded', { features: this.config.features });
      }
    } catch (error) {
      console.warn('Failed to load feature flags, using defaults:', error);
      // Non-critical error, continue with default features
    }
  }

  /**
   * Run post-initialization tasks
   * @private
   * @returns {Promise<void>}
   */
  async _runPostInitTasks() {
    // Set up data refresh timer if enabled
    if (this.config.features.realtimeUpdates) {
      this._setupDataRefreshTimer();
    }
    
    // Check for updates
    this._checkForUpdates();
    
    // Log user interactions
    this._setupUserInteractionLogging();
    
    // Initialize help tooltips
    this._initHelpTooltips();
  }

  /**
   * Handle dashboard view change
   * @param {string} viewName - Name of the view
   * @private
   */
  _handleViewChange(viewName) {
    if (viewName === this.state.currentView) return;
    
    // Show loading overlay
    this._updateLoadingOverlay(`Loading ${viewName} view...`);
    
    // Update URL fragment
    window.location.hash = viewName;
    
    // Initialize the new view
    this._initView(viewName).finally(() => {
      // Hide loading overlay
      this._hideLoadingOverlay();
    });
  }

  /**
   * Handle errors in the dashboard
   * @param {Error} error - The error object
   * @param {string} eventType - Type of error event
   * @private
   * @returns {boolean} - False to indicate error
   */
  _handleError(error, eventType = 'dashboard_error') {
    console.error(`Dashboard error (${eventType}):`, error);
    
    // Log the error
    this._logEvent(eventType, {
      message: error.message,
      stack: this.config.debug ? error.stack : undefined
    });
    
    // Show error in UI if loading
    if (this.state.loading) {
      this._updateLoadingOverlay(
        `Error: ${error.message}. <button id="retry-btn" class="btn btn-sm btn-primary">Retry</button>`,
        'error'
      );
      
      // Add retry button handler
      document.getElementById('retry-btn')?.addEventListener('click', () => {
        window.location.reload();
      });
    } else {
      // Show toast notification for non-loading errors
      this._showNotification('error', 'Dashboard Error', error.message);
    }
    
    // Publish error event
    this.events.publish('dashboard:error', {
      message: error.message,
      type: eventType
    });
    
    return false;
  }

  /**
   * Update the loading overlay text
   * @param {string} message - Message to display
   * @param {string} type - Type of message (default, error, warning)
   * @private
   */
  _updateLoadingOverlay(message, type = 'default') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.innerHTML = message;
      overlay.className = `loading-overlay loading-${type}`;
      overlay.style.display = 'flex';
    }
  }

  /**
   * Hide the loading overlay
   * @private
   */
  _hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Log an event to analytics
   * @param {string} eventName - Name of the event
   * @param {Object} data - Event data
   * @private
   */
  _logEvent(eventName, data = {}) {
    // Add common properties
    const eventData = {
      ...data,
      timestamp: new Date().toISOString(),
      version: this.config.version,
      environment: this.config.environment,
      sessionId: this._getSessionId()
    };
    
    // Log to console in debug mode
    if (this.config.debug) {
      console.log(`[EVENT] ${eventName}:`, eventData);
    }
    
    // Send to analytics API if available
    if (window.analyticsClient) {
      window.analyticsClient.logEvent(eventName, eventData);
    }
  }

  /**
   * Show notification toast
   * @param {string} type - Notification type (info, success, warning, error)
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @private
   */
  _showNotification(type, title, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
      <button class="notification-close">&times;</button>
    `;
    
    // Add to notifications container
    const container = document.getElementById('notifications-container') || 
      document.body.appendChild(
        Object.assign(document.createElement('div'), {
          id: 'notifications-container',
          className: 'notifications-container'
        })
      );
    
    container.appendChild(notification);
    
    // Add close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 5000);
  }

  /**
   * Create a debounced function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @private
   * @returns {Function} - Debounced function
   */
  _debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Get or create a session ID
   * @private
   * @returns {string} - Session ID
   */
  _getSessionId() {
    if (!this._sessionId) {
      // Check if there's an existing session ID in sessionStorage
      this._sessionId = sessionStorage.getItem('client360_session_id');
      
      // If not, create a new one
      if (!this._sessionId) {
        this._sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('client360_session_id', this._sessionId);
      }
    }
    
    return this._sessionId;
  }

  /**
   * Dynamically import a module
   * @param {string} path - Path to the module
   * @private
   * @returns {Promise<any>} - Imported module
   */
  async _dynamicImport(path) {
    try {
      // Check if module is already loaded globally
      const pathParts = path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const moduleName = fileName.replace('.js', '');
      
      // Convert snake_case or kebab-case to CamelCase for class name
      const className = moduleName
        .split(/[-_]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      
      // Check if globally available
      if (window[className]) {
        return window[className];
      }
      
      // Otherwise, dynamically import
      const module = await import(path);
      return module.default || module;
    } catch (error) {
      throw new Error(`Failed to import module: ${path}. ${error.message}`);
    }
  }
}

// Export the Dashboard class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dashboard;
} else {
  window.Dashboard = Dashboard;
}
