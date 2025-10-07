/**
 * Show-Ready UI Enhancement for Client360 Dashboard
 * Dynamically populates dashboard with FMCG demo data
 */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof SHOW_READY_DATA === 'undefined') {
    console.warn('Show-ready data not loaded');
    return;
  }

  initializeShowReadyDashboard();
});

function initializeShowReadyDashboard() {
  // Update page title and header
  updateHeaderForDemo();
  
  // Populate KPIs with FMCG data
  populateKPICards();
  
  // Update Device Health Grid
  updateDeviceHealthGrid();
  
  // Enhance Brand Performance Section
  updateBrandPerformance();
  
  // Update Regional Analysis
  updateRegionalAnalysis();
  
  // Populate AI Insights
  populateAIInsights();
  
  // Initialize Charts with Real Data
  initializeShowReadyCharts();
  
  console.log('✅ Show-ready dashboard initialized with FMCG data');
}

function updateHeaderForDemo() {
  // Update header title
  const headerTitle = document.querySelector('.header-title');
  if (headerTitle) {
    headerTitle.innerHTML = 'TBWA\\SMP FMCG Portfolio <span style="font-size: 0.8em; opacity: 0.8;">v2.4.0</span>';
  }
  
  // Update data source indicator
  const dataToggle = document.querySelector('.data-source-toggle .toggle-label');
  if (dataToggle) {
    dataToggle.textContent = 'Live Demo Data';
  }
}

function populateKPICards() {
  const kpiContainer = document.querySelector('.kpi-grid');
  if (!kpiContainer) return;
  
  const kpis = [
    {
      icon: 'fa-chart-line',
      value: SHOW_READY_DATA.kpis.total_sales,
      label: 'FMCG Portfolio Revenue',
      change: SHOW_READY_DATA.kpis.sales_change,
      positive: true
    },
    {
      icon: 'fa-shopping-cart',
      value: SHOW_READY_DATA.kpis.conversion_rate,
      label: 'Conversion Rate',
      change: SHOW_READY_DATA.kpis.conversion_change,
      positive: true
    },
    {
      icon: 'fa-bullseye',
      value: SHOW_READY_DATA.kpis.marketing_roi,
      label: 'Marketing ROI',
      change: SHOW_READY_DATA.kpis.roi_change,
      positive: true
    },
    {
      icon: 'fa-heart',
      value: SHOW_READY_DATA.kpis.brand_sentiment,
      label: 'Brand Sentiment',
      change: SHOW_READY_DATA.kpis.sentiment_change,
      positive: true
    }
  ];
  
  kpiContainer.innerHTML = kpis.map(kpi => `
    <div class="kpi-card clickable" data-kpi="${kpi.label.toLowerCase().replace(/\s+/g, '-')}">
      <div class="kpi-icon">
        <i class="fas ${kpi.icon}"></i>
      </div>
      <div class="kpi-content">
        <div class="kpi-value">${kpi.value}</div>
        <div class="kpi-label">${kpi.label}</div>
        <div class="kpi-change ${kpi.positive ? 'positive' : 'negative'}">
          <i class="fas fa-arrow-${kpi.positive ? 'up' : 'down'}"></i>
          ${kpi.change}
        </div>
      </div>
    </div>
  `).join('');
  
  // Add click handlers for drill-down
  document.querySelectorAll('.kpi-card.clickable').forEach(card => {
    card.addEventListener('click', function() {
      const kpiType = this.dataset.kpi;
      openKPIDrillDown(kpiType);
    });
  });
}

