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
  
  // KPI data endpoints
  kpis: {
    simulatedUrl: '/data/sim/kpis.json',
    liveUrl: '/api/kpis/summary',
    fallbackUrl: '/data/kpis.json'
  },
  
  // Tags endpoint configuration
  tags: {
    simulatedUrl: '/data/sim/tags.json',
    liveUrl: '/api/tags?clientOnly=true',
    fallbackUrl: '/data/sim/tags.json'
  },
  
  // Drill-down endpoints
  drilldowns: {
    simulatedUrl: '/data/sim/drilldown/',
    liveUrl: '/api/drilldown?kpi=',
    fallbackUrl: '/data/sim/drilldown/'
  }
};

// Helper functions for endpoint resolution
window.dataConfig.getTagEndpoint = () => {
  return window.dataConfig.isSimulatedData
    ? window.dataConfig.tags.simulatedUrl
    : window.dataConfig.tags.liveUrl;
};

window.dataConfig.getDrilldownEndpoint = (kpi) => {
  const base = window.dataConfig.isSimulatedData
    ? window.dataConfig.drilldowns.simulatedUrl
    : window.dataConfig.drilldowns.liveUrl;
  return window.dataConfig.isSimulatedData
    ? `${base}${kpi}.json`
    : `${base}${kpi}`;
};

// Global state for selected tags
window.selectedTags = [];

console.log('Configuration loaded: Client360 Dashboard v2.4.0');
console.log('Navigation items:', window.navItems.length);
console.log('Data mode:', window.dataConfig.isSimulatedData ? 'Simulated' : 'Live');