/**
 * Dashboard Integrator
 * 
 * This script integrates the dashboard with the Medallion Data Connector
 * and provides the toggle functionality between real and simulated data.
 */

class DashboardIntegrator {
  /**
   * Initialize the dashboard integrator
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    // Default configuration
    this.config = {
      dataToggleContainerId: options.dataToggleContainerId || 'data-source-toggle-container',
      defaultUseRealData: options.defaultUseRealData !== undefined ? options.defaultUseRealData : false,
      onDataSourceChange: options.onDataSourceChange || (() => {}),
      onError: options.onError || ((error) => console.error('Dashboard Integrator Error:', error)),
      enableConsoleMessages: options.enableConsoleMessages !== undefined ? options.enableConsoleMessages : true,
      medallionConfig: options.medallionConfig || {},
      dashboardElements: options.dashboardElements || {
        loadingIndicators: '.loading-indicator',
        dataContainers: '.data-container',
        kpiElements: '.kpi-value',
        charts: '.chart-container',
        statusBadges: '.status-badge'
      }
    };
    
    // Initialize data toggle
    this.dataSourceToggle = null;
    
    // Initialize medallion connector
    this.medallionConnector = null;
    
    // Track loaded data
    this.loadedData = {};
    
    // Initialize when DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this.initialize();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    }
  }
  
  /**
   * Initialize the dashboard integrator
   */
  initialize() {
    this.logMessage('Initializing Dashboard Integrator');
    
    // Initialize data source toggle
    this.initializeDataToggle();
    
    // Initialize medallion connector
    this.initializeMedallionConnector();
    
    // Add event listeners
    this.addEventListeners();
    
    // Load initial data
    this.loadDashboardData();
    
    this.logMessage('Dashboard Integrator initialized');
  }
  
  /**
   * Initialize the data source toggle
   */
  initializeDataToggle() {
    // Check if the toggle container exists
    const toggleContainer = document.getElementById(this.config.dataToggleContainerId);
    if (!toggleContainer) {
      this.logMessage('Creating data source toggle container');
      // Create the container if it doesn't exist
      const container = document.createElement('div');
      container.id = this.config.dataToggleContainerId;
      
      // Find a suitable location to insert the toggle
      const headerElement = document.querySelector('header, .header, .dashboard-header');
      if (headerElement) {
        // Insert after the header
        headerElement.parentNode.insertBefore(container, headerElement.nextSibling);
      } else {
        // Insert at the beginning of the body or main content
        const mainContent = document.querySelector('main, .main, .content, .dashboard-content');
        if (mainContent) {
          mainContent.insertBefore(container, mainContent.firstChild);
        } else {
          document.body.insertBefore(container, document.body.firstChild);
        }
      }
    }
    
    // Initialize the data source toggle if it doesn't exist globally
    if (!window.dataSourceToggle) {
      this.logMessage('Creating new DataSourceToggle instance');
      
      // Check if DataSourceToggle class exists
      if (typeof DataSourceToggle !== 'undefined') {
        // Create a new data source toggle
        this.dataSourceToggle = new DataSourceToggle({
          containerId: this.config.dataToggleContainerId,
          defaultUseRealData: this.config.defaultUseRealData,
          onToggle: (useRealData, endpoints) => this.handleDataSourceToggle(useRealData, endpoints)
        });
        
        // Make it globally available
        window.dataSourceToggle = this.dataSourceToggle;
      } else {
        this.logError('DataSourceToggle class not found. Make sure data_source_toggle.js is loaded.');
      }
    } else {
      // Use the existing data source toggle
      this.logMessage('Using existing DataSourceToggle instance');
      this.dataSourceToggle = window.dataSourceToggle;
      
      // Update the toggle callback
      const originalOnToggle = this.dataSourceToggle.onToggle;
      this.dataSourceToggle.onToggle = (useRealData, endpoints) => {
        // Call original handler
        if (originalOnToggle) {
          originalOnToggle(useRealData, endpoints);
        }
        
        // Call our handler
        this.handleDataSourceToggle(useRealData, endpoints);
      };
    }
  }
  
