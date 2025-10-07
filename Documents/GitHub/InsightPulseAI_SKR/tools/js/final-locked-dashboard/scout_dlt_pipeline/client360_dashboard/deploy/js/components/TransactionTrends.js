/**
 * Transaction Trends Component
 * Displays transaction trends with live data from API
 */

class TransactionTrends {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    
    this.options = {
      height: 400,
      period: 'daily',
      startDate: null,
      endDate: null,
      ...options
    };
    
    this.chart = null;
    this.data = null;
    this.loading = false;
    
    // Bind methods
    this.loadData = this.loadData.bind(this);
    this.render = this.render.bind(this);
    this.updateFilters = this.updateFilters.bind(this);
    this.handleResize = this.handleResize.bind(this);
    
    // Initialize
    this.init();
  }

  init() {
    // Create chart container
    this.container.innerHTML = `
      <div class="transaction-trends-component">
        <div class="component-header">
          <h3>Transaction Trends</h3>
          <div class="controls">
            <select id="${this.container.id}-period" class="period-selector">
              <option value="hourly">Hourly</option>
              <option value="daily" selected>Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button class="refresh-btn" title="Refresh data">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="chart-container" id="${this.container.id}-chart">
          <div class="loading-overlay">
            <div class="spinner"></div>
            <span>Loading transaction data...</span>
          </div>
        </div>
        <div class="chart-footer">
          <span class="last-updated"></span>
          <span class="data-source"></span>
        </div>
      </div>
    `;
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load initial data
    this.loadData();
    
    // Setup resize observer
    this.setupResizeObserver();
  }

  setupEventListeners() {
    // Period selector
    const periodSelector = this.container.querySelector('.period-selector');
    periodSelector.addEventListener('change', (e) => {
      this.options.period = e.target.value;
      this.loadData();
    });
    
    // Refresh button
    const refreshBtn = this.container.querySelector('.refresh-btn');
    refreshBtn.addEventListener('click', () => {
      this.loadData();
    });
    
    // Listen for global filter changes
    window.addEventListener('filters:changed', (e) => {
      this.updateFilters(e.detail);
    });
  }

  setupResizeObserver() {
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(this.handleResize);
      resizeObserver.observe(this.container);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', this.handleResize);
    }
  }

  handleResize() {
    if (this.chart) {
      this.chart.resize();
    }
  }

  showLoading(show = true) {
    const loadingOverlay = this.container.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    this.loading = show;
  }

  async loadData() {
    if (this.loading) return;
    
    this.showLoading(true);
    
    try {
      // Build API parameters
      const params = {
        period: this.options.period
      };
      
      if (this.options.startDate) {
        params.startDate = this.options.startDate;
      }
      
      if (this.options.endDate) {
        params.endDate = this.options.endDate;
      }
      
      // Add any global filters
      const globalFilters = window.globalFilters || {};
      Object.assign(params, globalFilters);
      
      // Fetch data from API
      const response = await window.apiClient.getTransactionTrends(params);
      
      // Process and store data
      this.data = this.processData(response.data);
      
      // Render chart
      this.render();
      
      // Update footer
      this.updateFooter(response);
      
    } catch (error) {
      console.error('Failed to load transaction trends:', error);
      this.showError(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  processData(rawData) {
    // Ensure data is in the correct format for Chart.js
    if (!Array.isArray(rawData)) {
      console.warn('Invalid data format received:', rawData);
      return { labels: [], datasets: [] };
    }
    
    // Extract labels and values
    const labels = rawData.map(item => {
      if (this.options.period === 'hourly') {
        return new Date(item.period).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        });
      } else if (this.options.period === 'daily') {
        return new Date(item.period).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } else if (this.options.period === 'weekly') {
        return `Week ${item.week || new Date(item.period).toLocaleDateString()}`;
      } else {
        return new Date(item.period).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
      }
    });
    
    const transactions = rawData.map(item => item.transactionCount || 0);
    const revenue = rawData.map(item => item.totalAmount || 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'Transactions',
          data: transactions,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          yAxisID: 'y-transactions',
          tension: 0.1
        },
        {
          label: 'Revenue (₱)',
          data: revenue,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          yAxisID: 'y-revenue',
          tension: 0.1
        }
      ]
    };
  }

  render() {
    const chartContainer = this.container.querySelector(`#${this.container.id}-chart`);
    
    // Clear loading overlay
    chartContainer.innerHTML = '<canvas></canvas>';
    const canvas = chartContainer.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Create new chart
    this.chart = new Chart(ctx, {
      type: 'line',
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: false
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  if (context.datasetIndex === 1) { // Revenue
                    label += new Intl.NumberFormat('en-PH', {
                      style: 'currency',
                      currency: 'PHP'
                    }).format(context.parsed.y);
                  } else { // Transactions
                    label += new Intl.NumberFormat('en-PH').format(context.parsed.y);
                  }
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          'y-transactions': {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Transaction Count'
            },
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('en-PH', {
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value);
              }
            }
          },
          'y-revenue': {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Revenue (₱)'
            },
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('en-PH', {
                  style: 'currency',
                  currency: 'PHP',
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value);
              }
            }
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const label = this.data.labels[index];
            
            // Dispatch drill-down event
            window.dispatchEvent(new CustomEvent('chart:drilldown', {
              detail: {
                component: 'transaction-trends',
                period: this.options.period,
                label: label,
                index: index
              }
            }));
          }
        }
      }
    });
  }

  updateFooter(response) {
    // Update last updated time
    const lastUpdated = this.container.querySelector('.last-updated');
    if (lastUpdated) {
      const now = new Date().toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
      lastUpdated.textContent = `Last updated: ${now}`;
    }
    
    // Update data source indicator
    const dataSource = this.container.querySelector('.data-source');
    if (dataSource && response.source) {
      dataSource.textContent = `Source: ${response.source}`;
      dataSource.className = `data-source ${response.source.toLowerCase()}`;
    }
  }

  updateFilters(filters) {
    // Update component options with new filters
    if (filters.startDate) {
      this.options.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      this.options.endDate = filters.endDate;
    }
    
    // Reload data with new filters
    this.loadData();
  }

  showError(message) {
    const chartContainer = this.container.querySelector('.chart-container');
    chartContainer.innerHTML = `
      <div class="error-message">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h4>Unable to load data</h4>
        <p>${message}</p>
        <button onclick="this.closest('.transaction-trends-component').dispatchEvent(new Event('retry'))">
          Retry
        </button>
      </div>
    `;
    
    // Listen for retry
    this.container.addEventListener('retry', () => {
      this.loadData();
    }, { once: true });
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Remove event listeners
    window.removeEventListener('filters:changed', this.updateFilters);
    window.removeEventListener('resize', this.handleResize);
    
    // Clear container
    this.container.innerHTML = '';
  }
}

// Export for use
window.TransactionTrends = TransactionTrends;