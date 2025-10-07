/**
 * Client360 Dashboard - Main JavaScript File
 * 
 * This file handles dashboard initialization, data loading, and component integration
 * including the geospatial store map component.
 */

// Dashboard Controller - Main entry point for dashboard functionality
class DashboardController {
  constructor(options = {}) {
    this.options = Object.assign({
      theme: 'tbwa',
      dataMode: 'live', // 'live' or 'sample'
      refreshInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
      debug: false
    }, options);
    
    // Component references
    this.storeMap = null;
    this.charts = {};
    
    // Element references
    this.elements = {
      mapContainer: document.getElementById('store-map'),
      metricSelector: document.getElementById('map-metric-selector'),
      regionFilter: document.getElementById('region-filter'),
      storeTypeFilter: document.getElementById('store-type-filter'),
      dataSourceToggle: document.getElementById('data-source-toggle'),
      dataSourceValue: document.getElementById('data-source-value'),
      dataRefreshTime: document.getElementById('data-refresh-time'),
      kpiGrid: document.querySelector('.kpi-grid')
    };
    
    // Data connector
    this.dataConnector = window.sqlConnector || {
      executeQuery: (query, params) => Promise.resolve([]),
      getDashboardKPIs: () => Promise.resolve({}),
      getRegionalPerformance: () => Promise.resolve([]),
      getStores: () => Promise.resolve([])
    };
    
    // Theme manager
    this.themeManager = {
      getTheme: () => this.options.theme,
      setTheme: (theme) => {
        this.options.theme = theme;
        document.body.setAttribute('data-theme', theme);
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
      },
      onThemeChange: (callback) => {
        document.addEventListener('themeChanged', callback);
      }
    };
    
    // Make theme manager available globally
    window.themeManager = this.themeManager;
    
    // Initialize dashboard
    this.init();
  }
  
  async init() {
    console.log('Initializing Client360 Dashboard');
    
    // Apply initial theme
    this.themeManager.setTheme(this.options.theme);
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Set up data source mode
    this._setupDataSourceMode();
    
    // Initialize store map if container exists
    if (this.elements.mapContainer) {
      this._initializeStoreMap();
    }
    
    // Initialize dashboard KPIs
    await this._initializeKPIs();
    
    // Set data refresh time
    this._updateDataRefreshTime();
    
    // Set up auto-refresh for live data
    if (this.options.dataMode === 'live') {
      this._setupAutoRefresh();
    }
    
    // Initialize drill-down components
    this._initializeDrillDowns();
    
    // Log initialization complete
    console.log('Dashboard initialization complete');
  }
  
  _setupEventListeners() {
    // Theme selector
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = this.options.theme;
      themeSelect.addEventListener('change', (e) => {
        this.themeManager.setTheme(e.target.value);
      });
    }
    
    // Data source toggle
    if (this.elements.dataSourceToggle) {
      this.elements.dataSourceToggle.checked = this.options.dataMode === 'live';
      this.elements.dataSourceToggle.addEventListener('change', (e) => {
        this.options.dataMode = e.target.checked ? 'live' : 'sample';
        this.elements.dataSourceValue.textContent = e.target.checked ? 'Live' : 'Sample';
        this._loadDashboardData();
      });
    }
    
    // Map metric selector
    if (this.elements.metricSelector) {
      this.elements.metricSelector.addEventListener('change', (e) => {
        if (this.storeMap) {
          this.storeMap.setMetric(e.target.value);
        }
      });
    }
    
    // Region filter
    if (this.elements.regionFilter) {
      this.elements.regionFilter.addEventListener('change', (e) => {
        this._applyFilters();
      });
    }
    
    // Store type filter
    if (this.elements.storeTypeFilter) {
      this.elements.storeTypeFilter.addEventListener('change', (e) => {
        this._applyFilters();
      });
    }
    
    // Window resize event
    window.addEventListener('resize', this._handleResize.bind(this));
    