  /**
   * Initialize the medallion data connector
   */
  initializeMedallionConnector() {
    // Check if MedallionDataConnector class exists
    if (typeof MedallionDataConnector !== 'undefined') {
      this.logMessage('Creating MedallionDataConnector instance');
      
      // Create a new medallion data connector
      this.medallionConnector = new MedallionDataConnector({
        useRealData: this.dataSourceToggle ? this.dataSourceToggle.useRealData : this.config.defaultUseRealData,
        onDataSourceChange: (useRealData, endpoints) => this.handleDataSourceChange(useRealData, endpoints),
        onError: (error) => this.handleError(error),
        ...this.config.medallionConfig
      });
      
      // Make it globally available
      window.medallionConnector = this.medallionConnector;
    } else {
      this.logError('MedallionDataConnector class not found. Make sure medallion_data_connector.js is loaded.');
    }
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Add event listeners for manual data refresh buttons
    document.querySelectorAll('.refresh-data-btn, [data-action="refresh-data"]').forEach(button => {
      button.addEventListener('click', () => this.loadDashboardData());
    });
    
    // Add event listeners for data filter changes
    document.querySelectorAll('select[data-filter], input[data-filter]').forEach(filter => {
      filter.addEventListener('change', () => this.handleFilterChange());
    });
  }
  
  /**
   * Handle data source toggle change
   * @param {boolean} useRealData Whether to use real data
   * @param {Object} endpoints Data endpoints
   */
  handleDataSourceToggle(useRealData, endpoints) {
    this.logMessage(`Data source toggled to: ${useRealData ? 'REAL' : 'SIMULATED'}`);
    
    // Show loading indicators
    this.showLoading(true);
    
    // Clear loaded data
    this.loadedData = {};
    
    // Update page UI to reflect data source
    this.updateDataSourceIndicators(useRealData);
    
    // Reload dashboard data
    this.loadDashboardData();
    
    // Call the onDataSourceChange callback
    this.config.onDataSourceChange(useRealData, endpoints);
  }
  
  /**
   * Handle data source change from the medallion connector
   * @param {boolean} useRealData Whether real data is being used
   * @param {Object} endpoints Data endpoints
   */
  handleDataSourceChange(useRealData, endpoints) {
    // This is called when the medallion connector changes data source
    // It might be triggered by the toggle or by other means
    this.logMessage(`Medallion connector data source changed to: ${useRealData ? 'REAL' : 'SIMULATED'}`);
    
    // If we have a data source toggle, update it if needed
    if (this.dataSourceToggle && this.dataSourceToggle.useRealData !== useRealData) {
      this.dataSourceToggle.useRealData = useRealData;
      this.dataSourceToggle.savePreference();
      this.dataSourceToggle.updateUI();
    }
    
    // Update page UI to reflect data source
    this.updateDataSourceIndicators(useRealData);
  }
  
  /**
   * Handle filter change
   */
  handleFilterChange() {
    this.logMessage('Data filters changed, reloading data');
    
    // Show loading indicators
    this.showLoading(true);
    
    // Reload dashboard data with the new filters
    this.loadDashboardData();
  }
  
  /**
   * Handle errors
   * @param {Error} error The error that occurred
   */
  handleError(error) {
    this.logError('Error occurred:', error);
    
    // Hide loading indicators
    this.showLoading(false);
    
    // Show error message
    this.showErrorMessage(error.message);
    
    // Call the onError callback
    this.config.onError(error);
  }
  
