/**
 * Client360 Dashboard v2.4.0 Configuration
 * Core configuration settings for dashboard components and features
 */

// Global configuration object
window.config = {
  // Application settings
  app: {
    version: '2.4.0',
    name: 'Client360 Dashboard',
    environment: 'production', // production, staging, development
    debug: false,
    telemetryEnabled: true
  },
  
  // API endpoints
  api: {
    baseUrl: 'https://api.client360.tbwa.com/v2',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // milliseconds
  },
  
  // Azure OpenAI API configuration
  azureOpenAI: {
    endpoint: 'AZURE_OPENAI_ENDPOINT_PLACEHOLDER',
    apiKey: 'AZURE_OPENAI_KEY_PLACEHOLDER',
    apiVersion: '2023-05-15',
    model: 'gpt-4o',
    embeddingModel: 'text-embedding-3-small',
    maxTokens: 8192,
    temperature: 0.7,
    fallbackEnabled: true
  },
  
  // Mapbox configuration for map components
  mapbox: {
    accessToken: 'pk.eyJ1IjoiY2xpZW50MzYwIiwiYSI6ImNscGRocDNsdzA5ZmcybXF2ZXU3N21vdDkifQ.placeholder-key',
    style: 'mapbox://styles/mapbox/light-v11',
    initialView: {
      center: [121.0, 14.6], // Manila, Philippines
      zoom: 6
    },
    fallbackEnabled: true,
    fallbackMessage: 'Map temporarily unavailable. Please refresh the page.'
  },
  
  // Data source configuration
  dataSources: {
    primary: {
      type: 'sql',
      connectionString: 'CONN_STRING_PLACEHOLDER',
      enabled: true
    },
    simulated: {
      type: 'json',
      dataPath: '/data/simulated',
      enabled: true
    },
    parquet: {
      type: 'parquet',
      dataPath: '/data/parquet',
      enabled: true
    }
  },
  
  // AI models configuration
  aiModels: [
    {
      id: 'azure-openai',
      name: 'Azure OpenAI',
      provider: 'azure',
      version: 'gpt-4o',
      priority: 1, // Primary model
      capabilities: ['completion', 'chat', 'embedding']
    },
    {
      id: 'parquet-fallback',
      name: 'Parquet Data Store',
      provider: 'local',
      priority: 2, // First fallback
      capabilities: ['completion']
    },
    {
      id: 'synthetic-insights',
      name: 'Synthetic Insights Generator',
      provider: 'local',
      priority: 3, // Last resort fallback
      capabilities: ['completion', 'chat']
    }
  ],
  
  // Map layers configuration
  mapLayers: [
    {
      id: 'regions',
      name: 'Regions',
      type: 'geojson',
      source: '/data/regions.geojson',
      visible: true,
      legendItems: [
        {
          type: 'gradient',
          colors: ['#f7fbff', '#08306b'],
          min: '₱0',
          max: '₱100K+'
        }
      ]
    },
    {
      id: 'municipalities',
      name: 'Municipalities',
      type: 'geojson',
      source: '/data/municipalities.geojson',
      visible: false,
      legendItems: [
        {
          type: 'gradient',
          colors: ['#f7fbff', '#08306b'],
          min: '₱0',
          max: '₱50K+'
        }
      ]
    },
    {
      id: 'stores',
      name: 'Store Locations',
      type: 'geojson',
      source: '/data/stores.geojson',
      visible: true,
      legendItems: [
        {
          type: 'color',
          color: '#1e88e5',
          label: 'Store Location'
        }
      ]
    },
    {
      id: 'heatmap',
      name: 'Sales Heatmap',
      type: 'heatmap',
      source: '/data/stores.geojson',
      visible: true,
      legendItems: [
        {
          type: 'gradient',
          colors: ['#9ecae1', '#2171b5', '#08306b'],
          min: 'Low',
          max: 'High'
        }
      ]
    }
  ],
  
  // User preferences default settings
  preferences: {
    defaultLayout: 'default',
    theme: 'light', // light, dark, system
    showTutorial: true,
    notifications: {
      enabled: true,
      types: {
        insights: true,
        alerts: true,
        system: true
      }
    },
    dashboard: {
      compactMode: false,
      refreshInterval: 300000, // 5 minutes
      defaultDateRange: 'last30days'
    }
  },
  
  // Navigation items (PRD-compliant only)
  navigation: [
    {
      key: "overview",
      label: "Overview",
      icon: "fas fa-chart-bar",
      route: "/",
      section: "overview",
      description: "Key performance metrics and insights",
      active: true,
      prdApproved: true
    },
    {
      key: "sales",
      label: "Sales Analytics",
      icon: "fas fa-chart-line",
      route: "/sales",
      section: "sales",
      description: "Sales performance and trends",
      active: false,
      prdApproved: true
    },
    {
      key: "customer",
      label: "Customer Insights",
      icon: "fas fa-users",
      route: "/customer",
      section: "customer",
      description: "Customer behavior and segmentation",
      active: false,
      prdApproved: true
    },
    {
      key: "regional",
      label: "Regional Analysis",
      icon: "fas fa-map-marked-alt",
      route: "/regional",
      section: "regional",
      description: "Geographic performance breakdown",
      active: false,
      prdApproved: true
    },
    {
      key: "brands",
      label: "Brand Performance",
      icon: "fas fa-tag",
      route: "/brands",
      section: "brands",
      description: "Brand-level metrics and analysis",
      active: false,
      prdApproved: true
    },
    {
      key: "device-health",
      label: "Device Health",
      icon: "fas fa-heartbeat",
      route: "/device-health",
      section: "device-health",
      description: "Device monitoring and status",
      active: false,
      prdApproved: true
    }
  ],

  // Feature flags
  features: {
    aiInsights: false, // Removed from PRD-approved nav
    enhancedMaps: true,
    userPersonalization: true,
    dataExport: true,
    realTimeUpdates: true,
    offlineMode: true,
    tutorialMode: true,
    debugPanel: false
  },
  
  // Performance settings
  performance: {
    enableCaching: true,
    cacheLifetime: 3600, // 1 hour
    lazyLoadComponents: true,
    prefetchData: true,
    useWebWorkers: true,
    compression: true
  }
};

// Global navigation reference for easy access
window.navItems = window.config.navigation;

// Data configuration for dynamic endpoint switching
window.dataConfig = {
  // Detect if we're in simulated data mode
  isSimulatedData: window.location.search.includes('demo=true') || 
                   window.demoMode === true ||
                   window.config.app.environment === 'demo',
  
  // Brand performance endpoint configuration
  brands: {
    simulatedUrl: '/data/sim/brands.json',
    liveUrl: '/api/brands?top=6&clientOnly=true',
    fallbackUrl: '/data/brands.json'
  },
  
  // Other data endpoints
  kpis: {
    simulatedUrl: '/data/sim/kpis.json',
    liveUrl: '/api/kpis/summary',
    fallbackUrl: '/data/kpis.json'
  }
};

console.log('Configuration loaded: Client360 Dashboard v2.4.0');
console.log('Navigation items:', window.navItems.length);
console.log('Data mode:', window.dataConfig.isSimulatedData ? 'Simulated' : 'Live');