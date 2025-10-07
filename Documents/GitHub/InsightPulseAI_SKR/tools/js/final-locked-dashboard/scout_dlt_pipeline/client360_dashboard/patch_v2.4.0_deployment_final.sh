#!/bin/bash
# patch_v2.4.0_deployment_final.sh
# Script to fix remaining issues in the Client360 Dashboard v2.4.0 deployment

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
echo -e "${BLUE}= Client360 Dashboard v2.4.0 Final Deployment Patch   =${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "Started at: $(date)"
echo -e "Deployment directory: $DEPLOY_DIR"
echo ""

# 1. Copy dashboard.js file to the root js directory
echo -e "${YELLOW}Creating dashboard.js in root js directory...${NC}"
cat > "$DEPLOY_DIR/js/dashboard.js" << 'EOF'
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
EOF

# 2. Copy the remaining missing user component files
echo -e "${YELLOW}Creating missing user component files...${NC}"

# Create recent_views.js file if it doesn't exist in the user components directory
if [ ! -f "$DEPLOY_DIR/js/components/user/recent_views.js" ]; then
  cat > "$DEPLOY_DIR/js/components/user/recent_views.js" << 'EOF'
/**
 * @file recent_views.js
 * @description Tracks and manages recently viewed items in the Client360 Dashboard
 * @version v2.4.0
 */

/**
 * Class for managing recently viewed items in the dashboard
 */
class RecentViews {
  /**
   * Create a new RecentViews instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      userPreferences: null, // Optional UserPreferences instance for sync
      storageKey: 'client360_recent_views',
      maxItemsPerType: 10, // Maximum number of items to store per type
      maxTotalItems: 50, // Maximum total items across all types
      localStorage: true, // Whether to use localStorage as fallback
      ...config
    };

    // Map to store recent items by type
    this.recentItems = new Map();
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Load saved items
    this._loadFromStorage();
    
    // Bind methods
    this.addItem = this.addItem.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.getRecentItems = this.getRecentItems.bind(this);
    this.clearAllItems = this.clearAllItems.bind(this);
    this.clearItemsByType = this.clearItemsByType.bind(this);
  }

  /**
   * Add an item to recent views
   * @param {Object} item - Item to add with at least id, type, and name properties
   * @returns {Promise<Object>} - The added item with metadata
   */
  async addItem(item) {
    if (!item || !item.id || !item.type) {
      throw new Error('Item must have at least id and type properties');
    }

    // Get existing items for this type
    if (!this.recentItems.has(item.type)) {
      this.recentItems.set(item.type, []);
    }
    
    const typeItems = this.recentItems.get(item.type);
    
    // Check if item already exists
    const existingIndex = typeItems.findIndex(i => i.id === item.id);
    
    // Create the full item object with metadata
    const recentItem = {
      ...item,
      timestamp: new Date().toISOString(),
      viewCount: 1
    };
    
    // If exists, update it and move to top
    if (existingIndex !== -1) {
      recentItem.viewCount = typeItems[existingIndex].viewCount + 1;
      typeItems.splice(existingIndex, 1);
    }
    
    // Add to beginning of the array
    typeItems.unshift(recentItem);
    
    // Enforce maximum items per type
    this._enforceMaxItems(item.type);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('itemAdded', recentItem);
    
    return recentItem;
  }

  /**
   * Remove an item from recent views
   * @param {string} itemId - ID of the item to remove
   * @param {string} itemType - Type of the item to remove
   * @returns {Promise<boolean>} - True if item was removed, false if not found
   */
  async removeItem(itemId, itemType) {
    // Get items for this type
    if (!this.recentItems.has(itemType)) {
      return false;
    }
    
    const typeItems = this.recentItems.get(itemType);
    
    // Find and remove the item
    const existingIndex = typeItems.findIndex(i => i.id === itemId);
    if (existingIndex === -1) {
      return false;
    }
    
    // Store the item for the event
    const removedItem = typeItems[existingIndex];
    
    // Remove the item
    typeItems.splice(existingIndex, 1);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('itemRemoved', removedItem);
    
    return true;
  }