  /**
   * Load dashboard data
   */
  async loadDashboardData() {
    // Skip if medallion connector is not initialized
    if (!this.medallionConnector) {
      this.logError('Cannot load data: Medallion connector not initialized');
      return;
    }
    
    try {
      this.logMessage('Loading dashboard data');
      
      // Show loading indicators
      this.showLoading(true);
      
      // Get data filters
      const filters = this.getDataFilters();
      
      // Load data for each dashboard section in parallel
      await Promise.all([
        this.loadOverviewData(filters),
        this.loadCustomerProfileData(filters),
        this.loadStorePerformanceData(filters),
        this.loadProductIntelligenceData(filters),
        this.loadAdvancedAnalyticsData(filters),
        this.loadChoroplethMapData(filters) // Load choropleth map data
      ]);
      
      // Hide loading indicators
      this.showLoading(false);
      
      this.logMessage('Dashboard data loaded successfully');
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Load choropleth map data
   * @param {Object} filters Data filters
   */
  async loadChoroplethMapData(filters) {
    // Check if choropleth map component is available
    const choroplethContainer = document.getElementById('geo-map');
    if (!choroplethContainer || !this.medallionConnector) return;
    
    try {
      this.logMessage('Loading choropleth map data');
      
      // Get map mode from active button
      const activeModeButton = document.querySelector('[data-map-mode].active');
      const mode = activeModeButton ? activeModeButton.getAttribute('data-map-mode') : 'stores';
      
      // Get geographic level
      const geoLevelSelect = document.getElementById('geoLevel');
      const geoLevel = geoLevelSelect ? geoLevelSelect.value : 'barangay';
      
      // Add brand filter if available
      const brandFilter = document.getElementById('brandFilter');
      if (brandFilter && brandFilter.value !== 'all') {
        filters.brandFilter = brandFilter.value;
      }
      
      // Add time filter if available
      const timeFilter = document.getElementById('timeFilter');
      if (timeFilter) {
        filters.days = parseInt(timeFilter.value, 10);
      }
      
      // Get choropleth data from medallion connector
      const data = await this.medallionConnector.getChoroplethData(mode, geoLevel, filters);
      
      // If choropleth map instance exists, update it
      if (window.choroplethMap) {
        window.choroplethMap.updateMode(mode);
        window.choroplethMap.updateGeoLevel(geoLevel);
        window.choroplethMap.updateData(data);
      } else {
        // Otherwise, initialize it
        this.initializeChoroplethMap(mode, geoLevel, data);
      }
      
      return data;
    } catch (error) {
      this.logError('Error loading choropleth map data:', error);
      throw error;
    }
  }
  
  /**
   * Initialize choropleth map
   * @param {string} mode Map mode
   * @param {string} geoLevel Geographic level
   * @param {Object} data Map data
   */
  initializeChoroplethMap(mode, geoLevel, data) {
    // Check if ChoroplethMap class is available
    if (typeof ChoroplethMap === 'undefined') {
      console.warn('ChoroplethMap class not found. Make sure choropleth_map.js is loaded.');
      
      // Try to load the script
      const script = document.createElement('script');
      script.src = 'js/choropleth_map.js';
      script.onload = () => {
        this.createChoroplethMap(mode, geoLevel, data);
      };
      document.head.appendChild(script);
    } else {
      this.createChoroplethMap(mode, geoLevel, data);
    }
  }
  
  /**
   * Create choropleth map instance
   * @param {string} mode Map mode
   * @param {string} geoLevel Geographic level
   * @param {Object} data Map data
   */
  createChoroplethMap(mode, geoLevel, data) {
    // Get dark mode preference
    const darkModeEnabled = document.body.classList.contains('dark-mode');
    
    // Create map instance
    window.choroplethMap = new ChoroplethMap({
      containerId: 'geo-map',
      mode: mode,
      geoLevel: geoLevel,
      data: data,
      darkMode: darkModeEnabled,
      onMapClick: (e, feature) => {
        console.log('Map clicked:', e.latlng, 'Feature:', feature);
        // You could add additional functionality here
      }
    });
    
    // Add event listeners to map mode buttons
    document.querySelectorAll('[data-map-mode]').forEach(button => {
      button.addEventListener('click', () => {
        // Update button active state
        document.querySelectorAll('[data-map-mode]').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update map mode
        const newMode = button.getAttribute('data-map-mode');
        window.choroplethMap.updateMode(newMode);
        
        // Reload map data
        this.loadChoroplethMapData(this.getDataFilters());
      });
    });
    
    // Add event listener to geographic level select
    const geoLevelSelect = document.getElementById('geoLevel');
    if (geoLevelSelect) {
      geoLevelSelect.addEventListener('change', () => {
        window.choroplethMap.updateGeoLevel(geoLevelSelect.value);
        this.loadChoroplethMapData(this.getDataFilters());
      });
    }
    
    // Add event listener to brand filter
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter) {
      brandFilter.addEventListener('change', () => {
        this.loadChoroplethMapData(this.getDataFilters());
      });
    }
    
    // Add event listener to time filter
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
      timeFilter.addEventListener('change', () => {
        this.loadChoroplethMapData(this.getDataFilters());
      });
    }
    
    // Add event listener for dark mode changes
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('change', () => {
        window.choroplethMap.updateDarkMode(darkModeToggle.checked);
      });
    }
  }
  
  /**
   * Load overview data
   * @param {Object} filters Data filters
   */
  async loadOverviewData(filters) {
    try {
      this.logMessage('Loading overview data');
      
      // Load summary data from platinum layer (GenAI insights)
      const summaryData = await this.medallionConnector.getPlatinumData('dashboard-summary', filters);
      
      // Store the data
      this.loadedData.overview = summaryData;
      
      // Update overview section in the dashboard
      this.updateOverviewSection(summaryData);
      
      return summaryData;
    } catch (error) {
      this.logError('Error loading overview data:', error);
      throw error;
    }
  }
  
  /**
   * Load customer profile data
   * @param {Object} filters Data filters
   */
  async loadCustomerProfileData(filters) {
    try {
      this.logMessage('Loading customer profile data');
      
      // Load customer data from gold layer
      const customerData = await this.medallionConnector.getGoldData('customer-segments', filters);
      
      // Store the data
      this.loadedData.customerProfile = customerData;
      
      // Update customer profile section in the dashboard
      this.updateCustomerProfileSection(customerData);
      
      return customerData;
    } catch (error) {
      this.logError('Error loading customer profile data:', error);
      throw error;
    }
  }
  
  /**
   * Load store performance data
   * @param {Object} filters Data filters
   */
  async loadStorePerformanceData(filters) {
    try {
      this.logMessage('Loading store performance data');
      
      // Load store performance data from gold layer
      const storeData = await this.medallionConnector.getGoldData('store-performance', filters);
      
      // Store the data
      this.loadedData.storePerformance = storeData;
      
      // Update store performance section in the dashboard
      this.updateStorePerformanceSection(storeData);
      
      return storeData;
    } catch (error) {
      this.logError('Error loading store performance data:', error);
      throw error;
    }
  }
  
  /**
   * Load product intelligence data
   * @param {Object} filters Data filters
   */
  async loadProductIntelligenceData(filters) {
    try {
      this.logMessage('Loading product intelligence data');
      
      // Load product data from gold layer
      const productData = await this.medallionConnector.getGoldData('product-performance', filters);
      
      // Store the data
      this.loadedData.productIntelligence = productData;
      
      // Update product intelligence section in the dashboard
      this.updateProductIntelligenceSection(productData);
      
      return productData;
    } catch (error) {
      this.logError('Error loading product intelligence data:', error);
      throw error;
    }
  }
  
  /**
   * Load advanced analytics data
   * @param {Object} filters Data filters
   */
  async loadAdvancedAnalyticsData(filters) {
    try {
      this.logMessage('Loading advanced analytics data');
      
      // Load insights from platinum layer
      const insightsData = await this.medallionConnector.getPlatinumData('insights', filters);
      
      // Load topic analysis from gold layer
      const topicData = await this.medallionConnector.getGoldData('topic-analysis', filters);
      
      // Combine the data
      const advancedData = {
        insights: insightsData,
        topics: topicData
      };
      
      // Store the data
      this.loadedData.advancedAnalytics = advancedData;
      
      // Update advanced analytics section in the dashboard
      this.updateAdvancedAnalyticsSection(advancedData);
      
      return advancedData;
    } catch (error) {
      this.logError('Error loading advanced analytics data:', error);
      throw error;
    }
  }
  
  /**
   * Update overview section in the dashboard
   * @param {Object} data Overview data
   */
  updateOverviewSection(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data || !data.data.overview) {
      this.logMessage('No overview data to update');
      return;
    }
    
    const overview = data.data.overview;
    
    // Update KPIs
    if (overview.kpis) {
      overview.kpis.forEach(kpi => {
        const kpiElement = document.querySelector(`[data-kpi="${kpi.name}"] .kpi-value, #kpi-${this.slugify(kpi.name)} .kpi-value`);
        if (kpiElement) {
          kpiElement.textContent = kpi.value;
          
          // Add trend indicator
          const trendElement = kpiElement.parentElement.querySelector('.kpi-trend');
          if (trendElement) {
            trendElement.className = `kpi-trend ${kpi.trend}`;
            trendElement.textContent = kpi.change > 0 ? `+${kpi.change}%` : `${kpi.change}%`;
          }
        }
      });
    }
    
    // Update alerts
    if (overview.alerts) {
      const alertsContainer = document.querySelector('#alerts-container, .alerts-container');
      if (alertsContainer) {
        alertsContainer.innerHTML = overview.alerts.map(alert => `
          <div class="alert alert-${this.getAlertClass(alert.type, alert.urgency)}">
            <div class="alert-header">
              <span class="alert-type">${this.formatAlertType(alert.type)}</span>
              <span class="alert-urgency ${alert.urgency}">${alert.urgency}</span>
            </div>
            <h4 class="alert-title">${alert.title}</h4>
            <p class="alert-summary">${alert.summary}</p>
            <a href="#insight-${alert.insightId}" class="alert-link">View Details</a>
          </div>
        `).join('');
      }
    }
  }
  
  /**
   * Update customer profile section in the dashboard
   * @param {Object} data Customer profile data
   */
  updateCustomerProfileSection(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data) {
      this.logMessage('No customer profile data to update');
      return;
    }
    
    // Update customer profile charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
      const customerData = data.data;
      
      // Update segment chart
      const segmentChartElement = document.querySelector('#customer-segment-chart, .customer-segment-chart');
      if (segmentChartElement && customerData.segments) {
        const ctx = segmentChartElement.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.customerSegmentChart) {
          window.customerSegmentChart.destroy();
        }
        
        // Create new chart
        window.customerSegmentChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: customerData.segments.map(segment => segment.name),
            datasets: [{
              data: customerData.segments.map(segment => segment.percentage),
              backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
      
      // Update demographics charts
      const ageChartElement = document.querySelector('#age-distribution-chart, .age-distribution-chart');
      if (ageChartElement && customerData.demographics && customerData.demographics.ageGroups) {
        const ctx = ageChartElement.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.ageDistributionChart) {
          window.ageDistributionChart.destroy();
        }
        
        // Create new chart
        window.ageDistributionChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: customerData.demographics.ageGroups.map(group => group.range),
            datasets: [{
              label: 'Age Distribution',
              data: customerData.demographics.ageGroups.map(group => group.percentage),
              backgroundColor: '#4e73df'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            }
          }
        });
      }
    }
  }
  
  /**
   * Update store performance section in the dashboard
   * @param {Object} data Store performance data
   */
  updateStorePerformanceSection(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data) {
      this.logMessage('No store performance data to update');
      return;
    }
    
    const storeData = data.data;
    
    // Update store performance table
    const storeTableElement = document.querySelector('#store-performance-table tbody, .store-performance-table tbody');
    if (storeTableElement && storeData.topStores) {
      storeTableElement.innerHTML = storeData.topStores.map(store => `
        <tr>
          <td>${store.name} (${store.id})</td>
          <td>${store.sales}</td>
          <td class="${store.growth >= 0 ? 'positive' : 'negative'}">${store.growth >= 0 ? '+' : ''}${store.growth}%</td>
          <td>${store.traffic.toLocaleString()}</td>
        </tr>
      `).join('');
    }
    
    // Update region performance chart if Chart.js is available
    if (typeof Chart !== 'undefined') {
      const regionChartElement = document.querySelector('#region-performance-chart, .region-performance-chart');
      if (regionChartElement && storeData.regionPerformance) {
        const ctx = regionChartElement.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.regionPerformanceChart) {
          window.regionPerformanceChart.destroy();
        }
        
        // Create new chart
        window.regionPerformanceChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: storeData.regionPerformance.map(region => region.region),
            datasets: [{
              label: 'Total Sales ($K)',
              data: storeData.regionPerformance.map(region => parseFloat(region.totalSales.replace(/[^0-9.-]+/g, '')) / 1000),
              backgroundColor: '#4e73df'
            }, {
              label: 'Growth (%)',
              data: storeData.regionPerformance.map(region => region.growth),
              backgroundColor: '#1cc88a',
              yAxisID: 'y1'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Sales ($K)'
                }
              },
              y1: {
                position: 'right',
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Growth (%)'
                },
                grid: {
                  drawOnChartArea: false
                }
              }
            }
          }
        });
      }
    }
  }
  
  /**
   * Update product intelligence section in the dashboard
   * @param {Object} data Product intelligence data
   */
  updateProductIntelligenceSection(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data) {
      this.logMessage('No product intelligence data to update');
      return;
    }
    
    const productData = data.data;
    
    // Update top products table
    const productTableElement = document.querySelector('#top-products-table tbody, .top-products-table tbody');
    if (productTableElement && productData.topProducts) {
      productTableElement.innerHTML = productData.topProducts.map(product => `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.brand}</td>
          <td>${product.sales}</td>
          <td>${product.units}</td>
          <td class="${product.growth >= 0 ? 'positive' : 'negative'}">${product.growth >= 0 ? '+' : ''}${product.growth}%</td>
        </tr>
      `).join('');
    }
    
    // Update category performance chart if Chart.js is available
    if (typeof Chart !== 'undefined') {
      const categoryChartElement = document.querySelector('#category-performance-chart, .category-performance-chart');
      if (categoryChartElement && productData.categoryPerformance) {
        const ctx = categoryChartElement.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.categoryPerformanceChart) {
          window.categoryPerformanceChart.destroy();
        }
        
        // Create new chart
        window.categoryPerformanceChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: productData.categoryPerformance.map(category => category.category),
            datasets: [{
              data: productData.categoryPerformance.map(category => parseFloat(category.sales.replace(/[^0-9.-]+/g, ''))),
              backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }
  }
  
  /**
   * Update advanced analytics section in the dashboard
   * @param {Object} data Advanced analytics data
   */
  updateAdvancedAnalyticsSection(data) {
    // Skip if no data or data is invalid
    if (!data || !data.insights || !data.insights.data) {
      this.logMessage('No advanced analytics data to update');
      return;
    }
    
    const insightsData = data.insights.data;
    
    // Update insights container
    const insightsContainer = document.querySelector('#insights-container, .insights-container');
    if (insightsContainer) {
      insightsContainer.innerHTML = insightsData.map(insight => `
        <div class="insight-card" id="insight-${insight.insightId}">
          <div class="insight-header">
            <span class="insight-type ${insight.insightType}">${this.formatInsightType(insight.insightType)}</span>
            <span class="insight-urgency ${insight.urgency}">${insight.urgency}</span>
          </div>
          <h3 class="insight-title">${insight.title}</h3>
          <p class="insight-summary">${insight.summary}</p>
          <div class="insight-details">
            <div class="insight-metrics">
              <div class="metric">
                <span class="metric-label">Confidence</span>
                <span class="metric-value">${(insight.confidence * 100).toFixed(0)}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Category</span>
                <span class="metric-value">${insight.category}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Brand</span>
                <span class="metric-value">${insight.brandName}</span>
              </div>
            </div>
            <div class="insight-actions">
              ${insight.actionableInsights ? `
                <h4>Actionable Insights</h4>
                <ul>
                  ${insight.actionableInsights.map(action => `<li>${action}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }
    
    // Update market basket analysis if available
    if (data.topics && data.topics.data) {
      const topicData = data.topics.data;
      
      // Update topic analysis chart if Chart.js is available
      if (typeof Chart !== 'undefined') {
        const topicChartElement = document.querySelector('#topic-analysis-chart, .topic-analysis-chart');
        if (topicChartElement) {
          const ctx = topicChartElement.getContext('2d');
          
          // Destroy existing chart if it exists
          if (window.topicAnalysisChart) {
            window.topicAnalysisChart.destroy();
          }
          
          // Create new chart
          window.topicAnalysisChart = new Chart(ctx, {
            type: 'radar',
            data: {
              labels: topicData.slice(0, 8).map(topic => topic.topicName),
              datasets: [{
                label: 'Sentiment Score',
                data: topicData.slice(0, 8).map(topic => topic.sentimentScore),
                fill: true,
                backgroundColor: 'rgba(78, 115, 223, 0.2)',
                borderColor: 'rgb(78, 115, 223)',
                pointBackgroundColor: 'rgb(78, 115, 223)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(78, 115, 223)'
              }, {
                label: 'Mention Volume',
                data: topicData.slice(0, 8).map(topic => topic.mentionCount / 100),
                fill: true,
                backgroundColor: 'rgba(28, 200, 138, 0.2)',
                borderColor: 'rgb(28, 200, 138)',
                pointBackgroundColor: 'rgb(28, 200, 138)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(28, 200, 138)'
              }]
            },
            options: {
              elements: {
                line: {
                  borderWidth: 3
                }
              },
              scales: {
                r: {
                  angleLines: {
                    display: true
                  },
                  suggestedMin: 0,
                  suggestedMax: 1
                }
              }
            }
          });
        }
      }
    }
  }
  
  /**
   * Get data filters from the dashboard
   * @returns {Object} Data filters
   */
  getDataFilters() {
    const filters = {};
    
    // Get date range filter
    const dateRangeSelect = document.querySelector('select[data-filter="dateRange"], #date-range-select');
    if (dateRangeSelect) {
      filters.days = parseInt(dateRangeSelect.value, 10);
    } else {
      // Default to 30 days
      filters.days = 30;
    }
    
    // Get store filter
    const storeSelect = document.querySelector('select[data-filter="storeId"], #store-select');
    if (storeSelect) {
      filters.storeId = storeSelect.value;
    }
    
    // Get category filter
    const categorySelect = document.querySelector('select[data-filter="category"], #category-select');
    if (categorySelect) {
      filters.category = categorySelect.value;
    }
    
    // Get brand filter
    const brandSelect = document.querySelector('select[data-filter="brand"], #brand-select');
    if (brandSelect) {
      filters.brand = brandSelect.value;
    }
    
    return filters;
  }
  
  /**
   * Show or hide loading indicators
   * @param {boolean} show Whether to show loading indicators
   */
  showLoading(show) {
    // Show or hide loading indicators
    document.querySelectorAll(this.config.dashboardElements.loadingIndicators).forEach(indicator => {
      indicator.style.display = show ? 'flex' : 'none';
    });
    
    // Add or remove loading class from data containers
    document.querySelectorAll(this.config.dashboardElements.dataContainers).forEach(container => {
      if (show) {
        container.classList.add('loading');
      } else {
        container.classList.remove('loading');
      }
    });
  }
  
  /**
   * Show error message
   * @param {string} message Error message
   */
  showErrorMessage(message) {
    // Check if error message container exists
    let errorContainer = document.querySelector('#error-message-container, .error-message-container');
    
    // Create it if it doesn't exist
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = 'error-message-container';
      errorContainer.className = 'error-message-container';
      
      // Find a suitable location to insert the error container
      const headerElement = document.querySelector('header, .header, .dashboard-header');
      if (headerElement) {
        // Insert after the header
        headerElement.parentNode.insertBefore(errorContainer, headerElement.nextSibling);
      } else {
        // Insert at the beginning of the body or main content
        const mainContent = document.querySelector('main, .main, .content, .dashboard-content');
        if (mainContent) {
          mainContent.insertBefore(errorContainer, mainContent.firstChild);
        } else {
          document.body.insertBefore(errorContainer, document.body.firstChild);
        }
      }
    }
    
    // Set the error message
    errorContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button class="close-error-btn">&times;</button>
      </div>
    `;
    
    // Show the error container
    errorContainer.style.display = 'block';
    
    // Add event listener to close button
    const closeButton = errorContainer.querySelector('.close-error-btn');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        errorContainer.style.display = 'none';
      });
    }
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 10000);
  }
  
  /**
   * Update data source indicators
   * @param {boolean} useRealData Whether real data is being used
   */
  updateDataSourceIndicators(useRealData) {
    // Update status badges
    document.querySelectorAll(this.config.dashboardElements.statusBadges).forEach(badge => {
      badge.className = badge.className.replace(/badge-(success|warning|info)/, '');
      badge.classList.add(`badge-${useRealData ? 'success' : 'warning'}`);
      
      // Update text if it contains "LIVE" or "DEMO"
      if (badge.textContent.includes('LIVE') || badge.textContent.includes('DEMO')) {
        badge.textContent = useRealData ? 'LIVE' : 'DEMO';
      }
    });
    
    // Update data source indicators
    document.querySelectorAll('.data-source-indicator').forEach(indicator => {
      indicator.classList.remove('data-source-real', 'data-source-simulated');
      indicator.classList.add(useRealData ? 'data-source-real' : 'data-source-simulated');
      
      // Update text if configured to do so
      if (indicator.hasAttribute('data-update-text')) {
        indicator.textContent = useRealData ? 'LIVE' : 'DEMO';
      }
    });
    
    // Add a data source indicator to each chart if it doesn't have one
    document.querySelectorAll(this.config.dashboardElements.charts).forEach(chartContainer => {
      if (!chartContainer.querySelector('.data-source-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = `data-source-indicator ${useRealData ? 'data-source-real' : 'data-source-simulated'}`;
        indicator.setAttribute('data-update-text', 'true');
        indicator.textContent = useRealData ? 'LIVE' : 'DEMO';
        chartContainer.appendChild(indicator);
      }
    });
  }
  
  /**
   * Format insight type for display
   * @param {string} type Insight type
   * @returns {string} Formatted insight type
   */
  formatInsightType(type) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Format alert type for display
   * @param {string} type Alert type
   * @returns {string} Formatted alert type
   */
  formatAlertType(type) {
    switch (type.toLowerCase()) {
      case 'risk':
      case 'risk_alert':
        return 'Risk Alert';
      case 'opportunity':
      case 'opportunity_identification':
        return 'Opportunity';
      case 'competitive':
      case 'competitive_intelligence':
        return 'Competitive Intel';
      case 'trend':
      case 'trend_detection':
        return 'Trend Detection';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }
  
  /**
   * Get alert class based on type and urgency
   * @param {string} type Alert type
   * @param {string} urgency Alert urgency
   * @returns {string} Alert class
   */
  getAlertClass(type, urgency) {
    switch (type.toLowerCase()) {
      case 'risk':
      case 'risk_alert':
        return urgency === 'high' ? 'danger' : 'warning';
      case 'opportunity':
      case 'opportunity_identification':
        return 'success';
      case 'competitive':
      case 'competitive_intelligence':
        return urgency === 'high' ? 'warning' : 'info';
      case 'trend':
      case 'trend_detection':
        return 'info';
      default:
        return 'primary';
    }
  }
  
  /**
   * Convert a string to a slug
   * @param {string} text Text to convert
   * @returns {string} Slug
   */
  slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
  
  /**
   * Log a message to the console
   * @param {string} message Message to log
   */
  logMessage(message) {
    if (this.config.enableConsoleMessages) {
      console.log(`Dashboard Integrator: ${message}`);
    }
  }
  
  /**
   * Log an error to the console
   * @param {string} message Error message
   * @param {Error} error Error object
   */
  logError(message, error) {
    console.error(`Dashboard Integrator: ${message}`, error || '');
  }
}

// Initialize the dashboard integrator when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.dashboardIntegrator = new DashboardIntegrator();
});