function updateDeviceHealthGrid() {
  const deviceGrid = document.querySelector('.device-health-grid');
  if (!deviceGrid) return;
  
  const devices = SHOW_READY_DATA.device_health;
  
  // Update health summary
  const healthSummary = deviceGrid.querySelector('.health-summary');
  if (healthSummary) {
    healthSummary.innerHTML = `
      <div class="health-metric">
        <div class="metric-value" style="color: var(--success-color);">${SHOW_READY_DATA.kpis.active_stores}</div>
        <div class="metric-label">Active Stores</div>
      </div>
      <div class="health-metric">
        <div class="metric-value" style="color: var(--success-color);">${SHOW_READY_DATA.kpis.device_health}</div>
        <div class="metric-label">Overall Health</div>
      </div>
      <div class="health-metric">
        <div class="metric-value" style="color: var(--info-color);">${devices.length}</div>
        <div class="metric-label">Monitored Devices</div>
      </div>
    `;
  }
  
  // Update device list
  const deviceList = deviceGrid.querySelector('.device-list') || deviceGrid;
  const deviceHTML = devices.map(device => {
    const statusColor = {
      'excellent': 'var(--success-color)',
      'good': 'var(--info-color)',
      'warning': 'var(--warning-color)',
      'critical': 'var(--danger-color)'
    }[device.status] || 'var(--text-secondary)';
    
    return `
      <div class="device-item clickable" data-device="${device.device_id}">
        <div class="device-status" style="background-color: ${statusColor};"></div>
        <div class="device-info">
          <div class="device-name">${device.device_id}</div>
          <div class="device-location">${device.location}</div>
        </div>
        <div class="device-metrics">
          <div class="metric">
            <span class="metric-label">Health:</span>
            <span class="metric-value">${device.health_score}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Uptime:</span>
            <span class="metric-value">${device.uptime}</span>
          </div>
        </div>
        <div class="device-battery">
          <i class="fas fa-battery-${getBatteryIcon(device.battery)}"></i>
          ${device.battery}
        </div>
      </div>
    `;
  }).join('');
  
  if (deviceList) {
    deviceList.innerHTML = (deviceList.classList.contains('health-summary') ? deviceList.innerHTML : '') + deviceHTML;
  }
  
  // Add click handlers for device drill-down
  document.querySelectorAll('.device-item.clickable').forEach(item => {
    item.addEventListener('click', function() {
      const deviceId = this.dataset.device;
      openDeviceDrillDown(deviceId);
    });
  });
}

function updateBrandPerformance() {
  const brandsContainer = document.querySelector('#brands-view') || document.querySelector('.brands-section');
  if (!brandsContainer) return;
  
  const brands = SHOW_READY_DATA.brands;
  
  const brandsHTML = brands.map(brand => `
    <div class="brand-card clickable" data-brand="${brand.name.toLowerCase().replace(/\s+/g, '-')}">
      <div class="brand-header">
        <div class="brand-logo">${brand.logo}</div>
        <div class="brand-info">
          <h4 class="brand-name">${brand.name}</h4>
          <div class="brand-category">${brand.category}</div>
        </div>
        <div class="brand-score ${brand.trend}">
          ${brand.performance_score}
          <i class="fas fa-arrow-${brand.trend === 'up' ? 'up' : brand.trend === 'down' ? 'down' : 'right'}"></i>
        </div>
      </div>
      <div class="brand-metrics">
        <div class="metric">
          <span class="metric-label">Market Share:</span>
          <span class="metric-value">${brand.market_share}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Growth:</span>
          <span class="metric-value positive">${brand.growth_rate}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Revenue:</span>
          <span class="metric-value">${brand.revenue}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Loyalty:</span>
          <span class="metric-value">${brand.customer_loyalty}</span>
        </div>
      </div>
      <div class="brand-products">
        <strong>Key Products:</strong> ${brand.products.join(', ')}
      </div>
    </div>
  `).join('');
  
  // Find or create brands container
  let brandsList = brandsContainer.querySelector('.brands-list');
  if (!brandsList) {
    brandsList = document.createElement('div');
    brandsList.className = 'brands-list';
    brandsContainer.appendChild(brandsList);
  }
  
  brandsList.innerHTML = brandsHTML;
  
  // Add click handlers for brand drill-down
  document.querySelectorAll('.brand-card.clickable').forEach(card => {
    card.addEventListener('click', function() {
      const brandName = this.dataset.brand;
      openBrandDrillDown(brandName);
    });
  });
}

