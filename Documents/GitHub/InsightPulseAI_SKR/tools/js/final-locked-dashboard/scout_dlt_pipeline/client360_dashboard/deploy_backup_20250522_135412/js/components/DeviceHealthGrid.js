/**
 * Device Health Grid Component (Visual Grid C)
 * PRD Requirement: F7.C - Device health monitoring with icon grid and box-whisker plots
 */

class DeviceHealthGrid {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      refreshInterval: 30000, // 30 seconds
      showAlerts: true,
      showBoxWhisker: true,
      gridColumns: 4,
      ...options
    };
    
    this.deviceData = [];
    this.healthSummary = {};
    this.boxWhiskerData = {};
    this.refreshTimer = null;
    
    this.init();
  }

  async init() {
    await this.loadDeviceData();
    this.render();
    this.startAutoRefresh();
  }

  async loadDeviceData() {
    try {
      const response = await fetch('./data/device_health.json');
      const data = await response.json();
      
      this.deviceData = data.device_grid || [];
      this.healthSummary = data.health_summary || {};
      this.boxWhiskerData = data.box_whisker_data || {};
      this.performanceMetrics = data.performance_metrics || {};
      
      console.log('✅ Device health data loaded:', this.deviceData.length, 'devices');
    } catch (error) {
      console.warn('Could not load device health data:', error);
      this.loadFallbackData();
    }
  }

  loadFallbackData() {
    this.deviceData = [
      {
        device_id: "DEVICE-1006",
        device_name: "SM Mall of Asia Scanner",
        location: "SM Mall of Asia - Pasay",
        status: "excellent",
        health_score: 98.5,
        uptime: "99.8%",
        battery_level: 89,
        signal_strength: 95,
        alerts: []
      },
      {
        device_id: "DEVICE-1009",
        device_name: "Robinsons Galleria Kiosk", 
        location: "Robinsons Galleria - Quezon City",
        status: "good",
        health_score: 94.2,
        uptime: "98.9%",
        battery_level: 72,
        signal_strength: 87,
        alerts: [{ type: "warning", message: "Battery level below 75%" }]
      }
    ];
    
    this.healthSummary = {
      overall_health: 94.2,
      devices_online: 74,
      devices_offline: 4,
      devices_warning: 6,
      devices_critical: 2
    };
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }

    container.innerHTML = `
      <div class="device-health-grid-container">
        <div class="device-health-header">
          <div class="header-title">
            <h3>Device Health Monitor</h3>
            <div class="last-updated">
              Last updated: <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div class="health-summary">
            ${this.renderHealthSummary()}
          </div>
        </div>
        
        <div class="device-grid-content">
          <div class="device-icon-grid">
            ${this.renderDeviceGrid()}
          </div>
          
          ${this.options.showBoxWhisker ? `
            <div class="box-whisker-section">
              <h4>Performance Distribution</h4>
              <div class="box-whisker-charts">
                ${this.renderBoxWhiskerCharts()}
              </div>
            </div>
          ` : ''}
        </div>
        
        ${this.options.showAlerts ? `
          <div class="alerts-section">
            <h4>Active Alerts</h4>
            <div class="alerts-list">
              ${this.renderActiveAlerts()}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.attachEventListeners();
  }

  renderHealthSummary() {
    const { overall_health, devices_online, devices_offline, devices_warning, devices_critical } = this.healthSummary;
    
    return `
      <div class="health-metric">
        <div class="metric-value ${this.getHealthStatus(overall_health)}">${overall_health}%</div>
        <div class="metric-label">Overall Health</div>
      </div>
      <div class="health-metric">
        <div class="metric-value online">${devices_online}</div>
        <div class="metric-label">Online</div>
      </div>
      <div class="health-metric">
        <div class="metric-value offline">${devices_offline}</div>
        <div class="metric-label">Offline</div>
      </div>
      <div class="health-metric">
        <div class="metric-value warning">${devices_warning}</div>
        <div class="metric-label">Warning</div>
      </div>
      <div class="health-metric">
        <div class="metric-value critical">${devices_critical}</div>
        <div class="metric-label">Critical</div>
      </div>
    `;
  }

  renderDeviceGrid() {
    return this.deviceData.map(device => {
      const statusClass = this.getStatusClass(device.status);
      const iconClass = this.getDeviceIcon(device.device_type);
      const batteryIcon = this.getBatteryIcon(device.battery_level);
      const signalBars = this.getSignalBars(device.signal_strength);
      
      return `
        <div class="device-grid-item ${statusClass}" data-device-id="${device.device_id}">
          <div class="device-icon">
            <i class="${iconClass}"></i>
            <div class="device-status-indicator ${statusClass}"></div>
          </div>
          
          <div class="device-info">
            <div class="device-name">${device.device_name}</div>
            <div class="device-location">${device.location}</div>
            <div class="device-metrics">
              <div class="metric-item">
                <span class="metric-icon"><i class="fas fa-heartbeat"></i></span>
                <span class="metric-value">${device.health_score}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-icon"><i class="fas fa-clock"></i></span>
                <span class="metric-value">${device.uptime}</span>
              </div>
            </div>
          </div>
          
          <div class="device-indicators">
            <div class="battery-indicator">
              <i class="fas ${batteryIcon}"></i>
              <span class="battery-level">${device.battery_level}%</span>
            </div>
            <div class="signal-indicator">
              ${signalBars}
            </div>
            ${device.alerts.length > 0 ? `
              <div class="alert-indicator">
                <i class="fas fa-exclamation-triangle"></i>
                <span class="alert-count">${device.alerts.length}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderBoxWhiskerCharts() {
    if (!this.boxWhiskerData || Object.keys(this.boxWhiskerData).length === 0) {
      return '<div class="no-data">Box-whisker data not available</div>';
    }

    return Object.entries(this.boxWhiskerData).map(([key, data]) => {
      const chartId = `box-whisker-${key}`;
      return `
        <div class="box-whisker-chart">
          <div class="chart-title">${this.formatChartTitle(key)}</div>
          <div class="chart-container" id="${chartId}">
            ${this.renderBoxWhiskerSVG(data, chartId)}
          </div>
          <div class="chart-stats">
            <div class="stat-item">Min: ${data.min}</div>
            <div class="stat-item">Median: ${data.median}</div>
            <div class="stat-item">Max: ${data.max}</div>
            <div class="stat-item">Mean: ${data.mean}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderBoxWhiskerSVG(data, chartId) {
    const { min, q1, median, q3, max, outliers = [] } = data;
    const width = 200;
    const height = 80;
    const margin = 20;
    
    // Calculate scale
    const dataRange = max - min;
    const scale = (width - 2 * margin) / dataRange;
    
    // Convert values to positions
    const minPos = margin;
    const q1Pos = margin + (q1 - min) * scale;
    const medianPos = margin + (median - min) * scale;
    const q3Pos = margin + (q3 - min) * scale;
    const maxPos = margin + (max - min) * scale;
    
    const centerY = height / 2;
    const boxHeight = 20;
    
    return `
      <svg width="${width}" height="${height}" class="box-whisker-svg">
        <!-- Min to Q1 line -->
        <line x1="${minPos}" y1="${centerY}" x2="${q1Pos}" y2="${centerY}" stroke="#666" stroke-width="2"/>
        
        <!-- Q3 to Max line -->
        <line x1="${q3Pos}" y1="${centerY}" x2="${maxPos}" y2="${centerY}" stroke="#666" stroke-width="2"/>
        
        <!-- Box (Q1 to Q3) -->
        <rect x="${q1Pos}" y="${centerY - boxHeight/2}" width="${q3Pos - q1Pos}" height="${boxHeight}" 
              fill="rgba(0, 103, 177, 0.3)" stroke="#0067b1" stroke-width="2"/>
        
        <!-- Median line -->
        <line x1="${medianPos}" y1="${centerY - boxHeight/2}" x2="${medianPos}" y2="${centerY + boxHeight/2}" 
              stroke="#e31937" stroke-width="3"/>
        
        <!-- Min and Max whiskers -->
        <line x1="${minPos}" y1="${centerY - 5}" x2="${minPos}" y2="${centerY + 5}" stroke="#666" stroke-width="2"/>
        <line x1="${maxPos}" y1="${centerY - 5}" x2="${maxPos}" y2="${centerY + 5}" stroke="#666" stroke-width="2"/>
        
        <!-- Outliers -->
        ${outliers.map(outlier => {
          const outlierPos = margin + (outlier - min) * scale;
          return `<circle cx="${outlierPos}" cy="${centerY}" r="3" fill="#ff4444" stroke="#cc0000" stroke-width="1"/>`;
        }).join('')}
      </svg>
    `;
  }

  renderActiveAlerts() {
    const alerts = this.deviceData.flatMap(device => 
      device.alerts.map(alert => ({
        ...alert,
        device_name: device.device_name,
        device_id: device.device_id
      }))
    );

    if (alerts.length === 0) {
      return '<div class="no-alerts">No active alerts</div>';
    }

    return alerts.map(alert => `
      <div class="alert-item ${alert.type}">
        <div class="alert-icon">
          <i class="fas ${this.getAlertIcon(alert.type)}"></i>
        </div>
        <div class="alert-content">
          <div class="alert-message">${alert.message}</div>
          <div class="alert-device">${alert.device_name} (${alert.device_id})</div>
          <div class="alert-timestamp">${new Date(alert.timestamp).toLocaleString()}</div>
        </div>
      </div>
    `).join('');
  }

  attachEventListeners() {
    // Device grid item clicks
    document.querySelectorAll('.device-grid-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const deviceId = e.currentTarget.dataset.deviceId;
        this.showDeviceDetails(deviceId);
      });
    });

    // Refresh button if present
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshData();
      });
    }
  }

  showDeviceDetails(deviceId) {
    const device = this.deviceData.find(d => d.device_id === deviceId);
    if (!device) return;

    // Dispatch custom event for drill-down
    const event = new CustomEvent('deviceSelected', {
      detail: { device, deviceId }
    });
    document.dispatchEvent(event);
    
    console.log('🔍 Device selected for drill-down:', device.device_name);
  }

  async refreshData() {
    console.log('🔄 Refreshing device health data...');
    await this.loadDeviceData();
    this.render();
    
    // Update timestamp
    const timestamp = document.querySelector('.timestamp');
    if (timestamp) {
      timestamp.textContent = new Date().toLocaleTimeString();
    }
  }

  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refreshData();
    }, this.options.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Helper methods
  getStatusClass(status) {
    const statusMap = {
      'excellent': 'status-excellent',
      'good': 'status-good',
      'warning': 'status-warning',
      'critical': 'status-critical',
      'offline': 'status-offline'
    };
    return statusMap[status] || 'status-unknown';
  }

  getHealthStatus(health) {
    if (health >= 95) return 'excellent';
    if (health >= 85) return 'good';
    if (health >= 70) return 'warning';
    return 'critical';
  }

  getDeviceIcon(deviceType) {
    const iconMap = {
      'barcode_scanner': 'fas fa-barcode',
      'interactive_kiosk': 'fas fa-desktop',
      'shelf_monitor': 'fas fa-monitor-waveform',
      'pos_terminal': 'fas fa-cash-register',
      'multi_scanner': 'fas fa-qrcode',
      'digital_display': 'fas fa-tv',
      'inventory_tracker': 'fas fa-boxes',
      'sensor_array': 'fas fa-satellite-dish'
    };
    return iconMap[deviceType] || 'fas fa-microchip';
  }

  getBatteryIcon(batteryLevel) {
    if (batteryLevel > 75) return 'fa-battery-full';
    if (batteryLevel > 50) return 'fa-battery-three-quarters';
    if (batteryLevel > 25) return 'fa-battery-half';
    if (batteryLevel > 10) return 'fa-battery-quarter';
    return 'fa-battery-empty';
  }

  getSignalBars(signalStrength) {
    const bars = Math.ceil(signalStrength / 25);
    let signalHTML = '';
    
    for (let i = 1; i <= 4; i++) {
      const isActive = i <= bars;
      signalHTML += `<div class="signal-bar ${isActive ? 'active' : ''}"></div>`;
    }
    
    return `<div class="signal-bars">${signalHTML}</div>`;
  }

  getAlertIcon(alertType) {
    const iconMap = {
      'critical': 'fa-exclamation-circle',
      'warning': 'fa-exclamation-triangle', 
      'info': 'fa-info-circle'
    };
    return iconMap[alertType] || 'fa-bell';
  }

  formatChartTitle(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Public API
  getDeviceData() {
    return this.deviceData;
  }

  getHealthSummary() {
    return this.healthSummary;
  }

  destroy() {
    this.stopAutoRefresh();
  }
}

// Add CSS styles for the component
const deviceHealthGridStyles = `
<style>
.device-health-grid-container {
  background: var(--background-card);
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
}

.device-health-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.header-title h3 {
  margin: 0;
  color: var(--text-primary);
}

.last-updated {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.health-summary {
  display: flex;
  gap: 1.5rem;
}

.health-metric {
  text-align: center;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.metric-value.excellent { color: var(--success-color); }
.metric-value.good { color: var(--info-color); }
.metric-value.warning { color: var(--warning-color); }
.metric-value.critical { color: var(--danger-color); }
.metric-value.online { color: var(--success-color); }
.metric-value.offline { color: var(--danger-color); }

.metric-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.device-icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.device-grid-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--background-card);
}

.device-grid-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.device-grid-item.status-excellent { border-left: 4px solid var(--success-color); }
.device-grid-item.status-good { border-left: 4px solid var(--info-color); }
.device-grid-item.status-warning { border-left: 4px solid var(--warning-color); }
.device-grid-item.status-critical { border-left: 4px solid var(--danger-color); }

.device-icon {
  position: relative;
  font-size: 2rem;
  color: var(--text-secondary);
}

.device-status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.device-status-indicator.status-excellent { background-color: var(--success-color); }
.device-status-indicator.status-good { background-color: var(--info-color); }
.device-status-indicator.status-warning { background-color: var(--warning-color); }
.device-status-indicator.status-critical { background-color: var(--danger-color); }

.device-info {
  flex: 1;
}

.device-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.device-location {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.device-metrics {
  display: flex;
  gap: 1rem;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.metric-icon {
  color: var(--text-secondary);
}

.device-indicators {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.battery-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.signal-bars {
  display: flex;
  gap: 1px;
  align-items: flex-end;
}

.signal-bar {
  width: 3px;
  background-color: var(--border-color);
  border-radius: 1px;
}

.signal-bar:nth-child(1) { height: 4px; }
.signal-bar:nth-child(2) { height: 6px; }
.signal-bar:nth-child(3) { height: 8px; }
.signal-bar:nth-child(4) { height: 10px; }

.signal-bar.active {
  background-color: var(--success-color);
}

.alert-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--warning-color);
  font-size: 0.875rem;
}

.box-whisker-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.box-whisker-section h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.box-whisker-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.box-whisker-chart {
  background: var(--background-light);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.chart-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
  color: var(--text-primary);
}

.chart-container {
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: center;
}

.chart-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.alerts-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.alerts-section h4 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid;
}

.alert-item.critical {
  background-color: rgba(220, 53, 69, 0.1);
  border-color: rgba(220, 53, 69, 0.3);
}

.alert-item.warning {
  background-color: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.3);
}

.alert-item.info {
  background-color: rgba(23, 162, 184, 0.1);
  border-color: rgba(23, 162, 184, 0.3);
}

.alert-icon {
  font-size: 1.25rem;
}

.alert-item.critical .alert-icon { color: var(--danger-color); }
.alert-item.warning .alert-icon { color: var(--warning-color); }
.alert-item.info .alert-icon { color: var(--info-color); }

.alert-content {
  flex: 1;
}

.alert-message {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.alert-device {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.alert-timestamp {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.no-alerts, .no-data {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
  padding: 1rem;
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', deviceHealthGridStyles);

// Export for use
if (typeof window !== 'undefined') {
  window.DeviceHealthGrid = DeviceHealthGrid;
}