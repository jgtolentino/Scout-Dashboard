/**
 * Analytics Dashboard Integration
 * Wires up all components with live data
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Analytics Dashboard...');
  
  // Initialize API client (already loaded from ScoutApiClient.js)
  const api = window.apiClient;
  
  // Initialize global filter manager (already loaded from GlobalFilterManager.js)
  const filters = window.filterManager;
  
  // Component instances
  let transactionTrends = null;
  let geographicHeatmap = null;
  let productMix = null;
  let consumerBehavior = null;
  let customerProfiling = null;
  
  // Initialize components
  function initializeComponents() {
    try {
      // Transaction Trends
      if (document.getElementById('transaction-trends-container')) {
        transactionTrends = new TransactionTrends('transaction-trends-container', {
          height: 400
        });
      }
      
      // Geographic Heatmap
      if (document.getElementById('geographic-heatmap-container')) {
        geographicHeatmap = new GeographicHeatmap('geographic-heatmap-container', {
          height: 500
        });
      }
      
      // Product Mix (if component exists)
      if (window.ProductMix && document.getElementById('product-mix-container')) {
        productMix = new ProductMix('product-mix-container');
      }
      
      // Consumer Behavior (if component exists)
      if (window.ConsumerBehavior && document.getElementById('consumer-behavior-container')) {
        consumerBehavior = new ConsumerBehavior('consumer-behavior-container');
      }
      
      // Customer Profiling (if component exists)
      if (window.CustomerProfiling && document.getElementById('customer-profiling-container')) {
        customerProfiling = new CustomerProfiling('customer-profiling-container');
      }
      
      console.log('✅ Components initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize components:', error);
      showError('Failed to initialize dashboard components');
    }
  }
  
  // Setup filter UI
  function setupFilterUI() {
    const filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;
    
    // Date range picker
    const dateRangeBtn = filterBar.querySelector('.date-range-btn');
    if (dateRangeBtn) {
      dateRangeBtn.addEventListener('click', showDateRangePicker);
    }
    
    // Data source toggle
    const dataSourceToggle = filterBar.querySelector('.data-source-toggle');
    if (dataSourceToggle) {
      dataSourceToggle.addEventListener('click', () => {
        filters.toggleDataSource();
      });
      
      // Update toggle state
      filters.subscribe((change) => {
        if (change.key === 'dataSource' || change.action === 'batch') {
          updateDataSourceToggle();
        }
      });
    }
    
    // Clear filters button
    const clearFiltersBtn = filterBar.querySelector('.clear-filters-btn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        filters.clearFilters();
      });
    }
    
    // Filter count badge
    updateFilterCount();
    filters.subscribe(() => updateFilterCount());
  }
  
  // Date range picker (simplified example)
  function showDateRangePicker() {
    // In production, use a proper date picker library
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    filters.setFilters({
      startDate: lastWeek.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  }
  
  // Update data source toggle UI
  function updateDataSourceToggle() {
    const toggle = document.querySelector('.data-source-toggle');
    if (toggle) {
      const isLive = filters.filters.dataSource === 'LIVE';
      toggle.classList.toggle('live', isLive);
      toggle.textContent = isLive ? '🔴 LIVE' : '🔵 SIM';
    }
  }
  
  // Update filter count badge
  function updateFilterCount() {
    const badge = document.querySelector('.filter-count');
    if (badge) {
      const count = filters.getFilterCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }
  
  // Setup cross-component interactions
  function setupInteractions() {
    // Handle drill-down from charts
    window.addEventListener('chart:drilldown', (event) => {
      const { component, period, label } = event.detail;
      console.log('Drill-down from', component, ':', label);
      
      // Example: Update filters based on drill-down
      if (component === 'transaction-trends' && period === 'daily') {
        // Set date filter to the selected day
        filters.setFilter('startDate', label);
        filters.setFilter('endDate', label);
      }
    });
    
    // Handle location clicks from map
    window.addEventListener('map:location:clicked', (event) => {
      const { location } = event.detail;
      console.log('Location clicked:', location);
      
      // Update location filters
      if (location.details) {
        filters.setFilters({
          barangay: location.details.barangay,
          municipality: location.details.municipality,
          province: location.details.province
        });
      }
    });
    
    // Handle map drill-down
    window.addEventListener('map:drilldown', (event) => {
      const location = event.detail;
      console.log('Map drill-down:', location);
      
      // Could open a modal with detailed location stats
      showLocationDetails(location);
    });
  }
  
  // Show location details modal
  function showLocationDetails(location) {
    // In production, use a proper modal library
    alert(`Location: ${location.location}\nTransactions: ${location.intensity}\nRevenue: ₱${location.amount}`);
  }
  
  // Health check
  async function performHealthCheck() {
    try {
      const health = await api.getHealth();
      console.log('✅ API health check passed:', health);
      
      // Update UI indicator
      const indicator = document.querySelector('.api-status');
      if (indicator) {
        indicator.classList.add('healthy');
        indicator.title = 'API Connected';
      }
      
    } catch (error) {
      console.error('❌ API health check failed:', error);
      showError('Unable to connect to API');
    }
  }
  
  // Error handling
  function showError(message) {
    const errorBanner = document.querySelector('.error-banner');
    if (errorBanner) {
      errorBanner.textContent = message;
      errorBanner.style.display = 'block';
      
      setTimeout(() => {
        errorBanner.style.display = 'none';
      }, 5000);
    }
  }
  
  // Notification helper
  window.showNotification = function(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };
  
  // Auto-refresh setup
  function setupAutoRefresh() {
    const refreshInterval = 5 * 60 * 1000; // 5 minutes
    
    setInterval(() => {
      console.log('Auto-refreshing dashboard data...');
      
      // Refresh all components
      if (transactionTrends) transactionTrends.loadData();
      if (geographicHeatmap) geographicHeatmap.loadData();
      if (productMix) productMix.loadData();
      if (consumerBehavior) consumerBehavior.loadData();
      if (customerProfiling) customerProfiling.loadData();
      
    }, refreshInterval);
  }
  
  // Responsive handling
  function handleResponsive() {
    const isMobile = window.innerWidth < 768;
    
    document.body.classList.toggle('mobile', isMobile);
    
    // Adjust component layouts for mobile
    if (geographicHeatmap && isMobile) {
      // Could adjust map height for mobile
    }
  }
  
  // Initialize everything
  async function initialize() {
    try {
      // Perform health check first
      await performHealthCheck();
      
      // Setup UI
      setupFilterUI();
      
      // Initialize components
      initializeComponents();
      
      // Setup interactions
      setupInteractions();
      
      // Setup auto-refresh
      setupAutoRefresh();
      
      // Handle responsive
      handleResponsive();
      window.addEventListener('resize', handleResponsive);
      
      console.log('✅ Analytics Dashboard initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      showError('Failed to initialize dashboard');
    }
  }
  
  // Start initialization
  initialize();
});