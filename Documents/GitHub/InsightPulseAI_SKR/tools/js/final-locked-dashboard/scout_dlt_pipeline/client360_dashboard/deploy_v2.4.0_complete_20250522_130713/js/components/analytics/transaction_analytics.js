/**
 * @file transaction_analytics.js
 * @description Transaction Analytics Module for Client360 Dashboard (PRD Section 4)
 * @version v2.4.0
 */

class TransactionAnalytics {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.charts = {};
    this.data = {
      transactions: [],
      substitutions: [],
      customerRequests: [],
      unbrandedItems: []
    };
    this.config = {
      updateInterval: 30000, // 30 seconds
      chartColors: {
        primary: '#ffc300',
        secondary: '#005bbb',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      }
    };
    this.init();
  }

  init() {
    this.createAnalyticsContainer();
    this.loadSampleData();
    this.createTransactionDashboard();
    this.createSubstitutionAnalysis();
    this.createCustomerRequestPatterns();
    this.createUnbrandedItemDetection();
    this.attachEventListeners();
    this.startAutoRefresh();
  }

  createAnalyticsContainer() {
    const container = document.getElementById('transaction-analytics') || this.createContainer();
    container.innerHTML = `
      <div class="analytics-module">
        <div class="module-header">
          <h2 class="module-title">Transaction Analytics</h2>
          <div class="module-controls">
            <button id="refresh-analytics" class="btn btn-sm btn-outline">Refresh</button>
            <button id="export-analytics" class="btn btn-sm btn-primary">Export</button>
          </div>
        </div>
        
        <div class="analytics-tabs">
          <button class="tab-btn active" data-tab="dashboard">Transaction Dashboard</button>
          <button class="tab-btn" data-tab="substitutions">Product Substitutions</button>
          <button class="tab-btn" data-tab="requests">Customer Requests</button>
          <button class="tab-btn" data-tab="unbranded">Unbranded Items</button>
        </div>
        
        <div class="tab-content">
          <div id="dashboard-tab" class="tab-panel active">
            <div class="transaction-dashboard"></div>
          </div>
          
          <div id="substitutions-tab" class="tab-panel">
            <div class="substitution-analysis"></div>
          </div>
          
          <div id="requests-tab" class="tab-panel">
            <div class="customer-requests"></div>
          </div>
          
          <div id="unbranded-tab" class="tab-panel">
            <div class="unbranded-detection"></div>
          </div>
        </div>
      </div>
    `;
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = 'transaction-analytics';
    container.className = 'transaction-analytics-container';
    
    // Find insertion point after KPI section
    const kpiSection = document.querySelector('.kpi-section, .metrics-overview');
    if (kpiSection) {
      kpiSection.after(container);
    } else {
      document.querySelector('.dashboard-container').appendChild(container);
    }
    
    return container;
  }

  loadSampleData() {
    // Load comprehensive sample data for all analytics
    this.data = {
      transactions: this.generateTransactionData(),
      substitutions: this.generateSubstitutionData(),
      customerRequests: this.generateCustomerRequestData(),
      unbrandedItems: this.generateUnbrandedItemData()
    };
  }

  generateTransactionData() {
    const hours = Array.from({length: 24}, (_, i) => i);
    return hours.map(hour => ({
      hour,
      averageDuration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
      productsPerTransaction: Math.random() * 3 + 1,
      averageBasketValue: Math.floor(Math.random() * 500) + 100,
      completionRate: Math.random() * 0.3 + 0.7, // 70-100%
      dwellTime: Math.floor(Math.random() * 600) + 30, // 30s-10min
      totalTransactions: Math.floor(Math.random() * 50) + 10
    }));
  }

  generateSubstitutionData() {
    const products = [
      { original: 'Coca-Cola Original', substitute: 'Pepsi Cola', category: 'Beverages' },
      { original: 'Tide Powder', substitute: 'Surf Powder', category: 'Household' },
      { original: 'Pantene Shampoo', substitute: 'Head & Shoulders', category: 'Personal Care' },
      { original: 'Nestea Iced Tea', substitute: 'Lipton Iced Tea', category: 'Beverages' },
      { original: 'Pringles Chips', substitute: 'Lays Chips', category: 'Snacks' }
    ];
    
    return products.map(product => ({
      ...product,
      substitutionCount: Math.floor(Math.random() * 100) + 20,
      reasons: this.getSubstitutionReasons(),
      impactScore: Math.random() * 10 + 1
    }));
  }

  generateCustomerRequestData() {
    const categories = ['Product Inquiry', 'Price Check', 'Availability', 'Recommendation', 'Complaint'];
    const regions = ['NCR', 'Luzon', 'Visayas', 'Mindanao'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return categories.map(category => ({
      category,
      frequency: Math.floor(Math.random() * 200) + 50,
      regionalData: regions.map(region => ({
        region,
        count: Math.floor(Math.random() * 50) + 10
      })),
      dayOfWeekData: days.map(day => ({
        day,
        count: Math.floor(Math.random() * 30) + 5
      })),
      trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      avgResponseTime: Math.floor(Math.random() * 300) + 30
    }));
  }

  generateUnbrandedItemData() {
    const categories = ['Soft Drinks', 'Instant Noodles', 'Soap', 'Shampoo', 'Snacks'];
    
    return categories.map(category => ({
      category,
      mentionCount: Math.floor(Math.random() * 150) + 25,
      volume: Math.floor(Math.random() * 1000) + 200,
      opportunitySize: Math.floor(Math.random() * 50000) + 10000,
      topBrands: this.getTopBrandsForCategory(category),
      growthPotential: Math.random() * 100 + 20
    }));
  }

  createTransactionDashboard() {
    const container = document.querySelector('.transaction-dashboard');
    container.innerHTML = `
      <div class="transaction-metrics">
        <div class="metric-cards">
          <div class="metric-card">
            <div class="metric-value" id="avg-duration">3.2 min</div>
            <div class="metric-label">Avg Transaction Duration</div>
            <div class="metric-trend positive">+12%</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value" id="products-per-tx">2.4</div>
            <div class="metric-label">Products per Transaction</div>
            <div class="metric-trend neutral">±0%</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value" id="avg-basket">₱285</div>
            <div class="metric-label">Average Basket Value</div>
            <div class="metric-trend positive">+8%</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value" id="completion-rate">87%</div>
            <div class="metric-label">Completion Rate</div>
            <div class="metric-trend positive">+5%</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value" id="dwell-time">4.1 min</div>
            <div class="metric-label">Avg Dwell Time</div>
            <div class="metric-trend negative">-3%</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value" id="total-transactions">1,247</div>
            <div class="metric-label">Total Transactions</div>
            <div class="metric-trend positive">+15%</div>
          </div>
        </div>
        
        <div class="transaction-charts">
          <div class="chart-container">
            <canvas id="hourly-transactions-chart"></canvas>
          </div>
          
          <div class="chart-container">
            <canvas id="completion-funnel-chart"></canvas>
          </div>
        </div>
      </div>
    `;
    
    this.createHourlyTransactionsChart();
    this.createCompletionFunnelChart();
  }

  createSubstitutionAnalysis() {
    const container = document.querySelector('.substitution-analysis');
    container.innerHTML = `
      <div class="substitution-module">
        <div class="substitution-header">
          <h3>Product Substitution Analysis</h3>
          <div class="filter-controls">
            <select id="substitution-category-filter">
              <option value="all">All Categories</option>
              <option value="beverages">Beverages</option>
              <option value="household">Household</option>
              <option value="personal-care">Personal Care</option>
              <option value="snacks">Snacks</option>
            </select>
          </div>
        </div>
        
        <div class="substitution-table-container">
          <table class="substitution-table">
            <thead>
              <tr>
                <th>Original Product</th>
                <th>Substituted Product</th>
                <th>Category</th>
                <th>Substitution Count</th>
                <th>Top Reasons</th>
                <th>Impact Score</th>
              </tr>
            </thead>
            <tbody id="substitution-table-body">
              <!-- Dynamic content -->
            </tbody>
          </table>
        </div>
        
        <div class="substitution-insights">
          <div class="insight-card">
            <h4>Top Substitution Reason</h4>
            <p><strong>Out of Stock</strong> accounts for 45% of all substitutions</p>
          </div>
          <div class="insight-card">
            <h4>Most Affected Category</h4>
            <p><strong>Beverages</strong> see the highest substitution rates</p>
          </div>
        </div>
      </div>
    `;
    
    this.populateSubstitutionTable();
  }

  createCustomerRequestPatterns() {
    const container = document.querySelector('.customer-requests');
    container.innerHTML = `
      <div class="requests-module">
        <div class="requests-overview">
          <div class="request-categories">
            <canvas id="request-categories-chart"></canvas>
          </div>
          
          <div class="regional-patterns">
            <canvas id="regional-requests-chart"></canvas>
          </div>
        </div>
        
        <div class="day-of-week-pattern">
          <h4>Request Patterns by Day of Week</h4>
          <canvas id="day-of-week-chart"></canvas>
        </div>
        
        <div class="request-metrics">
          <div class="metric-summary">
            <div class="summary-card">
              <div class="summary-value">1,234</div>
              <div class="summary-label">Total Requests This Week</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">2.5 min</div>
              <div class="summary-label">Avg Response Time</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">89%</div>
              <div class="summary-label">Resolution Rate</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.createRequestCategoriesChart();
    this.createRegionalRequestsChart();
    this.createDayOfWeekChart();
  }

  createUnbrandedItemDetection() {
    const container = document.querySelector('.unbranded-detection');
    container.innerHTML = `
      <div class="unbranded-module">
        <div class="unbranded-summary">
          <h3>Unbranded Item Detection</h3>
          <p class="summary-text">Products mentioned without specific brand attribution</p>
        </div>
        
        <div class="unbranded-grid">
          <div class="opportunity-chart">
            <canvas id="unbranded-opportunity-chart"></canvas>
          </div>
          
          <div class="unbranded-table">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Mentions</th>
                  <th>Volume</th>
                  <th>Opportunity (₱)</th>
                  <th>Growth Potential</th>
                </tr>
              </thead>
              <tbody id="unbranded-table-body">
                <!-- Dynamic content -->
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="unbranded-insights">
          <div class="insight-highlight">
            <h4>Biggest Opportunity</h4>
            <p><strong>Instant Noodles</strong> category shows ₱35,000 monthly opportunity</p>
          </div>
        </div>
      </div>
    `;
    
    this.populateUnbrandedTable();
    this.createUnbrandedOpportunityChart();
  }

  createHourlyTransactionsChart() {
    const ctx = document.getElementById('hourly-transactions-chart').getContext('2d');
    this.charts.hourlyTransactions = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.data.transactions.map(t => `${t.hour}:00`),
        datasets: [{
          label: 'Transactions per Hour',
          data: this.data.transactions.map(t => t.totalTransactions),
          borderColor: this.config.chartColors.primary,
          backgroundColor: this.config.chartColors.primary + '20',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Hourly Transaction Volume'
          }
        }
      }
    });
  }

  createCompletionFunnelChart() {
    const ctx = document.getElementById('completion-funnel-chart').getContext('2d');
    this.charts.completionFunnel = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Store Visit', 'Product Interaction', 'Basket Add', 'Purchase Complete'],
        datasets: [{
          label: 'Conversion Funnel',
          data: [100, 78, 65, 52],
          backgroundColor: [
            this.config.chartColors.primary,
            this.config.chartColors.secondary,
            this.config.chartColors.success,
            this.config.chartColors.warning
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Transaction Completion Funnel'
          }
        }
      }
    });
  }

  populateSubstitutionTable() {
    const tbody = document.getElementById('substitution-table-body');
    tbody.innerHTML = this.data.substitutions.map(sub => `
      <tr>
        <td class="product-name">${sub.original}</td>
        <td class="product-name">${sub.substitute}</td>
        <td class="category-tag">${sub.category}</td>
        <td class="count-value">${sub.substitutionCount}</td>
        <td class="reasons-list">${sub.reasons.slice(0, 2).join(', ')}</td>
        <td class="impact-score ${this.getImpactClass(sub.impactScore)}">${sub.impactScore.toFixed(1)}</td>
      </tr>
    `).join('');
  }

  populateUnbrandedTable() {
    const tbody = document.getElementById('unbranded-table-body');
    tbody.innerHTML = this.data.unbrandedItems.map(item => `
      <tr>
        <td class="category-name">${item.category}</td>
        <td class="mention-count">${item.mentionCount}</td>
        <td class="volume-value">${item.volume}</td>
        <td class="opportunity-value">₱${item.opportunitySize.toLocaleString()}</td>
        <td class="growth-potential ${this.getGrowthClass(item.growthPotential)}">${item.growthPotential.toFixed(0)}%</td>
      </tr>
    `).join('');
  }

  createRequestCategoriesChart() {
    const ctx = document.getElementById('request-categories-chart').getContext('2d');
    this.charts.requestCategories = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.data.customerRequests.map(r => r.category),
        datasets: [{
          data: this.data.customerRequests.map(r => r.frequency),
          backgroundColor: Object.values(this.config.chartColors)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Customer Request Categories'
          }
        }
      }
    });
  }

  attachEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Refresh button
    document.getElementById('refresh-analytics')?.addEventListener('click', () => {
      this.refreshData();
    });

    // Export button
    document.getElementById('export-analytics')?.addEventListener('click', () => {
      this.exportAnalytics();
    });

    // Filter changes
    document.getElementById('substitution-category-filter')?.addEventListener('change', (e) => {
      this.filterSubstitutions(e.target.value);
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-tab`);
    });
  }

  getSubstitutionReasons() {
    const reasons = ['Out of Stock', 'Price Difference', 'Customer Preference', 'Promotion', 'Recommendation'];
    return reasons.sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  getTopBrandsForCategory(category) {
    const brandMap = {
      'Soft Drinks': ['Coca-Cola', 'Pepsi', '7-Up'],
      'Instant Noodles': ['Nissin', 'Lucky Me', 'Pancit Canton'],
      'Soap': ['Safeguard', 'Dove', 'Palmolive'],
      'Shampoo': ['Pantene', 'Head & Shoulders', 'Sunsilk'],
      'Snacks': ['Pringles', 'Lays', 'Cheetos']
    };
    return brandMap[category] || ['Brand A', 'Brand B', 'Brand C'];
  }

  getImpactClass(score) {
    if (score >= 7) return 'high-impact';
    if (score >= 4) return 'medium-impact';
    return 'low-impact';
  }

  getGrowthClass(potential) {
    if (potential >= 70) return 'high-growth';
    if (potential >= 40) return 'medium-growth';
    return 'low-growth';
  }

  refreshData() {
    this.loadSampleData();
    this.updateAllCharts();
    this.populateSubstitutionTable();
    this.populateUnbrandedTable();
  }

  updateAllCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.update === 'function') {
        chart.update();
      }
    });
  }

  exportAnalytics() {
    const data = {
      transactionMetrics: this.data.transactions,
      substitutionAnalysis: this.data.substitutions,
      customerRequests: this.data.customerRequests,
      unbrandedOpportunities: this.data.unbrandedItems,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  startAutoRefresh() {
    setInterval(() => {
      this.refreshData();
    }, this.config.updateInterval);
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.TransactionAnalytics = TransactionAnalytics;
}

export default TransactionAnalytics;