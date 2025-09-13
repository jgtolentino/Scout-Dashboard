/**
 * Enhanced Drill-Down Drawer Component (F10)
 * PRD Requirement: Detailed drill-down with charts and export functionality
 * Loads data from drilldown/*.json files
 */

class DrillDownDrawer {
  constructor(options = {}) {
    this.options = {
      drawerSelector: '#drill-down-drawer',
      overlaySelector: '#drawer-overlay',
      closeSelector: '#drawer-close',
      titleSelector: '#drawer-title',
      bodySelector: '#drawer-body',
      exportSelector: '#drawer-export',
      ...options
    };
    
    this.isOpen = false;
    this.currentKPI = null;
    this.currentData = null;
    this.charts = [];
    
    this.init();
  }

  init() {
    this.attachEventListeners();
    console.log('🔍 Drill-down drawer initialized');
  }

  attachEventListeners() {
    // Close button
    document.querySelector(this.options.closeSelector)?.addEventListener('click', () => {
      this.close();
    });

    // Overlay click to close
    document.querySelector(this.options.overlaySelector)?.addEventListener('click', () => {
      this.close();
    });

    // Export button
    document.querySelector(this.options.exportSelector)?.addEventListener('click', () => {
      this.showExportOptions();
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Listen for KPI drill-down requests
    document.addEventListener('kpiSelected', (e) => {
      const { kpiType, element } = e.detail;
      this.openForKPI(kpiType, element);
    });
  }

  async openForKPI(kpiType, sourceElement) {
    this.currentKPI = kpiType;
    
    // Show loading state
    this.showLoadingState();
    this.open();
    
    try {
      // Load KPI drill-down data
      const data = await this.loadKPIData(kpiType);
      this.currentData = data;
      
      // Update drawer content
      this.updateTitle(data.kpi_label);
      this.renderContent(data);
      
    } catch (error) {
      console.error('Error loading drill-down data:', error);
      this.showErrorState();
    }
  }

  async loadKPIData(kpiType) {
    // Map KPI types to data files
    const kpiFileMap = {
      'total-sales': 'total-sales',
      'fmcg-portfolio-revenue': 'total-sales',
      'conversion-rate': 'conversion-rate',
      'marketing-roi': 'marketing-roi',
      'brand-sentiment': 'brand-sentiment'
    };
    
    const filename = kpiFileMap[kpiType] || kpiType;
    
    try {
      const response = await fetch(`./data/drilldown/${filename}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Could not load ${filename}.json, using fallback data`);
      return this.getFallbackData(kpiType);
    }
  }

  getFallbackData(kpiType) {
    return {
      kpi_type: kpiType,
      kpi_label: `${kpiType.replace('-', ' ').toUpperCase()} Details`,
      current_value: "N/A",
      change_percentage: "N/A",
      drill_down_data: {
        insights: [`Detailed data for ${kpiType} is being prepared.`]
      },
      recommended_actions: []
    };
  }

  renderContent(data) {
    const body = document.querySelector(this.options.bodySelector);
    if (!body) return;

    body.innerHTML = `
      <div class="drill-down-content">
        <!-- KPI Summary Header -->
        <div class="kpi-summary-header">
          <div class="kpi-current-value">
            <span class="value">${data.current_value}</span>
            <span class="change ${data.change_percentage?.startsWith('+') ? 'positive' : 'negative'}">
              ${data.change_percentage}
            </span>
          </div>
          <div class="kpi-meta">
            <div class="time-period">${data.time_period || 'Last 30 Days'}</div>
            <div class="last-updated">Updated: ${this.formatDate(data.last_updated)}</div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="drill-down-tabs">
          <button class="tab-button active" data-tab="overview">Overview</button>
          <button class="tab-button" data-tab="charts">Charts</button>
          <button class="tab-button" data-tab="breakdown">Breakdown</button>
          <button class="tab-button" data-tab="insights">Insights</button>
          <button class="tab-button" data-tab="actions">Actions</button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <div class="tab-panel active" id="overview-panel">
            ${this.renderOverviewPanel(data)}
          </div>
          <div class="tab-panel" id="charts-panel">
            ${this.renderChartsPanel(data)}
          </div>
          <div class="tab-panel" id="breakdown-panel">
            ${this.renderBreakdownPanel(data)}
          </div>
          <div class="tab-panel" id="insights-panel">
            ${this.renderInsightsPanel(data)}
          </div>
          <div class="tab-panel" id="actions-panel">
            ${this.renderActionsPanel(data)}
          </div>
        </div>
      </div>
    `;

    this.attachTabListeners();
    this.initializeCharts(data);
  }

  renderOverviewPanel(data) {
    const drillData = data.drill_down_data || {};
    
    return `
      <div class="overview-panel">
        <div class="overview-grid">
          ${drillData.breakdown_by_brand ? `
            <div class="overview-card">
              <h4>Top Performing Brands</h4>
              <div class="brand-list">
                ${drillData.breakdown_by_brand.slice(0, 3).map(brand => `
                  <div class="brand-item">
                    <span class="brand-name">${brand.brand}</span>
                    <span class="brand-value">${brand.sales ? '₱' + (brand.sales/1000000).toFixed(1) + 'M' : brand.percentage + '%'}</span>
                    <span class="brand-change ${brand.trend}">${brand.change}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${drillData.breakdown_by_region ? `
            <div class="overview-card">
              <h4>Regional Performance</h4>
              <div class="region-list">
                ${drillData.breakdown_by_region.slice(0, 3).map(region => `
                  <div class="region-item">
                    <span class="region-name">${region.region}</span>
                    <span class="region-value">${region.sales ? '₱' + (region.sales/1000000).toFixed(1) + 'M' : region.conversion_rate + '%'}</span>
                    <span class="region-stores">${region.stores} stores</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${drillData.top_performing_stores ? `
            <div class="overview-card">
              <h4>Top Stores</h4>
              <div class="store-list">
                ${drillData.top_performing_stores.slice(0, 3).map(store => `
                  <div class="store-item">
                    <span class="store-name">${store.store_name}</span>
                    <span class="store-value">${store.sales ? '₱' + (store.sales/1000).toFixed(0) + 'K' : store.conversion_rate + '%'}</span>
                    <span class="store-growth">${store.growth}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderChartsPanel(data) {
    const drillData = data.drill_down_data || {};
    
    return `
      <div class="charts-panel">
        ${drillData.time_series ? `
          <div class="chart-container">
            <h4>Trend Analysis</h4>
            <div class="chart-wrapper">
              <canvas id="trend-chart" width="400" height="200"></canvas>
            </div>
          </div>
        ` : ''}
        
        ${drillData.breakdown_by_brand ? `
          <div class="chart-container">
            <h4>Brand Breakdown</h4>
            <div class="chart-wrapper">
              <canvas id="brand-chart" width="400" height="200"></canvas>
            </div>
          </div>
        ` : ''}
        
        ${drillData.funnel_analysis ? `
          <div class="chart-container">
            <h4>Conversion Funnel</h4>
            <div class="chart-wrapper">
              <canvas id="funnel-chart" width="400" height="200"></canvas>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderBreakdownPanel(data) {
    const drillData = data.drill_down_data || {};
    
    return `
      <div class="breakdown-panel">
        ${drillData.breakdown_by_brand ? `
          <div class="breakdown-table">
            <h4>By Brand</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Value</th>
                  <th>Percentage</th>
                  <th>Change</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                ${drillData.breakdown_by_brand.map(item => `
                  <tr>
                    <td class="brand-cell">${item.brand}</td>
                    <td class="value-cell">${item.sales ? '₱' + (item.sales/1000000).toFixed(1) + 'M' : item.conversion_rate + '%'}</td>
                    <td class="percentage-cell">${item.percentage}%</td>
                    <td class="change-cell ${item.change?.startsWith('+') ? 'positive' : 'negative'}">${item.change}</td>
                    <td class="trend-cell">
                      <i class="fas fa-arrow-${item.trend === 'up' ? 'up' : item.trend === 'down' ? 'down' : 'right'}"></i>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${drillData.breakdown_by_region ? `
          <div class="breakdown-table">
            <h4>By Region</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Value</th>
                  <th>Stores</th>
                  <th>Avg per Store</th>
                </tr>
              </thead>
              <tbody>
                ${drillData.breakdown_by_region.map(item => `
                  <tr>
                    <td class="region-cell">${item.region}</td>
                    <td class="value-cell">${item.sales ? '₱' + (item.sales/1000000).toFixed(1) + 'M' : item.conversion_rate + '%'}</td>
                    <td class="stores-cell">${item.stores}</td>
                    <td class="avg-cell">${item.avg_per_store ? '₱' + item.avg_per_store.toLocaleString() : 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderInsightsPanel(data) {
    const insights = data.drill_down_data?.insights || data.insights || [];
    
    return `
      <div class="insights-panel">
        <div class="insights-list">
          ${insights.map((insight, index) => `
            <div class="insight-item">
              <div class="insight-number">${index + 1}</div>
              <div class="insight-content">
                <p>${insight}</p>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${data.drill_down_data?.conversion_drivers ? `
          <div class="drivers-section">
            <h4>Key Performance Drivers</h4>
            <div class="drivers-list">
              ${data.drill_down_data.conversion_drivers.map(driver => `
                <div class="driver-item">
                  <div class="driver-factor">${driver.factor}</div>
                  <div class="driver-impact">${driver.impact}</div>
                  <div class="driver-description">${driver.description}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderActionsPanel(data) {
    const actions = data.recommended_actions || [];
    
    return `
      <div class="actions-panel">
        <div class="actions-list">
          ${actions.map(action => `
            <div class="action-item priority-${action.priority}">
              <div class="action-header">
                <div class="action-priority ${action.priority}">${action.priority.toUpperCase()}</div>
                <div class="action-timeline">${action.timeline}</div>
              </div>
              <div class="action-content">
                <h5>${action.action}</h5>
                <div class="action-impact">${action.impact}</div>
              </div>
              <div class="action-buttons">
                <button class="btn-sm btn-primary" onclick="this.implementAction('${action.action}')">
                  Implement
                </button>
                <button class="btn-sm btn-outline" onclick="this.scheduleAction('${action.action}')">
                  Schedule
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  attachTabListeners() {
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-panel`);
    });
    
    // Initialize charts if switching to charts tab
    if (tabName === 'charts' && this.currentData) {
      setTimeout(() => this.initializeCharts(this.currentData), 100);
    }
  }

  initializeCharts(data) {
    const drillData = data.drill_down_data || {};
    
    // Clear existing charts
    this.destroyCharts();
    
    // Time series chart
    if (drillData.time_series) {
      this.createTrendChart(drillData.time_series);
    }
    
    // Brand breakdown chart
    if (drillData.breakdown_by_brand) {
      this.createBrandChart(drillData.breakdown_by_brand);
    }
    
    // Funnel chart
    if (drillData.funnel_analysis) {
      this.createFunnelChart(drillData.funnel_analysis);
    }
  }

  createTrendChart(timeSeriesData) {
    const canvas = document.getElementById('trend-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: timeSeriesData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createBrandChart(brandData) {
    const canvas = document.getElementById('brand-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: brandData.map(item => item.brand),
        datasets: [{
          data: brandData.map(item => item.percentage),
          backgroundColor: [
            '#228b22', // Del Monte
            '#ff6b35', // Oishi  
            '#4a90e2', // Alaska
            '#7b68ee', // Peerless
            '#ffd700', // Others
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createFunnelChart(funnelData) {
    const canvas = document.getElementById('funnel-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: funnelData.stages.map(stage => stage.stage),
        datasets: [{
          label: 'Count',
          data: funnelData.stages.map(stage => stage.count),
          backgroundColor: '#0067b1',
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  destroyCharts() {
    this.charts.forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = [];
  }

  showExportOptions() {
    if (!this.currentData?.drill_down_data?.export_options) {
      alert('Export options not available for this KPI');
      return;
    }
    
    const exportOptions = this.currentData.drill_down_data.export_options;
    const optionsHTML = exportOptions.map(option => `
      <div class="export-option" data-format="${option.format}" data-filename="${option.filename}">
        <div class="export-format">${option.format}</div>
        <div class="export-description">${option.description}</div>
      </div>
    `).join('');
    
    // Show export modal (would need to implement modal)
    console.log('📊 Export options:', exportOptions);
    
    // For demo, trigger download
    this.exportData(exportOptions[0].format, exportOptions[0].filename);
  }

  exportData(format, filename) {
    console.log(`📥 Exporting ${this.currentKPI} data as ${format} (${filename})`);
    
    // In production, this would trigger actual export
    // For demo, show success message
    setTimeout(() => {
      alert(`Export completed: ${filename}`);
    }, 1000);
  }

  open() {
    const drawer = document.querySelector(this.options.drawerSelector);
    const overlay = document.querySelector(this.options.overlaySelector);
    
    if (drawer && overlay) {
      drawer.classList.add('open');
      overlay.classList.add('open');
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
    }
  }

  close() {
    const drawer = document.querySelector(this.options.drawerSelector);
    const overlay = document.querySelector(this.options.overlaySelector);
    
    if (drawer && overlay) {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      this.isOpen = false;
      document.body.style.overflow = '';
      
      // Clean up charts
      this.destroyCharts();
    }
  }

  updateTitle(title) {
    const titleElement = document.querySelector(this.options.titleSelector);
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  showLoadingState() {
    const body = document.querySelector(this.options.bodySelector);
    if (body) {
      body.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div class="loading-text">Loading detailed analysis...</div>
        </div>
      `;
    }
  }

  showErrorState() {
    const body = document.querySelector(this.options.bodySelector);
    if (body) {
      body.innerHTML = `
        <div class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="error-text">Could not load detailed data</div>
          <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }

  // Public API
  isDrawerOpen() {
    return this.isOpen;
  }

  getCurrentKPI() {
    return this.currentKPI;
  }
}

// Add enhanced styles for the drill-down drawer
const drillDownDrawerStyles = `
<style>
.drill-down-content {
  padding: 1rem;
}

.kpi-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--background-light);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.kpi-current-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.kpi-current-value .value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary);
}

.kpi-current-value .change {
  font-size: 1rem;
  font-weight: 600;
}

.kpi-current-value .change.positive { color: var(--success-color); }
.kpi-current-value .change.negative { color: var(--danger-color); }

.kpi-meta {
  text-align: right;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.drill-down-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: var(--text-primary);
  background: var(--background-light);
}

.tab-button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.tab-panel {
  display: none;
}

.tab-panel.active {
  display: block;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.overview-card {
  background: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
}

.overview-card h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.brand-list, .region-list, .store-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.brand-item, .region-item, .store-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--background-light);
  border-radius: 0.25rem;
}

.brand-name, .region-name, .store-name {
  font-weight: 500;
  color: var(--text-primary);
}

.brand-value, .region-value, .store-value {
  font-weight: 600;
  color: var(--primary-color);
}

.brand-change, .store-growth {
  font-size: 0.875rem;
  font-weight: 500;
}

.brand-change.up, .store-growth { color: var(--success-color); }
.brand-change.down { color: var(--danger-color); }

.region-stores {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.charts-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-container {
  background: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
}

.chart-container h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.chart-wrapper {
  position: relative;
  height: 250px;
}

.breakdown-table {
  margin-bottom: 2rem;
}

.breakdown-table h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
}

.data-table th {
  background: var(--background-light);
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover {
  background: var(--background-light);
}

.value-cell {
  font-weight: 600;
  color: var(--primary-color);
}

.change-cell.positive { color: var(--success-color); }
.change-cell.negative { color: var(--danger-color); }

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.insight-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.insight-number {
  width: 24px;
  height: 24px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: bold;
  flex-shrink: 0;
}

.insight-content p {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.5;
}

.drivers-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.drivers-section h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.drivers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.driver-item {
  display: grid;
  grid-template-columns: 1fr auto 2fr;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  background: var(--background-light);
  border-radius: 0.375rem;
}

.driver-factor {
  font-weight: 500;
  color: var(--text-primary);
}

.driver-impact {
  font-weight: 600;
  color: var(--success-color);
}

.driver-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-item {
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--background-card);
}

.action-item.priority-high { border-left: 4px solid var(--danger-color); }
.action-item.priority-medium { border-left: 4px solid var(--warning-color); }
.action-item.priority-low { border-left: 4px solid var(--info-color); }

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.action-priority {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.action-priority.high { background: var(--danger-color); color: white; }
.action-priority.medium { background: var(--warning-color); color: black; }
.action-priority.low { background: var(--info-color); color: white; }

.action-timeline {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.action-content h5 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.action-impact {
  font-size: 0.875rem;
  color: var(--success-color);
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-spinner {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.loading-text, .error-text {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 2rem;
  color: var(--warning-color);
  margin-bottom: 1rem;
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', drillDownDrawerStyles);

// Export for use
if (typeof window !== 'undefined') {
  window.DrillDownDrawer = DrillDownDrawer;
}