    // Store drill-down event
    window.addEventListener('openStoreDetail', this._handleStoreDetail.bind(this));
  }
  
  _setupDataSourceMode() {
    if (this.elements.dataSourceToggle) {
      this.elements.dataSourceToggle.checked = this.options.dataMode === 'live';
      this.elements.dataSourceValue.textContent = this.options.dataMode === 'live' ? 'Live' : 'Sample';
    }
  }
  
  async _initializeStoreMap() {
    // Dynamically load the StoreMap class if not available
    if (typeof StoreMap === 'undefined') {
      try {
        console.log('Loading StoreMap component...');
        
        // Try to load from the compiled JS bundle first
        if (typeof window.StoreMap === 'undefined') {
          // Fallback to loading from the module file
          const storeMapModule = await import('../src/components/store_map.js');
          window.StoreMap = storeMapModule.default || storeMapModule;
        }
      } catch (error) {
        console.error('Error loading StoreMap component:', error);
        return;
      }
    }
    
    // Get initial metric from selector if available
    const initialMetric = this.elements.metricSelector?.value || 'sales_30d';
    
    // Create store map instance
    this.storeMap = new StoreMap('store-map', {
      metricKey: initialMetric,
      showLegend: true,
      enableClustering: false
    });
    
    // Load map data
    await this.storeMap.loadData();
    
    // Apply initial filters if any
    this._applyFilters();
  }
  
  async _initializeKPIs() {
    if (!this.elements.kpiGrid) return;
    
    try {
      // Get KPI data
      const kpiData = await this._fetchKPIData();
      
      // Generate KPI cards
      this.elements.kpiGrid.innerHTML = this._generateKPICards(kpiData);
    } catch (error) {
      console.error('Error initializing KPIs:', error);
      
      // Fallback to sample KPI data
      const sampleKPIs = {
        total_sales: 5678900,
        avg_conversion_rate: 68.5,
        avg_growth_rate: 8.2,
        total_stores: 128,
        brand_sentiment: 76.3
      };
      
      this.elements.kpiGrid.innerHTML = this._generateKPICards(sampleKPIs);
    }
  }
  
  async _fetchKPIData() {
    // Try to get KPI data from the data connector
    if (window.sqlConnector) {
      return await window.sqlConnector.getDashboardKPIs();
    }
    
    // Fallback to sample data
    return {
      total_sales: 5678900,
      avg_conversion_rate: 68.5,
      avg_growth_rate: 8.2,
      total_stores: 128,
      brand_sentiment: 76.3
    };
  }
  
  _generateKPICards(kpiData) {
    return `
      <div class="kpi-card">
        <div class="kpi-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v6m0 0 4-4m-4 4L8 4m12 8h-6m0 0 4 4m-4-4 4-4M4 12h6m0 0-4 4m4-4-4-4m8 14v-6m0 0 4-4m-4 4-4-4" />
          </svg>
        </div>
        <div class="kpi-content">
          <h3 class="kpi-title">Total Sales</h3>
          <div class="kpi-value">₱ ${this._formatNumber(kpiData.total_sales || 0)}</div>
          <div class="kpi-change positive">+${kpiData.avg_growth_rate?.toFixed(1) || 0}%</div>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
        <div class="kpi-content">
          <h3 class="kpi-title">Brand Sentiment</h3>
          <div class="kpi-value">${kpiData.brand_sentiment?.toFixed(1) || 0}%</div>
          <div class="kpi-change positive">+3.2%</div>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 10V7c0-2.2 1.8-4 4-4s4 1.8 4 4v3" />
            <rect width="16" height="12" x="4" y="9" rx="2" />
            <path d="M12 15v2" />
          </svg>
        </div>
        <div class="kpi-content">
          <h3 class="kpi-title">Conversion Rate</h3>
          <div class="kpi-value">${kpiData.avg_conversion_rate?.toFixed(1) || 0}%</div>
          <div class="kpi-change positive">+1.5%</div>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 7h-9M14 17H5" />
            <circle cx="17" cy="17" r="3" />
            <circle cx="7" cy="7" r="3" />
          </svg>
        </div>
        <div class="kpi-content">
          <h3 class="kpi-title">Active Stores</h3>
          <div class="kpi-value">${kpiData.total_stores || 0}</div>
          <div class="kpi-change positive">+12</div>
        </div>
      </div>
    `;
  }
  
  _updateDataRefreshTime() {
    if (this.elements.dataRefreshTime) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
      
      this.elements.dataRefreshTime.textContent = `Today at ${formattedHours}:${formattedMinutes} ${ampm}`;
    }
  }
  
  _setupAutoRefresh() {
    // Clear any existing refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Set up new refresh interval
    this.refreshInterval = setInterval(() => {
      this._loadDashboardData();
      this._updateDataRefreshTime();
    }, this.options.refreshInterval);
  }
  
  async _loadDashboardData() {
    // Refresh store map data
    if (this.storeMap) {
      await this.storeMap.loadData();
    }
    
    // Refresh KPI data
    await this._initializeKPIs();
    
    // Refresh any other dashboard components
    this._updateDataRefreshTime();
  }
  
  _applyFilters() {
    // Get filter values
    const regionFilter = this.elements.regionFilter?.value || 'all';
    const storeTypeFilter = this.elements.storeTypeFilter?.value || 'all';
    
    // Apply filters to store map
    if (this.storeMap) {
      this.storeMap.applyFilters({
        region: regionFilter,
        storeType: storeTypeFilter
      });
    }
  }
  
  _handleResize() {
    // Handle map resize
    if (this.storeMap) {
      this.storeMap.resize();
    }
    
    // Handle other responsive components
  }
  
  _handleStoreDetail(event) {
    const { storeId, store } = event.detail;
    
    // Open drill-down drawer if available
    if (typeof window.toggleDrillDown === 'function') {
      window.toggleDrillDown('storeDrillDown');
    }
    
    console.log('Store detail opened:', storeId);
  }
  
  _initializeDrillDowns() {
    // Create store drill-down container if it doesn't exist
    if (!document.getElementById('storeDrillDown')) {
      const drillDownContainer = document.querySelector('#drillDownDrawer > div > div:nth-child(2)');
      if (drillDownContainer) {
        const drillDownContent = document.createElement('div');
        drillDownContent.id = 'storeDrillDown';
        drillDownContent.className = 'hidden';
        drillDownContainer.appendChild(drillDownContent);
      }
    }
    
    // Define toggle function if it doesn't exist
    if (typeof window.toggleDrillDown !== 'function') {
      window.toggleDrillDown = (id) => {
        const drillDown = document.getElementById(id);
        if (drillDown) {
          const drawer = document.getElementById('drillDownDrawer');
          const isHidden = drillDown.classList.contains('hidden');
          
          // Hide all drill downs
          document.querySelectorAll('#drillDownDrawer > div > div:nth-child(2) > div').forEach(el => {
            el.classList.add('hidden');
          });
          
          // Show/hide the requested drill down
          if (isHidden) {
            drillDown.classList.remove('hidden');
            drawer.classList.add('open');
          } else {
            drawer.classList.remove('open');
          }
        }
      };
    }
  }
  
  // Helper functions
  _formatNumber(num) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }
}

// Initialize dashboard on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM ready, initializing dashboard');
  
  // Get theme from URL or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const savedTheme = localStorage.getItem('dashboard_theme') || 'tbwa';
  const theme = urlParams.get('theme') || savedTheme;
  
  // Set initial data mode from URL or localStorage
  const savedDataMode = localStorage.getItem('dashboard_data_mode') || 'sample';
  const dataMode = urlParams.get('dataMode') || savedDataMode;
  
  // Create dashboard controller instance
  window.dashboardController = new DashboardController({
    theme: theme,
    dataMode: dataMode,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    debug: urlParams.get('debug') === 'true'
  });
  
  // Save theme and data mode preference to localStorage when they change
  document.addEventListener('themeChanged', (e) => {
    localStorage.setItem('dashboard_theme', e.detail.theme);
  });
  
  document.getElementById('data-source-toggle')?.addEventListener('change', (e) => {
    localStorage.setItem('dashboard_data_mode', e.target.checked ? 'live' : 'sample');
  });
});