function populateAIInsights() {
  const insightsContainer = document.querySelector('.ai-insights-content') || document.querySelector('#insights-view');
  if (!insightsContainer) return;
  
  const insights = SHOW_READY_DATA.ai_insights;
  
  const insightsHTML = insights.map(insight => `
    <div class="insight-card priority-${insight.priority} clickable" data-insight="${insight.type}">
      <div class="insight-header">
        <div class="insight-type">
          <i class="fas fa-${getInsightIcon(insight.type)}"></i>
          ${insight.type.replace('_', ' ').toUpperCase()}
        </div>
        <div class="insight-priority ${insight.priority}">${insight.priority.toUpperCase()}</div>
      </div>
      <h4 class="insight-title">${insight.title}</h4>
      <p class="insight-description">${insight.insight}</p>
      <div class="insight-action">
        <strong>Recommended Action:</strong> ${insight.action}
      </div>
      <div class="insight-metrics">
        <div class="metric">
          <span class="metric-label">Confidence:</span>
          <span class="metric-value">${Math.round(insight.confidence * 100)}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Impact:</span>
          <span class="metric-value positive">${insight.impact}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  insightsContainer.innerHTML = insightsHTML;
  
  // Add click handlers for insight drill-down
  document.querySelectorAll('.insight-card.clickable').forEach(card => {
    card.addEventListener('click', function() {
      const insightType = this.dataset.insight;
      openInsightDrillDown(insightType);
    });
  });
}

// Helper functions
function getBatteryIcon(batteryLevel) {
  const level = parseInt(batteryLevel);
  if (level > 75) return 'full';
  if (level > 50) return 'three-quarters';
  if (level > 25) return 'half';
  if (level > 10) return 'quarter';
  return 'empty';
}

function getInsightIcon(type) {
  const icons = {
    'growth_opportunity': 'chart-line',
    'trend_analysis': 'trending-up',
    'loyalty_optimization': 'heart',
    'market_penetration': 'bullseye'
  };
  return icons[type] || 'lightbulb';
}

// Drill-down functions (placeholders for existing drawer functionality)
function openKPIDrillDown(kpiType) {
  console.log(`Opening KPI drill-down for: ${kpiType}`);
  // Existing drawer functionality will handle this
}

function openDeviceDrillDown(deviceId) {
  console.log(`Opening device drill-down for: ${deviceId}`);
  // Existing drawer functionality will handle this
}

function openBrandDrillDown(brandName) {
  console.log(`Opening brand drill-down for: ${brandName}`);
  // Existing drawer functionality will handle this
}

function openInsightDrillDown(insightType) {
  console.log(`Opening insight drill-down for: ${insightType}`);
  // Existing drawer functionality will handle this
}

function initializeShowReadyCharts() {
  // This will integrate with existing chart initialization
  console.log('Charts initialized with show-ready data');
}

// Add show-ready specific styles
const showReadyStyles = `
<style>
.brand-card, .insight-card, .device-item, .kpi-card.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.brand-card:hover, .insight-card:hover, .device-item:hover, .kpi-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.brand-logo {
  font-size: 2rem;
}

.brand-score {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--success-color);
}

.brand-score.up { color: var(--success-color); }
.brand-score.down { color: var(--danger-color); }
.brand-score.steady { color: var(--info-color); }

.brand-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.insight-card {
  border-left: 4px solid var(--primary-color);
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--background-card);
}

.insight-card.priority-high {
  border-left-color: var(--danger-color);
}

.insight-card.priority-medium {
  border-left-color: var(--warning-color);
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.insight-priority {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: bold;
}

.insight-priority.high {
  background-color: var(--danger-color);
  color: white;
}

.insight-priority.medium {
  background-color: var(--warning-color);
  color: black;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.device-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.device-metrics {
  display: flex;
  gap: 1rem;
  flex: 1;
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', showReadyStyles);