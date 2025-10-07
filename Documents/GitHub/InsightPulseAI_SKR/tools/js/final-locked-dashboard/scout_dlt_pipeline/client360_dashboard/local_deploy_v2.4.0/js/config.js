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
    accessToken: 'MAPBOX_TOKEN_PLACEHOLDER',
    style: 'mapbox://styles/mapbox/light-v11',
    initialView: {
      center: [121.0, 14.6], // Manila, Philippines
      zoom: 6
    }
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
  
  // Feature flags
  features: {
    aiInsights: true,
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

console.log('Configuration loaded: Client360 Dashboard v2.4.0');