  /**
   * Get recent items, optionally filtered by type
   * @param {string|null} itemType - Type of items to get, or null for all
   * @param {number|null} limit - Maximum number of items to return, or null for all
   * @returns {Array<Object>} - Array of recent items
   */
  getRecentItems(itemType = null, limit = null) {
    let items = [];
    
    if (itemType) {
      // Get items for specific type
      items = this.recentItems.has(itemType) 
        ? [...this.recentItems.get(itemType)]
        : [];
    } else {
      // Get all items across all types
      for (const typeItems of this.recentItems.values()) {
        items = items.concat(typeItems);
      }
      
      // Sort by timestamp (most recent first)
      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Apply limit if specified
    if (limit !== null && limit > 0) {
      items = items.slice(0, limit);
    }
    
    return items;
  }

  /**
   * Get the count of recent items by type
   * @param {string|null} itemType - Type of items to count, or null for all
   * @returns {number} - Count of items
   */
  getItemCount(itemType = null) {
    if (itemType) {
      return this.recentItems.has(itemType) 
        ? this.recentItems.get(itemType).length
        : 0;
    } else {
      // Count all items
      let count = 0;
      for (const items of this.recentItems.values()) {
        count += items.length;
      }
      return count;
    }
  }

  /**
   * Clear all recent items
   * @returns {Promise<void>}
   */
  async clearAllItems() {
    this.recentItems.clear();
    await this._saveToStorage();
    this._emitEvent('allItemsCleared');
  }

  /**
   * Clear recent items of a specific type
   * @param {string} itemType - Type of items to clear
   * @returns {Promise<boolean>} - True if items were cleared, false if type not found
   */
  async clearItemsByType(itemType) {
    if (!this.recentItems.has(itemType)) {
      return false;
    }
    
    // Store count for the event
    const count = this.recentItems.get(itemType).length;
    
    // Clear items
    this.recentItems.delete(itemType);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('itemsCleared', { type: itemType, count });
    
    return true;
  }

  /**
   * Get all available item types
   * @returns {Array<string>} - Array of item type strings
   */
  getItemTypes() {
    return Array.from(this.recentItems.keys());
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Function to remove the listener
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(callback);
    
    // Return a function to remove the listener
    return () => {
      this.removeEventListener(event, callback);
    };
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {boolean} - True if listener was removed, false if not found
   */
  removeEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      return false;
    }
    
    return this.eventListeners.get(event).delete(callback);
  }

  /**
   * Load items from storage
   * @private
   */
  _loadFromStorage() {
    try {
      let savedItems = null;
      
      // Try to load from UserPreferences if available
      if (this.config.userPreferences) {
        savedItems = this.config.userPreferences.getPreference('recentViews');
      }
      
      // Fall back to localStorage if enabled and items not found in UserPreferences
      if (!savedItems && this.config.localStorage) {
        const storedData = localStorage.getItem(this.config.storageKey);
        if (storedData) {
          savedItems = JSON.parse(storedData);
        }
      }
      
      // Initialize recentItems from loaded data
      if (savedItems) {
        this.recentItems.clear();
        
        // Process saved data
        if (Array.isArray(savedItems)) {
          // Old format: flat array of items
          for (const item of savedItems) {
            if (item && item.type) {
              if (!this.recentItems.has(item.type)) {
                this.recentItems.set(item.type, []);
              }
              this.recentItems.get(item.type).push(item);
            }
          }
        } else if (typeof savedItems === 'object') {
          // New format: object with types as keys
          for (const [type, items] of Object.entries(savedItems)) {
            if (Array.isArray(items)) {
              this.recentItems.set(type, items);
            }
          }
        }
        
        // Ensure each type's items are sorted by timestamp
        for (const [type, items] of this.recentItems.entries()) {
          this.recentItems.set(
            type,
            items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          );
        }
      }
    } catch (error) {
      console.error('Error loading recent items from storage:', error);
      // Initialize with empty data on error
      this.recentItems.clear();
    }
  }

