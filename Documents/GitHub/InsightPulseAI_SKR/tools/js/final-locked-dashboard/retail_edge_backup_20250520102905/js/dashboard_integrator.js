/**
 * Dashboard Integrator for Retail Edge
 * 
 * This script integrates the dashboard with the Medallion Data Connector
 * and provides the toggle functionality between real and simulated data.
 * 
 * It now includes support for the choropleth map component for geospatial
 * brand intelligence and sales distribution visualization.
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
    document.querySelectorAll('.refresh-data-btn, [data-action="refresh-data"], .btn-outline-light').forEach(button => {
      button.addEventListener('click', () => this.loadDashboardData());
    });
    
    // Add event listeners for data filter changes
    document.querySelectorAll('select[data-filter], #timeRange, #regionFilter, #storeType, #dataSource').forEach(filter => {
      filter.addEventListener('change', () => this.handleFilterChange());
    });
    
    // Add event listeners for choropleth map filters
    document.querySelectorAll('#geoLevel, #brandFilter, #timeFilter').forEach(filter => {
      filter.addEventListener('change', () => this.handleChoroplethFilterChange());
    });
    
    // Add event listeners for map mode buttons
    document.querySelectorAll('[data-map-mode]').forEach(button => {
      button.addEventListener('click', (e) => {
        // Update active state
        document.querySelectorAll('[data-map-mode]').forEach(btn => btn.classList.remove('active'));
        e.target.closest('[data-map-mode]').classList.add('active');
        
        // Get the map mode
        const mode = e.target.closest('[data-map-mode]').getAttribute('data-map-mode');
        
        // Update map mode
        this.updateChoroplethMapMode(mode);
      });
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
      
      // Load data for the dashboard in parallel
      await Promise.all([
        this.loadDashboardSummary(filters),
        this.loadStorePerformance(filters),
        this.loadProductData(filters),
        this.loadInsights(filters),
        this.loadChoroplethMapData(filters)
      ]);
      
      // Hide loading indicators
      this.showLoading(false);
      
      this.logMessage('Dashboard data loaded successfully');
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Load dashboard summary data
   * @param {Object} filters Data filters
   */
  async loadDashboardSummary(filters) {
    try {
      this.logMessage('Loading dashboard summary data');
      
      // Load summary data
      const summaryData = await this.medallionConnector.fetchData('platinum', 'dashboard-summary', filters);
      
      // Store the data
      this.loadedData.summary = summaryData;
      
      // Update dashboard KPIs
      this.updateDashboardKPIs(summaryData);
      
      return summaryData;
    } catch (error) {
      this.logError('Error loading dashboard summary data:', error);
      throw error;
    }
  }
  
  /**
   * Load store performance data
   * @param {Object} filters Data filters
   */
  async loadStorePerformance(filters) {
    try {
      this.logMessage('Loading store performance data');
      
      // Load store performance data
      const storeData = await this.medallionConnector.getGoldData('store-performance', filters);
      
      // Store the data
      this.loadedData.storePerformance = storeData;
      
      // Update store cards in the dashboard
      this.updateStorePerformanceCards(storeData);
      
      // Update store performance chart
      this.updateRevenueByStoreChart(storeData);
      
      return storeData;
    } catch (error) {
      this.logError('Error loading store performance data:', error);
      throw error;
    }
  }
  
  /**
   * Load product data
   * @param {Object} filters Data filters
   */
  async loadProductData(filters) {
    try {
      this.logMessage('Loading product data');
      
      // Load product performance data
      const productData = await this.medallionConnector.getGoldData('product-performance', filters);
      
      // Store the data
      this.loadedData.productPerformance = productData;
      
      // Update product table in the dashboard
      this.updateProductTable(productData);
      
      // Update category chart
      this.updateCategoryChart(productData);
      
      return productData;
    } catch (error) {
      this.logError('Error loading product data:', error);
      throw error;
    }
  }
  
  /**
   * Load insights data
   * @param {Object} filters Data filters
   */
  async loadInsights(filters) {
    try {
      this.logMessage('Loading insights data');
      
      // Load insights data
      const insightsData = await this.medallionConnector.getPlatinumData('insights', filters);
      
      // Store the data
      this.loadedData.insights = insightsData;
      
      // Update insights section in the dashboard
      this.updateInsightsSection(insightsData);
      
      return insightsData;
    } catch (error) {
      this.logError('Error loading insights data:', error);
      throw error;
    }
  }
  
  /**
   * Update dashboard KPIs
   * @param {Object} data Summary data
   */
  updateDashboardKPIs(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data || !data.data.overview) {
      this.logMessage('No summary data to update KPIs');
      return;
    }
    
    const overview = data.data.overview;
    
    // Update KPIs
    if (overview.kpis) {
      const kpiElements = document.querySelectorAll('.stats-card .stats-number');
      const trendElements = document.querySelectorAll('.stats-card .trend-indicator');
      
      // Match them by index (simplified approach for demo)
      for (let i = 0; i < Math.min(kpiElements.length, overview.kpis.length); i++) {
        if (kpiElements[i] && overview.kpis[i]) {
          kpiElements[i].textContent = overview.kpis[i].value;
        }
        
        if (trendElements[i] && overview.kpis[i]) {
          // Update trend indicator
          trendElements[i].className = `trend-indicator trend-${overview.kpis[i].trend}`;
          const changeText = overview.kpis[i].change > 0 ? 
            `<i class="fas fa-arrow-up"></i> ${overview.kpis[i].change}% from last period` : 
            `<i class="fas fa-arrow-down"></i> ${Math.abs(overview.kpis[i].change)}% from last period`;
          trendElements[i].innerHTML = changeText;
        }
      }
    }
  }
  
  /**
   * Update store performance cards
   * @param {Object} data Store performance data
   */
  updateStorePerformanceCards(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data || !data.data.storePerformance) {
      this.logMessage('No store performance data to update cards');
      return;
    }
    
    const storeData = data.data.storePerformance;
    
    // Update total stores
    const totalStoresElement = document.getElementById('totalStores');
    if (totalStoresElement && storeData.totalStores) {
      totalStoresElement.textContent = storeData.totalStores;
    }
    
    // Update top performer
    const topPerformerElement = document.getElementById('topPerformer');
    if (topPerformerElement && storeData.topPerformer) {
      topPerformerElement.textContent = storeData.topPerformer.name;
      
      // Update the trend text below it
      const trendElement = topPerformerElement.parentElement.querySelector('.trend-indicator');
      if (trendElement) {
        trendElement.innerHTML = `<i class="fas fa-trophy text-warning"></i> ${storeData.topPerformer.revenue} revenue`;
      }
    }
    
    // Update store efficiency
    const efficiencyElement = document.getElementById('storeEfficiency');
    if (efficiencyElement && storeData.storeEfficiency) {
      efficiencyElement.textContent = storeData.storeEfficiency;
    }
    
    // Update stock accuracy
    const accuracyElement = document.getElementById('stockAccuracy');
    if (accuracyElement && storeData.stockAccuracy) {
      accuracyElement.textContent = storeData.stockAccuracy;
    }
  }
  
  /**
   * Update revenue by store chart
   * @param {Object} data Store performance data
   */
  updateRevenueByStoreChart(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data || !data.data.storePerformance || !data.data.storePerformance.regionPerformance) {
      this.logMessage('No region performance data to update chart');
      return;
    }
    
    const regionData = data.data.storePerformance.regionPerformance;
    
    // Skip if Chart.js is not available
    if (typeof Chart === 'undefined') {
      this.logMessage('Chart.js not available, skipping chart update');
      return;
    }
    
    // Get the chart instance
    const chartInstance = window.revenueChart;
    if (!chartInstance) {
      this.logMessage('Revenue chart instance not found, skipping update');
      return;
    }
    
    // Update chart data
    chartInstance.data.labels = regionData.map(region => region.region);
    chartInstance.data.datasets[0].data = regionData.map(region => {
      // Convert string like '$980,450' to number (980.45)
      const value = parseFloat(region.totalSales.replace(/[^0-9.-]+/g, '')) / 1000;
      return value;
    });
    chartInstance.data.datasets[1].data = regionData.map(region => region.growth);
    
    // Update the chart
    chartInstance.update();
    
    // Add data source indicator if it doesn't exist
    const chartContainer = document.getElementById('revenueChart');
    if (chartContainer && !chartContainer.querySelector('.data-source-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = `data-source-indicator ${this.medallionConnector.config.useRealData ? 'data-source-real' : 'data-source-simulated'}`;
      indicator.setAttribute('data-update-text', 'true');
      indicator.textContent = this.medallionConnector.config.useRealData ? 'LIVE' : 'DEMO';
      chartContainer.appendChild(indicator);
    }
  }
  
  /**
   * Update category chart
   * @param {Object} data Product performance data
   */
  updateCategoryChart(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data || !data.data.categoryPerformance) {
      this.logMessage('No category performance data to update chart');
      return;
    }
    
    const categoryData = data.data.categoryPerformance;
    
    // Skip if Chart.js is not available
    if (typeof Chart === 'undefined') {
      this.logMessage('Chart.js not available, skipping chart update');
      return;
    }
    
    // Get the chart instance
    const chartInstance = window.categoryChart;
    if (!chartInstance) {
      this.logMessage('Category chart instance not found, skipping update');
      return;
    }
    
    // Update chart data
    chartInstance.data.labels = categoryData.map(category => category.category);
    chartInstance.data.datasets[0].data = categoryData.map(category => {
      // Convert string like '$348,560' to percentage
      const totalSales = categoryData.reduce((sum, cat) => {
        return sum + parseFloat(cat.sales.replace(/[^0-9.-]+/g, ''));
      }, 0);
      const value = parseFloat(category.sales.replace(/[^0-9.-]+/g, ''));
      return Math.round((value / totalSales) * 100);
    });
    
    // Update the chart
    chartInstance.update();
    
    // Add data source indicator if it doesn't exist
    const chartContainer = document.getElementById('categoryChart');
    if (chartContainer && !chartContainer.querySelector('.data-source-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = `data-source-indicator ${this.medallionConnector.config.useRealData ? 'data-source-real' : 'data-source-simulated'}`;
      indicator.setAttribute('data-update-text', 'true');
      indicator.textContent = this.medallionConnector.config.useRealData ? 'LIVE' : 'DEMO';
      chartContainer.appendChild(indicator);
    }
  }
  
  /**
   * Update product table
   * @param {Object} data Product performance data
   */
  updateProductTable(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data || !data.data.topProducts) {
      this.logMessage('No top products data to update table');
      return;
    }
    
    const productsData = data.data.topProducts;
    
    // Get the table body
    const tableBody = document.querySelector('table.table.table-hover tbody');
    if (!tableBody) {
      this.logMessage('Products table body not found, skipping update');
      return;
    }
    
    // Update table rows
    tableBody.innerHTML = '';
    productsData.forEach((product, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <th scope="row">${index + 1}</th>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${product.units}</td>
        <td>${product.sales}</td>
        <td>${product.brand}</td>
        <td><i class="fas fa-arrow-${product.growth > 0 ? 'up text-success' : (product.growth < 0 ? 'down text-danger' : 'right text-warning')}"></i></td>
      `;
      tableBody.appendChild(row);
    });
  }
  
  /**
   * Update insights section
   * @param {Object} data Insights data
   */
  updateInsightsSection(data) {
    // Skip if no data or data is invalid
    if (!data || !data.data) {
      this.logMessage('No insights data to update section');
      return;
    }
    
    const insightsData = data.data;
    
    // Get the insights container
    const insightsContainer = document.getElementById('insightsCardsContainer');
    if (!insightsContainer) {
      this.logMessage('Insights container not found, skipping update');
      return;
    }
    
    // Update insights cards
    insightsContainer.innerHTML = '';
    
    // Only show first 2 insights
    const visibleInsights = insightsData.slice(0, 2);
    
    visibleInsights.forEach(insight => {
      const card = document.createElement('div');
      card.className = 'col-md-6 mb-3';
      
      // Map insight type to card class
      const cardTypeClass = this.getInsightCardClass(insight.insightType);
      
      // Format the date
      const insightDate = new Date();
      const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(insightDate);
      
      card.innerHTML = `
        <div class="card ${cardTypeClass}">
          <div class="card-header" style="background-color: var(${this.getInsightTypeColor(insight.insightType)}); color: white;">
            <span class="badge bg-light text-dark me-2">${this.formatInsightType(insight.insightType)}</span>
            ${insight.title}
            <span class="badge bg-success float-end">${(insight.confidence * 100).toFixed(0)}% confidence</span>
          </div>
          <div class="card-body">
            <p>${insight.summary}</p>
            <div class="text-end">
              <small class="text-muted">Generated by AI • ${formattedDate}</small>
            </div>
          </div>
        </div>
      `;
      
      insightsContainer.appendChild(card);
    });
    
    // Add data source indicator if it doesn't exist
    const parentCard = insightsContainer.closest('.card');
    if (parentCard && !parentCard.querySelector('.data-source-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = `data-source-indicator ${this.medallionConnector.config.useRealData ? 'data-source-real' : 'data-source-simulated'}`;
      indicator.setAttribute('data-update-text', 'true');
      indicator.textContent = this.medallionConnector.config.useRealData ? 'LIVE' : 'DEMO';
      const cardHeader = parentCard.querySelector('.card-header');
      if (cardHeader) {
        cardHeader.appendChild(indicator);
      }
    }
  }
  
  /**
   * Get insight card class based on type
   * @param {string} type Insight type
   * @returns {string} CSS class for card
   */
  getInsightCardClass(type) {
    switch (type) {
      case 'trend_detection':
        return 'card-insight-general';
      case 'opportunity_identification':
        return 'card-insight-brand';
      case 'risk_alert':
        return 'card-insight-sentiment';
      case 'competitive_intelligence':
        return 'card-insight-trend';
      default:
        return 'card-insight-general';
    }
  }
  
  /**
   * Get insight type color variable name
   * @param {string} type Insight type
   * @returns {string} CSS variable name
   */
  getInsightTypeColor(type) {
    switch (type) {
      case 'trend_detection':
        return '--insight-general';
      case 'opportunity_identification':
        return '--insight-brand';
      case 'risk_alert':
        return '--insight-sentiment';
      case 'competitive_intelligence':
        return '--insight-trend';
      default:
        return '--insight-general';
    }
  }
  
  /**
   * Format insight type for display
   * @param {string} type Insight type
   * @returns {string} Formatted insight type
   */
  formatInsightType(type) {
    switch (type) {
      case 'trend_detection':
        return 'Trend';
      case 'opportunity_identification':
        return 'Opportunity';
      case 'risk_alert':
        return 'Risk';
      case 'competitive_intelligence':
        return 'Competitive';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }
  
  /**
   * Get data filters from the dashboard
   * @returns {Object} Data filters
   */
  getDataFilters() {
    const filters = {};
    
    // Get time range filter
    const timeRangeSelect = document.getElementById('timeRange');
    if (timeRangeSelect) {
      filters.days = parseInt(timeRangeSelect.value, 10);
    } else {
      // Default to 30 days
      filters.days = 30;
    }
    
    // Get region filter
    const regionSelect = document.getElementById('regionFilter');
    if (regionSelect && regionSelect.value !== 'all') {
      filters.region = regionSelect.value;
    }
    
    // Get store type filter
    const storeTypeSelect = document.getElementById('storeType');
    if (storeTypeSelect && storeTypeSelect.value !== 'all') {
      filters.storeType = storeTypeSelect.value;
    }
    
    // Get data source filter
    const dataSourceSelect = document.getElementById('dataSource');
    if (dataSourceSelect && dataSourceSelect.value !== 'all') {
      filters.dataSource = dataSourceSelect.value;
    }
    
    // Add choropleth map specific filters
    const geoLevelSelect = document.getElementById('geoLevel');
    if (geoLevelSelect) {
      filters.geoLevel = geoLevelSelect.value;
    }
    
    const brandFilterSelect = document.getElementById('brandFilter');
    if (brandFilterSelect && brandFilterSelect.value !== 'all') {
      filters.brandId = brandFilterSelect.value;
    }
    
    const timeFilterSelect = document.getElementById('timeFilter');
    if (timeFilterSelect) {
      filters.timePeriod = parseInt(timeFilterSelect.value, 10);
    }
    
    return filters;
  }
  
  /**
   * Show or hide loading indicators
   * @param {boolean} show Whether to show loading indicators
   */
  showLoading(show) {
    // Toggle refresh button state
    const refreshBtn = document.querySelector('.btn-outline-light');
    if (refreshBtn) {
      if (show) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Refreshing...';
        refreshBtn.disabled = true;
      } else {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Refresh';
        refreshBtn.disabled = false;
      }
    }
    
    // Add loading class to dashboard elements
    if (show) {
      document.querySelectorAll('.card').forEach(card => {
        card.classList.add('loading');
        card.style.opacity = '0.7';
      });
    } else {
      document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('loading');
        card.style.opacity = '1';
      });
    }
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
      const mainContent = document.querySelector('main');
      if (mainContent) {
        // Insert at the beginning of main content
        mainContent.insertBefore(errorContainer, mainContent.firstChild);
      } else {
        // Insert at the beginning of body
        document.body.insertBefore(errorContainer, document.body.firstChild);
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
    // Update existing data source indicators
    document.querySelectorAll('.data-source-indicator').forEach(indicator => {
      indicator.classList.remove('data-source-real', 'data-source-simulated');
      indicator.classList.add(useRealData ? 'data-source-real' : 'data-source-simulated');
      
      // Update text if configured to do so
      if (indicator.hasAttribute('data-update-text')) {
        indicator.textContent = useRealData ? 'LIVE' : 'DEMO';
      }
    });
  }
  
  /**
   * Log a message to the console
   * @param {string} message Message to log
   */
  logMessage(message) {
    if (this.config.enableConsoleMessages) {
      console.log(`Retail Edge Dashboard: ${message}`);
    }
  }
  
  /**
   * Log an error to the console
   * @param {string} message Error message
   * @param {Error} error Error object
   */
  logError(message, error) {
    console.error(`Retail Edge Dashboard: ${message}`, error || '');
  }
  
  /**
   * Load choropleth map data
   * @param {Object} filters Data filters
   */
  async loadChoroplethMapData(filters) {
    try {
      this.logMessage('Loading choropleth map data');
      
      // Check if the choropleth map element exists
      const mapContainer = document.getElementById('geo-map');
      if (!mapContainer) {
        this.logMessage('Choropleth map container not found, skipping update');
        return;
      }
      
      // Check if the ChoroplethMap class exists
      if (typeof ChoroplethMap === 'undefined') {
        this.logError('ChoroplethMap class not found. Make sure choropleth_map.js is loaded.');
        return;
      }
      
      // Get additional map-specific filters
      const mapFilters = {
        ...filters,
        geoLevel: document.getElementById('geoLevel')?.value || 'barangay',
        brandId: document.getElementById('brandFilter')?.value || 'all',
        timePeriod: parseInt(document.getElementById('timeFilter')?.value || '30', 10)
      };
      
      // Determine map mode
      const activeMapModeButton = document.querySelector('[data-map-mode].active');
      const mapMode = activeMapModeButton ? activeMapModeButton.getAttribute('data-map-mode') : 'stores';
      
      // Fetch geo data from silver layer for brand mentions
      let geojsonData;
      
      if (mapMode === 'brands') {
        // Brand mentions mode uses geo_brand_mentions
        geojsonData = await this.medallionConnector.getSilverData('brand_mentions', mapFilters);
      } else if (mapMode === 'sales') {
        // Sales volume mode uses geo_sales_volume
        geojsonData = await this.medallionConnector.getSilverData('sales_volume', mapFilters);
      } else if (mapMode === 'stores') {
        // Store density mode uses geo_store_density
        geojsonData = await this.medallionConnector.getSilverData('store_density', mapFilters);
      } else if (mapMode === 'combos') {
        // Combo frequency mode uses geo_combo_frequency
        geojsonData = await this.medallionConnector.getSilverData('combo_frequency', mapFilters);
      } else {
        // Default to brand mentions
        geojsonData = await this.medallionConnector.getSilverData('brand_mentions', mapFilters);
      }
      
      // Store the data
      this.loadedData.choroplethData = geojsonData;
      
      // Initialize or update the choropleth map
      if (!window.choroplethMap) {
        // Create a new choropleth map
        window.choroplethMap = new ChoroplethMap({
          containerId: 'geo-map',
          mode: mapMode,
          geoLevel: mapFilters.geoLevel,
          data: geojsonData,
          darkMode: document.body.classList.contains('dark-mode'),
          onMapClick: (e, feature) => this.handleChoroplethMapClick(e, feature)
        });
      } else {
        // Update existing map
        window.choroplethMap.updateMode(mapMode);
        window.choroplethMap.updateGeoLevel(mapFilters.geoLevel);
        window.choroplethMap.updateData(geojsonData);
        
        // Update dark mode if needed
        if (document.body.classList.contains('dark-mode') !== window.choroplethMap.config.darkMode) {
          window.choroplethMap.updateDarkMode(document.body.classList.contains('dark-mode'));
        }
      }
      
      // Add data source indicator if it doesn't exist
      const mapSection = mapContainer.closest('.card');
      if (mapSection && !mapSection.querySelector('.data-source-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = `data-source-indicator float-end ${this.medallionConnector.config.useRealData ? 'data-source-real' : 'data-source-simulated'}`;
        indicator.setAttribute('data-update-text', 'true');
        indicator.textContent = this.medallionConnector.config.useRealData ? 'LIVE' : 'DEMO';
        
        const mapInfo = mapSection.querySelector('.map-info');
        if (mapInfo) {
          const dataSourceSpan = mapInfo.querySelector('.data-source-indicator');
          if (dataSourceSpan) {
            dataSourceSpan.replaceWith(indicator);
          } else {
            mapInfo.appendChild(indicator);
          }
        }
      }
      
      return geojsonData;
    } catch (error) {
      this.logError('Error loading choropleth map data:', error);
      
      // Set error message on the map container
      const mapContainer = document.getElementById('geo-map');
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Failed to load map data. Please try refreshing the page.
          </div>
        `;
      }
      
      throw error;
    }
  }
  
  /**
   * Handle choropleth map filter change
   */
  handleChoroplethFilterChange() {
    this.logMessage('Choropleth filters changed, updating map');
    
    // Get data filters
    const filters = this.getDataFilters();
    
    // Update only the choropleth map
    this.loadChoroplethMapData(filters);
  }
  
  /**
   * Update choropleth map mode
   * @param {string} mode Map mode (stores, sales, brands, combos)
   */
  updateChoroplethMapMode(mode) {
    this.logMessage(`Changing choropleth map mode to: ${mode}`);
    
    if (window.choroplethMap) {
      window.choroplethMap.updateMode(mode);
      
      // Refresh the data with the new mode
      const filters = this.getDataFilters();
      this.loadChoroplethMapData(filters);
    }
  }
  
  /**
   * Handle choropleth map click
   * @param {L.MouseEvent} e Mouse event
   * @param {Object} feature GeoJSON feature
   */
  handleChoroplethMapClick(e, feature) {
    this.logMessage(`Map clicked on: ${feature.properties.region}, ${feature.properties.city}, ${feature.properties.barangay}`);
    
    // Based on current geographic level, we can drill down or show details
    const geoLevelSelect = document.getElementById('geoLevel');
    const currentLevel = geoLevelSelect ? geoLevelSelect.value : 'barangay';
    
    if (currentLevel === 'region') {
      // Drill down to city level
      if (geoLevelSelect) {
        geoLevelSelect.value = 'city';
        
        // Update region filter
        const regionFilter = document.getElementById('regionFilter');
        if (regionFilter) {
          // Try to find matching option
          const option = Array.from(regionFilter.options).find(opt => 
            opt.value.toLowerCase() === feature.properties.region.toLowerCase());
          
          if (option) {
            regionFilter.value = option.value;
          }
        }
        
        // Trigger filter change
        this.handleChoroplethFilterChange();
      }
    } else if (currentLevel === 'city') {
      // Drill down to barangay level
      if (geoLevelSelect) {
        geoLevelSelect.value = 'barangay';
        
        // Trigger filter change
        this.handleChoroplethFilterChange();
      }
    } else {
      // Show details popup for barangay level
      // Here you could show a modal with detailed metrics for the selected area
      const areaName = feature.properties.barangay || feature.properties.city || feature.properties.region;
      const topBrand = feature.properties.topBrand || 'Unknown';
      const value = feature.properties.value || 0;
      
      alert(`Details for ${areaName}:\nTop Brand: ${topBrand}\nValue: ${value}\n\nFor a full analysis, please use the SQL Data Explorer.`);
    }
  }
}

// Initialize the dashboard integrator when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.dashboardIntegrator = new DashboardIntegrator();
});