/**
 * Project Scout SQL Analytics Component
 * 
 * This component integrates SQL data analytics into the Retail Advisor dashboard
 * It provides visualizations for the Analysis Overview categories
 */

// SQL Analytics Dashboard Component
const SQLAnalyticsDashboard = (function() {
  // DOM selectors
  const selectors = {
    container: '#analytics-dashboard-container',
    categoryTabs: '#analytics-category-tabs',
    contentArea: '#analytics-content-area',
    dateRangePicker: '#analytics-date-range',
    storeSelector: '#analytics-store-selector',
    exportButton: '#analytics-export-button',
    loadingIndicator: '.analytics-loading-indicator'
  };
  
  // Configuration
  const config = {
    defaultDateRange: 30, // days
    defaultStore: 'all',
    refreshInterval: 900000, // 15 minutes
    chartColors: [
      'rgba(66, 133, 244, 0.8)',
      'rgba(219, 68, 55, 0.8)',
      'rgba(244, 180, 0, 0.8)',
      'rgba(15, 157, 88, 0.8)',
      'rgba(171, 71, 188, 0.8)',
      'rgba(0, 172, 193, 0.8)'
    ],
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    }
  };
  
  // Analytics categories (mapped to the Analysis Overview sections)
  const categories = [
    {
      id: 'customer-profile',
      name: 'Customer Profile',
      icon: 'fas fa-users',
      reports: [
        { id: 'demographics', name: 'Purchase Patterns by Demographics', type: 'bar' },
        { id: 'brand-loyalty', name: 'Brand Loyalty Metrics', type: 'radar' },
        { id: 'cultural-influence', name: 'Cultural Influence Analysis', type: 'heatmap' }
      ]
    },
    {
      id: 'store-performance',
      name: 'Store Performance',
      icon: 'fas fa-store',
      reports: [
        { id: 'regional', name: 'Regional Performance', type: 'map' },
        { id: 'store-size', name: 'Store Size Impact', type: 'scatter' },
        { id: 'peak-transactions', name: 'Peak Transaction Analysis', type: 'heatmap' }
      ]
    },
    {
      id: 'product-intelligence',
      name: 'Product Intelligence',
      icon: 'fas fa-box-open',
      reports: [
        { id: 'bundle-effectiveness', name: 'Bundle Effectiveness', type: 'bar' },
        { id: 'category-performance', name: 'Category Performance', type: 'pie' },
        { id: 'sku-patterns', name: 'SKU-level Patterns', type: 'table' },
        { id: 'bumo', name: 'Brand Used Most Often (BUMO)', type: 'doughnut' }
      ]
    },
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      icon: 'fas fa-chart-line',
      reports: [
        { id: 'market-basket', name: 'Market Basket Analysis', type: 'network' },
        { id: 'demand-forecast', name: 'Demand Forecasting', type: 'line' },
        { id: 'promotion-impact', name: 'Promotional Impact', type: 'bar' }
      ]
    }
  ];
  
  // Chart instances (to be initialized)
  let charts = {};
  
  // Current state
  let currentState = {
    category: 'customer-profile',
    report: 'demographics',
    dateRange: config.defaultDateRange,
    store: config.defaultStore,
    data: {}
  };
  
  /**
   * Initialize the dashboard
   * @param {Object} options - Custom initialization options
   */
  function init(options = {}) {
    // Merge provided options with defaults
    const mergedConfig = {...config, ...options};
    
    // Check if the container exists
    const container = document.querySelector(selectors.container);
    if (!container) {
      console.error('SQL Analytics Dashboard: Container not found');
      return;
    }
    
    // Create UI structure
    createDashboardUI(container);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadSelectedReportData();
    
    // Set up refresh interval
    if (mergedConfig.refreshInterval > 0) {
      setInterval(loadSelectedReportData, mergedConfig.refreshInterval);
    }
    
    console.log('SQL Analytics Dashboard initialized');
  }
  
  /**
   * Create the dashboard UI components
   * @param {HTMLElement} container - The container element
   */
  function createDashboardUI(container) {
    // Create main dashboard layout
    container.innerHTML = `
      <div class="analytics-dashboard">
        <div class="analytics-controls">
          <div class="analytics-filters">
            <div class="filter-group">
              <label for="analytics-date-range">Time Period:</label>
              <select id="analytics-date-range" class="form-select">
                <option value="7">Last 7 Days</option>
                <option value="30" selected>Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last 12 Months</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="analytics-store-selector">Store:</label>
              <select id="analytics-store-selector" class="form-select">
                <option value="all" selected>All Stores</option>
                <option value="112">North Flagship (112)</option>
                <option value="143">East Center (143)</option>
                <option value="156">West Express (156)</option>
                <option value="119">South Hub (119)</option>
                <option value="127">Central Mall (127)</option>
              </select>
            </div>
            <div class="filter-group">
              <button id="analytics-export-button" class="btn btn-outline-primary">
                <i class="fas fa-download"></i> Export Data
              </button>
            </div>
          </div>
          
          <div id="analytics-category-tabs" class="analytics-tabs">
            ${categories.map(category => `
              <div class="analytics-tab ${category.id === currentState.category ? 'active' : ''}" 
                   data-category="${category.id}">
                <i class="${category.icon}"></i>
                <span>${category.name}</span>
              </div>
            `).join('')}
          </div>
          
          <div id="analytics-report-tabs" class="analytics-report-tabs">
            <!-- Report tabs will be populated dynamically -->
          </div>
        </div>
        
        <div id="analytics-content-area" class="analytics-content">
          <div class="analytics-loading-indicator">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    `;
    
    // Populate report tabs for the default category
    updateReportTabs(currentState.category);
  }
  
  /**
   * Set up event listeners for dashboard controls
   */
  function setupEventListeners() {
    // Category tab selection
    const categoryTabs = document.querySelector(selectors.categoryTabs);
    categoryTabs.addEventListener('click', event => {
      const tabElement = event.target.closest('.analytics-tab');
      if (tabElement) {
        const category = tabElement.dataset.category;
        
        // Update active tab
        document.querySelectorAll('.analytics-tab').forEach(tab => {
          tab.classList.remove('active');
        });
        tabElement.classList.add('active');
        
        // Update current state
        currentState.category = category;
        
        // Update report tabs
        updateReportTabs(category);
        
        // Set first report as active
        currentState.report = categories.find(c => c.id === category).reports[0].id;
        
        // Load data for the selected report
        loadSelectedReportData();
      }
    });
    
    // Report tab selection is set in updateReportTabs()
    
    // Date range selection
    const dateRangeSelector = document.querySelector(selectors.dateRangePicker);
    dateRangeSelector.addEventListener('change', event => {
      currentState.dateRange = parseInt(event.target.value, 10);
      loadSelectedReportData();
    });
    
    // Store selection
    const storeSelector = document.querySelector(selectors.storeSelector);
    storeSelector.addEventListener('change', event => {
      currentState.store = event.target.value;
      loadSelectedReportData();
    });
    
    // Export button
    const exportButton = document.querySelector(selectors.exportButton);
    exportButton.addEventListener('click', exportCurrentReport);
  }
  
  /**
   * Update report tabs for the selected category
   * @param {string} categoryId - The selected category ID
   */
  function updateReportTabs(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const reportsTabsContainer = document.getElementById('analytics-report-tabs');
    
    // Generate report tabs HTML
    reportsTabsContainer.innerHTML = category.reports.map(report => `
      <div class="analytics-report-tab ${report.id === currentState.report ? 'active' : ''}" 
           data-report="${report.id}">
        ${report.name}
      </div>
    `).join('');
    
    // Set up event listeners for report tabs
    document.querySelectorAll('.analytics-report-tab').forEach(tab => {
      tab.addEventListener('click', event => {
        const reportId = event.target.dataset.report;
        
        // Update active tab
        document.querySelectorAll('.analytics-report-tab').forEach(t => {
          t.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update current state
        currentState.report = reportId;
        
        // Load data for the selected report
        loadSelectedReportData();
      });
    });
  }
  
  /**
   * Load data for the currently selected report
   */
  function loadSelectedReportData() {
    // Show loading indicator
    showLoading(true);
    
    // Get report configuration
    const category = categories.find(c => c.id === currentState.category);
    const report = category.reports.find(r => r.id === currentState.report);
    
    console.log(`Loading data for ${category.name} - ${report.name}`);
    
    // In a real implementation, we would fetch data from the API
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      // Generate mock data based on the report type
      const mockData = generateMockData(category.id, report.id, currentState.dateRange, currentState.store);
      
      // Store data in current state
      currentState.data = mockData;
      
      // Render the report
      renderReport(category.id, report.id, mockData);
      
      // Hide loading indicator
      showLoading(false);
    }, 800);
  }
  
  /**
   * Show or hide the loading indicator
   * @param {boolean} show - Whether to show or hide the indicator
   */
  function showLoading(show) {
    const loadingIndicator = document.querySelector(selectors.loadingIndicator);
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? 'flex' : 'none';
    }
    
    const contentArea = document.querySelector(selectors.contentArea);
    if (contentArea) {
      contentArea.classList.toggle('loading', show);
    }
  }
  
  /**
   * Generate mock data for demonstration
   * @param {string} categoryId - The category ID
   * @param {string} reportId - The report ID
   * @param {number} dateRange - The date range in days
   * @param {string} storeId - The store ID or 'all'
   * @returns {Object} Mock data for the specified report
   */
  function generateMockData(categoryId, reportId, dateRange, storeId) {
    // Common datasets with plausible values for each report type
    // This would be replaced with actual API calls in production
    
    // Sample data structure (simplified for this example)
    const mockData = {
      labels: [],
      datasets: [],
      summary: {
        title: '',
        insights: []
      }
    };
    
    // Generate different data based on category and report
    switch(`${categoryId}-${reportId}`) {
      case 'customer-profile-demographics':
        mockData.labels = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
        mockData.datasets = [
          {
            label: 'Average Transaction Value',
            data: [48.75, 67.92, 82.45, 75.23, 63.18, 51.39],
            backgroundColor: config.chartColors[0]
          },
          {
            label: 'Purchase Frequency (Monthly)',
            data: [2.3, 3.1, 3.8, 3.2, 2.5, 1.9],
            backgroundColor: config.chartColors[1]
          }
        ];
        mockData.summary = {
          title: 'Demographics Analysis',
          insights: [
            'Ages 35-44 show highest transaction value ($82.45)',
            'Purchase frequency peaks in the 35-44 age group (3.8 times monthly)',
            'Youngest and oldest demographics show lowest engagement'
          ]
        };
        break;
        
      case 'store-performance-regional':
        mockData.labels = ['North', 'East', 'South', 'West', 'Central'];
        mockData.datasets = [
          {
            label: 'Average Sales per Store ($K)',
            data: [342.8, 286.5, 312.7, 395.2, 274.1],
            backgroundColor: config.chartColors
          }
        ];
        mockData.summary = {
          title: 'Regional Performance Summary',
          insights: [
            'West region shows highest per-store performance ($395.2K)',
            'Central region stores underperforming with $274.1K average',
            'North region shows strong conversion rates despite mid-range sales'
          ]
        };
        break;
        
      case 'product-intelligence-category-performance':
        mockData.labels = ['Electronics', 'Apparel', 'Home Goods', 'Food & Beverage', 'Health & Beauty'];
        mockData.datasets = [
          {
            label: 'Revenue Share (%)',
            data: [42, 23, 15, 12, 8],
            backgroundColor: config.chartColors
          }
        ];
        mockData.summary = {
          title: 'Product Category Analysis',
          insights: [
            'Electronics represent largest revenue share at 42%',
            'Health & Beauty showing strongest growth at +18% year-over-year',
            'Food & Beverage has highest profit margin at 34%'
          ]
        };
        break;
        
      case 'advanced-analytics-demand-forecast':
        // Generate dates for the past dateRange days
        const dates = [];
        for (let i = dateRange; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));
        }
        
        mockData.labels = dates;
        
        // Generate sales data with a realistic pattern
        const salesData = [];
        for (let i = 0; i <= dateRange; i++) {
          // Base value with weekly pattern (higher on weekends)
          const dayOfWeek = (i % 7);
          const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
          const baseValue = isWeekend ? 120 : 80;
          
          // Add trend and random noise
          const trend = i * 0.5; // Slight upward trend
          const noise = Math.random() * 30 - 15; // Random noise ±15
          
          salesData.push(Math.round(baseValue + trend + noise));
        }
        
        // Generate forecast data for next 14 days
        const forecastDates = [];
        const forecastData = [];
        
        for (let i = 1; i <= 14; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          forecastDates.push(date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));
          
          // Base value with weekly pattern
          const dayOfWeek = (i % 7);
          const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
          const baseValue = isWeekend ? 130 : 85; // Slightly higher than historical
          
          // Add trend and lower random noise (forecasts are smoother)
          const trend = (dateRange + i) * 0.5; // Continue the trend
          const noise = Math.random() * 10 - 5; // Reduced noise in forecast
          
          forecastData.push(Math.round(baseValue + trend + noise));
        }
        
        mockData.labels = [...dates, ...forecastDates];
        mockData.datasets = [
          {
            label: 'Historical Sales',
            data: [...salesData, ...Array(14).fill(null)],
            borderColor: config.chartColors[0],
            backgroundColor: 'rgba(66, 133, 244, 0.1)',
            fill: true
          },
          {
            label: 'Forecasted Sales',
            data: [...Array(dateRange + 1).fill(null), ...forecastData],
            borderColor: config.chartColors[1],
            backgroundColor: 'rgba(219, 68, 55, 0.1)',
            borderDash: [5, 5],
            fill: true
          }
        ];
        mockData.summary = {
          title: 'Demand Forecast Analysis',
          insights: [
            'Projected 12% sales increase over next 14 days',
            'Weekend sales showing stronger growth trend than weekdays',
            'Forecast confidence: 85% based on historical patterns'
          ]
        };
        break;
        
      default:
        // Generic mock data for any other report
        mockData.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        mockData.datasets = [
          {
            label: 'Sample Data',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: config.chartColors[0]
          }
        ];
        mockData.summary = {
          title: 'Data Summary',
          insights: [
            'Sample insight 1',
            'Sample insight 2',
            'Sample insight 3'
          ]
        };
    }
    
    return mockData;
  }
  
  /**
   * Render a report with the provided data
   * @param {string} categoryId - The category ID
   * @param {string} reportId - The report ID
   * @param {Object} data - The data to render
   */
  function renderReport(categoryId, reportId, data) {
    const category = categories.find(c => c.id === categoryId);
    const report = category.reports.find(r => r.id === reportId);
    
    // Get the content area
    const contentArea = document.querySelector(selectors.contentArea);
    
    // Create the report structure
    contentArea.innerHTML = `
      <div class="analytics-report">
        <div class="report-header">
          <h3>${report.name}</h3>
          <div class="report-meta">
            <span class="date-range">Last ${currentState.dateRange} days</span>
            <span class="store-filter">
              ${currentState.store === 'all' ? 'All Stores' : `Store ${currentState.store}`}
            </span>
          </div>
        </div>
        
        <div class="report-content">
          <div class="report-chart-container">
            <canvas id="report-chart"></canvas>
          </div>
          
          <div class="report-summary">
            <h4>${data.summary.title}</h4>
            <ul class="insights-list">
              ${data.summary.insights.map(insight => `
                <li>
                  <i class="fas fa-lightbulb text-warning"></i>
                  ${insight}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    
    // Render the chart
    renderChart(report.type, data);
  }
  
  /**
   * Render a chart with the provided data
   * @param {string} chartType - The type of chart to render
   * @param {Object} data - The data for the chart
   */
  function renderChart(chartType, data) {
    // If Chart.js is not available, display error
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is required for rendering charts');
      document.getElementById('report-chart').innerHTML = 
        '<div class="alert alert-warning">Chart.js library is required for rendering charts</div>';
      return;
    }
    
    // Destroy previous chart if it exists
    if (charts.reportChart) {
      charts.reportChart.destroy();
    }
    
    // Get the chart canvas
    const ctx = document.getElementById('report-chart').getContext('2d');
    
    // Map the report chart type to Chart.js chart type
    let chartJsType = 'bar'; // Default
    switch (chartType) {
      case 'bar': chartJsType = 'bar'; break;
      case 'line': chartJsType = 'line'; break;
      case 'pie': chartJsType = 'pie'; break;
      case 'doughnut': chartJsType = 'doughnut'; break;
      case 'radar': chartJsType = 'radar'; break;
      case 'scatter': chartJsType = 'scatter'; break;
      case 'heatmap': chartJsType = 'bar'; break; // Fallback to bar, would use a heatmap plugin in production
      case 'map': chartJsType = 'bar'; break; // Fallback to bar, would use a map visualization in production
      case 'network': chartJsType = 'bar'; break; // Fallback to bar, would use a network visualization in production
      case 'table': 
        // For table, render a table instead of a chart
        renderDataTable(data);
        return;
    }
    
    // Create the chart
    charts.reportChart = new Chart(ctx, {
      type: chartJsType,
      data: {
        labels: data.labels,
        datasets: data.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        animation: config.animation
      }
    });
  }
  
  /**
   * Render a data table for table-type reports
   * @param {Object} data - The data for the table
   */
  function renderDataTable(data) {
    // Get the chart container to replace with table
    const chartContainer = document.getElementById('report-chart');
    
    // Create table HTML
    let tableHTML = `
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>#</th>
              ${data.labels.map(label => `<th>${label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add rows for each dataset
    data.datasets.forEach((dataset, index) => {
      tableHTML += `
        <tr>
          <td><strong>${dataset.label}</strong></td>
          ${dataset.data.map(value => `<td>${value}</td>`).join('')}
        </tr>
      `;
    });
    
    tableHTML += `
          </tbody>
        </table>
      </div>
    `;
    
    // Replace chart with table
    chartContainer.outerHTML = tableHTML;
  }
  
  /**
   * Export the current report data
   */
  function exportCurrentReport() {
    // Get the current report configuration
    const category = categories.find(c => c.id === currentState.category);
    const report = category.reports.find(r => r.id === currentState.report);
    
    // Create a CSV from the current data
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Category,";
    currentState.data.labels.forEach(label => {
      csvContent += label + ",";
    });
    csvContent += "\r\n";
    
    // Add data
    currentState.data.datasets.forEach(dataset => {
      csvContent += dataset.label + ",";
      dataset.data.forEach(value => {
        csvContent += value + ",";
      });
      csvContent += "\r\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${category.id}-${report.id}-export.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  }
  
  // Return public API
  return {
    init: init,
    refreshData: loadSelectedReportData
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if we're on a page with the analytics dashboard container
  if (document.getElementById('analytics-dashboard-container')) {
    SQLAnalyticsDashboard.init();
  }
});