  /**
   * Save items to storage
   * @private
   * @returns {Promise<void>}
   */
  async _saveToStorage() {
    try {
      // Convert Map to object for storage
      const dataToSave = {};
      for (const [type, items] of this.recentItems.entries()) {
        dataToSave[type] = items;
      }
      
      // Save to UserPreferences if available
      if (this.config.userPreferences) {
        await this.config.userPreferences.setPreference('recentViews', dataToSave);
      }
      
      // Also save to localStorage if enabled
      if (this.config.localStorage) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error('Error saving recent items to storage:', error);
      // Emit error event
      this._emitEvent('error', { message: 'Failed to save recent items', error });
    }
  }

  /**
   * Enforce maximum items per type
   * @param {string} itemType - Type of items to enforce limit on
   * @private
   */
  _enforceMaxItems(itemType) {
    const typeItems = this.recentItems.get(itemType);
    
    // Enforce max items per type
    if (typeItems.length > this.config.maxItemsPerType) {
      typeItems.splice(this.config.maxItemsPerType);
    }
    
    // Check total items across all types
    let totalItems = 0;
    for (const items of this.recentItems.values()) {
      totalItems += items.length;
    }
    
    // If over total limit, remove oldest items
    if (totalItems > this.config.maxTotalItems) {
      // Flatten all items into a single array with type info
      const allItems = [];
      for (const [type, items] of this.recentItems.entries()) {
        for (const item of items) {
          allItems.push({ ...item, _type: type });
        }
      }
      
      // Sort by timestamp (oldest first)
      allItems.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Remove oldest items until under limit
      const excess = totalItems - this.config.maxTotalItems;
      const itemsToRemove = allItems.slice(0, excess);
      
      // Remove each item from its type array
      for (const item of itemsToRemove) {
        const typeItems = this.recentItems.get(item._type);
        const index = typeItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          typeItems.splice(index, 1);
        }
      }
    }
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  _emitEvent(event, data = null) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    for (const callback of this.eventListeners.get(event)) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    }
  }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecentViews;
} else {
  window.RecentViews = RecentViews;
}
EOF
fi

# Create export_templates.js file if it doesn't exist in the user components directory
if [ ! -f "$DEPLOY_DIR/js/components/user/export_templates.js" ]; then
  cat > "$DEPLOY_DIR/js/components/user/export_templates.js" << 'EOF'
/**
 * @file export_templates.js
 * @description Manages template configurations for exporting dashboard data
 * @version v2.4.0
 */

/**
 * Class for managing export templates
 */
class ExportTemplates {
  /**
   * Create a new ExportTemplates instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      userPreferences: null, // Optional UserPreferences instance for sync
      storageKey: 'client360_export_templates',
      maxTemplates: 20,
      localStorage: true, // Whether to use localStorage as fallback
      supportedFormats: ['xlsx', 'csv', 'pdf', 'png', 'json'],
      defaultExporters: {
        xlsx: null, // Will be initialized on first use
        csv: null,
        pdf: null,
        png: null,
        json: null
      },
      ...config
    };

    // Map to store templates by ID
    this.templates = new Map();
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Load saved templates
    this._loadFromStorage();
    
    // Bind methods
    this.createTemplate = this.createTemplate.bind(this);
    this.updateTemplate = this.updateTemplate.bind(this);
    this.deleteTemplate = this.deleteTemplate.bind(this);
    this.getTemplate = this.getTemplate.bind(this);
    this.getAllTemplates = this.getAllTemplates.bind(this);
    this.exportWithTemplate = this.exportWithTemplate.bind(this);
  }

  /**
   * Create a new export template
   * @param {Object} template - Template configuration
   * @returns {Promise<Object>} - The created template with ID
   */
  async createTemplate(template) {
    if (!template || !template.name || !template.format) {
      throw new Error('Template must have at least name and format properties');
    }
    
    // Validate format
    if (!this.config.supportedFormats.includes(template.format)) {
      throw new Error(`Unsupported format: ${template.format}. Supported formats: ${this.config.supportedFormats.join(', ')}`);
    }
    
    // Generate unique ID
    const templateId = `template_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Create full template object with metadata
    const newTemplate = {
      id: templateId,
      ...template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };
    
    // Store template
    this.templates.set(templateId, newTemplate);
    
    // Enforce maximum templates
    this._enforceMaxTemplates();
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('templateCreated', newTemplate);
    
    return newTemplate;
  }

  /**
   * Update an existing template
   * @param {string} templateId - ID of the template to update
   * @param {Object} updates - Properties to update
   * @returns {Promise<Object>} - The updated template
   */
  async updateTemplate(templateId, updates) {
    // Check if template exists
    if (!this.templates.has(templateId)) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Get existing template
    const existingTemplate = this.templates.get(templateId);
    
    // Create updated template
    const updatedTemplate = {
      ...existingTemplate,
      ...updates,
      id: templateId, // Ensure ID is not changed
      updatedAt: new Date().toISOString()
    };
    
    // Validate format if it's being updated
    if (updates.format && !this.config.supportedFormats.includes(updates.format)) {
      throw new Error(`Unsupported format: ${updates.format}. Supported formats: ${this.config.supportedFormats.join(', ')}`);
    }
    
    // Update template
    this.templates.set(templateId, updatedTemplate);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('templateUpdated', updatedTemplate);
    
    return updatedTemplate;
  }

  /**
   * Delete a template
   * @param {string} templateId - ID of the template to delete
   * @returns {Promise<boolean>} - True if template was deleted, false if not found
   */
  async deleteTemplate(templateId) {
    // Check if template exists
    if (!this.templates.has(templateId)) {
      return false;
    }
    
    // Store template for event
    const deletedTemplate = this.templates.get(templateId);
    
    // Delete template
    this.templates.delete(templateId);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('templateDeleted', deletedTemplate);
    
    return true;
  }

  /**
   * Get a template by ID
   * @param {string} templateId - ID of the template to get
   * @returns {Object|null} - The template or null if not found
   */
  getTemplate(templateId) {
    return this.templates.has(templateId) 
      ? { ...this.templates.get(templateId) }
      : null;
  }

  /**
   * Get all templates, optionally filtered by format
   * @param {string|null} format - Format to filter by, or null for all
   * @returns {Array<Object>} - Array of templates
   */
  getAllTemplates(format = null) {
    let templates = Array.from(this.templates.values());
    
    // Filter by format if specified
    if (format) {
      templates = templates.filter(t => t.format === format);
    }
    
    // Sort by updated date (newest first)
    templates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    return templates;
  }

  /**
   * Export data using a template
   * @param {string} templateId - ID of the template to use
   * @param {*} data - Data to export
   * @param {Object} options - Additional export options
   * @returns {Promise<*>} - The export result
   */
  async exportWithTemplate(templateId, data, options = {}) {
    // Check if template exists
    if (!this.templateId && !this.templates.has(templateId)) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Get template
    const template = this.templates.get(templateId);
    
    // Update usage count
    template.usageCount += 1;
    template.lastUsed = new Date().toISOString();
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('templateUsed', { 
      templateId,
      template,
      dataSize: Array.isArray(data) ? data.length : 1
    });
    
    // Perform export
    return await this._performExport(template, data, options);
  }

  /**
   * Register a custom exporter for a format
   * @param {string} format - Format to register exporter for
   * @param {Function} exporterFn - Exporter function
   */
  registerExporter(format, exporterFn) {
    if (typeof exporterFn !== 'function') {
      throw new Error('Exporter must be a function');
    }
    
    // Add to supported formats if not already included
    if (!this.config.supportedFormats.includes(format)) {
      this.config.supportedFormats.push(format);
    }
    
    // Register exporter
    this.config.defaultExporters[format] = exporterFn;
    
    // Emit event
    this._emitEvent('exporterRegistered', { format });
  }

  /**
   * Get supported export formats
   * @returns {Array<string>} - Array of supported format strings
   */
  getSupportedFormats() {
    return [...this.config.supportedFormats];
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Function to remove the listener
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(callback);
    
    // Return a function to remove the listener
    return () => {
      this.removeEventListener(event, callback);
    };
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {boolean} - True if listener was removed, false if not found
   */
  removeEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      return false;
    }
    
    return this.eventListeners.get(event).delete(callback);
  }

  /**
   * Perform an export using a template
   * @param {Object} template - Template to use
   * @param {*} data - Data to export
   * @param {Object} options - Additional export options
   * @returns {Promise<*>} - The export result
   * @private
   */
  async _performExport(template, data, options = {}) {
    const format = template.format;
    
    // Get exporter for this format
    let exporter = this.config.defaultExporters[format];
    
    // If no exporter is registered, try to get a default one
    if (!exporter) {
      exporter = await this._getDefaultExporter(format);
    }
    
    if (!exporter) {
      throw new Error(`No exporter available for format: ${format}`);
    }
    
    // Merge template options with provided options
    const exportOptions = {
      ...template.options,
      ...options,
      format,
      templateId: template.id,
      templateName: template.name
    };
    
    // Perform the export
    try {
      const result = await exporter(data, exportOptions);
      
      // Emit success event
      this._emitEvent('exportSuccess', {
        templateId: template.id,
        format,
        dataSize: Array.isArray(data) ? data.length : 1
      });
      
      return result;
    } catch (error) {
      // Emit error event
      this._emitEvent('exportError', {
        templateId: template.id,
        format,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get a default exporter for a format
   * @param {string} format - Format to get exporter for
   * @returns {Promise<Function|null>} - The exporter function or null if not available
   * @private
   */
  async _getDefaultExporter(format) {
    switch (format) {
      case 'xlsx':
        // Load XLSX exporter if available
        if (window.ExcelJS) {
          return this._xlsxExporter;
        }
        break;
        
      case 'csv':
        // Simple CSV exporter is always available
        return this._csvExporter;
        
      case 'json':
        // JSON exporter is always available
        return this._jsonExporter;
        
      case 'pdf':
        // Check if PDF generation library is available
        if (window.jsPDF) {
          return this._pdfExporter;
        }
        break;
        
      case 'png':
        // Check if HTML2Canvas is available
        if (window.html2canvas) {
          return this._pngExporter;
        }
        break;
    }
    
    return null;
  }

  /**
   * CSV exporter function
   * @param {Array<Object>} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<string>} - CSV string
   * @private
   */
  async _csvExporter(data, options = {}) {
    if (!Array.isArray(data)) {
      throw new Error('CSV export requires array data');
    }
    
    // Get column headers from first item or options
    const headers = options.headers || Object.keys(data[0] || {});
    
    // Generate CSV header row
    let csv = headers.map(header => {
      // Quote headers with commas or quotes
      const needsQuotes = header.includes(',') || header.includes('"');
      return needsQuotes ? `"${header.replace(/"/g, '""')}"` : header;
    }).join(',') + '\n';
    
    // Generate CSV data rows
    for (const item of data) {
      const row = headers.map(header => {
        const value = item[header];
        const strValue = value === null || value === undefined ? '' : String(value);
        
        // Quote values with commas or quotes
        const needsQuotes = strValue.includes(',') || strValue.includes('"');
        return needsQuotes ? `"${strValue.replace(/"/g, '""')}"` : strValue;
      }).join(',');
      
      csv += row + '\n';
    }
    
    // Handle downloading if requested
    if (options.download) {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename || `export_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    return csv;
  }

  /**
   * JSON exporter function
   * @param {*} data - Data to export
   * @param {Object} options - Export options
   * @returns {Promise<string>} - JSON string
   * @private
   */
  async _jsonExporter(data, options = {}) {
    const jsonString = JSON.stringify(data, null, options.indent || 2);
    
    // Handle downloading if requested
    if (options.download) {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename || `export_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    return jsonString;
  }

  /**
   * Load templates from storage
   * @private
   */
  _loadFromStorage() {
    try {
      let savedTemplates = null;
      
      // Try to load from UserPreferences if available
      if (this.config.userPreferences) {
        savedTemplates = this.config.userPreferences.getPreference('exportTemplates');
      }
      
      // Fall back to localStorage if enabled and templates not found in UserPreferences
      if (!savedTemplates && this.config.localStorage) {
        const storedData = localStorage.getItem(this.config.storageKey);
        if (storedData) {
          savedTemplates = JSON.parse(storedData);
        }
      }
      
      // Initialize templates from loaded data
      if (savedTemplates) {
        this.templates.clear();
        
        // Process saved data
        if (Array.isArray(savedTemplates)) {
          // Handle array format
          for (const template of savedTemplates) {
            if (template && template.id) {
              this.templates.set(template.id, template);
            }
          }
        } else if (typeof savedTemplates === 'object') {
          // Handle object format with IDs as keys
          for (const [id, template] of Object.entries(savedTemplates)) {
            if (template) {
              this.templates.set(id, { ...template, id });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading export templates from storage:', error);
      // Initialize with empty data on error
      this.templates.clear();
    }
  }

  /**
   * Save templates to storage
   * @private
   * @returns {Promise<void>}
   */
  async _saveToStorage() {
    try {
      // Convert Map to object for storage
      const dataToSave = {};
      for (const [id, template] of this.templates.entries()) {
        dataToSave[id] = template;
      }
      
      // Save to UserPreferences if available
      if (this.config.userPreferences) {
        await this.config.userPreferences.setPreference('exportTemplates', dataToSave);
      }
      
      // Also save to localStorage if enabled
      if (this.config.localStorage) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error('Error saving export templates to storage:', error);
      // Emit error event
      this._emitEvent('error', { message: 'Failed to save export templates', error });
    }
  }

  /**
   * Enforce maximum templates
   * @private
   */
  _enforceMaxTemplates() {
    // Check if over limit
    if (this.templates.size <= this.config.maxTemplates) {
      return;
    }
    
    // Get all templates as array
    const templates = Array.from(this.templates.values());
    
    // Sort by last used date (oldest first)
    templates.sort((a, b) => {
      // Prioritize by usage count first (least used first)
      if (a.usageCount !== b.usageCount) {
        return a.usageCount - b.usageCount;
      }
      
      // Then by last used date
      const aDate = a.lastUsed ? new Date(a.lastUsed) : new Date(a.createdAt);
      const bDate = b.lastUsed ? new Date(b.lastUsed) : new Date(b.createdAt);
      return aDate - bDate;
    });
    
    // Remove oldest templates until under limit
    const excess = this.templates.size - this.config.maxTemplates;
    const templatesToRemove = templates.slice(0, excess);
    
    // Remove each template
    for (const template of templatesToRemove) {
      this.templates.delete(template.id);
    }
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  _emitEvent(event, data = null) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    for (const callback of this.eventListeners.get(event)) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    }
  }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportTemplates;
} else {
  window.ExportTemplates = ExportTemplates;
}
EOF
fi

# 3. Run the verification script again to see if our fixes worked
echo -e "${YELLOW}Running verification script to check fixes...${NC}"
./verify_v2.4.0_deployment.sh

echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}= Final Patch Completed                               =${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "Finished at: $(date)"
echo -e "If verification still fails, please check the logs for details."